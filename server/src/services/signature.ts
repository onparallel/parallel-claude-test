import { EventEmitter } from "events";
import { inject, injectable } from "inversify";
import { Knex } from "knex";
import "reflect-metadata";
import { countBy, isDefined, omit } from "remeda";
import SignaturitSDK, { BrandingParams, BrandingResponse, Document } from "signaturit-sdk";
import { URLSearchParams } from "url";
import { Tone } from "../api/public/__types";
import {
  IntegrationRepository,
  IntegrationSettings,
} from "../db/repositories/IntegrationRepository";
import { OrganizationRepository } from "../db/repositories/OrganizationRepository";
import { PetitionRepository, PetitionSignatureConfig } from "../db/repositories/PetitionRepository";
import { OrgIntegration, PetitionAccess, User } from "../db/__types";
import { buildEmail } from "../emails/buildEmail";
import SignatureCancelledEmail from "../emails/components/SignatureCancelledEmail";
import SignatureCompletedEmail from "../emails/components/SignatureCompletedEmail";
import SignatureReminderEmail from "../emails/components/SignatureReminderEmail";
import SignatureRequestedEmail from "../emails/components/SignatureRequestedEmail";
import { toGlobalId } from "../util/globalId";
import { downloadImageBase64 } from "../util/images";
import { getBaseWebhookUrl } from "../workers/helpers/getBaseWebhookUrl";
import { CONFIG, Config } from "./../config";
import { AWS_SERVICE, IAws } from "./aws";
import { FetchService, FETCH_SERVICE } from "./fetch";

type SignatureOptions = {
  locale: string;
  templateData: {
    logoUrl: string;
    logoAlt: string;
    parallelUrl: string;
    assetsUrl: string;
    tone: Tone;
  };
  events_url?: string;
  signingMode?: "parallel" | "sequential";
  /**
   * Optional plain-text custom message to include in the "signature requested" emails
   */
  initialMessage?: string;
};

export type SignatureResponse = {
  id: string;
  created_at: Date;
  data: any[];
  documents: Document[];
  url?: string;
};

export type Recipient = { email: string; name: string };

type SignaturitIntegrationSettings = IntegrationSettings<"SIGNATURE">;

export interface ISignatureClient {
  startSignatureRequest: (
    petitionId: string,
    filePath: string,
    recipients: Recipient[],
    options: SignatureOptions
  ) => Promise<SignatureResponse>;

  cancelSignatureRequest: (externalId: string) => Promise<SignatureResponse>;
  downloadSignedDocument: (externalId: string) => Promise<Buffer>;
  downloadAuditTrail: (externalId: string) => Promise<Buffer>;
  sendPendingSignatureReminder: (signatureId: string) => Promise<SignatureResponse>;
}

export interface ISignatureService {
  checkSignaturitApiKey(apiKey: string): Promise<"sandbox" | "production">;
  createSignatureRequest(
    petitionId: number,
    signatureConfig: PetitionSignatureConfig,
    starter: User | PetitionAccess,
    t?: Knex.Transaction
  ): Promise<any>;
}

export const SIGNATURE = Symbol.for("SIGNATURE");
@injectable()
export class SignatureService implements ISignatureService {
  constructor(
    @inject(CONFIG) private config: Config,
    @inject(IntegrationRepository)
    private integrationRepository: IntegrationRepository,
    @inject(PetitionRepository) private petitionsRepository: PetitionRepository,
    @inject(OrganizationRepository) private organizationsRepository: OrganizationRepository,
    @inject(AWS_SERVICE) private aws: IAws,
    @inject(FETCH_SERVICE) private fetch: FetchService
  ) {}
  public getClient(integration: OrgIntegration): ISignatureClient {
    switch (integration.provider.toUpperCase()) {
      case "SIGNATURIT":
        return this.buildSignaturItClient(integration);
      default:
        throw new Error(`Couldn't resolve signature client: ${integration.provider}`);
    }
  }

  private buildSignaturItClient(integration: OrgIntegration): SignaturItClient {
    const settings = integration.settings as SignaturitIntegrationSettings;
    const client = new SignaturItClient(settings, this.config, integration.org_id);
    client.on(
      "branding_updated",
      ({ locale, brandingId, tone }: { locale: string; brandingId: string; tone: Tone }) => {
        const key = `${locale.toUpperCase()}_${tone.toUpperCase()}_BRANDING_ID` as `${
          | "EN"
          | "ES"}_${Tone}_BRANDING_ID`;

        settings[key] = brandingId;

        this.integrationRepository.updateOrgIntegration<"SIGNATURE">(
          integration.id,
          { settings },
          `OrgIntegration:${integration.id}`
        );
      }
    );
    return client;
  }

  async checkSignaturitApiKey(apiKey: string) {
    return await Promise.any(
      Object.entries({
        sandbox: "https://api.sandbox.signaturit.com",
        production: "https://api.signaturit.com",
      }).map(([environment, url]) =>
        this.fetch
          .fetchWithTimeout(
            `${url}/v3/team/users.json`,
            { headers: { authorization: `Bearer ${apiKey}` } },
            5000
          )
          .then((res) => {
            if (res.status === 200) {
              return environment as "sandbox" | "production";
            } else {
              throw new Error();
            }
          })
      )
    );
  }

