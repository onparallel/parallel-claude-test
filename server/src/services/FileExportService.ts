import { inject, injectable } from "inversify";
import { indexBy, isNonNullish, isNullish, omit } from "remeda";
import sanitizeFilename from "sanitize-filename";
import { Readable } from "stream";
import { assert } from "ts-essentials";
import { PetitionExcelExport } from "../api/helpers/PetitionExcelExport";
import { Config, CONFIG } from "../config";
import { FileExportLog, PetitionField, UserLocale } from "../db/__types";
import { ContactRepository } from "../db/repositories/ContactRepository";
import { FileRepository } from "../db/repositories/FileRepository";
import { IntegrationRepository } from "../db/repositories/IntegrationRepository";
import { PetitionRepository } from "../db/repositories/PetitionRepository";
import { UserRepository } from "../db/repositories/UserRepository";
import { IFileExportIntegration } from "../integrations/file-export/FileExportIntegration";
import { IMANAGE_FILE_EXPORT_INTEGRATION } from "../integrations/file-export/imanage/IManageFileExportIntegration";
import { getAllFieldsWithIndices } from "../util/fieldIndices";
import { applyFieldVisibility, evaluateFieldLogic } from "../util/fieldLogic";
import { isFileTypeField } from "../util/isFileTypeField";
import { sanitizeFilenameWithSuffix } from "../util/sanitizeFilenameWithSuffix";
import { renderTextWithPlaceholders } from "../util/slate/placeholders";
import { random } from "../util/token";
import { Maybe, UnwrapArray } from "../util/types";
import { I18N_SERVICE, II18nService } from "./I18nService";
import { ILogger, LOGGER } from "./Logger";
import { IPrinter, PRINTER } from "./Printer";
import { IStorageImpl, IStorageService, STORAGE_SERVICE } from "./StorageService";

export const FILE_EXPORT_SERVICE = Symbol.for("FILE_EXPORT_SERVICE");

interface GetPetitionFilesOptions {
  locale: UserLocale;
  pattern?: string | null;
  include: ("excel-file" | "petition-field-files" | "latest-signature")[];
  onProgress?: (value: number) => Promise<void>;
}

export type FileExportMetadata =
  | {
      id: number;
      type: "PetitionFieldReply" | "Petition";
      metadata: any;
    }
  | {
      id: number;
      type: "PetitionSignatureRequest";
      documentType: "signed-document" | "audit-trail";
      metadata: any;
    };

export type FileExport = {
  id: string;
  metadata: FileExportMetadata;
  filename: string;
  temporary_url: string;
  status: "WAITING" | "OK" | "NOK";
  error?: string;
  url?: string;
};

export interface IFileExportService {
  getPetitionFiles<T>(
    petitionId: number,
    userId: number,
    processFile: (storage: IStorageImpl, path: string, filename: string) => Promise<T>,
    options: GetPetitionFilesOptions,
  ): AsyncGenerator<T>;

  buildWindowUrl(integrationId: number, fileExportLogId: number): Promise<string>;

  createPetitionFilesExportLog(
    integrationId: number,
    petitionId: number,
    filenamePattern: string | null,
    userId: number,
    onProgress?: (progress: number) => Promise<void>,
  ): Promise<FileExportLog>;
}
@injectable()
export class FileExportService implements IFileExportService {
  constructor(
    @inject(PetitionRepository) private petitions: PetitionRepository,
    @inject(IntegrationRepository) private integrations: IntegrationRepository,
    @inject(FileRepository) private files: FileRepository,
    @inject(UserRepository) private users: UserRepository,
    @inject(ContactRepository) private contacts: ContactRepository,
    @inject(STORAGE_SERVICE) private storage: IStorageService,
    @inject(PRINTER) private printer: IPrinter,
    @inject(LOGGER) private logger: ILogger,
    @inject(I18N_SERVICE) private i18n: II18nService,
    @inject(CONFIG) private config: Config,
    @inject(IMANAGE_FILE_EXPORT_INTEGRATION) private iManageFileExport: IFileExportIntegration,
  ) {}

  private async getIntegration(integrationId: number) {
    const integration = await this.integrations.loadIntegration(integrationId);
    assert(integration?.type === "FILE_EXPORT", "Invalid integration");

    switch (integration.provider) {
      case "IMANAGE":
        return this.iManageFileExport;
      default:
        throw new Error(`Provider ${integration.provider} not supported`);
    }
  }

  async buildWindowUrl(integrationId: number, fileExportLogId: number) {
    const integration = await this.getIntegration(integrationId);
    return await integration.buildWindowUrl(integrationId, fileExportLogId);
  }

