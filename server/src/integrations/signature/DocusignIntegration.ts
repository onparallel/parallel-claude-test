import { json, Request } from "express";
import { inject, injectable } from "inversify";
import { isNonNullish, isNullish, maxBy, pick } from "remeda";
import { CONFIG, Config } from "../../config";
import { FeatureFlagName, OrgIntegration } from "../../db/__types";
import { SignatureDeliveredEvent } from "../../db/events/PetitionEvent";
import { FeatureFlagRepository } from "../../db/repositories/FeatureFlagRepository";
import {
  IntegrationRepository,
  IntegrationSettings,
} from "../../db/repositories/IntegrationRepository";
import {
  PetitionRepository,
  PetitionSignatureConfigSigner,
} from "../../db/repositories/PetitionRepository";
import { ENCRYPTION_SERVICE, EncryptionService } from "../../services/EncryptionService";
import { FETCH_SERVICE, FetchService } from "../../services/FetchService";
import { IRedis, REDIS } from "../../services/Redis";
import { ISignatureService } from "../../services/SignatureService";
import { fullName } from "../../util/fullName";
import { fromGlobalId } from "../../util/globalId";
import { Replace } from "../../util/types";
import { InvalidCredentialsError } from "../helpers/GenericIntegration";
import {
  OauthCredentials,
  OAuthIntegration,
  OauthIntegrationState,
} from "../helpers/OAuthIntegration";

type EnvelopeEvent =
  | // This event is sent when the email notification, with a link to the envelope,
  // is sent to at least one recipient or when it is a recipient's turn to sign during embedded signing.
  // The envelope remains in this state until all recipients have viewed the envelope.
  "envelope-sent"
  // This event is sent when all recipients have opened the envelope through the DocuSign signing website.
  // This does not signify an email delivery of an envelope.
  | "envelope-delivered"
  // The envelope has been completed by all the recipients.
  | "envelope-completed"
  // The envelope has been declined by one of the recipients.
  | "envelope-declined"
  // The envelope has been voided by the sender or has expired. The void reason indicates whether the envelope was manually voided or expired.
  | "envelope-voided"
  // Sent when the envelope is resent within the web application or via the Envelopes API call. Only available in JSON SIM message format.
  | "envelope-resent"
  // Sent when the envelope is corrected within the web application or via any of the Envelopes/EnvelopesRecipients API calls. Only available in JSON SIM message format.
  // Note: This event can only be generated in the API after an envelope lock is created prior to the envelope update, and then subsequently removed.
  | "envelope-corrected"
  // Sent when the envelope is queued to be purged within the web application or via the Update Envelopes API call. Only available in JSON SIM message format.
  // Note: The Purge queue has four states that will populate within the purgeState parameter within the envelope summary.
  // - documents_queued
  // - documents_and_metadata_queued
  // - documents_and_metadata_and_redact_queued
  // - documents_dequeued
  | "envelope-purge"
  // This event is sent after an already-sent envelope is deleted within the web application. Only available in JSON SIM message format.
  // Note: This event will not trigger for Envelopes in created or draft state.
  | "envelope-deleted"
  // Sent when an envelope in a created or draft state is deleted within the web application or discarded within the tagging UI.
  // Only available in JSON SIM message format.
  | "envelope-discard";

