import { Knex } from "knex";
import { countBy, difference, isDefined, omit } from "remeda";
import { ApiContext } from "../context";
import { PetitionSignatureConfigSigner } from "../db/repositories/PetitionRepository";
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
  const isAccess = "keycode" in starter;
  const updatedBy = isAccess ? `Contact:${starter.contact_id}` : `User:${starter.id}`;

  let updatedPetition = null;
  const userSigners = (petition.signature_config?.signersInfo ??
    []) as PetitionSignatureConfigSigner[];

  if (process.env.NODE_ENV !== "production") {
    if (
      ![...userSigners, ...additionalSignersInfo].every(({ email }) =>
        email.endsWith("@onparallel.com")
      )
    ) {
      throw new Error("DEVELOPMENT: All recipients must have a parallel email.");
    }
  }

  if (userSigners.length === 0 && additionalSignersInfo.length === 0) {
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

  return updatedPetition;
}