  async createPetitionFilesExportLog(
    integrationId: number,
    petitionId: number,
    filenamePattern: string | null,
    userId: number,
    onProgress?: (progress: number) => Promise<void>,
  ): Promise<FileExportLog> {
    const userData = await this.users.loadUserDataByUserId(userId);
    assert(userData, `User ${userId} not found`);
    const files = this.getPetitionFiles<FileExport>(
      petitionId,
      userId,
      async (storage, path, filename, metadata) => ({
        id: random(16),
        status: "WAITING",
        metadata,
        filename: sanitizeFilename(filename),
        temporary_url: await storage.getSignedDownloadEndpoint(path, filename, "inline"),
      }),
      {
        include: ["excel-file", "petition-field-files", "latest-signature"],
        locale: userData.preferred_locale,
        pattern: filenamePattern,
        onProgress,
      },
    );

    let next: IteratorResult<FileExport>;
    const exportedFiles: FileExport[] = [];
    while (!(next = await files.next()).done) {
      exportedFiles.push(next.value);
    }

    if (exportedFiles.length === 0) {
      throw new Error(`No files to export on Petition:${petitionId}`);
    }

    return await this.integrations.createFileExportLog(
      {
        integration_id: integrationId,
        created_by_user_id: userId,
        json_export: exportedFiles,
      },
      `User:${userId}`,
    );
  }

