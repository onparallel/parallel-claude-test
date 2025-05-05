import { createHmac, timingSafeEqual } from "crypto";
import { Request, Response, json } from "express";
import { inject, injectable } from "inversify";
import { isNonNullish, omit, pick } from "remeda";
import { CONFIG, Config } from "../../../config";
import { ContactLocale } from "../../../db/__types";
import { FeatureFlagRepository } from "../../../db/repositories/FeatureFlagRepository";
import {
  IntegrationCredentials,
  IntegrationRepository,
} from "../../../db/repositories/IntegrationRepository";
import { OrganizationRepository } from "../../../db/repositories/OrganizationRepository";
import { ENCRYPTION_SERVICE, EncryptionService } from "../../../services/EncryptionService";
import { FETCH_SERVICE, IFetchService } from "../../../services/FetchService";
import { IIdVerificationService } from "../../../services/IdVerificationService";
import { IImageService, IMAGE_SERVICE } from "../../../services/ImageService";
import { ILogger, LOGGER } from "../../../services/Logger";
import { getBaseWebhookUrl } from "../../../util/getBaseWebhookUrl";
import { fromGlobalId } from "../../../util/globalId";
import { StopRetryError, retry } from "../../../util/retry";
import { Maybe } from "../../../util/types";
import {
  GenericIntegration,
  InvalidCredentialsError,
  InvalidRequestError,
} from "../../helpers/GenericIntegration";
import {
  CreateIdentityVerificationSessionRequest,
  CreateIdentityVerificationSessionResponse,
  IIdVerificationIntegration,
  IdentityVerificationDocument,
  IdentityVerificationDocumentInfo,
  IdentityVerificationDocumentType,
  IdentityVerificationRequestType,
  IdentityVerificationSessionRequestMetadata,
  IdentityVerificationSessionResponse,
  IdentityVerificationSessionSummaryResponse,
  SelfieDocument,
} from "../IdVerificationIntegration";

export const BANKFLIP_ID_VERIFICATION_INTEGRATION = Symbol.for(
  "BANKFLIP_ID_VERIFICATION_INTEGRATION",
);
interface BankflipCreateIdentityVerificationSessionResponse {
  id: string;
  widgetLink: string;
}

type BankflipIdentityVerificationDocumentType =
  | "id_card"
  | "passport"
  | "residence_permit"
  | "driver_license";

type BankflipIdentityVerificationRequestType = "simple" | "extended";

interface BankflipIdentityVerificationSessionResponse {
  id: string;
  metadata: IdentityVerificationSessionRequestMetadata;
  identityVerification: Maybe<{
    id: Maybe<string>;
    type: BankflipIdentityVerificationRequestType;
    allowedCountries: Maybe<string[]>;
    bannedCountries: Maybe<string[]>;
    allowedDocuments: Maybe<BankflipIdentityVerificationDocumentType[]>;
    bannedDocuments: Maybe<BankflipIdentityVerificationDocumentType[]>;
    state: "ok" | "ko";
    approval: Maybe<"manually_approved" | "manually_rejected">;
    koReason: Maybe<
      "generic" | "user_aborted" | "manually_rejected" | "attempts_exceeded" | "user_blocked"
    >;
    koSubreason: Maybe<
      | "user_aborted_before_start"
      | "user_aborted_during_process"
      | "user_aborted_after_error"
      | "user_blocked_expired_document"
      | "user_blocked_underage"
      | "user_blocked_id_number_not_detected"
    >;
  }>;
}

interface BankflipIdentityVerificationSessionSummaryResponse {
  id: string;
  createdAt: string;
  firstName: Maybe<string>;
  surname: Maybe<string>;
  birthDate: Maybe<string>;
  nationality: Maybe<string>;
  birthPlace: Maybe<string>;
  documents: Maybe<BankflipIdentityVerificationDocument[]>;
  selfie: Maybe<BankflipSelfieDocument>;
}

interface BankflipIdentityVerificationDocumentInfo {
  id: string;
  sessionId: string;
  extension: string;
  name: string;
  contentType: string;
  createdAt: string;
}

