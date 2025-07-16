import { ApiClient, Envelope, EnvelopeDefinition, EnvelopesApi } from "docusign-esign";
import stringify from "fast-safe-stringify";
import { readFile, stat } from "fs/promises";
import { inject, injectable } from "inversify";
import { basename, extname } from "path";
import { isNonNullish } from "remeda";
import { assert } from "ts-essentials";
import { CONFIG, Config } from "../../config";
import { I18N_SERVICE, II18nService } from "../../services/I18nService";
import { getBaseWebhookUrl } from "../../util/getBaseWebhookUrl";
import { toGlobalId } from "../../util/globalId";
import { safeJsonParse } from "../../util/safeJsonParse";
import { BaseClient } from "../helpers/BaseClient";
import { ExpiredCredentialsError } from "../helpers/ExpirableCredentialsIntegration";
import { InvalidCredentialsError } from "../helpers/GenericIntegration";
import { DocusignIntegration, DocusignIntegrationContext } from "./DocusignIntegration";
import {
  ISignatureClient,
  Recipient,
  SignatureOptions,
  SignatureResponse,
} from "./SignatureClient";

interface UserInfoResponse {
  accounts: { accountId: string; baseUri: string; isDefault: "true" | "false" }[];
}

@injectable()
export class DocusignClient extends BaseClient implements ISignatureClient {
  constructor(
    @inject(CONFIG) private config: Config,
    @inject(I18N_SERVICE) private i18n: II18nService,
    @inject(DocusignIntegration) private docusignIntegration: DocusignIntegration,
  ) {
    super();
  }

  private isAccessTokenExpiredError(error: any) {
    return error?.response?.status === 401;
  }

  private isAccountSuspendedError(error: any) {
    const jsonError = safeJsonParse(error?.response?.text);
    return error?.response?.status === 400 && jsonError?.errorCode === "ACCOUNT_HAS_BEEN_SUSPENDED";
  }

  private async withDocusignSdk<TResult>(
    handler: (
      apis: { envelopes: EnvelopesApi },
      context: DocusignIntegrationContext & { userAccountId: string },
    ) => Promise<TResult>,
  ): Promise<TResult> {
    return await this.docusignIntegration.withCredentials(
      this.integrationId,
      async ({ ACCESS_TOKEN: accessToken }, context) => {
        try {
          const client = new ApiClient();
          client.setOAuthBasePath(
            this.config.oauth.docusign[context.environment].oauthBaseUri.replace("https://", ""),
          );
          const userInfo = (await client.getUserInfo(accessToken)) as UserInfoResponse;
          const defaultAccount = userInfo.accounts.find((a) => a.isDefault === "true")!;

          client.setBasePath(`${defaultAccount.baseUri}/restapi`);
          client.addDefaultHeader("Authorization", `Bearer ${accessToken}`);

          return await handler(
            {
              envelopes: new EnvelopesApi(client),
            },
            { ...context, userAccountId: defaultAccount.accountId },
          );
        } catch (error) {
          if (this.isAccessTokenExpiredError(error)) {
            throw new ExpiredCredentialsError();
          }
          if (this.isAccountSuspendedError(error)) {
            throw new InvalidCredentialsError(
              "ACCOUNT_SUSPENDED",
              error instanceof Error ? error.message : stringify(error),
            );
          }
          throw error;
        }
      },
    );
  }

  async getSignatureRequest(externalId: string): Promise<SignatureResponse> {
    throw new Error("Not implemented");
  }

  async startSignatureRequest(
    petitionId: number,
    orgId: number,
    filePath: string,
    recipients: Recipient[],
    options: SignatureOptions,
  ): Promise<SignatureResponse> {
    return await this.withDocusignSdk(async ({ envelopes }, { userAccountId }) => {
      const baseEventsUrl = await getBaseWebhookUrl(this.config.misc.webhooksUrl);

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
            url: `${baseEventsUrl}/api/integrations/signature/docusign/${toGlobalId(
              "Petition",
              petitionId,
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
            signers: recipients
              .map((r, recipientIndex) => {
                if (r.signWithEmbeddedImageFileUploadId) {
                  // signers with an embedded signature are not part of the signature request
                  return null;
                }

                assert(isNonNullish(r.email), "Email is required");

                return {
                  recipientId: (recipientIndex + 1).toString(),
                  routingOrder:
                    options.signingMode === "PARALLEL"
                      ? undefined
                      : (recipientIndex + 1).toString(),
                  email: r.email,
                  name: r.name,
                  tabs: {
                    signHereTabs: [
                      {
                        anchorString: `3cb39pzCQA9wJ${recipientIndex}`,
                        anchorUnits: "inches",
                        anchorXOffset: "0.2",
                        anchorYOffset: "0.5",
                        scaleValue: "1.4",
                      },
                    ],
                  },
                };
              })
              .filter(isNonNullish),
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
    await this.withDocusignSdk(async ({ envelopes }, { userAccountId }) => {
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
            { signatureProvider: "DocuSign", tone: "INFORMAL" },
          ),
        } as Envelope,
      });
    });
  }

  async downloadSignedDocument(externalId: string): Promise<Buffer> {
    return await this.withDocusignSdk(async ({ envelopes }, { userAccountId }) => {
      return Buffer.from(
        await envelopes.getDocument(userAccountId, externalId, "combined", {}),
        "binary",
      );
    });
  }

  async downloadAuditTrail(externalId: string): Promise<Buffer> {
    return await this.withDocusignSdk(async ({ envelopes }, { userAccountId }) => {
      return Buffer.from(
        await envelopes.getDocument(userAccountId, externalId, "certificate", {}),
        "binary",
      );
    });
  }

  async sendPendingSignatureReminder(externalId: string) {
    await this.withDocusignSdk(async ({ envelopes }, { userAccountId }) => {
      await envelopes.update(userAccountId, externalId, {
        resendEnvelope: true,
      });
    });
  }
}