type RecipientEvent =
  // This event is sent when an email notification is sent to the recipient signifying that it is their turn to sign an envelope.
  | "recipient-sent"
  // Sent when DocuSign gets notification that an email delivery has failed. The delivery failure could be for a number of reasons,
  // such as a bad email address or that the recipient’s email system auto-responds to the email from DocuSign.
  | "recipient-autoresponded"
  // Sent when the recipient has viewed the document(s) in an envelope through the DocuSign signing web site.
  // This does not signify an email delivery of an envelope.
  | "recipient-delivered"
  // Sent when the recipient has completed their actions for the envelope, typically (but not always) by signing.
  | "recipient-completed"
  // Sent when the recipient declines to sign the document(s) in the envelope.
  | "recipient-declined"
  // Sent when the recipient fails an authentication check. In cases where a recipient has multiple attempts to pass a check,
  // it means that the recipient failed all the attempts.
  | "recipient-authenticationfailed"
  // Sent when the recipient selects finish within the web application on an Envelope. Only available in JSON SIM message format.
  | "recipient-resent"
  // Sent after a Delegation rule is in place and when a delegated signer is sent an envelope within the web application or the API.
  // Only available in JSON SIM message format.
  | "recipient-delegate"
  // Sent when the envelope is reassigned by a recipient within the web application. Only available in JSON SIM message format.
  | "recipient-reassign"
  // Sent when the recipient selects finish within the web application on an Envelope. Only available in JSON SIM message format.
  | "recipient-finish-later";

export interface DocuSignEventBody {
  event: EnvelopeEvent | RecipientEvent;
  apiVersion: string;
  uri: string;
  retryCount: number;
  configurationId: number;
  generatedDateTime: string;
  data: {
    accountId: string;
    userId: string;
    envelopeId: string;
    recipientId?: string;
    reassignedRecipientId?: string;
    envelopeSummary: {
      status: string;
      voidedReason?: string;
      recipients: {
        signers: {
          name: string;
          email: string;
          recipientId: string;
          status: string;
          declinedReason?: string;
        }[];
      };
    };
  };
}

export interface DocusignIntegrationContext {
  environment: DocusignEnvironment;
}

export type DocusignEnvironment = IntegrationSettings<"SIGNATURE", "DOCUSIGN">["ENVIRONMENT"];

interface DocusignIntegrationState extends OauthIntegrationState {
  environment: DocusignEnvironment;
}

interface TokenResponse {
  access_token: string;
  refresh_token: string;
}

@injectable()
export class DocusignIntegration extends OAuthIntegration<
  "SIGNATURE",
  "DOCUSIGN",
  DocusignIntegrationState,
  DocusignIntegrationContext
