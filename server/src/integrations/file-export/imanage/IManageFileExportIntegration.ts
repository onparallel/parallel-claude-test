import Ajv from "ajv";
import { createHmac, timingSafeEqual } from "crypto";
import { ErrorRequestHandler, json, RequestHandler, Router } from "express";
import fastSafeStringify from "fast-safe-stringify";
import { inject, injectable } from "inversify";
import { FromSchema } from "json-schema-to-ts";
import { isNonNullish, zip } from "remeda";
import { Config, CONFIG } from "../../../config";
import {
  EnhancedOrgIntegration,
  IntegrationRepository,
} from "../../../db/repositories/IntegrationRepository";
import { ENCRYPTION_SERVICE, EncryptionService } from "../../../services/EncryptionService";
import { ILogger, LOGGER } from "../../../services/Logger";
import { fromGlobalId, isGlobalId, toGlobalId } from "../../../util/globalId";
import { JsonSchemaFor } from "../../../util/jsonSchema";
import { WebhookIntegration } from "../../helpers/WebhookIntegration";
import { IFileExportIntegration } from "../FileExportIntegration";

class RequestError extends Error {
  constructor(
    public status: number,
    message?: string,
  ) {
    super(message);
  }
}

export const IMANAGE_FILE_EXPORT_INTEGRATION = Symbol.for("IMANAGE_FILE_EXPORT_INTEGRATION");

const FILE_SCHEMA = {
  type: "object",
  required: ["id", "status"],
  properties: {
    id: { type: "string" },
    status: { type: "string", enum: ["OK", "NOK"] },
    url: { type: "string" },
    error: { type: "string" },
  },
} as const;

interface ImanageFileExportContext {
  clientId: string;
}

