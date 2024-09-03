import { createHmac, timingSafeEqual } from "crypto";
import { json, Request, Router } from "express";
import { readFile } from "fs/promises";
import { inject, injectable } from "inversify";
import { Knex } from "knex";
import { extension } from "mime-types";
import { join } from "path";
import { isNullish, omit } from "remeda";
import { Config, CONFIG } from "../../../config";
import { DocumentProcessingType, FileUpload } from "../../../db/__types";
import {
  EnhancedCreateOrgIntegration,
  EnhancedOrgIntegration,
  IntegrationCredentials,
  IntegrationRepository,
} from "../../../db/repositories/IntegrationRepository";
import { IDocumentProcessingService } from "../../../services/DocumentProcessingService";
import { ENCRYPTION_SERVICE, EncryptionService } from "../../../services/EncryptionService";
import { FETCH_SERVICE, IFetchService } from "../../../services/FetchService";
import { IStorageService, STORAGE_SERVICE } from "../../../services/StorageService";
import { getBaseWebhookUrl } from "../../../util/getBaseWebhookUrl";
import { never } from "../../../util/never";
import { removePasswordFromPdf } from "../../../util/pdf";
import { Maybe } from "../../../util/types";
import { InvalidCredentialsError, InvalidRequestError } from "../../helpers/GenericIntegration";
import { WebhookIntegration } from "../../helpers/WebhookIntegration";
import { IDocumentProcessingIntegration } from "../DocumentProcessingIntegration";

interface BankflipDocument {
  id: string;
  name: string;
  extension: string;
  contentType: string;
}

interface BankflipPayslip {
  document?: Maybe<BankflipDocument>;
  employerName?: Maybe<string>;
  employeeName?: Maybe<string>;
  employeeId?: Maybe<{
    type: Maybe<string>;
    number: Maybe<string>;
    country: Maybe<string>;
  }>;
  employerId?: Maybe<{
    type: Maybe<string>;
    number: Maybe<string>;
    country: Maybe<string>;
  }>;
  period?: Maybe<{
    start?: Maybe<string>;
    end?: Maybe<string>;
  }>;
  netPay?: Maybe<{
    value: Maybe<number>;
    currency: Maybe<string>;
  }>;
  totalDeduction?: Maybe<{
    value: Maybe<number>;
    currency: Maybe<string>;
  }>;
  totalAccrued?: Maybe<{
    value: Maybe<number>;
    currency: Maybe<string>;
  }>;
}

interface BankflipPayslipAnalysisResult {
  id: string;
  metadata: any;
  completed: boolean;
  createdAt: string;
  documents: BankflipDocument[];
  documentOutcomes: [
    {
      document?: BankflipDocument;
      completed?: boolean;
      payslips?: BankflipPayslip[];
    },
  ];
}

interface WebhookSubscriptionResponse {
  data: {
    id: string;
    events: string[];
    url: string;
    customerId: string;
  }[];
  hasNext: boolean;
  nextCursor: string | null;
}

export const BANKFLIP_DOCUMENT_PROCESSING_INTEGRATION = Symbol.for(
  "BANKFLIP_DOCUMENT_PROCESSING_INTEGRATION",
);

