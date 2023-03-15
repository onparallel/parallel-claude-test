import stringify from "fast-safe-stringify";
import { inject, injectable } from "inversify";
import pMap from "p-map";
import { isDefined } from "remeda";
import SignaturitSDK, { BrandingParams } from "signaturit-sdk";
import { URLSearchParams } from "url";
import { CONFIG, Config } from "../../config";
import { OrganizationRepository } from "../../db/repositories/OrganizationRepository";
import { PetitionRepository } from "../../db/repositories/PetitionRepository";
import { buildEmail } from "../../emails/buildEmail";
import SignatureCancelledEmail from "../../emails/emails/SignatureCancelledEmail";
import SignatureCompletedEmail from "../../emails/emails/SignatureCompletedEmail";
import SignatureReminderEmail from "../../emails/emails/SignatureReminderEmail";
import SignatureRequestedEmail from "../../emails/emails/SignatureRequestedEmail";
import { InvalidCredentialsError } from "../../integrations/GenericIntegration";
import {
  SignaturitBrandingIdKey,
  SignaturitIntegration,
  SignaturitIntegrationContext,
} from "../../integrations/SignaturitIntegration";
import { getBaseWebhookUrl } from "../../util/getBaseWebhookUrl";
import { toGlobalId } from "../../util/globalId";
import { downloadImageBase64 } from "../../util/images";
import { retry } from "../../util/retry";
import { EMAILS, IEmailsService } from "../emails";
import { I18N_SERVICE, II18nService } from "../i18n";
import { IOrganizationCreditsService, ORGANIZATION_CREDITS_SERVICE } from "../organization-credits";
import {
  IOrganizationLayoutService,
  OrganizationLayout,
  ORGANIZATION_LAYOUT_SERVICE,
} from "../organization-layout";
import { SIGNATURE, SignatureService } from "../signature";
import {
  CancelAbortedError,
  ISignatureClient,
  Recipient,
  SignatureOptions,
  SignatureResponse,
} from "./client";

interface SignaturitError {
  status_code: number;
  message: string;
}

@injectable()
export class SignaturitClient implements ISignatureClient {
  constructor(
    @inject(CONFIG) private config: Config,
    @inject(I18N_SERVICE) private i18n: II18nService,
    @inject(EMAILS) private emails: IEmailsService,
    @inject(ORGANIZATION_CREDITS_SERVICE) private orgCredits: IOrganizationCreditsService,
    @inject(ORGANIZATION_LAYOUT_SERVICE) private layouts: IOrganizationLayoutService,
    @inject(SIGNATURE) private signature: SignatureService,
    @inject(PetitionRepository) private petitions: PetitionRepository,
    @inject(OrganizationRepository) private organizations: OrganizationRepository,
    @inject(SignaturitIntegration) private signaturitApiKey: SignaturitIntegration
  ) {}
  private integrationId!: number;

  configure(integrationId: number) {
    this.integrationId = integrationId;
  }

  private async withSignaturitSDK<TResult>(
    handler: (sdk: SignaturitSDK, context: SignaturitIntegrationContext) => Promise<TResult>
  ): Promise<TResult> {
    return this.signaturitApiKey.withApiKey(this.integrationId, async (apiKey, context) => {
      try {
        const sdk = new SignaturitSDK(apiKey, context.environment === "production");
        return await handler(sdk, context);
      } catch (e) {
        if (this.isInvalidGrantError(e)) {
          throw new InvalidCredentialsError("INVALID_CREDENTIALS", e.error_message);
        }
        if (this.isUserIsBannedError(e)) {
          throw new InvalidCredentialsError("INVALID_CREDENTIALS", e.message);
        }
        throw e;
      }
    });
  }

