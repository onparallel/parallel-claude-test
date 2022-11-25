import { AccountsApi, ApiClient, Envelope, EnvelopeDefinition, EnvelopesApi } from "docusign-esign";
import { readFile, stat } from "fs/promises";
import { inject, injectable } from "inversify";
import { basename, extname } from "path";
import { Config, CONFIG } from "../../config";
import { IntegrationRepository } from "../../db/repositories/IntegrationRepository";
import {
  DocusignOauthIntegration,
  DocusignOauthIntegrationContext,
} from "../../integrations/DocusignOauthIntegration";
import { InvalidCredentialsError } from "../../integrations/GenericIntegration";
import { getBaseWebhookUrl } from "../../util/getBaseWebhookUrl";
import { toGlobalId } from "../../util/globalId";
import { I18N_SERVICE, II18nService } from "../i18n";
import { ISignatureClient, Recipient, SignatureOptions, SignatureResponse } from "./client";

@injectable()
export class DocuSignClient implements ISignatureClient {
  constructor(
    @inject(CONFIG) private config: Config,
    @inject(I18N_SERVICE) private i18n: II18nService,
    @inject(IntegrationRepository) private integrations: IntegrationRepository,
    @inject(DocusignOauthIntegration) private docusignOauth: DocusignOauthIntegration
  ) {}

  private integrationId!: number;
  configure(integrationId: number) {
    this.integrationId = integrationId;
  }

  private isConsentRequiredError(error: any) {
    console.debug(error);
    // TODO: check
    return error?.error === "invalid_grant";
  }

  private isAccessTokenExpiredError(error: any) {
    console.debug(error);
    // TODO: check
    return (error as any)?.status === 401;
  }

  private async withDocusignSdk<TResult>(
    handler: (
      apis: { envelopes: EnvelopesApi; accounts: AccountsApi },
      context: DocusignOauthIntegrationContext
    ) => Promise<TResult>
  ): Promise<TResult> {
    return this.docusignOauth.withAccessToken(this.integrationId, async (accessToken, context) => {
      const client = new ApiClient();
      client.setBasePath(`${context.API_BASE_PATH}/restapi`);
      client.addDefaultHeader("Authorization", `Bearer ${accessToken}`);

      try {
        return await handler(
          {
            envelopes: new EnvelopesApi(client),
            accounts: new AccountsApi(client),
          },
          context
        );
      } catch (error) {
        if (this.isConsentRequiredError(error)) {
          throw new InvalidCredentialsError(true);
        }
        if (this.isAccessTokenExpiredError(error)) {
          throw new InvalidCredentialsError();
        }
        throw error;
      }
    });
  }

  async startSignatureRequest(
    petitionId: number,
    orgId: number,
    filePath: string,
    recipients: Recipient[],
    options: SignatureOptions
  ): Promise<SignatureResponse> {
    // const key = `${options.locale.toUpperCase()}_INFORMAL_BRANDING_ID` as BrandingIdKey;
    // let brandingId = this.settings[key];
    // if (!brandingId) {
    //   brandingId = await this.createBranding(options);
    //   this.settings[key] = brandingId;

    //   if (isDefined(this.integrationId)) {
    //     this.integrations.updateOrgIntegration<"SIGNATURE">(
    //       this.integrationId,
    //       { settings: this.settings },
    //       `OrgIntegration:${this.integrationId}`
    //     );
    //   }
    // }
    return await this.withDocusignSdk(async ({ envelopes }, { USER_ACCOUNT_ID: userAccountId }) => {
      const baseEventsUrl = await getBaseWebhookUrl(this.config.misc.parallelUrl);

      const intl = await this.i18n.getIntl(options.locale);
      const ext = extname(filePath);
      const summary = await envelopes.createEnvelope(userAccountId, {
        envelopeDefinition: {
          // brandId: brandingId,
          status: "sent",
          emailBlurb: options.initialMessage,
          emailSubject: intl.formatMessage({
            id: "signature-requested.subject",
            defaultMessage: "Signature requested",
          }),
          eventNotification: {
            includeHMAC: "true",
            url: `${baseEventsUrl}/api/webhooks/docusign/${toGlobalId(
              "Petition",
              petitionId
            )}/events`,
            deliveryMode: "SIM",
            events: [
              "envelope-sent",
              "envelope-delivered",
              "envelope-completed",
              "envelope-declined",
              "envelope-voided",
              "envelope-resent",
              "envelope-corrected",
              "envelope-purge",
              "envelope-deleted",
              "envelope-discard",
              "recipient-sent",
              "recipient-autoresponded",
              "recipient-delivered",
              "recipient-completed",
              "recipient-declined",
              "recipient-authenticationfailed",
              "recipient-resent",
              "recipient-delegate",
              "recipient-reassign",
              "recipient-finish-later",
            ],
            eventData: {
              version: "restv2.1",
              format: "json",
              includeData: ["recipients"],
            },
          },
          documents: [
            {
              name: basename(filePath, ext),
              fileExtension: ext,
              documentId: "1",
              documentBase64: (await readFile(filePath)).toString("base64"),
            },
          ],
          recipients: {
            signers: recipients.map((r, recipientIndex) => ({
              recipientId: (recipientIndex + 1).toString(),
              email: r.email,
              name: r.name,
              tabs: {
                signHereTabs: [
                  {
                    anchorString: `3cb39pzCQA9wJ${recipientIndex}`,
                    anchorUnits: "inches",
                    anchorXOffset: "0.2",
                    anchorYOffset: "0.5",
                  },
                ],
              },
            })),
          },
        } as EnvelopeDefinition,
      });

      const { signers } = await envelopes.listRecipients(userAccountId, summary.envelopeId!);

      const createdAt = new Date(summary.statusDateTime!);
      const { size } = await stat(filePath);
      return {
        id: summary.envelopeId!,
        created_at: createdAt,
        documents: signers!.map((s) => ({
          id: s.recipientId!,
          email: s.email!,
          name: s.name!,
          file: { name: basename(filePath), size },
          status: s.status!,
          created_at: createdAt,
          events: [],
        })),
        data: [],
      };
    });
  }