> {
  protected type = "SIGNATURE" as const;
  protected provider = "DOCUSIGN" as const;
  public service?: ISignatureService;

  constructor(
    @inject(CONFIG) private config: Config,
    @inject(REDIS) redis: IRedis,
    @inject(PetitionRepository) private petitions: PetitionRepository,
    @inject(IntegrationRepository) integrations: IntegrationRepository,
    @inject(FeatureFlagRepository) private featureFlags: FeatureFlagRepository,
    @inject(FETCH_SERVICE) private fetch: FetchService,
    @inject(ENCRYPTION_SERVICE) protected override encryption: EncryptionService,
  ) {
    super(encryption, integrations, redis);
    this.registerHandlers((router) => {
      router.use(json()).post(
        "/:petitionId/events",
        // function validateHMACSignature(req, res, next) {
        //   // check against multiple keys to allow for key rotation on Docusign panel
        //   const headerKeys = ["x-docusign-signature-1", "x-docusign-signature-2"];
        //   const isValid = headerKeys.some((key) => {
        //     const signature = req.headers[key] as string | undefined;
        //     if (signature) {
        //       const hash = createHmac(
        //         "sha256",
        //         req.context.config.oauth.docusign.production.webhookHmacSecret,
        //       )
        //         .update(JSON.stringify(req.body))
        //         .digest("base64");
        //       if (timingSafeEqual(Buffer.from(hash, "base64"), Buffer.from(signature, "base64"))) {
        //         return true;
        //       }
        //     }
        //     return false;
        //   });

        //   if (isValid) {
        //     next();
        //   } else {
        //     res.sendStatus(401).end();
        //   }
        // },
        async (req, res, next) => {
          try {
            const body = req.body as DocuSignEventBody;
            const signature = await req.context.petitions.loadPetitionSignatureByExternalId(
              `DOCUSIGN/${body.data.envelopeId}`,
            );

            if (isNullish(signature) || signature.status === "CANCELLED") {
              // status 200 to kill request but avoid sending an error to signaturit
              return res.sendStatus(200).end();
            }
            const petitionId = fromGlobalId(req.params.petitionId, "Petition").id;
            try {
              await this.appendEventLogs(body);
              switch (body.event) {
                case "recipient-sent":
                  await this.recipientSent(body, petitionId);
                  break;
                case "recipient-delivered":
                  await this.recipientDelivered(body, petitionId);
                  break;
                case "recipient-declined":
                  await this.recipientDeclined(body, petitionId);
                  break;
                case "envelope-voided":
                  await this.envelopeVoided(body, petitionId);
                  break;
                case "recipient-completed":
                  await this.recipientCompleted(body, petitionId);
                  break;
                case "envelope-completed":
                  await this.envelopeCompleted(body, petitionId);
                  break;
                case "recipient-autoresponded":
                  await this.recipientAutoresponded(body, petitionId);
                  break;
                case "recipient-reassign":
                  await this.recipientReassigned(body, petitionId);
                  break;
              }
            } catch (error: any) {
              req.context.logger.error(error.message, { stack: error.stack });
            }
            res.sendStatus(200).end();
          } catch (error: any) {
            req.context.logger.error(error.message, { stack: error.stack });
            next(error);
          }
        },
      );
    });
  }

  protected override getContext(
    integration: Replace<
      OrgIntegration,
      { settings: IntegrationSettings<"SIGNATURE", "DOCUSIGN"> }
    >,
  ): DocusignIntegrationContext {
    return {
      environment: integration.settings.ENVIRONMENT,
    };
  }

  protected override async buildState(req: Request) {
    if (
      typeof req.query.environment !== "string" ||
      !["production", "sandbox"].includes(req.query.environment)
    ) {
      throw new Error(`Invalid environment in query ${req.query.environment}`);
    }
    return {
      ...(await super.buildState(req)),
      environment: req.query.environment as DocusignEnvironment,
    };
  }

  private baseUri(environment: DocusignEnvironment) {
    return `${this.config.oauth.docusign[environment].oauthBaseUri}/oauth`;
  }

  private integrationKey(environment: DocusignEnvironment) {
    return this.config.oauth.docusign[environment].integrationKey;
  }

  private redirectUri(environment: DocusignEnvironment) {
    return this.config.oauth.docusign[environment].redirectUri;
  }

  private secretKey(environment: DocusignEnvironment) {
    return this.config.oauth.docusign[environment].secretKey;
  }

  private basicAuthorization(environment: DocusignEnvironment) {
    return `Basic ${Buffer.from(
      this.integrationKey(environment) + ":" + this.secretKey(environment),
    ).toString("base64")}`;
  }

  private async apiRequest<T>(
    environment: DocusignEnvironment,
    url: string,
    init: RequestInit,
  ): Promise<T> {
    const response = await this.fetch.fetch(`${this.baseUri(environment)}${url}`, {
      ...init,
      headers: { ...init.headers, "Cache-Control": "no-store", Pragma: "no-cache" },
    });

    if (!response.ok) {
      throw response;
    }

    return await response.json();
  }

  protected async buildAuthorizationUrl(state: string, { environment }: DocusignIntegrationState) {
    return `${this.baseUri(environment)}/auth?${new URLSearchParams({
      state,
      response_type: "code",
      scope: "signature,impersonation",
      client_id: this.integrationKey(environment),
      redirect_uri: this.redirectUri(environment),
    })}`;
  }

  protected async fetchIntegrationSettings(
    code: string,
    { environment }: DocusignIntegrationState,
  ): Promise<IntegrationSettings<"SIGNATURE", "DOCUSIGN">> {
    const data = await this.apiRequest<TokenResponse>(environment, "/token", {
      method: "POST",
      headers: {
        Authorization: this.basicAuthorization(environment),
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
      }),
    });

    return {
      CREDENTIALS: {
        ACCESS_TOKEN: data.access_token,
        REFRESH_TOKEN: data.refresh_token,
      },
      ENVIRONMENT: environment,
    };
  }

  protected async refreshCredentials(
    credentials: OauthCredentials,
    { environment }: DocusignIntegrationContext,
  ): Promise<OauthCredentials> {
    try {
      const data = await this.apiRequest<TokenResponse>(environment, "/token", {
        method: "POST",
        headers: {
          Authorization: this.basicAuthorization(environment),
        },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token: credentials.REFRESH_TOKEN,
        }),
      });

      return {
        ACCESS_TOKEN: data.access_token,
        REFRESH_TOKEN: data.refresh_token,
      };
    } catch (error) {
      if (error instanceof Response) {
        const errorData = await error.json();
        if (errorData.error === "invalid_grant") {
          throw new InvalidCredentialsError("CONSENT_REQUIRED", errorData);
        }
      }
      throw error;
    }
  }

  protected override async orgHasAccessToIntegration(
    orgId: number,
    state: DocusignIntegrationState,
  ) {
    const ffs: FeatureFlagName[] = ["PETITION_SIGNATURE"];
    if (state.environment === "sandbox") {
      ffs.push("DOCUSIGN_SANDBOX_PROVIDER");
    }
    return (await this.featureFlags.orgHasFeatureFlag(orgId, ffs)).every((ff) => ff);
  }

  /** email is sent to the recipient signifying that it is their turn to sign an envelope. */
  private async recipientSent(body: DocuSignEventBody, petitionId: number) {
    const signature = (await this.petitions.loadPetitionSignatureByExternalId(
      `DOCUSIGN/${body.data.envelopeId}`,
    ))!;

    /* 
    recipient externalId may not be found on the signature config if this recipient
    was assigned by somebody else. In this case we will skip without throwing error
  */
    let signerIndex: number;
    try {
      [, signerIndex] = this.findSigner(
        signature.signature_config.signersInfo,
        body.data.recipientId!,
      );
    } catch {
      return;
    }

    await this.petitions.updatePetitionSignatureSignerStatusByExternalId(
      signature.external_id!,
      signerIndex,
      { sent_at: new Date(body.generatedDateTime) },
    );

    await this.upsertSignatureDeliveredEvent(petitionId, body, {
      email_delivered_at: new Date(body.generatedDateTime),
    });
  }

  /** a signer opened the signing page on the signature provider */
  private async recipientDelivered(body: DocuSignEventBody, petitionId: number) {
    const signature = (await this.petitions.loadPetitionSignatureByExternalId(
      `DOCUSIGN/${body.data.envelopeId}`,
    ))!;
    const [signer, signerIndex] = this.findSigner(
      signature!.signature_config.signersInfo,
      body.data.recipientId!,
    );

    await this.petitions.updatePetitionSignatureSignerStatusByExternalId(
      signature.external_id!,
      signerIndex,
      { opened_at: new Date(body.generatedDateTime) },
    );

    await this.petitions.createEvent({
      type: "SIGNATURE_OPENED",
      petition_id: petitionId,
      data: {
        signer,
        petition_signature_request_id: signature!.id,
      },
    });
  }

  /** signer declined the document. Whole signature process is automatically cancelled by Docusign */
  private async recipientDeclined(body: DocuSignEventBody, petitionId: number) {
    const signature = (await this.petitions.loadPetitionSignatureByExternalId(
      `DOCUSIGN/${body.data.envelopeId}`,
    ))!;
    const [canceller, cancellerIndex] = this.findSigner(
      signature.signature_config.signersInfo,
      body.data.recipientId!,
    );

    const declineReason = body.data.envelopeSummary.recipients.signers.find(
      (s) => s.recipientId === body.data.recipientId!,
    )?.declinedReason;

    await this.petitions.updatePetitionSignatureRequestAsCancelled(signature.id, {
      cancel_reason: "DECLINED_BY_SIGNER",
      cancel_data: { canceller, decline_reason: declineReason },
      signer_status: {
        ...signature.signer_status,
        [cancellerIndex]: {
          ...signature.signer_status[cancellerIndex],
          declined_at: new Date(body.generatedDateTime),
        },
      },
    });
  }

  /**
   * envelope has been voided (declined) by some signer
   * similar to recipient-declined, but when document has only 1 signer.
   * in this event, body.data.recipientId is undefined so we assume the decliner is the only signer.
   * this event is also sent by docusign when user cancels/restarts the signature request,
   * but in that case the event will not be processed because the signature will be already cancelled.
   *
   * voided envelopes are already canceled by docusign so there is no need to call signature service
   * */
  private async envelopeVoided(body: DocuSignEventBody, petitionId: number) {
    const signature = (await this.petitions.loadPetitionSignatureByExternalId(
      `DOCUSIGN/${body.data.envelopeId}`,
    ))!;
    const [canceller, cancellerIndex] = [signature.signature_config.signersInfo[0], 0];
    await this.petitions.updatePetitionSignatureRequestAsCancelled(signature.id, {
      cancel_reason: "DECLINED_BY_SIGNER",
      cancel_data: {
        canceller,
        decline_reason: body.data.envelopeSummary.voidedReason,
      },
      signer_status: {
        ...signature.signer_status,
        [cancellerIndex]: {
          ...signature.signer_status[cancellerIndex],
          declined_at: new Date(body.generatedDateTime),
        },
      },
    });
  }

  /** recipient signed the document */
  private async recipientCompleted(body: DocuSignEventBody, petitionId: number) {
    const signature = (await this.petitions.loadPetitionSignatureByExternalId(
      `DOCUSIGN/${body.data.envelopeId}`,
    ))!;

    let signerIndex: number;
    let signer: PetitionSignatureConfigSigner;
    try {
      [signer, signerIndex] = this.findSigner(
        signature.signature_config.signersInfo,
        body.data.recipientId!,
      );
    } catch {
      return;
    }

    await this.petitions.updatePetitionSignatureSignerStatusByExternalId(
      `DOCUSIGN/${body.data.envelopeId}`,
      signerIndex,
      { signed_at: new Date(body.generatedDateTime) },
    );

    await this.petitions.createEvent({
      type: "RECIPIENT_SIGNED",
      petition_id: petitionId,
      data: {
        signer,
        petition_signature_request_id: signature!.id,
      },
    });
  }

  /** document is completed (everyone has already signed). document and audit trail are ready to be downloaded */
  private async envelopeCompleted(body: DocuSignEventBody, petitionId: number) {
    const signature = (await this.petitions.loadPetitionSignatureByExternalId(
      `DOCUSIGN/${body.data.envelopeId}`,
    ))!;

    // fetch signer with most recent signed_at Date to show it on the Signature Completed email
    const lastSignerIndex = parseInt(
      maxBy(Object.entries(signature.signer_status as Record<string, { signed_at: string }>), (i) =>
        new Date(i[1]!.signed_at).getTime(),
      )![0],
    );
    const signer = signature.signature_config.signersInfo[lastSignerIndex];

    await this.service!.storeSignedDocument(signature, body.data.envelopeId, signer);
    await this.service!.storeAuditTrail(signature, body.data.envelopeId);
  }

  /** Sent when DocuSign gets notification that an email delivery has failed. */
  private async recipientAutoresponded(body: DocuSignEventBody, petitionId: number) {
    const signature = (await this.petitions.loadPetitionSignatureByExternalId(
      `DOCUSIGN/${body.data.envelopeId}`,
    ))!;

    const bouncedSignerExternalId = body.data.recipientId!;
    const bouncedSignerIndex = signature.signature_config.signersInfo.findIndex(
      (s) => s.externalId === bouncedSignerExternalId,
    );
    const bouncedSigner = signature.signature_config.signersInfo[bouncedSignerIndex];

    await this.service!.cancelSignatureRequest(
      signature,
      "REQUEST_ERROR",
      {
        error: bouncedSigner ? `email ${bouncedSigner.email} bounced` : "email bounced",
        error_code: "EMAIL_BOUNCED",
        extra: bouncedSigner
          ? {
              email: bouncedSigner.email,
              name: fullName(bouncedSigner.firstName, bouncedSigner.lastName),
            }
          : null,
      },
      {
        signer_status: {
          ...signature.signer_status,
          [bouncedSignerIndex]: {
            ...signature.signer_status[bouncedSignerIndex],
            bounced_at: new Date(body.generatedDateTime),
          },
        },
      },
    );

    await this.upsertSignatureDeliveredEvent(petitionId, body, {
      email_bounced_at: new Date(body.generatedDateTime),
    });
  }

  /** one of the recipients reassigned their signature to another person. We need to update the recipientIds to point to the new signer */
  private async recipientReassigned(body: DocuSignEventBody, petitionId: number) {
    const signature = (await this.petitions.loadPetitionSignatureByExternalId(
      `DOCUSIGN/${body.data.envelopeId}`,
    ))!;

    await this.petitions.updatePetitionSignatureByExternalId(`DOCUSIGN/${body.data.envelopeId}`, {
      signature_config: {
        ...signature.signature_config,
        signersInfo: signature.signature_config.signersInfo.map((s) => ({
          ...s,
          externalId:
            s.externalId === body.data.recipientId ? body.data.reassignedRecipientId : s.externalId,
        })),
      },
    });
  }

  private async appendEventLogs(body: DocuSignEventBody): Promise<void> {
    await this.petitions.appendPetitionSignatureEventLogs(`DOCUSIGN/${body.data.envelopeId}`, [
      body,
    ]);
  }

  private findSigner(
    signers: (PetitionSignatureConfigSigner & { externalId: string })[],
    recipientExternalId: string,
  ): [PetitionSignatureConfigSigner & { externalId: string }, number] {
    const signerIndex = signers.findIndex((signer) => signer.externalId === recipientExternalId);

    const signer = signers[signerIndex];

    if (!signer) {
      throw new Error(
        `Can't find signer on signature_config. externalId: ${recipientExternalId}, signersInfo: ${JSON.stringify(
          signers,
        )}`,
      );
    }

    return [signer, signerIndex];
  }

  private async upsertSignatureDeliveredEvent(
    petitionId: number,
    body: DocuSignEventBody,
    data: Pick<
      SignatureDeliveredEvent["data"],
      "email_delivered_at" | "email_opened_at" | "email_bounced_at"
    >,
  ) {
    const signature = (await this.petitions.loadPetitionSignatureByExternalId(
      `DOCUSIGN/${body.data.envelopeId}`,
    ))!;

    const [signer] = this.findSigner(
      signature.signature_config.signersInfo,
      body.data.recipientId!,
    );

    const events = await this.petitions.getPetitionEventsByType(petitionId, [
      "SIGNATURE_DELIVERED",
    ]);

    const signerEvent = events.find((e) => e.data.signer.externalId === signer.externalId);

    if (isNonNullish(signerEvent)) {
      await this.petitions.updateEvent(signerEvent.id, {
        ...signerEvent,
        data: {
          ...signerEvent.data,
          ...data,
        },
      });
    } else {
      await this.petitions.createEvent({
        type: "SIGNATURE_DELIVERED",
        petition_id: petitionId,
        data: {
          petition_signature_request_id: signature.id,
          signer: pick(signer, ["email", "firstName", "lastName", "externalId"]),
          ...data,
        },
      });
    }
  }
}