  async startSignatureRequest(
    petitionId: number,
    orgId: number,
    files: string,
    recipients: Recipient[],
    opts: SignatureOptions
  ) {
    return await this.withSignaturitSDK(async (sdk, context) => {
      // signaturit has a 40 signers limit
      if (recipients.length > 40) {
        throw new Error("MAX_RECIPIENTS_EXCEEDED_ERROR");
      }

      const petition = await this.petitions.loadPetition(petitionId);
      const petitionTheme = await this.organizations.loadOrganizationTheme(
        petition!.document_organization_theme_id
      );
      if (!petitionTheme) {
        throw new Error(`Expected Petition:${petitionId} to have defined PDF_DOCUMENT theme`);
      }

      const templateData = await this.layouts.getLayoutProps(orgId);

      const locale = opts.locale;
      const tone = templateData.theme.preferredTone ?? "INFORMAL";

      try {
        if (context.isParallelManaged) {
          await this.orgCredits.consumeSignaturitApiKeyCredits(orgId, 1);
        }

        const branding = context.brandings.find((b) => b.locale === locale && b.tone === tone);
        let brandingId = branding?.brandingId;
        if (!brandingId) {
          brandingId = await this.createSignaturitBranding(orgId, locale);
          const key = `${locale.toUpperCase()}_${tone}_BRANDING_ID` as SignaturitBrandingIdKey;
          await context.onUpdateBrandingId(key, brandingId);
        }

        const baseEventsUrl = await getBaseWebhookUrl(this.config.misc.webhooksUrl);

        const response = await retry(
          async () => {
            return await sdk.createSignature(files, recipients, {
              body: opts.initialMessage,
              delivery_type: "email",
              signing_mode: "parallel",
              branding_id: brandingId,
              events_url: `${baseEventsUrl}/api/webhooks/signaturit/${toGlobalId(
                "Petition",
                petitionId
              )}/events`,
              callback_url: `${this.config.misc.parallelUrl}/${locale}/thanks?${new URLSearchParams(
                {
                  o: toGlobalId("Organization", orgId),
                }
              )}`,
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
                        petitionTheme.data.marginLeft -
                        petitionTheme.data.marginRight -
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
          },
          { maxRetries: 3, delay: 5_000 }
        );

        if (!isDefined(response.id) || !isDefined(response.documents)) {
          throw new Error(
            `Invalid response: ${stringify({ petitionId, opts, recipients, response })}`
          );
        }
        return response;
      } catch (error) {
        if (
          error instanceof Error &&
          error.message === "Account depleted all it's advanced signature requests"
        ) {
          await this.emails.sendInternalSignaturitAccountDepletedCreditsEmail(
            orgId,
            petitionId,
            context.apiKeyHint
          );
        }
        throw error;
      }
    });
  }

  async cancelSignatureRequest(externalId: string) {
    await this.withSignaturitSDK(async (sdk) => {
      try {
        await retry(async () => await sdk.cancelSignature(externalId), {
          maxRetries: 3,
          delay: 5_000,
        });
      } catch (e) {
        if (this.isCancelNonReadyRequestError(e)) {
          const signature = await sdk.getSignature(externalId);
          if (signature.documents.every((d) => d.status === "completed")) {
            await this.handleDocumentsAlreadySigned(signature);
            throw new CancelAbortedError();
          }
        } else {
          throw e;
        }
      }
    });
  }

  // returns a binary encoded buffer of the signed document
  async downloadSignedDocument(externalId: string) {
    return await this.withSignaturitSDK(async (sdk) => {
      const [signatureId, documentId] = externalId.split("/");

      const result = await retry(
        async () => await sdk.downloadSignedDocument(signatureId, documentId),
        { maxRetries: 3, delay: 5_000 }
      );

      return Buffer.from(result);
    });
  }

  async downloadAuditTrail(externalId: string) {
    return await this.withSignaturitSDK(async (sdk) => {
      const [signatureId, documentId] = externalId.split("/");

      const result = await retry(
        async () => await sdk.downloadAuditTrail(signatureId, documentId),
        { maxRetries: 3, delay: 5_000 }
      );

      return Buffer.from(result);
    });
  }

  async sendPendingSignatureReminder(signatureId: string) {
    await this.withSignaturitSDK(async (sdk) => {
      try {
        await sdk.sendSignatureReminder(signatureId);
      } catch (e) {
        if (this.isDocumentsAlreadySignedError(e)) {
          const signature = await sdk.getSignature(signatureId);
          await this.handleDocumentsAlreadySigned(signature);
        } else {
          throw e;
        }
      }
    });
  }

  async onOrganizationBrandChange(orgId: number) {
    await this.withSignaturitSDK(async (sdk, context) => {
      const templateData = await this.layouts.getLayoutProps(orgId);
      await pMap(
        context.brandings,
        async ({ locale, brandingId }) => {
          await sdk.updateBranding(brandingId, {
            show_csv: context.showCsv,
            logo: await downloadImageBase64(templateData.logoUrl),
            layout_color: templateData.theme.color,
            templates: await this.buildSignaturItBrandingTemplates(locale, templateData),
          });
        },
        { concurrency: 1 }
      );
    });
  }

  private async createSignaturitBranding(
    orgId: number,
    // TODO locales
    //  locale: ContactLocale
    locale: string
  ) {
    return await this.withSignaturitSDK(async (sdk, context) => {
      const intl = await this.i18n.getIntl(locale);

      const templateData = await this.layouts.getLayoutProps(orgId);
      const branding = await sdk.createBranding({
        show_welcome_page: false,
        show_csv: context.showCsv,
        layout_color: templateData.theme.color ?? "#6059F7",
        text_color: "#F6F6F6",
        logo: templateData.logoUrl ? await downloadImageBase64(templateData.logoUrl) : undefined,
        application_texts: {
          open_sign_button: intl.formatMessage({
            id: "signature-client.open-document",
            defaultMessage: "Open document",
          }),
        },
        templates: await this.buildSignaturItBrandingTemplates(locale, templateData),
      });

      return branding.id;
    });
  }

  private async buildSignaturItBrandingTemplates(
    // TODO locales
    // locale: ContactLocale,
    locale: string,
    templateData: OrganizationLayout
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
          ...templateData,
        },
        { locale }
      ),
      buildEmail(
        SignatureCompletedEmail,
        {
          signatureProvider: "Signaturit",
          signerName: "{{signer_name}}",
          documentName: "{{filename}}",
          ...templateData,
        },
        { locale }
      ),
      buildEmail(
        SignatureCancelledEmail,
        {
          signatureProvider: "Signaturit",
          signerName: "{{signer_name}}",
          ...templateData,
        },
        { locale }
      ),
      buildEmail(
        SignatureReminderEmail,
        {
          documentName: "{{filename}}",
          signerName: "{{signer_name}}",
          signButton: "{{sign_button}}",
          ...templateData,
        },
        { locale }
      ),
    ]);

    return {
      signatures_request: signatureRequestedEmail,
      signatures_receipt: signatureCompletedEmail,
      document_canceled: signatureCancelledEmail,
      pending_sign: signatureReminderEmail,
    };
  }

  private isSignaturitError(e: unknown): e is SignaturitError {
    return (
      isDefined(e) &&
      typeof e === "object" &&
      "status_code" in e &&
      typeof e.status_code === "number" &&
      "message" in e &&
      typeof e.message === "string"
    );
  }

  private isDocumentsAlreadySignedError(e: unknown) {
    return (
      this.isSignaturitError(e) && e.status_code === 403 && e.message === "Documents already signed"
    );
  }

  private isCancelNonReadyRequestError(e: unknown) {
    return (
      this.isSignaturitError(e) &&
      e.status_code === 403 &&
      e.message === "You cannot cancel a non-ready request"
    );
  }

  private isUserIsBannedError(e: unknown): e is SignaturitError {
    return this.isSignaturitError(e) && e.status_code === 403 && e.message === "The user is banned";
  }

  private isInvalidGrantError(e: unknown): e is { error: string; error_message: string } {
    return (
      isDefined(e) &&
      typeof e === "object" &&
      "error" in e &&
      typeof e.error === "string" &&
      "error_message" in e &&
      typeof e.error_message === "string" &&
      e.error === "invalid_grant"
    );
  }

  /** "documents already signed" error occurrs when trying to send a signature reminder on a signature that is already fully signed, or a signature that was cancelled by any reason.
   * For this reason, before doing anything we have to get the current status of the signature to be able to sync.
   *
   * If the documents on signaturit are canceled, we have to cancel the signature request
   * If the documents are completed, try to download the signed document and audit trail. If everything is ok, set signature to COMPLETED
   */
  private async handleDocumentsAlreadySigned(signature: SignatureResponse) {
    if (signature.documents.some((d) => d.status === "canceled")) {
      // the document was manually cancelled by an User, data is in sync
      return;
    }
    const signatureRequest = await this.petitions.loadPetitionSignatureByExternalId(
      `SIGNATURIT/${signature.id}`
    );
    if (!signatureRequest) {
      throw new Error(`PetitionSignatureRequest with externalId ${signature.id} not found`);
    }

    if (signature.documents.every((d) => d.status === "completed")) {
      // we can't be sure who was the last person to sign the document.
      // so we take the last configured signer, their name will be used in the PetitionCompleted email
      const lastSigner = signature.documents.at(-1)!;
      if (!isDefined(signatureRequest.file_upload_audit_trail_id)) {
        await this.signature.storeAuditTrail(signatureRequest, `${signature.id}/${lastSigner.id}`);
      }
      if (!isDefined(signatureRequest.file_upload_id)) {
        await this.signature.storeSignedDocument(
          signatureRequest,
          `${signature.id}/${lastSigner.id}`,
          signatureRequest.signature_config.signersInfo.find((s) => s.externalId === lastSigner.id)!
        );
      }
    } else if (
      signature.documents.some((d) => d.status === "declined") &&
      signatureRequest.status !== "CANCELLED"
    ) {
      const declinedDocument = signature.documents.find((d) => d.status === "declined")!;
      const cancellerIndex = signatureRequest.signature_config.signersInfo.findIndex(
        (s) => s.externalId === declinedDocument.id
      )!;
      const canceller = signatureRequest.signature_config.signersInfo[cancellerIndex];
      await this.petitions.updatePetitionSignatureRequestAsCancelled(signatureRequest, {
        cancel_reason: "DECLINED_BY_SIGNER",
        cancel_data: {
          decline_reason: declinedDocument.decline_reason,
          canceller: {
            email: canceller.email,
            firstName: canceller.firstName,
            lastName: canceller.lastName,
          },
        },
        signer_status: {
          ...signatureRequest.signer_status,
          [cancellerIndex]: {
            ...signatureRequest.signer_status[cancellerIndex],
            declined_at: new Date(declinedDocument.created_at),
          },
        },
      });
    }
  }
}
