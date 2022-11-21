import {
  AccountsApi,
  ApiClient,
  Brand,
  Envelope,
  EnvelopeDefinition,
  EnvelopesApi,
} from "docusign-esign";
import { readFile, stat } from "fs/promises";
import { inject, injectable } from "inversify";
import { basename, extname } from "path";
import { isDefined } from "remeda";
import { DocusignOauthIntegration } from "../../api/oauth/DocusignOauthIntegration";
import { OAuthIntegration } from "../../api/oauth/OAuthIntegration";
import { Config, CONFIG } from "../../config";
import {
  IntegrationRepository,
  IntegrationSettings,
} from "../../db/repositories/IntegrationRepository";
import { getBaseWebhookUrl } from "../../util/getBaseWebhookUrl";
import { toGlobalId } from "../../util/globalId";
import { I18N_SERVICE, II18nService } from "../i18n";
import {
  BrandingIdKey,
  ISignatureClient,
  Recipient,
  SignatureOptions,
  SignatureResponse,
} from "./client";

@injectable()
export class DocuSignClient implements ISignatureClient<"DOCUSIGN"> {
  private envelopesApi!: EnvelopesApi;
  private accountsApi!: AccountsApi;
  private apiAccountId!: string;
  private settings!: IntegrationSettings<"SIGNATURE", "DOCUSIGN">;
  private integrationId?: number;

  constructor(
    @inject(CONFIG) private config: Config,
    @inject(I18N_SERVICE) private i18n: II18nService,
    @inject(IntegrationRepository) private integrations: IntegrationRepository,
    @inject(DocusignOauthIntegration) private docusignOauth: OAuthIntegration
  ) {}

  configure(integration: {
    id?: number | undefined;
    settings: IntegrationSettings<"SIGNATURE", "DOCUSIGN">;
  }) {
    if (
      !integration.settings.CREDENTIALS.ACCESS_TOKEN ||
      !integration.settings.CREDENTIALS.REFRESH_TOKEN
    ) {
      throw new Error("Docusign credentials not found on org_integration settings");
    }

    this.settings = integration.settings;
    this.integrationId = integration.id;

    const environment = (this.settings.ENVIRONMENT ?? "sandbox") as "production" | "sandbox";
    const credentials = this.docusignOauth.decryptCredentials(this.settings.CREDENTIALS);

    const url = {
      sandbox: "account-d.docusign.com",
      production: "account.docusign.com",
    }[environment];

    const apiClient = new ApiClient();
    apiClient.setOAuthBasePath(url);
    this.apiAccountId = credentials.API_ACCOUNT_ID;

    apiClient.setBasePath(`${credentials.API_BASE_PATH}/restapi`);
    apiClient.addDefaultHeader("Authorization", `Bearer ${credentials.ACCESS_TOKEN}`);

    this.envelopesApi = new EnvelopesApi(apiClient);
    this.accountsApi = new AccountsApi(apiClient);
  }

  async authenticate() {
    return { environment: this.settings.ENVIRONMENT ?? "sandbox" };
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

    const baseEventsUrl = await getBaseWebhookUrl(this.config.misc.parallelUrl);

    const intl = await this.i18n.getIntl(options.locale);
    const ext = extname(filePath);
    const summary = await this.envelopesApi.createEnvelope(this.apiAccountId, {
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

    const { signers } = await this.envelopesApi.listRecipients(
      this.apiAccountId,
      summary.envelopeId!
    );

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
  }

  async cancelSignatureRequest(externalId: string) {
    const intl = await this.i18n.getIntl("es");
    await this.envelopesApi.update(this.apiAccountId, externalId, {
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
  }

  async downloadSignedDocument(externalId: string): Promise<Buffer> {
    return Buffer.from(
      await this.envelopesApi.getDocument(this.apiAccountId, externalId, "combined", {}),
      "binary"
    );
  }

  async downloadAuditTrail(externalId: string): Promise<Buffer> {
    return Buffer.from(
      await this.envelopesApi.getDocument(this.apiAccountId, externalId, "certificate", {}),
      "binary"
    );
  }

  async sendPendingSignatureReminder(externalId: string) {
    await this.envelopesApi.update(this.apiAccountId, externalId, {
      resendEnvelope: true,
    });
  }

  async updateBranding(
    brandingId: string,
    opts: Pick<SignatureOptions, "locale" | "templateData">
  ) {
    try {
      await this.accountsApi.updateBrand(this.apiAccountId, brandingId, {
        brand: {
          brandCompany: opts.templateData?.organizationName,
        } as Brand,
      });
    } catch (error: any) {
      if (error.response?.body?.errorCode === "INVALID_BRAND_ID") {
        // branding has probably been deleted on docusign admin dashboard, so we need to remove the id from our database
        if (isDefined(this.integrationId)) {
          const key: BrandingIdKey =
            `${opts.locale.toUpperCase()}_INFORMAL_BRANDING_ID` as BrandingIdKey;
          delete this.settings[key];
          await this.integrations.updateOrgIntegration(
            this.integrationId!,
            { settings: this.settings },
            `OrgIntegration:${this.integrationId!}`
          );
        }
      } else {
        throw error;
      }
    }
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
