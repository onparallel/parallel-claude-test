import { EventEmitter } from "events";
import "reflect-metadata";
import { isDefined } from "remeda";
import SignaturitSDK, { BrandingParams, BrandingResponse } from "signaturit-sdk";
import { URLSearchParams } from "url";
import { ISignatureClient, Recipient, SignatureOptions } from ".";
import { Config } from "../../../config";
import { IntegrationSettings } from "../../../db/repositories/IntegrationRepository";
import { Tone } from "../../../db/__types";
import { buildEmail } from "../../../emails/buildEmail";
import SignatureCancelledEmail from "../../../emails/emails/SignatureCancelledEmail";
import SignatureCompletedEmail from "../../../emails/emails/SignatureCompletedEmail";
import SignatureReminderEmail from "../../../emails/emails/SignatureReminderEmail";
import SignatureRequestedEmail from "../../../emails/emails/SignatureRequestedEmail";
import { getBaseWebhookUrl } from "../../../util/getBaseWebhookUrl";
import { toGlobalId } from "../../../util/globalId";
import { downloadImageBase64 } from "../../../util/images";
import { II18nService } from "../../i18n";

export class SignaturItClient extends EventEmitter implements ISignatureClient {
  private sdk: SignaturitSDK;
  constructor(
    private settings: IntegrationSettings<"SIGNATURE", "SIGNATURIT">,
    private config: Config,
    private orgId: number,
    private i18n: II18nService
  ) {
    super();
    if (!this.settings.CREDENTIALS.API_KEY) {
      throw new Error("Signaturit API KEY not found on org_integration settings");
    }

    this.sdk = new SignaturitSDK(
      this.settings.CREDENTIALS.API_KEY,
      settings.ENVIRONMENT === "production"
    );
  }

  public async startSignatureRequest(
    petitionId: string,
    files: string,
    recipients: Recipient[],
    opts: SignatureOptions
  ) {
    const locale = opts.locale;
    const tone = opts.templateData?.tone ?? "INFORMAL";

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
            height: 7.5, // 7.5% of page height
            width:
              ((210 -
                opts.pdfDocumentTheme.marginLeft -
                opts.pdfDocumentTheme.marginRight -
                5 /* grid gap */ * 2) /
                3 /
                210) *
              100,
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
    const intl = await this.i18n.getIntl(opts.locale);

    return await this.sdk.createBranding({
      show_welcome_page: false,
      layout_color: opts.templateData?.theme?.color ?? "#6059F7",
      text_color: "#F6F6F6",
      logo: opts.templateData?.logoUrl
        ? await downloadImageBase64(opts.templateData.logoUrl)
        : undefined,
      application_texts: {
        open_sign_button: intl.formatMessage({
          id: "signature-client.open-document",
          defaultMessage: "Open document",
        }),
      },
      templates: isDefined(opts.templateData)
        ? await this.buildSignaturItBrandingTemplates(opts)
        : undefined,
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
          ...opts.templateData!,
        },
        { locale: opts.locale }
      ),
      buildEmail(
        SignatureCompletedEmail,
        {
          signatureProvider: "Signaturit",
          signerName: "{{signer_name}}",
          documentName: "{{filename}}",
          ...opts.templateData!,
        },
        { locale: opts.locale }
      ),
      buildEmail(
        SignatureCancelledEmail,
        {
          signatureProvider: "Signaturit",
          signerName: "{{signer_name}}",
          ...opts.templateData!,
        },
        { locale: opts.locale }
      ),
      buildEmail(
        SignatureReminderEmail,
        {
          documentName: "{{filename}}",
          signerName: "{{signer_name}}",
          signButton: "{{sign_button}}",
          ...opts.templateData!,
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