  async *getPetitionFiles<T>(
    petitionId: number,
    userId: number,
    processFile: (
      storage: IStorageImpl,
      path: string,
      filename: string,
      metadata: FileExportMetadata,
    ) => Promise<T>,
    options: GetPetitionFilesOptions,
  ): AsyncGenerator<T> {
    this.logger.info(`Exporting files on Petition:${petitionId} ...`);
    this.logger.info(JSON.stringify(omit(options, ["onProgress"]), null, 2));
    const includeXlsx = options.include.includes("excel-file");
    const includeFiles = options.include.includes("petition-field-files");
    const includeSignature = options.include.includes("latest-signature");

    const [composedPetition] = await this.petitions.getComposedPetitionFieldsAndVariables([
      petitionId,
    ]);

    const indices = Object.fromEntries(
      getAllFieldsWithIndices(composedPetition.fields).map(([field, fieldIndex]) => [
        field.id,
        fieldIndex,
      ]),
    );
    const logic = evaluateFieldLogic(composedPetition);
    const visibleFields = applyFieldVisibility(composedPetition);
    const allReplies = visibleFields
      .flatMap((f) => [
        ...f.replies,
        ...f.replies.flatMap((r) => r.children?.flatMap((c) => c.replies) ?? []),
      ])
      .filter((r) => r.type !== "FIELD_GROUP");

    const fileReplies = allReplies.filter(
      (r) =>
        isFileTypeField(r.type) &&
        isNonNullish(r.content.file_upload_id) &&
        isNullish(r.content.error) &&
        r.status !== "REJECTED",
    );

    const backgroundCheckEntityReplies = allReplies.filter(
      (r) => r.type === "BACKGROUND_CHECK" && isNonNullish(r.content.entity),
    );

    const files = await this.files.loadFileUpload(
      fileReplies.map((reply) => reply.content["file_upload_id"]),
    );
    const filesById = indexBy(files.filter(isNonNullish), (f) => f.id);

    const latestPetitionSignature =
      await this.petitions.loadLatestPetitionSignatureByPetitionId(petitionId);

    const totalFiles = [
      includeXlsx ? 1 : 0, // excel file may contain text replies and/or field comments
      includeFiles ? fileReplies.length + backgroundCheckEntityReplies.length : 0,
      includeSignature && isNonNullish(latestPetitionSignature?.file_upload_id) ? 1 : 0,
      includeSignature && isNonNullish(latestPetitionSignature?.file_upload_audit_trail_id) ? 1 : 0,
    ].reduce((a, b) => a + b, 0);

    this.logger.info(`Found ${totalFiles} files...`);

    if (totalFiles === 0) {
      return;
    }

    let processedFiles = 0;

    const intl = await this.i18n.getIntl(options.locale);
    const excelWorkbook = new PetitionExcelExport(intl, this.config.misc.parallelUrl, {
      contacts: this.contacts,
      petitions: this.petitions,
      users: this.users,
    });
    await excelWorkbook.init();
    const seen = new Set<string>();

    function resolveFileName(
      field: Pick<PetitionField, "id" | "title">,
      pattern: string | null | undefined,
      originalFileName: string,
    ) {
      const extension = originalFileName.match(/\.[a-z0-9]+$/i)?.[0] ?? "";
      const name = renderTextWithPlaceholders(pattern ?? "{{file-name}}", (placeholder) => {
        switch (placeholder) {
          case "field-number":
            return `${indices[field.id]}`;
          case "field-title":
            return field.title ?? "";
          case "file-name":
            // remove file extension since it's added back later
            return originalFileName.replace(/\.[a-z0-9]+$/, "");
          default:
            return "";
        }
      });
      let filename = sanitizeFilenameWithSuffix(name, extension.toLowerCase());
      let counter = 1;
      while (seen.has(filename)) {
        filename = sanitizeFilenameWithSuffix(name, ` ${counter++}${extension.toLowerCase()}`);
      }
      seen.add(filename);

      return filename;
    }

    async function* processField(
      field: UnwrapArray<typeof visibleFields> & {
        group_name?: Maybe<string>;
        group_number?: number;
      },
      options: GetPetitionFilesOptions,
      context: {
        logger: ILogger;
        storage: IStorageService;
        printer: IPrinter;
      },
    ): AsyncGenerator<T> {
      if (field.type === "HEADING") {
        // do nothing
      } else if (field.type === "FIELD_GROUP") {
        for (const groupReply of field.replies) {
          const groupIndex = field.replies.indexOf(groupReply);
          // process every child field on every reply group
          for (const child of groupReply.children ?? []) {
            yield* processField(
              {
                ...child.field,
                children: [],
                replies: child.replies.map((r) => ({ ...r, children: [] })),
                group_number: groupIndex + 1,
                group_name: field.options.groupName ?? null,
              },
              options,
              context,
            );
          }
        }
      } else {
        if (includeFiles && isFileTypeField(field.type)) {
          for (const reply of field.replies) {
            const file = filesById[reply.content["file_upload_id"]];
            if (file?.upload_complete) {
              context.logger.info(`Exporting FileUpload:${file.id}...`);
              yield await processFile(
                context.storage.fileUploads,
                file.path,
                resolveFileName(field, options.pattern, file.filename),
                { type: "PetitionFieldReply", id: reply.id, metadata: reply.metadata },
              );
              await options.onProgress?.(++processedFiles / totalFiles);
            }
          }
        }

        if (includeFiles && field.type === "BACKGROUND_CHECK") {
          // on BACKGROUND_CHECK fields, export the PDF if reply has set "entity"
          for (const reply of field.replies.filter((r) => isNonNullish(r.content.entity))) {
            const path = random(16);
            await context.storage.temporaryFiles.uploadFile(
              path,
              "application/pdf",
              Readable.from(await context.printer.backgroundCheckProfile(userId, reply.content)),
            );
            context.logger.info(`Exporting BackgroundCheck PetitionFieldReply:${reply.id}...`);
            yield await processFile(
              context.storage.temporaryFiles,
              path,
              resolveFileName(
                field,
                options.pattern,
                `${reply.content.entity.type}-${reply.content.entity.id}.pdf`,
              ),
              { type: "PetitionFieldReply", id: reply.id, metadata: reply.metadata },
            );
            await options.onProgress?.(++processedFiles / totalFiles);
          }
        }

        if (includeXlsx && !isFileTypeField(field.type)) {
          excelWorkbook.addPetitionFieldReply(field);
        }
      }
    }

    excelWorkbook.addPetitionVariables(logic[0].finalVariables);

    for (const field of visibleFields) {
      yield* processField(field, options, {
        logger: this.logger,
        storage: this.storage,
        printer: this.printer,
      });
    }

    await excelWorkbook.addPetitionFieldComments(visibleFields);

    if (includeXlsx && excelWorkbook.hasRows()) {
      this.logger.info(`Exporting excel file...`);
      yield await excelWorkbook.export(async (stream, filename) => {
        const path = random(16);
        await this.storage.temporaryFiles.uploadFile(
          path,
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          stream,
        );
        return await processFile(this.storage.temporaryFiles, path, filename, {
          type: "Petition",
          id: petitionId,
          metadata: composedPetition.metadata,
        });
      });
      await options.onProgress?.(++processedFiles / totalFiles);
    }

    if (includeSignature && latestPetitionSignature?.status === "COMPLETED") {
      if (isNonNullish(latestPetitionSignature.file_upload_id)) {
        const signedPetition = await this.files.loadFileUpload(
          latestPetitionSignature.file_upload_id,
        );
        if (signedPetition?.upload_complete) {
          this.logger.info(
            `Exporting PetitionSignature:${latestPetitionSignature.id} signed doc...`,
          );
          yield await processFile(
            this.storage.fileUploads,
            signedPetition.path,
            signedPetition.filename,
            {
              type: "PetitionSignatureRequest",
              documentType: "signed-document",
              id: latestPetitionSignature.id,
              metadata: latestPetitionSignature.metadata,
            },
          );
          await options.onProgress?.(++processedFiles / totalFiles);
        }
      }
      if (isNonNullish(latestPetitionSignature.file_upload_audit_trail_id)) {
        const auditTrail = await this.files.loadFileUpload(
          latestPetitionSignature.file_upload_audit_trail_id,
        );
        if (auditTrail?.upload_complete) {
          this.logger.info(
            `Exporting PetitionSignature:${latestPetitionSignature.id} audit trail...`,
          );
          yield await processFile(this.storage.fileUploads, auditTrail.path, auditTrail.filename, {
            type: "PetitionSignatureRequest",
            documentType: "audit-trail",
            id: latestPetitionSignature.id,
            metadata: latestPetitionSignature.metadata,
          });
          await options.onProgress?.(++processedFiles / totalFiles);
        }
      }
    }
  }
}
