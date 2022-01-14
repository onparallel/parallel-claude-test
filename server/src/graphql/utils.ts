import { Knex } from "knex";
import { countBy, difference, isDefined, omit } from "remeda";
import { ApiContext } from "../context";
import { IntegrationSettings } from "../db/repositories/IntegrationRepository";
import {
  PetitionSignatureConfig,
  PetitionSignatureConfigSigner,
} from "../db/repositories/PetitionRepository";
import { Petition, PetitionAccess, PetitionField, User } from "../db/__types";
import { toGlobalId } from "../util/globalId";
import { DynamicSelectOption } from "./helpers/parseDynamicSelectValues";

export function validateDynamicSelectReplyValues(field: PetitionField, reply: (string | null)[][]) {
  const levels = field.options.labels.length;
  const labels = field.options.labels as string[];
  let values = field.options.values as string[] | DynamicSelectOption[];
  for (let level = 0; level < levels; level++) {
    if (reply[level][0] !== labels[level]) {
      throw new Error(`Invalid label at level ${level}`);
    }
    if (reply[level][1] === null) {
      if (!reply.slice(level + 1).every(([, value]) => value === null)) {
        throw new Error("Invalid values after null");
      }
    } else if (level === levels - 1) {
      if (!(values as unknown as string[]).includes(reply[level][1]!)) {
        throw new Error(`Invalid value at level ${level}`);
      }
    } else {
      if (!(values as DynamicSelectOption[]).some(([value]) => value === reply[level][1])) {
        throw new Error(`Invalid value at level ${level}`);
      }
      values =
        (values as DynamicSelectOption[]).find(([value]) => value === reply[level][1])?.[1] ?? [];
    }
  }
}

export function validateCheckboxReplyValues(field: PetitionField, values: string[]) {
  const { type: subtype, min, max } = field.options.limit;

  if (subtype === "RADIO" && values.length > 1) {
    throw new Error("Invalid values");
  }

  if (
    (subtype === "EXACT" || subtype === "RANGE") &&
    (values.length > max || values.length < min)
  ) {
    throw new Error("Invalid values");
  }

  if (difference(values, field.options.values).length !== 0) {
    throw new Error(`Invalid values`);
  }
}