  async createSignatureRequest(
    petitionId: number,
    signatureConfig: PetitionSignatureConfig,
    starter: User | PetitionAccess,
    t?: Knex.Transaction
  ) {
    await this.verifySignatureIntegration(petitionId, signatureConfig.orgIntegrationId);

    const isAccess = "keycode" in starter;
    const updatedBy = isAccess ? `Contact:${starter.contact_id}` : `User:${starter.id}`;

    let updatedPetition = null;

    const allSigners = [
      ...signatureConfig.signersInfo,
      ...(signatureConfig.additionalSignersInfo ?? []),
    ];

    const emails = allSigners.map((s) => s.email);
    if (process.env.NODE_ENV === "development") {
      if (!emails.every((email) => this.config.development.whitelistedEmails.includes(email))) {
        throw new Error(
          "DEVELOPMENT: Every recipient email must be whitelisted in .development.env"
        );
      }
    }

    if (allSigners.length === 0) {
      throw new Error(`REQUIRED_SIGNER_INFO_ERROR`);
    }

    if ((signatureConfig.additionalSignersInfo ?? [])?.length > 0) {
      [updatedPetition] = await this.petitionsRepository.updatePetition(
        petitionId,
        { signature_config: signatureConfig },
        updatedBy,
        t
      );
    }

    const previousSignatureRequests =
      await this.petitionsRepository.loadPetitionSignaturesByPetitionId(petitionId, {
        refresh: true,
      });

    // avoid recipients restarting the signature process too many times
    if (countBy(previousSignatureRequests, (r) => r.cancel_reason === "REQUEST_RESTARTED") >= 20) {
      throw new Error(`Signature request on Petition:${petitionId} was restarted too many times`);
    }

    const enqueuedSignatureRequest = previousSignatureRequests.find(
      (r) => r.status === "ENQUEUED" || r.status === "PROCESSING"
    );

    const pendingSignatureRequest = previousSignatureRequests.find((r) => r.status === "PROCESSED");

    // cancel pending signature request before starting a new one
    if (enqueuedSignatureRequest || pendingSignatureRequest) {
      await Promise.all([
        this.petitionsRepository.cancelPetitionSignatureRequest(
          [enqueuedSignatureRequest, pendingSignatureRequest].filter(isDefined),
          "REQUEST_RESTARTED",
          isAccess ? { petition_access_id: starter.id } : { user_id: starter.id },
          undefined,
          t
        ),
        this.petitionsRepository.loadPetitionSignaturesByPetitionId.dataloader.clear(petitionId),
        pendingSignatureRequest
          ? // only send a cancel request if the signature request has been already processed
            this.aws.enqueueMessages(
              "signature-worker",
              {
                groupId: `signature-${toGlobalId("Petition", pendingSignatureRequest.petition_id)}`,
                body: {
                  type: "cancel-signature-process",
                  payload: { petitionSignatureRequestId: pendingSignatureRequest.id },
                },
              },
              t
            )
          : null,
      ]);
    }

    const signatureRequest = await this.petitionsRepository.createPetitionSignature(
      petitionId,
      {
        ...(omit(signatureConfig, ["additionalSignersInfo"]) as any),
        signersInfo: signatureConfig.signersInfo.concat(
          signatureConfig.additionalSignersInfo ?? []
        ),
      },
      t
    );

    await Promise.all([
      this.aws.enqueueMessages(
        "signature-worker",
        {
          groupId: `signature-${toGlobalId("Petition", petitionId)}`,
          body: {
            type: "start-signature-process",
            payload: { petitionSignatureRequestId: signatureRequest.id },
          },
        },
        t
      ),
      this.petitionsRepository.createEvent(
        {
          type: "SIGNATURE_STARTED",
          petition_id: petitionId,
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
  private async verifySignatureIntegration(
    petitionId: number,
    orgIntegrationId: number | undefined
  ) {
    if (orgIntegrationId === undefined) {
      throw new Error(`undefined orgIntegrationId on signature_config. Petition:${petitionId}`);
    }
    const integration = await this.integrationRepository.loadIntegration(orgIntegrationId);
    if (!integration || integration.type !== "SIGNATURE") {
      throw new Error(
        `Couldn't find an enabled signature integration for OrgIntegration:${orgIntegrationId}`
      );
    }
    const settings = integration.settings as IntegrationSettings<"SIGNATURE">;
    if (settings.API_KEY === this.config.signature.signaturitSharedProductionApiKey) {
      const sharedKeyUsage = await this.organizationsRepository.getOrganizationCurrentUsageLimit(
        integration.org_id,
        "SIGNATURIT_SHARED_APIKEY"
      );
      if (!sharedKeyUsage || sharedKeyUsage.used >= sharedKeyUsage.limit) {
        throw new Error("SIGNATURIT_SHARED_APIKEY_LIMIT_REACHED");
      }
    }
  }
}

class SignaturItClient extends EventEmitter implements ISignatureClient {
  private sdk: SignaturitSDK;
  constructor(
    private settings: SignaturitIntegrationSettings,
    private config: Config,
    private orgId: number
  ) {
    super();
    if (!this.settings.API_KEY) {
      throw new Error("Signaturit API KEY not found on org_integration settings");
    }

    this.sdk = new SignaturitSDK(this.settings.API_KEY, settings.ENVIRONMENT === "production");
  }

  public async startSignatureRequest(
    petitionId: string,
    files: string,
    recipients: Recipient[],
    opts: SignatureOptions
  ) {
    const locale = opts.locale;
    const tone = opts.templateData.tone;

    const key = `${locale.toUpperCase()}_${tone}_BRANDING_ID` as `${
      | "EN"
      | "ES"}_${Tone}_BRANDING_ID`;

    let brandingId = this.settings[key];

    if (!brandingId) {
      brandingId = (await this.createOrgBranding(opts)).id;
      this.emit("branding_updated", { locale, brandingId, tone });
    }

    const baseEventsUrl = await getBaseWebhookUrl(this.config.misc.parallelUrl);

    return await this.sdk.createSignature(files, recipients, {
      body: opts.initialMessage,
      delivery_type: "email",
      signing_mode: opts.signingMode ?? "parallel",
      branding_id: brandingId,
      events_url: `${baseEventsUrl}/api/webhooks/signaturit/${petitionId}/events`,
      callback_url: `${this.config.misc.parallelUrl}/${locale}/thanks?${new URLSearchParams({
        o: toGlobalId("Organization", this.orgId),
      })}`,
      recipients: recipients.map((r, recipientIndex) => ({
        email: r.email,
        name: r.name,
        widgets: [
          {
            type: "signature",
            word_anchor: `3cb39pzCQA9wJ${recipientIndex}`,
            height: 7, // 7% of page height
            width: 28, // 28% of page width
          },
        ],
      })),
      expire_time: 0, // disable signaturit automatic reminder emails
      reminders: 0,
    });
  }

  public async cancelSignatureRequest(externalId: string) {
    return await this.sdk.cancelSignature(externalId);
  }

  // returns a binary encoded buffer of the signed document
  public async downloadSignedDocument(externalId: string): Promise<Buffer> {
    const [signatureId, documentId] = externalId.split("/");
    return Buffer.from(await this.sdk.downloadSignedDocument(signatureId, documentId));
  }

  public async downloadAuditTrail(externalId: string) {
    const [signatureId, documentId] = externalId.split("/");
    return Buffer.from(await this.sdk.downloadAuditTrail(signatureId, documentId));
  }

  public async sendPendingSignatureReminder(signatureId: string) {
    return await this.sdk.sendSignatureReminder(signatureId);
  }

  private async createOrgBranding(opts: SignatureOptions): Promise<BrandingResponse> {
    return await this.sdk.createBranding({
      show_welcome_page: false,
      layout_color: "#6059F7",
      text_color: "#F6F6F6",
      logo: await downloadImageBase64(opts.templateData.logoUrl),
      application_texts: {
        open_sign_button: opts.locale === "es" ? "Abrir documento" : "Open document",
      },
      templates: await this.buildSignaturItBrandingTemplates(opts),
    });
  }

  private async buildSignaturItBrandingTemplates(
    opts: SignatureOptions
  ): Promise<BrandingParams["templates"]> {
    const [
      { html: signatureRequestedEmail },
      { html: signatureCompletedEmail },
      { html: signatureCancelledEmail },
      { html: signatureReminderEmail },
    ] = await Promise.all([
      buildEmail(
        SignatureRequestedEmail,
        {
          signButton: "{{sign_button}}",
          signerName: "{{signer_name}}",
          documentName: "{{filename}}",
          emailBody: "{{email_body}}",
          ...opts.templateData,
        },
        { locale: opts.locale }
      ),
      buildEmail(
        SignatureCompletedEmail,
        {
          signatureProvider: "Signaturit",
          signerName: "{{signer_name}}",
          documentName: "{{filename}}",
          ...opts.templateData,
        },
        { locale: opts.locale }
      ),
      buildEmail(
        SignatureCancelledEmail,
        {
          signatureProvider: "Signaturit",
          signerName: "{{signer_name}}",
          ...opts.templateData,
        },
        { locale: opts.locale }
      ),
      buildEmail(
        SignatureReminderEmail,
        {
          documentName: "{{filename}}",
          signerName: "{{signer_name}}",
          signButton: "{{sign_button}}",
          ...opts.templateData,
        },
        { locale: opts.locale }
      ),
    ]);

    return {
      signatures_request: signatureRequestedEmail,
      signatures_receipt: signatureCompletedEmail,
      document_canceled: signatureCancelledEmail,
      pending_sign: signatureReminderEmail,
    };
  }
}