@injectable()
export class IManageFileExportIntegration
  extends WebhookIntegration<"FILE_EXPORT", "IMANAGE", ImanageFileExportContext>
  implements IFileExportIntegration
{
  protected override type = "FILE_EXPORT" as const;
  protected override provider = "IMANAGE" as const;

  public override WEBHOOK_API_PREFIX = "/export/imanage";
  public override service: any;

  constructor(
    @inject(CONFIG) private config: Config,
    @inject(LOGGER) private logger: ILogger,
    @inject(ENCRYPTION_SERVICE) encryption: EncryptionService,
    @inject(IntegrationRepository) integrations: IntegrationRepository,
  ) {
    super(encryption, integrations);
  }

  protected override getContext(
    integration: EnhancedOrgIntegration<"FILE_EXPORT", "IMANAGE", false>,
  ) {
    return {
      clientId: integration.settings.CLIENT_ID,
    };
  }

  async buildWindowUrl(integrationId: number, fileExportLogId: number) {
    return await this.withCredentials(integrationId, async (_, { clientId }) => {
      const timestamp = Date.now().toString();
      const exportId = toGlobalId("FileExportLog", fileExportLogId);
      const signature = createHmac(
        "sha256",
        Buffer.from(this.config.fileExport.iManage.signatureSecret, "base64"),
      )
        .update(clientId + exportId + timestamp)
        .digest("base64");

      return `https://parallel.lexsoft.com/export?${new URLSearchParams({
        cid: clientId,
        eid: exportId,
        timestamp,
        signature,
      })}`;
    });
  }

  protected override webhookHandlers(router: Router) {
    router.use(
      "/client/:clientId/export/:exportId",
      json({
        verify: (req, res, payload) => {
          try {
            JSON.parse(payload.toString());
          } catch {
            throw new RequestError(400, "Invalid request body");
          }
        },
      }),
      this.appendRequestLog(),
      this.verifyHMAC(),
      this.validateParams(),
      Router({ mergeParams: true })
        .post("/", this.fetchFileExportJson())
        .post(
          "/complete",
          this.validateBodySchema({
            type: "array",
            minItems: 1,
            items: FILE_SCHEMA,
          }),
          this.processCompletedFiles(),
        ),
      this.handleErrors(),
    );
  }

  private handleErrors(): ErrorRequestHandler {
    return async (error, req, res, next) => {
      const message = error instanceof Error ? error.message : fastSafeStringify(error);
      try {
        this.logger.info(`Error handling request: ${message}`);

        if (req.params.exportId && isGlobalId(req.params.exportId, "FileExportLog")) {
          const fileExportLogId = fromGlobalId(req.params.exportId, "FileExportLog").id;
          await this.integrations.appendFileExportRequestLog(fileExportLogId, {
            error: message,
          });
        }
      } catch {}
      return res
        .status(error instanceof RequestError ? error.status : 500)
        .json({ error: message })
        .end();
    };
  }

  private verifyHMAC(): RequestHandler {
    return async (req, res, next) => {
      try {
        const requestUri = `${process.env.NODE_ENV === "development" ? "http" : "https"}://${req.hostname}${req.originalUrl}`;
        const requestBody = (req as any).rawBody;

        const signature1 = req.headers["x-signature-1"] as string | undefined;
        const signature2 = req.headers["x-signature-2"] as string | undefined;
        const timestamp = req.headers["x-signature-timestamp"] as string | undefined;
        const signatures = [signature1, signature2].filter(isNonNullish);

        if (signatures.length === 0 || !timestamp) {
          this.logger.info("HMAC verification failed: missing signature or timestamp");
          throw new RequestError(403, "HMAC verification failed");
        }

        const numericTimestamp = parseInt(timestamp, 10);
        const diff = Date.now() - numericTimestamp;
        if (isNaN(diff) || diff < 0 || diff > 60_000) {
          // received timestamp is more than 1 minute old
          // this may be a replay attack
          this.logger.info("HMAC verification failed: invalid timestamp");
          throw new RequestError(403, "HMAC verification failed");
        }

        const hash = createHmac(
          "sha256",
          Buffer.from(this.config.fileExport.iManage.signatureSecret, "base64"),
        )
          .update(Buffer.from(requestUri + requestBody + timestamp))
          .digest();

        if (
          !signatures.some((signature) => timingSafeEqual(Buffer.from(signature, "base64"), hash))
        ) {
          this.logger.info("HMAC verification failed: invalid signature");
          throw new RequestError(403, "HMAC verification failed");
        }

        this.logger.info("HMAC verification passed");
        next();
      } catch (error) {
        next(error);
      }
    };
  }

  private appendRequestLog(): RequestHandler {
    return async (req, res, next) => {
      if (req.params.exportId && isGlobalId(req.params.exportId, "FileExportLog")) {
        this.logger.info("Appending request log...");
        const fileExportLogId = fromGlobalId(req.params.exportId, "FileExportLog").id;
        await this.integrations.appendFileExportRequestLog(fileExportLogId, {
          method: req.method,
          url: req.originalUrl,
          headers: req.headers,
          body: req.body,
        });
      }

      next();
    };
  }

  private validateParams(): RequestHandler {
    return async (req, res, next) => {
      try {
        this.logger.info("Verifying params...");
        this.logger.info(JSON.stringify(req.params, null, 2));
        const clientId = req.params.clientId;
        const exportId = req.params.exportId;

        if (!clientId || !exportId) {
          throw new RequestError(403, "Missing clientId or exportId");
        }

        if (!isGlobalId(exportId, "FileExportLog")) {
          throw new RequestError(403, "Invalid exportId");
        }

        const fileExportLog = await this.integrations.loadFileExportLog(
          fromGlobalId(exportId, "FileExportLog").id,
        );

        if (!fileExportLog) {
          throw new RequestError(403, "invalid exportId");
        }

        const isValidClientId = await this.withCredentials(
          fileExportLog.integration_id,
          async (_, context) => context.clientId === clientId,
        );

        if (!isValidClientId) {
          throw new RequestError(403, "Invalid clientId");
        }

        this.logger.info("Params verified");
        next();
      } catch (error) {
        next(error);
      }
    };
  }

  private fetchFileExportJson(): RequestHandler {
    return async (req, res, next) => {
      try {
        this.logger.info("Fetching file export JSON...");
        const fileExportLogId = fromGlobalId(req.params.exportId, "FileExportLog").id;
        const log = await req.context.integrations.loadFileExportLog(fileExportLogId);
        if (!log) {
          throw new RequestError(403, "Invalid file export log ID");
        }

        return res
          .json(
            log.json_export.map((f) => ({
              id: f.id,
              status: f.status,
              filename: f.filename,
              temporaryUrl: f.temporary_url,
            })),
          )
          .status(200)
          .end();
      } catch (error) {
        next(error);
      }
    };
  }

  private validateBodySchema(schema: JsonSchemaFor<any>): RequestHandler {
    return (req, res, next) => {
      try {
        this.logger.info("Validating body schema...");
        this.logger.info(JSON.stringify(req.body, null, 2));
        const ajv = new Ajv();
        if (!ajv.validate(schema, req.body)) {
          throw new RequestError(400, "Invalid JSON object: " + ajv.errorsText());
        }

        this.logger.info("Body schema validated");
        next();
      } catch (error) {
        next(error);
      }
    };
  }

  private processCompletedFiles(): RequestHandler {
    return async (req, res, next) => {
      try {
        const body = req.body as FromSchema<typeof FILE_SCHEMA>[];
        for (const url of body.map((data) => data.url).filter(isNonNullish)) {
          try {
            new URL(url);
          } catch {
            throw new RequestError(400, `Invalid URL: ${url}`);
          }
        }

        const fileExportLogId = fromGlobalId(req.params.exportId, "FileExportLog").id;
        const log = await req.context.integrations.loadFileExportLog(fileExportLogId);
        if (!log) {
          throw new RequestError(403, "Invalid exportId");
        }

        const files = body.map((data) => log.json_export.find((f) => f.id === data.id));

        if (!files.every(isNonNullish)) {
          throw new RequestError(403, "Unknown file ID");
        }

        for (const [file, result] of zip(files, body)) {
          file.status = result.status;
          file.url = result.status === "OK" ? result.url : undefined;
          file.error = result.status === "NOK" ? result.error : undefined;

          switch (file.metadata.type) {
            case "Petition":
              await req.context.petitions.attachPetitionMetadata(
                file.metadata.id,
                { FILE_EXPORT_IMANAGE_URL: file.url ?? null },
                `User:${log.created_by_user_id}`,
              );
              break;
            case "PetitionFieldReply":
              await req.context.petitions.attachPetitionFieldReplyMetadata(
                file.metadata.id,
                { FILE_EXPORT_IMANAGE_URL: file.url ?? null },
                `User:${log.created_by_user_id}`,
              );
              break;
            case "PetitionSignatureRequest":
              await req.context.petitions.attachPetitionSignatureRequestMetadata(file.metadata.id, {
                [file.metadata.documentType === "signed-document"
                  ? "SIGNED_DOCUMENT_FILE_EXPORT_IMANAGE_URL"
                  : "AUDIT_TRAIL_FILE_EXPORT_IMANAGE_URL"]: file.url ?? null,
              });
          }
        }

        await req.context.integrations.updateFileExportLog(log.id, {
          // update json_export with new status and url
          json_export: log.json_export,
        });

        return res.json({}).status(200).end();
      } catch (error) {
        next(error);
      }
    };
  }
}
