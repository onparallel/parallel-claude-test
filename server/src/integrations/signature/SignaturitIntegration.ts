import { urlencoded } from "express";
import { inject, injectable } from "inversify";
import { isNonNullish, isNullish, pick } from "remeda";
import { ContactLocale, ContactLocaleValues } from "../../db/__types";
import { SignatureDeliveredEvent } from "../../db/events/PetitionEvent";
import {
  EnhancedOrgIntegration,
  IntegrationRepository,
  IntegrationSettings,
} from "../../db/repositories/IntegrationRepository";
import {
  PetitionRepository,
  PetitionSignatureConfig,
  PetitionSignatureConfigSigner,
} from "../../db/repositories/PetitionRepository";
import { Tone } from "../../emails/utils/types";
import { SignaturitEvents } from "../../integrations/signature/SignaturitClient";
import { ENCRYPTION_SERVICE, EncryptionService } from "../../services/EncryptionService";
import { FETCH_SERVICE, IFetchService } from "../../services/FetchService";
import { ISignatureService } from "../../services/SignatureService";
import { fromGlobalId } from "../../util/globalId";
import { Replace } from "../../util/types";
import { GenericIntegration } from "../helpers/GenericIntegration";
import { SIGNATURE_CLIENT_FACTORY, SignatureClientFactory } from "./SignatureClient";

export interface SignaturitEventBody {
  document: {
    created_at: string;
    decline_reason?: string; // only for document_declined event type
    file: { name: string; pages: string; size: string };
    id: string;
    events?: {
      created_at: string;
      type: SignaturitEvents;
      decline_reason?: string;
    }[];
    signature: { id: string };
    email: string;
    name: string;
    status: string;
  };
  created_at: string;
  type: SignaturitEvents;
  reason?: string;
}

export type SignaturitBrandingIdKey = `${Uppercase<ContactLocale>}_${Tone}_BRANDING_ID`;

export type SignaturitEnvironment = IntegrationSettings<"SIGNATURE", "SIGNATURIT">["ENVIRONMENT"];

export interface SignaturitIntegrationContext {
  isParallelManaged: boolean;
  apiKeyHint: string;
  showCsv: boolean;
  brandings: {
    locale: ContactLocale;
    tone: Tone;
    brandingId: string;
  }[];
  environment: SignaturitEnvironment;
  onUpdateBrandingId(key: SignaturitBrandingIdKey, id: string): Promise<void>;
}

@injectable()
export class SignaturitIntegration extends GenericIntegration<
  "SIGNATURE",
  "SIGNATURIT",
  SignaturitIntegrationContext