export async function startSignatureRequest(
  petition: Petition,
  additionalSignersInfo: PetitionSignatureConfigSigner[],
  message: string | null,
  starter: User | PetitionAccess,
  ctx: ApiContext,
  t?: Knex.Transaction
) {
  if (!petition.signature_config) {
    throw new Error(`Petition:${petition.id} was expected to have signature_config set`);
  }
  await verifySignatureIntegration(petition.signature_config.orgIntegrationId, petition.id, ctx);

  const isAccess = "keycode" in starter;
  const updatedBy = isAccess ? `Contact:${starter.contact_id}` : `User:${starter.id}`;

  let updatedPetition = null;

  const config = petition.signature_config as PetitionSignatureConfig;
  const userSigners = [...config.signersInfo, ...additionalSignersInfo];

  const allSigners = [...userSigners, ...additionalSignersInfo].map((s) => s.email);
  if (process.env.NODE_ENV === "development") {
    if (!allSigners.every((email) => ctx.config.development.whitelistedEmails.includes(email))) {
      throw new Error("DEVELOPMENT: Every recipient email must be whitelisted in .development.env");
    }
  }

  if (allSigners.length === 0) {
    throw new Error(`REQUIRED_SIGNER_INFO_ERROR`);
  }

  if (additionalSignersInfo.length > 0 && isDefined(petition.signature_config)) {
    [updatedPetition] = await ctx.petitions.updatePetition(
      petition.id,
      {
        signature_config: {
          ...petition.signature_config,
          // save the signer info specified by the recipient, so we can show this later on recipient view
          additionalSignersInfo,
        },
      },
      updatedBy,
      t
    );
  }

  const previousSignatureRequests = await ctx.petitions.loadPetitionSignaturesByPetitionId(
    petition.id
  );

  // avoid recipients restarting the signature process too many times
  if (countBy(previousSignatureRequests, (r) => r.cancel_reason === "REQUEST_RESTARTED") >= 20) {
    throw new Error(`Signature request on Petition:${petition.id} was restarted too many times`);
  }

  const enqueuedSignatureRequest = previousSignatureRequests.find((r) => r.status === "ENQUEUED");
  // ENQUEUED signature requests cannot be cancelled because those still don't have an external_id
  if (enqueuedSignatureRequest) {
    throw new Error(
      `Can't cancel enqueued PetitionSignatureRequest:${enqueuedSignatureRequest.id}`
    );
  }
  const pendingSignatureRequest = previousSignatureRequests.find((r) => r.status === "PROCESSING");

  // cancel pending signature request before starting a new one
  if (pendingSignatureRequest) {
    await Promise.all([
      ctx.petitions.cancelPetitionSignatureRequest(
        pendingSignatureRequest.id,
        "REQUEST_RESTARTED",
        isAccess ? { petition_access_id: starter.id } : { user_id: starter.id },
        t
      ),
      ctx.petitions.loadPetitionSignaturesByPetitionId.dataloader.clear(petition.id),
      ctx.petitions.createEvent(
        {
          type: "SIGNATURE_CANCELLED",
          petition_id: petition.id,
          data: {
            petition_signature_request_id: pendingSignatureRequest.id,
            cancel_reason: "REQUEST_RESTARTED",
            cancel_data: isAccess ? { petition_access_id: starter.id } : { user_id: starter.id },
          },
        },
        t
      ),
      ctx.aws.enqueueMessages("signature-worker", {
        groupId: `signature-${toGlobalId("Petition", pendingSignatureRequest.petition_id)}`,
        body: {
          type: "cancel-signature-process",
          payload: { petitionSignatureRequestId: pendingSignatureRequest.id },
        },
      }),
    ]);
  }

  const signatureRequest = await ctx.petitions.createPetitionSignature(
    petition.id,
    {
      ...(omit(petition.signature_config, ["additionalSignersInfo"]) as any),
      signersInfo: userSigners.concat(additionalSignersInfo),
      message,
    },
    t
  );

  await Promise.all([
    ctx.aws.enqueueMessages("signature-worker", {
      groupId: `signature-${toGlobalId("Petition", petition.id)}`,
      body: {
        type: "start-signature-process",
        payload: { petitionSignatureRequestId: signatureRequest.id },
      },
    }),
    ctx.petitions.createEvent(
      {
        type: "SIGNATURE_STARTED",
        petition_id: petition.id,
        data: {
          petition_signature_request_id: signatureRequest.id,
        },
      },
      t
    ),
  ]);

  return { petition: updatedPetition, signatureRequest };
}
/**
 *
 * checks that the signature integration exists and is valid.
 * also checks the usage limit if the integration uses our shared sandbox API_KEY
 */
async function verifySignatureIntegration(
  orgIntegrationId: number | undefined,
  petitionId: number,
  ctx: ApiContext
) {
  if (orgIntegrationId === undefined) {
    throw new Error(`undefined orgIntegrationId on signature_config. Petition:${petitionId}`);
  }
  const integration = await ctx.integrations.loadIntegration(orgIntegrationId);
  if (!integration || integration.type !== "SIGNATURE") {
    throw new Error(
      `Couldn't find an enabled signature integration for OrgIntegration:${orgIntegrationId}`
    );
  }
  const settings = integration.settings as IntegrationSettings<"SIGNATURE">;
  if (settings.API_KEY === ctx.config.signature.signaturitSharedProductionApiKey) {
    const sharedKeyUsage = await ctx.organizations.getOrganizationCurrentUsageLimit(
      integration.org_id,
      "SIGNATURIT_SHARED_APIKEY"
    );
    if (!sharedKeyUsage || sharedKeyUsage.used >= sharedKeyUsage.limit) {
      throw new Error("SIGNATURIT_SHARED_APIKEY_LIMIT_REACHED");
    }
  }
}
