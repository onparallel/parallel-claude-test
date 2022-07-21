import { EventEmitter } from "events";
import "reflect-metadata";
import { isDefined } from "remeda";
import SignaturitSDK, { BrandingParams } from "signaturit-sdk";
import { URLSearchParams } from "url";
import { BrandingIdKey, ISignatureClient, Recipient, SignatureOptions } from "./client";
import { Config } from "../../config";
import { IntegrationSettings } from "../../db/repositories/IntegrationRepository";
import { buildEmail } from "../../emails/buildEmail";
import SignatureCancelledEmail from "../../emails/emails/SignatureCancelledEmail";
import SignatureCompletedEmail from "../../emails/emails/SignatureCompletedEmail";
import SignatureReminderEmail from "../../emails/emails/SignatureReminderEmail";
import SignatureRequestedEmail from "../../emails/emails/SignatureRequestedEmail";
import { getBaseWebhookUrl } from "../../util/getBaseWebhookUrl";
import { toGlobalId } from "../../util/globalId";
import { downloadImageBase64 } from "../../util/images";
import { removeNotDefined } from "../../util/remedaExtensions";
import { IFetchService } from "../fetch";
import { II18nService } from "../i18n";

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

  static async guessEnvironment(apiKey: string, fetch: IFetchService) {
    return await Promise.any(
      Object.entries({
        sandbox: "https://api.sandbox.signaturit.com",
        production: "https://api.signaturit.com",
      }).map(([environment, url]) =>
        fetch
          .fetchWithTimeout(
            `${url}/v3/team/users.json`,
            {
              headers: { authorization: `Bearer ${apiKey}` },
            },
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

  async startSignatureRequest(
    petitionId: string,
    files: string,
    recipients: Recipient[],
    opts: SignatureOptions
  ) {
    const locale = opts.locale;
    const tone = opts.templateData?.tone ?? "INFORMAL";

    const key = `${locale.toUpperCase()}_${tone}_BRANDING_ID` as BrandingIdKey;

    let brandingId = this.settings[key];

    if (!brandingId) {
      brandingId = await this.createBranding(opts);
      this.emit("branding_created", { locale, brandingId, tone });
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

  async cancelSignatureRequest(externalId: string) {
    return await this.sdk.cancelSignature(externalId);
  }

  // returns a binary encoded buffer of the signed document
  async downloadSignedDocument(externalId: string) {
    const [signatureId, documentId] = externalId.split("/");
    return Buffer.from(await this.sdk.downloadSignedDocument(signatureId, documentId));
  }

  async downloadAuditTrail(externalId: string) {
    const [signatureId, documentId] = externalId.split("/");
    return Buffer.from(await this.sdk.downloadAuditTrail(signatureId, documentId));
  }

  async sendPendingSignatureReminder(signatureId: string) {
    return await this.sdk.sendSignatureReminder(signatureId);
  }

  async updateBranding(
    brandingId: string,
    opts: Pick<SignatureOptions, "locale" | "templateData">
  ) {
    const intl = await this.i18n.getIntl(opts.locale);

    const branding = await this.sdk.updateBranding(
      brandingId,
      removeNotDefined({
        layout_color: opts.templateData?.theme?.color,
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
          ? await this.buildSignaturItBrandingTemplates({
              locale: opts.locale,
              templateData: opts.templateData!,
            })
          : undefined,
      })
    );

    return branding.id;
  }

  private async createBranding(opts: SignatureOptions) {
    const intl = await this.i18n.getIntl(opts.locale);

    const branding = await this.sdk.createBranding({
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

    return branding.id;
  }

  private async buildSignaturItBrandingTemplates(
    opts: Pick<SignatureOptions, "locale" | "templateData">
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