interface BankflipIdentityVerificationDocument {
  type: BankflipIdentityVerificationDocumentType;
  dataDocument: Maybe<BankflipIdentityVerificationDocumentInfo>;
  imagesDocument: Maybe<BankflipIdentityVerificationDocumentInfo>;
  idNumber: Maybe<string>; // ID of document's holder
  number: Maybe<string>; // ID of the document itself
  firstName: Maybe<string>;
  surname: Maybe<string>;
  birthDate: Maybe<string>;
  birthPlace: Maybe<string>;
  nationality: Maybe<string>;
  issueDate: Maybe<string>;
  expirationDate: Maybe<string>;
  unexpiredDocument: Maybe<number>;
  faceFrontSide: Maybe<number>;
  uncompromisedDocument: Maybe<number>;
  notShownScreen: Maybe<number>;
  checkedMRZ: Maybe<number>;
  issuingCountry: Maybe<string>;
  documentSecurity: Maybe<boolean>;
  documentRead: Maybe<boolean>;
  notForged: Maybe<number>;
  notPrinted: Maybe<number>;
  notSyntheticDocument: Maybe<number>;
  createdAt: string;
}

interface BankflipSelfieDocument {
  pictureDocument: Maybe<BankflipIdentityVerificationDocumentInfo>;
  videoDocument: Maybe<BankflipIdentityVerificationDocumentInfo>;
  createdAt: string;
  liveness: Maybe<number>;
}

