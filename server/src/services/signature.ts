import { EventEmitter } from "events";
import { inject, injectable } from "inversify";
import "reflect-metadata";
import SignaturitSDK, {
  BrandingParams,
  BrandingResponse,
  Document,
  SignatureParams,
} from "signaturit-sdk";
import { URLSearchParams } from "url";
import { Tone } from "../api/public/__types";
import {
  IntegrationRepository,
  IntegrationSettings,
} from "../db/repositories/IntegrationRepository";
import { OrgIntegration } from "../db/__types";
import { buildEmail } from "../emails/buildEmail";
import SignatureCancelledEmail from "../emails/components/SignatureCancelledEmail";
import SignatureCompletedEmail from "../emails/components/SignatureCompletedEmail";
import SignatureReminderEmail from "../emails/components/SignatureReminderEmail";
import SignatureRequestedEmail from "../emails/components/SignatureRequestedEmail";
import { toGlobalId } from "../util/globalId";
import { downloadImageBase64 } from "../util/images";
import { removeNotDefined } from "../util/remedaExtensions";
import { PageSignatureMetadata } from "../workers/helpers/calculateSignatureBoxPositions";
import { getBaseWebhookUrl } from "../workers/helpers/getBaseWebhookUrl";
import { CONFIG, Config } from "./../config";

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
   *  Each element on the array represents a page in the document.
   *  Inside each page, there's an array with the signers information.
   */
  signatureBoxPositions?: PageSignatureMetadata[][];
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

export const SIGNATURE = Symbol.for("SIGNATURE");
@injectable()
export class SignatureService {
  constructor(
    @inject(CONFIG) private config: Config,
    @inject(IntegrationRepository)
    private integrationRepository: IntegrationRepository
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

    return await this.sdk.createSignature(
      files,
      recipients,
      removeNotDefined<SignatureParams>({
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
          require_signature_in_coordinates: opts.signatureBoxPositions?.map(
            (pageBoxes) => pageBoxes.find((pb) => pb.signerIndex === recipientIndex)?.box ?? {}
          ),
        })),
        expire_time: 0, // disable signaturit automatic reminder emails
        reminders: 0,
      }) as any
    );
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