@injectable()
export class BankflipDocumentProcessingIntegration
  extends WebhookIntegration<"DOCUMENT_PROCESSING", "BANKFLIP", {}, IDocumentProcessingService>
  implements IDocumentProcessingIntegration
{
  public override WEBHOOK_API_PREFIX = "/document-processing/bankflip/";
  public override service!: IDocumentProcessingService;

  protected override type = "DOCUMENT_PROCESSING" as const;
  protected override provider = "BANKFLIP" as const;

  constructor(
    @inject(IntegrationRepository) integrations: IntegrationRepository,
    @inject(ENCRYPTION_SERVICE) encryption: EncryptionService,
    @inject(FETCH_SERVICE) private fetch: IFetchService,
    @inject(STORAGE_SERVICE) private storage: IStorageService,
    @inject(CONFIG) private config: Config,
  ) {
    super(encryption, integrations);
  }

  private supportedDocumentTypes = ["PAYSLIP" as const];

  async createDocumentExtractionRequest(
    integrationId: number,
    file: FileUpload,
    documentType: DocumentProcessingType,
  ) {
    if (!this.supportedDocumentTypes.includes(documentType)) {
      throw new InvalidRequestError(
        "DOCUMENT_TYPE_NOT_SUPPORTED",
        `Document type ${documentType} not supported`,
      );
    }

    switch (documentType) {
      case "PAYSLIP":
        return await this.createPayslipExtractionRequest(integrationId, file);
      default:
        never(`Unknown document type ${documentType}`);
    }
  }

  protected override webhookHandlers(router: Router) {
    router.post(
      "/events",
      json(), // need to parse body before verifying HMAC, so we can access req.body in the following middleware
      async (req, res, next) => {
        try {
          if (
            !req.body.payload?.analysisRequestId ||
            isNullish(req.body.name) ||
            req.body.name !== "ANALYSIS_REQUEST_COMPLETED"
          ) {
            // don't throw error if request body is invalid or incomplete
            return res.sendStatus(200).end();
          }

          const body = req.body as {
            name: string;
            payload: {
              analysisRequestId: string;
            };
          };

          const docProcessingLog =
            await req.context.integrations.loadDocumentProcessingLogByExternalId(
              `BANKFLIP/${body.payload.analysisRequestId}`,
            );

          if (!docProcessingLog) {
            // As this is a global webhook, we need to check if we have a log for this external ID.
            // This way we can be sure we are in the correct environment, as the same APIKEY can be shared and used in multiple environments at the same time.
            // If we don't find the log in database, it could mean the request is for another environment, so return OK and finish
            return res.sendStatus(200).end();
          }
          const webhookSecret = await this.withCredentials(
            docProcessingLog.integration_id,
            async (credentials) => credentials.WEBHOOK_SECRET,
          );
          this.verifyHMAC(req, webhookSecret);

          // don't await this, as we don't want to block the webhook response
          this.withCredentials(docProcessingLog.integration_id, async (credentials) => {
            const response = await this.apiRequest<BankflipPayslipAnalysisResult>(
              credentials,
              `/payslip/analysis-request/${body.payload.analysisRequestId}`,
            );
            const currencyData = (
              await import(join(__dirname, "../../../../data/currencies/units.json"))
            ).default as Record<string, number>;

            return { response, currencyData };
          }).then(({ response, currencyData }) => {
            function convert(data?: { value: number | null; currency: string | null } | null) {
              if (!isNullish(data?.value) && !isNullish(data?.currency)) {
                const fractionalUnit = currencyData[data.currency];

                if (isNullish(fractionalUnit)) {
                  throw new Error("CURRENCY_NOT_FOUND");
                }

                return {
                  value: data.value / fractionalUnit,
                  currency: data.currency,
                };
              }

              // either value or currency (or both) are null
              return null;
            }

            if (response.completed) {
              this.service.onCompleted<"PAYSLIP">(
                `BANKFLIP/${body.payload.analysisRequestId}`,
                response,
                (response: BankflipPayslipAnalysisResult) =>
                  response.documentOutcomes.flatMap((outcome) =>
                    (outcome.payslips ?? []).map((payslip) => ({
                      periodStart: payslip.period?.start?.split("T")[0] ?? null,
                      periodEnd: payslip.period?.end?.split("T")[0] ?? null,
                      employeeName: payslip.employeeName ?? null,
                      employeeId: payslip.employeeId?.number ?? null,
                      employerName: payslip.employerName ?? null,
                      employerId: payslip.employerId?.number ?? null,
                      netPay: convert(payslip.netPay),
                      totalAccrued: convert(payslip.totalAccrued),
                      totalDeduction: convert(payslip.totalDeduction),
                    })),
                  ),
              );
            }
          });

          res.sendStatus(200).end();
        } catch (error) {
          if (error instanceof Error) {
            req.context.logger.error(error.message, { stack: error.stack });
          }
          next(error);
        }
      },
    );
  }

  // returns a bse64-encoded decrypted version of the file
  private async resolveFileUploadContents(file: FileUpload): Promise<string> {
    if (file.content_type === "application/pdf" && file.password) {
      const readable = await this.storage.fileUploads.downloadFile(file.path);
      const decryptedFilePath = await removePasswordFromPdf(
        readable,
        this.encryption.decrypt(Buffer.from(file.password, "hex"), "utf8"),
      );
      return await readFile(decryptedFilePath, { encoding: "base64" });
    } else {
      return await this.storage.fileUploads.downloadFileBase64(file.path);
    }
  }

  private async createPayslipExtractionRequest(integrationId: number, file: FileUpload) {
    return await this.withCredentials(integrationId, async (credentials) => {
      const response = await this.apiRequest<{ id: string }>(
        credentials,
        "/payslip/analysis-request",
        {
          method: "POST",
          body: JSON.stringify({
            documents: [
              {
                content: await this.resolveFileUploadContents(file),
                contentType: file.content_type,
                name: file.filename,
                extension: extension(file.content_type),
              },
            ],
          }),
        },
      );

      return response.id;
    });
  }

  private async apiRequest<T>(
    credentials: IntegrationCredentials<"DOCUMENT_PROCESSING", "BANKFLIP">,
    url: string,
    init: RequestInit = {},
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
      if (response.status === 413) {
        throw new InvalidRequestError("FILE_TOO_LARGE", response.statusText);
      }
      throw new InvalidRequestError("UNKNOWN", response.statusText);
    }

    return await response.json();
  }

  private verifyHMAC(req: Request, webhookSecret: string) {
    const requestUri = `https://${req.hostname}${req.originalUrl}`;
    const requestMethod = req.method;
    const requestBody = (req as any).rawBody;
    const timestamp = req.headers["x-signature-timestamp"] as string;
    const requestSignature = req.headers["x-signature-v1"] as string;

    const numericTimestamp = parseInt(timestamp, 10);
    const diff = new Date().getTime() - numericTimestamp;
    if (isNaN(diff) || diff > 5 * 60 * 1_000) {
      // if received timestamp is older than 5 minutes, reject the request as it could be a replay attack
      // any error response in the webhook will cause Bankflip to retry the request after an exponential backoff, up to 60 times, or ~6 days
      // 5 minutes check should allow Bankflip to retry the request a few times before it's rejected
      throw new Error("HMAC verification error: Invalid timestamp");
    }

    const hash = createHmac("sha256", Buffer.from(webhookSecret, "base64"))
      .update(Buffer.from(requestMethod + requestUri + requestBody + timestamp))
      .digest();
    if (!timingSafeEqual(Buffer.from(requestSignature, "base64"), hash)) {
      throw new Error("HMAC verification error: signature does not match");
    }
  }

  public override async createOrgIntegration(
    data: Omit<
      EnhancedCreateOrgIntegration<"DOCUMENT_PROCESSING", "BANKFLIP", false>,
      "type" | "provider" | "is_enabled"
    >,
    createdBy: string,
    t?: Knex.Transaction,
  ): Promise<EnhancedOrgIntegration<"DOCUMENT_PROCESSING", "BANKFLIP">> {
    const integration = await super.createOrgIntegration(data, createdBy, t);

    // search for a subscribed webhook on this API key
    const baseWebhookUrl = await getBaseWebhookUrl(this.config.misc.webhooksUrl);
    const webhookUrl = `${baseWebhookUrl}/api/integrations${this.WEBHOOK_API_PREFIX}events`;
    const webhooks = await this.apiRequest<WebhookSubscriptionResponse>(
      data.settings.CREDENTIALS,
      `/webhook-subscription?${new URLSearchParams({
        "events.eq": "analysis_request_completed",
        "url.eq": webhookUrl,
        limit: "1",
      })}`,
    );

    // if not found, create it
    if (webhooks.data.length === 0) {
      await this.apiRequest(data.settings.CREDENTIALS, "/webhook-subscription", {
        method: "POST",
        body: JSON.stringify({
          events: ["analysis_request_completed"],
          url: webhookUrl,
        }),
      });
    }

    return integration;
  }
}
