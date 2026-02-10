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
import { PetitionRepository } from "../../../db/repositories/PetitionRepository";
import { ENCRYPTION_SERVICE, EncryptionService } from "../../../services/EncryptionService";
import { ILogger, LOGGER } from "../../../services/Logger";
import { fromGlobalId, isGlobalId, toGlobalId } from "../../../util/globalId";
import { JsonSchemaFor } from "../../../util/jsonSchema";
import { never } from "../../../util/never";
import { GenericIntegration } from "../../helpers/GenericIntegration";
import { FileExport, IFileExportIntegration } from "../FileExportIntegration";

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

interface IManageFileExportContext {
  clientId: string;
}

@injectable()
export class IManageFileExportIntegration
  extends GenericIntegration<"FILE_EXPORT", "IMANAGE", IManageFileExportContext>
  implements IFileExportIntegration
{
  protected override type = "FILE_EXPORT" as const;
  protected override provider = "IMANAGE" as const;

  constructor(
    @inject(CONFIG) private config: Config,
    @inject(LOGGER) private logger: ILogger,
    @inject(PetitionRepository) private petitions: PetitionRepository,
    @inject(ENCRYPTION_SERVICE) encryption: EncryptionService,
    @inject(IntegrationRepository) integrations: IntegrationRepository,
  ) {
    super(encryption, integrations);
    super.registerHandlers((router) => {
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
    });
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
        Buffer.from(this.config.fileExport.iManage.signatureSecret),
      )
        .update(clientId + exportId + timestamp)
        .digest("base64");

      return `https://parallel.t3lexsoft.com/First.aspx?${new URLSearchParams({
        cid: clientId,
        eid: exportId,
        timestamp,
        signature,
      })}`;
    });
  }

  private handleErrors(): ErrorRequestHandler {
    return async (error, req, res, next) => {
      const message = error instanceof Error ? error.message : fastSafeStringify(error);
      try {
        this.logger.info(`Error handling request: ${message}`);

        if (
          (req.params.exportId as string) &&
          isGlobalId(req.params.exportId as string, "FileExportLog")
        ) {
          const fileExportLogId = fromGlobalId(req.params.exportId as string, "FileExportLog").id;
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

      const hash = createHmac("sha256", Buffer.from(this.config.fileExport.iManage.signatureSecret))
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
    };
  }

  private appendRequestLog(): RequestHandler {
    return async (req, res, next) => {
      if (
        (req.params.exportId as string) &&
        isGlobalId(req.params.exportId as string, "FileExportLog")
      ) {
        this.logger.info("Appending request log...");
        const fileExportLogId = fromGlobalId(req.params.exportId as string, "FileExportLog").id;
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
      this.logger.info("Verifying params...");
      this.logger.info(JSON.stringify(req.params, null, 2));
      const clientId = req.params.clientId;
      const exportId = req.params.exportId as string;

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
    };
  }

  /*
   * entity can be a petition, petition_field_reply or petition_signature_request
   * if entity is null or undefined, the most possible case is that the entity has been deleted so we have to ignore it
   */
  private resolveMetadataUrl(
    entity: { metadata: Record<string, string | null | undefined> } | null | undefined,
    key: string,
  ) {
    if (!entity) {
      return null;
    }

    const url = entity.metadata[key];
    if (url) {
      return { status: "OK", url };
    }
    if (url === null) {
      return { status: "NOK", url: null };
    }
    return { status: "WAITING", url: null };
  }

  private async fetchFileExportStatus(files: FileExport[]) {
    const [petitionId] = files
      .map((f) => (f.metadata.type === "PETITION_EXCEL_EXPORT" ? f.metadata.petitionId : null))
      .filter(isNonNullish);
    const fieldReplyIds = files
      .map((f) => (f.metadata.type === "PETITION_FILE_FIELD_REPLIES" ? f.metadata.replyId : null))
      .filter(isNonNullish);
    const [signatureId] = files
      .map((f) =>
        f.metadata.type === "PETITION_LATEST_SIGNATURE"
          ? f.metadata.petitionSignatureRequestId
          : null,
      )
      .filter(isNonNullish);

    const petition = isNonNullish(petitionId)
      ? await this.petitions.loadPetition(petitionId)
      : null;

    const replies =
      fieldReplyIds.length > 0 ? await this.petitions.loadFieldReply(fieldReplyIds) : [];

    const signatureRequest = isNonNullish(signatureId)
      ? await this.petitions.loadPetitionSignatureById(signatureId)
      : null;

    return files.map((file) => {
      if (file.status !== "WAITING") {
        return { status: file.status, url: file.url };
      }

      switch (file.metadata.type) {
        case "PETITION_EXCEL_EXPORT": {
          return this.resolveMetadataUrl(petition, "FILE_EXPORT_IMANAGE_URL");
        }
        case "PETITION_FILE_FIELD_REPLIES": {
          const replyId = file.metadata.replyId;
          const reply = replies.find((r) => r?.id === replyId);
          return this.resolveMetadataUrl(reply, "FILE_EXPORT_IMANAGE_URL");
        }
        case "PETITION_LATEST_SIGNATURE": {
          if (file.metadata.subtype === "SIGNED_DOCUMENT") {
            return this.resolveMetadataUrl(
              signatureRequest,
              "SIGNED_DOCUMENT_FILE_EXPORT_IMANAGE_URL",
            );
          } else if (file.metadata.subtype === "AUDIT_TRAIL") {
            return this.resolveMetadataUrl(signatureRequest, "AUDIT_TRAIL_FILE_EXPORT_IMANAGE_URL");
          } else {
            never(`Unknown subtype: ${file.metadata.subtype}`);
          }
        }
      }
    });
  }

  private fetchFileExportJson(): RequestHandler {
    return async (req, res) => {
      this.logger.info("Fetching file export JSON...");
      const fileExportLogId = fromGlobalId(req.params.exportId as string, "FileExportLog").id;
      const log = await req.context.integrations.loadFileExportLog(fileExportLogId);
      if (!log) {
        throw new RequestError(403, "Invalid file export log ID");
      }

      const exportStatus = await this.fetchFileExportStatus(log.json_export);

      return res
        .json(
          zip(log.json_export, exportStatus)
            .filter(([, s]) => isNonNullish(s)) // filter null statuses, as those files may have been deleted
            .map(([e, s]) => ({
              id: e.id,
              filename: e.filename,
              temporaryUrl: e.temporary_url,
              status: s!.status,
              url: s!.url,
            })),
        )
        .status(200)
        .end();
    };
  }

  private validateBodySchema(schema: JsonSchemaFor<any>): RequestHandler {
    return (req, res, next) => {
      this.logger.info("Validating body schema...");
      this.logger.info(JSON.stringify(req.body, null, 2));
      const ajv = new Ajv();
      if (!ajv.validate(schema, req.body)) {
        throw new RequestError(400, "Invalid JSON object: " + ajv.errorsText());
      }

      this.logger.info("Body schema validated");
      next();
    };
  }

  private processCompletedFiles(): RequestHandler {
    return async (req, res) => {
      const body = req.body as FromSchema<typeof FILE_SCHEMA>[];
      for (const url of body.map((data) => data.url).filter(isNonNullish)) {
        try {
          new URL(url);
        } catch {
          throw new RequestError(400, `Invalid URL: ${url}`);
        }
      }

      const fileExportLogId = fromGlobalId(req.params.exportId as string, "FileExportLog").id;
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
          case "PETITION_EXCEL_EXPORT":
            await req.context.petitions.attachPetitionMetadata(
              file.metadata.petitionId,
              { FILE_EXPORT_IMANAGE_URL: file.url ?? null },
              `User:${log.created_by_user_id}`,
            );
            break;
          case "PETITION_FILE_FIELD_REPLIES":
            await req.context.petitions.attachPetitionFieldReplyMetadata(
              file.metadata.replyId,
              { FILE_EXPORT_IMANAGE_URL: file.url ?? null },
              `User:${log.created_by_user_id}`,
            );
            break;
          case "PETITION_LATEST_SIGNATURE":
            await req.context.petitions.attachPetitionSignatureRequestMetadata(
              file.metadata.petitionSignatureRequestId,
              {
                [file.metadata.subtype === "SIGNED_DOCUMENT"
                  ? "SIGNED_DOCUMENT_FILE_EXPORT_IMANAGE_URL"
                  : "AUDIT_TRAIL_FILE_EXPORT_IMANAGE_URL"]: file.url ?? null,
              },
            );
        }
      }

      await req.context.integrations.updateFileExportLog(log.id, {
        // update json_export with new status and url
        json_export: log.json_export,
      });

      return res.json({}).status(200).end();
    };
  }
}