  async cancelSignatureRequest(externalId: string) {
    await this.withDocusignSdk(async ({ envelopes }, { USER_ACCOUNT_ID: userAccountId }) => {
      const intl = await this.i18n.getIntl("es");
      await envelopes.update(userAccountId, externalId, {
        envelope: {
          status: "voided",
          voidedReason: intl.formatMessage(
            {
              id: "signature-cancelled.text",
              defaultMessage:
                "The signing process sent through {signatureProvider} has been cancelled by the sender.",
            },
            { signatureProvider: "DocuSign", tone: "INFORMAL" }
          ),
        } as Envelope,
      });
    });
  }

  async downloadSignedDocument(externalId: string): Promise<Buffer> {
    return await this.withDocusignSdk(async ({ envelopes }, { USER_ACCOUNT_ID: userAccountId }) => {
      return Buffer.from(
        await envelopes.getDocument(userAccountId, externalId, "combined", {}),
        "binary"
      );
    });
  }

  async downloadAuditTrail(externalId: string): Promise<Buffer> {
    return await this.withDocusignSdk(async ({ envelopes }, { USER_ACCOUNT_ID: userAccountId }) => {
      return Buffer.from(
        await envelopes.getDocument(userAccountId, externalId, "certificate", {}),
        "binary"
      );
    });
  }

  async sendPendingSignatureReminder(externalId: string) {
    await this.withDocusignSdk(async ({ envelopes }, { USER_ACCOUNT_ID: userAccountId }) => {
      await envelopes.update(userAccountId, externalId, {
        resendEnvelope: true,
      });
    });
  }

  async updateBranding(
    brandingId: string,
    opts: Pick<SignatureOptions, "locale" | "templateData">
  ) {
    // await this.withDocusignSdk(async ({ accounts }, { USER_ACCOUNT_ID: userAccountId }) => {
    //   try {
    //     await accounts.updateBrand(userAccountId, brandingId, {
    //       brand: {
    //         brandCompany: opts.templateData?.organizationName,
    //       } as Brand,
    //     });
    //   } catch (error: any) {
    //     if (error.response?.body?.errorCode === "INVALID_BRAND_ID") {
    //       // branding has probably been deleted on docusign admin dashboard, so we need to remove the id from our database
    //       const integration = (await this.integrations.loadIntegration(this.integrationId))!;
    //       const settings = integration.settings as IntegrationSettings<"SIGNATURE", "DOCUSIGN">;
    //       delete settings[`${opts.locale.toUpperCase()}_INFORMAL_BRANDING_ID` as BrandingIdKey];
    //       await this.integrations.updateOrgIntegration(
    //         this.integrationId,
    //         { settings },
    //         `OrgIntegration:${this.integrationId}`
    //       );
    //     } else {
    //       throw error;
    //     }
    //   }
    // });
  }

  // private async createBranding(opts: SignatureOptions) {
  //   const response = await this.accountsApi.createBrand(this.apiAccountId, {
  //     brand: {
  //       isOverridingCompanyName: true,
  //       brandCompany: opts.templateData?.organizationName,
  //       brandLanguages: [opts.locale],
  //       defaultBrandLanguage: opts.locale,
  //       brandName: `Parallel Brand (${opts.locale})`,
  //     } as Brand,
  //   });

  //   return response.brands![0].brandId!;
  // }
}