@injectable()
export class BankflipIdVerificationIntegration
  extends GenericIntegration<"ID_VERIFICATION", "BANKFLIP", {}>
  implements IIdVerificationIntegration
{
  public service?: IIdVerificationService;
  protected override type = "ID_VERIFICATION" as const;
  protected override provider = "BANKFLIP" as const;

  constructor(
    @inject(IntegrationRepository) integrations: IntegrationRepository,
    @inject(OrganizationRepository) private organizations: OrganizationRepository,
    @inject(FeatureFlagRepository) private featureFlags: FeatureFlagRepository,
    @inject(IMAGE_SERVICE) private images: IImageService,
    @inject(ENCRYPTION_SERVICE) encryption: EncryptionService,
    @inject(FETCH_SERVICE) private fetch: IFetchService,
    @inject(CONFIG) private config: Config,
    @inject(LOGGER) private logger: ILogger,
  ) {
    super(encryption, integrations);
    this.registerHandlers((router) => {
      router.post(
        "/:integrationId/events",
        async (req, res, next) => {
          try {
            (req as any).webhookSecret = await this.withCredentials(
              fromGlobalId(req.params.integrationId, "OrgIntegration").id,
              async (credentials) => credentials.WEBHOOK_SECRET,
            );
            next();
          } catch (error) {
            next(error);
          }
        },
        json({ verify: this.verifyHMAC }),
        (req, res, next) => {
          try {
            const body = req.body as {
              name: string;
              payload: {
                sessionId: string;
              };
            };

            if (body.name === "SESSION_COMPLETED") {
              this.service!.onSessionCompleted({
                externalId: body.payload.sessionId,
                integrationId: fromGlobalId(req.params.integrationId, "OrgIntegration").id,
              });
            }

            res.sendStatus(200).end();
          } catch (error) {
            if (error instanceof Error) {
              req.context.logger.error(error.message, { stack: error.stack });
            }
            next(error);
          }
        },
      );
    });
  }

  async createSession(
    metadata: IdentityVerificationSessionRequestMetadata,
    request: CreateIdentityVerificationSessionRequest,
    locale: ContactLocale,
  ): Promise<CreateIdentityVerificationSessionResponse> {
    const orgId = fromGlobalId(metadata.orgId, "Organization").id;
    const integrationId = fromGlobalId(metadata.integrationId, "OrgIntegration").id;
    const baseWebhookUrl = await getBaseWebhookUrl(this.config.misc.webhooksUrl);
    const customization = await this.buildBankflipCustomization(orgId);

    function mapRequestTypeToBankflip(
      type: IdentityVerificationRequestType,
    ): BankflipIdentityVerificationRequestType {
      switch (type) {
        case "SIMPLE":
          return "simple";
        case "EXTENDED":
          return "extended";
        default:
          throw new Error(`Unknown request type: ${type}`);
      }
    }

    function mapDocumentTypeToBankflip(
      type: IdentityVerificationDocumentType,
    ): BankflipIdentityVerificationDocumentType {
      switch (type) {
        case "ID_CARD":
          return "id_card";
        case "PASSPORT":
          return "passport";
        case "RESIDENCE_PERMIT":
          return "residence_permit";
        case "DRIVER_LICENSE":
          return "driver_license";
        default:
          throw new Error(`Unknown document type: ${type}`);
      }
    }

    function mapContactLocaleToBankflip(locale: ContactLocale) {
      // Bankflip does not support italian locale
      if (locale === "it") return "en";
      return locale;
    }

    const response = await this.withCredentials(integrationId, async (credentials) => {
      return await retry(
        async (i) => {
          try {
            return await this.apiRequest<BankflipCreateIdentityVerificationSessionResponse>(
              credentials,
              "/session",
              {
                method: "POST",
                body: JSON.stringify({
                  webhookUrl: `${baseWebhookUrl}/api/integrations/id-verification/bankflip/${metadata.integrationId}/events`,
                  customization,
                  metadata,
                  identityVerification: {
                    type: mapRequestTypeToBankflip(request.type),
                    allowedDocuments: request.allowedDocuments?.map(mapDocumentTypeToBankflip),
                  },
                  ...(i === 0 ? { locale: mapContactLocaleToBankflip(locale) } : {}),
                }),
              },
            );
          } catch (error) {
            if (error instanceof InvalidRequestError && error.code === "VALIDATION_ERROR") {
              // Bankflip returns 400 with VALIDATION_ERROR when requested locale is not enabled in the account
              // in this case, we want to retry the request without passing locale param (defaults to "es").
              // log as error so we can be aware of this
              this.logger.error(
                `Integration:${integrationId} Bankflip validation error: ${error.message}. Will retry request without locale param.`,
              );
              throw error;
            }
            // any other error, we don't want to retry
            throw new StopRetryError(error);
          }
        },
        { maxRetries: 1 },
      );
    });

    return {
      id: response.id,
      url: response.widgetLink,
    };
  }

  async fetchSession(
    integrationId: number,
    sessionId: string,
  ): Promise<IdentityVerificationSessionResponse> {
    return await this.withCredentials(integrationId, async (credentials) => {
      const session = await this.apiRequest<BankflipIdentityVerificationSessionResponse>(
        credentials,
        `/session/${sessionId}`,
      );

      return {
        id: session.id,
        metadata: session.metadata,
        identityVerification: isNonNullish(session.identityVerification)
          ? {
              ...pick(session.identityVerification, ["id", "koReason", "koSubreason", "state"]),
              request: {
                type: this.mapIdVerificationType(session.identityVerification.type),
                allowedDocuments:
                  session.identityVerification.allowedDocuments?.map((t) =>
                    this.mapDocumentType(t),
                  ) ?? [],
              },
            }
          : null,
      };
    });
  }

  async fetchSessionSummary(
    integrationId: number,
    identityVerificationId: string,
  ): Promise<IdentityVerificationSessionSummaryResponse> {
    return await this.withCredentials(integrationId, async (credentials) => {
      const summary = await this.apiRequest<BankflipIdentityVerificationSessionSummaryResponse>(
        credentials,
        `/identity-verification/${identityVerificationId}`,
      );

      return {
        ...pick(summary, [
          "id",
          "firstName",
          "surname",
          "birthDate",
          "birthPlace",
          "nationality",
          "createdAt",
        ]),
        documents: summary.documents?.map((doc) => this.mapIdVerificationDocument(doc)) ?? null,
        selfie: summary.selfie ? this.mapIdVerificationSelfie(summary.selfie) : null,
      };
    });
  }

  async fetchBinaryDocumentContents(integrationId: number, documentId: string) {
    return await this.withCredentials(integrationId, async (credentials) => {
      return await this.apiRequest<Buffer>(
        credentials,
        `/document/${documentId}/content`,
        {},
        "buffer",
      );
    });
  }

  private async apiRequest<T>(
    credentials: IntegrationCredentials<"ID_VERIFICATION", "BANKFLIP">,
    url: string,
    init: RequestInit = {},
    type: "json" | "buffer" = "json",
  ): Promise<T> {
    const response = await this.fetch.fetch(`${credentials.HOST}${url}`, {
      ...omit(init, ["headers"]),
      headers: {
        ...init.headers,
        "Content-Type": "application/json",
        Authorization: `Bearer ${credentials.API_KEY}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new InvalidCredentialsError("INVALID_CREDENTIALS", response.statusText);
      }
      if (response.status === 400) {
        const data = await response.json();
        if (data.code === "VALIDATION_ERROR") {
          throw new InvalidRequestError("VALIDATION_ERROR", data.message);
        }
      }
      throw new Error(`${response.status} ${response.statusText}`);
    }

    if (type === "json") {
      return await response.json();
    } else {
      return Buffer.from(await response.arrayBuffer()) as T;
    }
  }

  private async buildBankflipCustomization(orgId: number) {
    const organization = await this.organizations.loadOrg(orgId);
    const hasRemoveParallelBranding = await this.featureFlags.orgHasFeatureFlag(
      orgId,
      "REMOVE_PARALLEL_BRANDING",
    );

    const customization: any = {};
    if (hasRemoveParallelBranding) {
      customization["companyName"] = organization!.name;
      const customLogoPath = await this.organizations.loadOrgIconPath(organization!.id);
      if (isNonNullish(customLogoPath)) {
        customization["companyLogo"] = await this.images.getImageUrl(customLogoPath, {
          resize: { height: 150, width: 150, fit: "fill" },
        });
      }
    }

    return customization;
  }

  private verifyHMAC(req: Request, _: Response, buffer: Buffer) {
    const requestUri = `https://${req.hostname}${req.originalUrl}`;
    const requestMethod = req.method;
    const requestBody = buffer.toString();
    const timestamp = req.headers["x-signature-timestamp"] as string;
    const requestSignature = req.headers["x-signature-v1"] as string;

    const numericTimestamp = parseInt(timestamp, 10);
    const diff = new Date().getTime() - numericTimestamp;
    if (isNaN(diff) || diff > 5 * 60 * 1_000) {
      // if received timestamp is older than 5 minutes, reject the request as it could be a replay attack
      // any error response in the webhook will cause Bankflip to retry the request after an exponential backoff, up to 60 times, or ~6 days
      throw new Error("HMAC verification error: Invalid timestamp");
    }

    const hash = createHmac("sha256", Buffer.from((req as any).webhookSecret, "base64"))
      .update(Buffer.from(requestMethod + requestUri + requestBody + timestamp))
      .digest();
    if (!timingSafeEqual(Buffer.from(requestSignature, "base64"), hash)) {
      throw new Error("HMAC verification error: signature does not match");
    }
  }

  private mapIdVerificationType(
    type: BankflipIdentityVerificationRequestType,
  ): IdentityVerificationRequestType {
    switch (type) {
      case "simple":
        return "SIMPLE";
      case "extended":
        return "EXTENDED";
      default:
        throw new Error(`Unknown request type: ${type}`);
    }
  }

  private mapDocumentType(
    type: BankflipIdentityVerificationDocumentType,
  ): IdentityVerificationDocumentType {
    switch (type) {
      case "id_card":
        return "ID_CARD";
      case "passport":
        return "PASSPORT";
      case "residence_permit":
        return "RESIDENCE_PERMIT";
      case "driver_license":
        return "DRIVER_LICENSE";
      default:
        throw new Error(`Unknown document type: ${type}`);
    }
  }

  private mapDocumentInfo(
    info: BankflipIdentityVerificationDocumentInfo,
  ): IdentityVerificationDocumentInfo {
    return pick(info, ["id", "sessionId", "extension", "name", "contentType", "createdAt"]);
  }

  private mapIdVerificationDocument(
    doc: BankflipIdentityVerificationDocument,
  ): IdentityVerificationDocument {
    return {
      ...pick(doc, [
        "idNumber",
        "number",
        "firstName",
        "surname",
        "birthPlace",
        "birthDate",
        "nationality",
        "issueDate",
        "expirationDate",
        "issuingCountry",
        "unexpiredDocument",
        "faceFrontSide",
        "uncompromisedDocument",
        "notShownScreen",
        "checkedMRZ",
        "createdAt",
      ]),
      type: this.mapDocumentType(doc.type),
      dataDocument: isNonNullish(doc.dataDocument) ? this.mapDocumentInfo(doc.dataDocument) : null,
      imagesDocument: isNonNullish(doc.imagesDocument)
        ? this.mapDocumentInfo(doc.imagesDocument)
        : null,
    };
  }

  private mapIdVerificationSelfie(selfie: BankflipSelfieDocument): SelfieDocument {
    return {
      ...pick(selfie, ["liveness", "createdAt"]),
      pictureDocument: isNonNullish(selfie.pictureDocument)
        ? this.mapDocumentInfo(selfie.pictureDocument)
        : null,
      videoDocument: isNonNullish(selfie.videoDocument)
        ? this.mapDocumentInfo(selfie.videoDocument)
        : null,
    };
  }
}