> {
  protected type = "SIGNATURE" as const;
  protected provider = "SIGNATURIT" as const;
  public service?: ISignatureService;

  constructor(
    @inject(ENCRYPTION_SERVICE) encryption: EncryptionService,
    @inject(FETCH_SERVICE) private fetch: IFetchService,
    @inject(PetitionRepository) private petitions: PetitionRepository,
    @inject(IntegrationRepository) integrations: IntegrationRepository,
    @inject(SIGNATURE_CLIENT_FACTORY) private signatureClientFactory: SignatureClientFactory,
  ) {
    super(encryption, integrations);
    this.registerHandlers((router) => {
      router
        .use(urlencoded({ extended: true }))
        .post("/:petitionId/events", async (req, res, next) => {
          try {
            const body = req.body as SignaturitEventBody;
            const signature = await req.context.petitions.loadPetitionSignatureByExternalId(
              `SIGNATURIT/${body.document.signature.id}`,
            );

            if (isNullish(signature) || signature.status === "CANCELLED") {
              // status 200 to kill request but avoid sending an error to signaturit
              return res.sendStatus(200).end();
            }
            const petitionId = fromGlobalId(req.params.petitionId, "Petition").id;
            try {
              await this.appendEventLogs(body);
              switch (body.type) {
                case "document_opened":
                  await this.documentOpened(body, petitionId);
                  break;
                case "document_signed":
                  await this.documentSigned(body, petitionId);
                  break;
                case "document_declined":
                  await this.documentDeclined(body, petitionId);
                  break;
                case "audit_trail_completed":
                  await this.auditTrailCompleted(body, petitionId);
                  break;
                case "email_delivered":
                  await this.emailDelivered(body, petitionId);
                  break;
                case "email_opened":
                  await this.emailOpened(body, petitionId);
                  break;
                case "email_bounced":
                  await this.emailBounced(body, petitionId);
                  break;
                case "document_expired":
                  await this.documentExpired(body, petitionId);
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
        });
    });
  }

  async authenticateApiKey(apiKey: string) {
    return await Promise.any(
      Object.entries({
        sandbox: "https://api.sandbox.signaturit.com",
        production: "https://api.signaturit.com",
      }).map(([environment, url]) =>
        this.fetch
          .fetch(
            `${url}/v3/team/users.json`,
            { headers: { Authorization: `Bearer ${apiKey}` } },
            { timeout: 5_000 },
          )
          .then(({ status }) => {
            if (status === 200) {
              return { environment: environment as SignaturitEnvironment };
            } else {
              throw new Error();
            }
          }),
      ),
    );
  }

  public async withApiKey<TResult>(
    orgIntegrationId: number,
    handler: (apiKey: string, context: SignaturitIntegrationContext) => Promise<TResult>,
  ): Promise<TResult> {
    return await this.withCredentials(orgIntegrationId, async (credentials, context) => {
      return await handler(credentials.API_KEY, context);
    });
  }

  protected override getContext(
    integration: EnhancedOrgIntegration<"SIGNATURE", "SIGNATURIT", false>,
  ): SignaturitIntegrationContext {
    const settings = integration.settings;
    const brandings = ContactLocaleValues.flatMap((locale) =>
      (["FORMAL", "INFORMAL"] as Tone[]).map((tone) => {
        const key = `${locale.toUpperCase()}_${tone}_BRANDING_ID` as SignaturitBrandingIdKey;
        if (key in settings) {
          return { locale, tone, brandingId: settings[key]! };
        }
      }),
    ).filter(isNonNullish);
    const apiKey = settings.CREDENTIALS.API_KEY;
    return {
      apiKeyHint: apiKey.slice(0, 10),
      isParallelManaged: settings.IS_PARALLEL_MANAGED,
      showCsv: settings.SHOW_CSV ?? false,
      brandings,
      environment: settings.ENVIRONMENT,
      onUpdateBrandingId: async (key, id) => {
        await this.updateOrgIntegration(integration.id, { settings: { [key]: id } });
      },
    };
  }

  /** a signer opened the signing page on the signature provider */
  private async documentOpened(data: SignaturitEventBody, petitionId: number) {
    const signature = await this.fetchPetitionSignature(data.document.signature.id);
    const [signer, signerIndex] = await this.findSigner(signature!.signature_config, data.document);

    await this.petitions.updatePetitionSignatureSignerStatusByExternalId(
      signature.external_id!,
      signerIndex,
      { opened_at: new Date(data.created_at) },
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

  /** the document was signed by any of the assigned signers */
  private async documentSigned(data: SignaturitEventBody, petitionId: number) {
    const signature = await this.fetchPetitionSignature(data.document.signature.id);
    const [signer, signerIndex] = await this.findSigner(signature.signature_config, data.document);

    await this.petitions.updatePetitionSignatureSignerStatusByExternalId(
      `SIGNATURIT/${data.document.signature.id}`,
      signerIndex,
      { signed_at: new Date(data.created_at) },
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

  /** signer declined the document. Whole signature process will be cancelled */
  private async documentDeclined(data: SignaturitEventBody, petitionId: number) {
    const signature = await this.fetchPetitionSignature(data.document.signature.id);
    const [canceller, cancellerIndex] = await this.findSigner(
      signature.signature_config,
      data.document,
    );

    await this.petitions.updatePetitionSignatureRequestAsCancelled(signature.id, {
      cancel_reason: "DECLINED_BY_SIGNER",
      cancel_data: {
        canceller,
        decline_reason: data.document.decline_reason,
      },
      signer_status: {
        ...signature.signer_status,
        [cancellerIndex]: {
          ...signature.signer_status[cancellerIndex],
          declined_at: new Date(data.created_at),
        },
      },
    });
  }

  /** audit trail has been completed, audit trail and signed document are ready to be downloaded */
  private async auditTrailCompleted(data: SignaturitEventBody, petitionId: number) {
    const {
      id: documentId,
      signature: { id: signatureId },
    } = data.document;

    const signature = await this.fetchPetitionSignature(signatureId);
    const [signer] = await this.findSigner(signature!.signature_config, data.document);

    await this.service!.storeSignedDocument(signature, `${signatureId}/${documentId}`, signer);
    await this.service!.storeAuditTrail(signature, `${signatureId}/${documentId}`);
  }

  private async emailDelivered(data: SignaturitEventBody, petitionId: number) {
    const signature = await this.fetchPetitionSignature(data.document.signature.id);
    const [, signerIndex] = await this.findSigner(signature.signature_config, data.document);
    await this.petitions.updatePetitionSignatureSignerStatusByExternalId(
      signature.external_id!,
      signerIndex,
      { sent_at: new Date(data.created_at) },
    );

    await this.upsertSignatureDeliveredEvent(petitionId, data, {
      email_delivered_at: new Date(data.created_at),
    });
  }

  private async emailOpened(data: SignaturitEventBody, petitionId: number) {
    await this.upsertSignatureDeliveredEvent(petitionId, data, {
      email_opened_at: new Date(data.created_at),
    });
  }

  private async emailBounced(data: SignaturitEventBody, petitionId: number) {
    const signature = await this.fetchPetitionSignature(data.document.signature.id);

    const [, signerIndex] = await this.findSigner(signature.signature_config, data.document);
    await this.petitions.updatePetitionSignatureRequestAsCancelled(signature.id, {
      cancel_reason: "REQUEST_ERROR",
      cancel_data: {
        error: data.reason ?? `email ${data.document.email} bounced`,
        error_code: "EMAIL_BOUNCED",
        extra: pick(data.document, ["email", "name"]),
      },
      signer_status: {
        ...signature.signer_status,
        [signerIndex]: {
          ...signature.signer_status[signerIndex],
          bounced_at: new Date(data.created_at),
        },
      },
    });

    await this.upsertSignatureDeliveredEvent(petitionId, data, {
      email_bounced_at: new Date(data.created_at),
    });
  }
  /** document has expired before every signer could sign it. we need to cancel the request in our DB */
  private async documentExpired(data: SignaturitEventBody, petitionId: number) {
    const signature = await this.fetchPetitionSignature(data.document.signature.id);
    await this.petitions.updatePetitionSignatureRequestAsCancelled(signature.id, {
      cancel_reason: "REQUEST_EXPIRED",
      cancel_data: {},
    });
  }

  private async fetchPetitionSignature(signatureId: string) {
    const externalId = `SIGNATURIT/${signatureId}`;
    const signature = await this.petitions.loadPetitionSignatureByExternalId(externalId);
    if (!signature) {
      throw new Error(`Petition signature request with externalId: ${externalId} not found.`);
    }
    if (signature.status === "CANCELLED") {
      throw new Error(
        `Requested petition signature with id: ${signature.id} was previously cancelled`,
      );
    }

    return signature;
  }

  private async appendEventLogs(data: SignaturitEventBody): Promise<void> {
    // data.document.events contain the complete list of events since signature was started
    // we just want to append the last event to the log
    delete data.document.events;
    await this.petitions.appendPetitionSignatureEventLogs(
      `SIGNATURIT/${data.document.signature.id}`,
      [data],
    );
  }

  private async findSigner(
    signatureConfig: Replace<
      PetitionSignatureConfig,
      { signersInfo: (PetitionSignatureConfigSigner & { externalId: string })[] }
    >,
    document: SignaturitEventBody["document"],
  ): Promise<[PetitionSignatureConfigSigner & { externalId: string }, number]> {
    let signerIndex = signatureConfig.signersInfo.findIndex(
      (signer) => signer.externalId === document.id,
    );

    let signer = signatureConfig.signersInfo[signerIndex];

    if (!signer) {
      // signer not found, it's probably because it has been changed from signaturit dashboard
      // fetch updated signers from signaturit API and update signersInfo array
      const newSignersInfo = await this.syncSignatureRequestSigners(document.signature.id);

      signerIndex = newSignersInfo.findIndex((signer) => signer.externalId === document.id);
      signer = newSignersInfo[signerIndex];

      if (!signer) {
        // sync didn't work
        throw new Error(
          `Signer with externalId: ${document.id} not found in signature request SIGNATURIT/${document.signature.id}`,
        );
      }
    }

    return [signer, signerIndex];
  }

  private async upsertSignatureDeliveredEvent(
    petitionId: number,
    body: SignaturitEventBody,
    data: Pick<
      SignatureDeliveredEvent["data"],
      "email_delivered_at" | "email_opened_at" | "email_bounced_at"
    >,
  ) {
    const signature = await this.fetchPetitionSignature(body.document.signature.id);

    const [signer] = await this.findSigner(signature.signature_config, body.document);

    const events = await this.petitions.getPetitionEventsByType(petitionId, [
      "SIGNATURE_DELIVERED",
    ]);

    const signerEvent = events.find((e) => e.data.signer.externalId === signer.externalId);

    if (isNonNullish(signerEvent)) {
      if (isNonNullish(signerEvent.data.email_opened_at) && isNonNullish(data.email_opened_at)) {
        // write the email_opened_at Date only once, so future email opens after signature is completed don't overwrite this date
        return;
      }

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

  private async syncSignatureRequestSigners(signatureExternalId: string) {
    const signatureRequest = await this.fetchPetitionSignature(signatureExternalId);
    const client = this.signatureClientFactory(
      "SIGNATURIT",
      signatureRequest.signature_config.orgIntegrationId,
    );

    const signature = await client.getSignatureRequest(signatureExternalId);

    const newSignersInfo = signature.documents.map((signer) => ({
      email: signer.email,
      firstName: signer.name,
      lastName: "",
      externalId: signer.id,
    }));

    const newSignerStatus: Record<
      string,
      Pick<
        SignatureDeliveredEvent["data"],
        "email_delivered_at" | "email_opened_at" | "email_bounced_at"
      >
    > = {};

    const eventLogs = signatureRequest.event_logs as SignaturitEventBody[];

    for (const signer of newSignersInfo) {
      const signerIndex = newSignersInfo.findIndex((s) => s.externalId === signer.externalId);
      const emailDeliveredEvent = eventLogs.find(
        (e) => e.type === "email_delivered" && e.document.id === signer.externalId,
      );
      const emailOpenedEvent = eventLogs.find(
        (e) => e.type === "email_opened" && e.document.id === signer.externalId,
      );
      const emailBouncedEvent = eventLogs.findLast(
        (e) => e.type === "email_bounced" && e.document.id === signer.externalId,
      );

      newSignerStatus[signerIndex] = {
        email_bounced_at: emailBouncedEvent ? new Date(emailBouncedEvent.created_at) : undefined,
        email_delivered_at: emailDeliveredEvent
          ? new Date(emailDeliveredEvent.created_at)
          : undefined,
        email_opened_at: emailOpenedEvent ? new Date(emailOpenedEvent.created_at) : undefined,
      };
    }

    await this.petitions.updatePetitionSignatureByExternalId(`SIGNATURIT/${signatureExternalId}`, {
      signature_config: {
        ...signatureRequest.signature_config,
        signersInfo: newSignersInfo,
      },
      signer_status: newSignerStatus,
    });

    return newSignersInfo;
  }
}
