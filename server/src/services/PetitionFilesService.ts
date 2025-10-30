import { inject, injectable } from "inversify";
import { indexBy, isNonNullish, isNullish, sumBy } from "remeda";
import { Readable } from "stream";
import { PetitionExcelExport } from "../api/helpers/PetitionExcelExport";
import { Config, CONFIG } from "../config";
import { PetitionField, UserLocale } from "../db/__types";
import { ContactRepository } from "../db/repositories/ContactRepository";
import { FileRepository } from "../db/repositories/FileRepository";
import { PetitionRepository } from "../db/repositories/PetitionRepository";
import { UserRepository } from "../db/repositories/UserRepository";
import { getAllFieldsWithIndices } from "../util/fieldIndices";
import { applyFieldVisibility, evaluateFieldLogic } from "../util/fieldLogic";
import { isFileTypeField } from "../util/isFileTypeField";
import { sanitizeFilenameWithSuffix } from "../util/sanitizeFilenameWithSuffix";
import { renderTextWithPlaceholders } from "../util/slate/placeholders";
import { random } from "../util/token";
import { UnwrapArray } from "../util/types";
import { HandledTaskRunnerError } from "../workers/helpers/TaskRunner";
import { BACKGROUND_CHECK_SERVICE, BackgroundCheckService } from "./BackgroundCheckService";
import { I18N_SERVICE, II18nService } from "./I18nService";
import { ILogger, LOGGER } from "./Logger";
import { IPrinter, PRINTER } from "./Printer";
import { IStorageService, STORAGE_SERVICE } from "./StorageService";

export const PETITION_FILES_SERVICE = Symbol.for("PETITION_FILES_SERVICE");

type GetPetitionFilesInclude =
  | "PETITION_EXCEL_EXPORT"
  | "PETITION_FILE_FIELD_REPLIES"
  | "PETITION_LATEST_SIGNATURE";

interface GetPetitionFilesOptions {
  locale: UserLocale;
  pattern?: string | null;
  include: GetPetitionFilesInclude[];
  includeEmptyExcel?: boolean;
  maxFileSizeBytes?: number;
}

export type GetPetitionFilesResultMetadata =
  | { type: "PETITION_EXCEL_EXPORT"; petitionId: number }
  | { type: "PETITION_FILE_FIELD_REPLIES"; fieldId: number; replyId: number }
  | {
      type: "PETITION_LATEST_SIGNATURE";
      subtype: "SIGNED_DOCUMENT" | "AUDIT_TRAIL";
      petitionSignatureRequestId: number;
    };

interface GetPetitionFilesResult {
  filename: string;
  getStream: () => Promise<Readable>;
  getDownloadUrl: () => Promise<string>;
  metadata: GetPetitionFilesResultMetadata;
}

@injectable()
export class PetitionFilesService {
  constructor(
    @inject(PetitionRepository) private petitions: PetitionRepository,
    @inject(FileRepository) private files: FileRepository,
    @inject(UserRepository) private users: UserRepository,
    @inject(ContactRepository) private contacts: ContactRepository,
    @inject(BACKGROUND_CHECK_SERVICE) private backgroundCheck: BackgroundCheckService,
    @inject(STORAGE_SERVICE) private storage: IStorageService,
    @inject(PRINTER) private printer: IPrinter,
    @inject(LOGGER) private logger: ILogger,
    @inject(I18N_SERVICE) private i18n: II18nService,
    @inject(CONFIG) private config: Config,
  ) {}

  async getPetitionFiles(petitionId: number, userId: number, options: GetPetitionFilesOptions) {
    const results: GetPetitionFilesResult[] = [];
    this.logger.info(`Exporting files on Petition:${petitionId} ...`);
    this.logger.info(JSON.stringify(options, null, 2));
    const includeXlsx = options.include.includes("PETITION_EXCEL_EXPORT");
    const includeFileReplies = options.include.includes("PETITION_FILE_FIELD_REPLIES");
    const includeSignature = options.include.includes("PETITION_LATEST_SIGNATURE");

    const intl = await this.i18n.getIntl(options.locale);

    const [composedPetition] = await this.petitions.getComposedPetitionFieldsAndVariables([
      petitionId,
    ]);

    // TODO evaluateFieldLogic se ejecuta 2 veces
    const logic = evaluateFieldLogic(composedPetition);
    const visibleFields = applyFieldVisibility(composedPetition);

    const allVisibleReplies = visibleFields
      .flatMap((f) => [
        ...f.replies,
        ...f.replies.flatMap((r) => r.children?.flatMap((c) => c.replies) ?? []),
      ])
      .filter((r) => r.type !== "FIELD_GROUP");

    // get all valid FILE type replies
    const fileReplies = allVisibleReplies.filter(
      (r) =>
        isFileTypeField(r.type) &&
        isNonNullish(r.content.file_upload_id) &&
        isNullish(r.content.error) &&
        r.status !== "REJECTED",
    );

    // get all BACKGROUND_CHECK replies (matched entities and/or search results)
    const backgroundCheckEntityReplies = allVisibleReplies.filter(
      (r) => r.type === "BACKGROUND_CHECK",
    );

    const latestPetitionSignature =
      await this.petitions.loadLatestPetitionSignatureByPetitionId(petitionId);

    // totalFiles may differ in 1 from the actual number of files exported
    // as we do not know at this point if the excel file will be generated or no
    const totalFiles = [
      includeXlsx ? 1 : 0, // excel file is built only of petition contains text replies, background checks, variables and/or field comments
      includeFileReplies ? fileReplies.length + backgroundCheckEntityReplies.length : 0,
      includeSignature && isNonNullish(latestPetitionSignature?.file_upload_id) ? 1 : 0,
      includeSignature && isNonNullish(latestPetitionSignature?.file_upload_audit_trail_id) ? 1 : 0,
    ].reduce((a, b) => a + b, 0);

    this.logger.info(`Found ${totalFiles} files...`);

    if (totalFiles === 0) {
      return [];
    }

    const files = (
      await this.files.loadFileUpload(fileReplies.map((reply) => reply.content["file_upload_id"]))
    ).filter(isNonNullish);

    if (includeFileReplies && isNonNullish(options.maxFileSizeBytes)) {
      // verify that every file does not exceed size limit for export
      const totalSize = sumBy(files, (f) => parseInt(f.size));
      if (totalSize > options.maxFileSizeBytes) {
        throw new HandledTaskRunnerError("MAX_FILE_SIZE_EXCEEDED", {
          size: options.maxFileSizeBytes,
        });
      }
    }

    const filesById = indexBy(files, (f) => f.id);

    const excelWorkbook = new PetitionExcelExport(intl, this.config.misc.parallelUrl, {
      contacts: this.contacts,
      petitions: this.petitions,
      users: this.users,
    });
    await excelWorkbook.init();

    excelWorkbook.addPetitionVariables(logic[0].finalVariables);

    const indices = Object.fromEntries(
      getAllFieldsWithIndices(composedPetition.fields).map(([field, fieldIndex]) => [
        field.id,
        fieldIndex,
      ]),
    );

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

    const processField = async (
      field: UnwrapArray<typeof visibleFields> & {
        group_name?: string | null;
        group_number?: number;
      },
      options: GetPetitionFilesOptions,
    ) => {
      if (field.type === "HEADING" || field.type === "PROFILE_SEARCH") {
        // do nothing
      } else if (field.type === "FIELD_GROUP") {
        for (const groupReply of field.replies) {
          const groupIndex = field.replies.indexOf(groupReply);
          // process every child field on every reply group
          for (const child of groupReply.children ?? []) {
            await processField(
              {
                ...child.field,
                children: [],
                replies: child.replies.map((r) => ({ ...r, children: [] })),
                group_number: groupIndex + 1,
                group_name: field.options.groupName ?? null,
              },
              options,
            );
          }
        }
      } else {
        if (includeFileReplies && isFileTypeField(field.type)) {
          for (const reply of field.replies) {
            const file = filesById[reply.content["file_upload_id"]];
            if (file?.upload_complete) {
              // this.logger.info(`Exporting FileUpload:${file.id}...`);
              const filename = resolveFileName(field, options.pattern, file.filename);

              results.push({
                filename,
                getDownloadUrl: () => {
                  return this.storage.fileUploads.getSignedDownloadEndpoint(
                    file.path,
                    filename,
                    "inline",
                  );
                },
                getStream: () => {
                  return this.storage.fileUploads.downloadFile(file.path);
                },
                metadata: {
                  type: "PETITION_FILE_FIELD_REPLIES",
                  fieldId: field.id,
                  replyId: reply.id,
                },
              });
            }
          }
        }

        if (includeFileReplies && field.type === "BACKGROUND_CHECK") {
          for (const reply of field.replies) {
            if (isNonNullish(reply.content.entity)) {
              // export entity match PDF
              // this.logger.info(`Exporting BackgroundCheck PetitionFieldReply:${reply.id}...`);
              const filename = resolveFileName(
                field,
                options.pattern,
                `${reply.content.entity.type}-${reply.content.entity.id}.pdf`,
              );
              results.push({
                filename,
                getDownloadUrl: async () => {
                  const path = random(16);
                  await this.storage.temporaryFiles.uploadFile(
                    path,
                    "application/pdf",
                    await this.printer.backgroundCheckProfile(userId, reply.content),
                  );
                  return this.storage.temporaryFiles.getSignedDownloadEndpoint(
                    path,
                    filename,
                    "inline",
                  );
                },
                getStream: () => {
                  return this.printer.backgroundCheckProfile(userId, reply.content);
                },
                metadata: {
                  type: "PETITION_FILE_FIELD_REPLIES",
                  fieldId: field.id,
                  replyId: reply.id,
                },
              });
            } else {
              // export search results PDF
              const filename = resolveFileName(
                field,
                options.pattern,
                `${reply.content.query.name}-${intl.formatMessage({
                  id: "petition-excel-export.background-check-results",
                  defaultMessage: "background check search",
                })}.pdf`,
              );

              const content = {
                query: reply.content.query,
                // extend search results with false positives information
                search: this.backgroundCheck.mapBackgroundCheckSearch(reply.content),
              };

              results.push({
                filename,
                getDownloadUrl: async () => {
                  const path = random(16);
                  await this.storage.temporaryFiles.uploadFile(
                    path,
                    "application/pdf",
                    await this.printer.backgroundCheckResults(userId, content),
                  );
                  return this.storage.temporaryFiles.getSignedDownloadEndpoint(
                    path,
                    filename,
                    "inline",
                  );
                },
                getStream: () => {
                  return this.printer.backgroundCheckResults(userId, content);
                },
                metadata: {
                  type: "PETITION_FILE_FIELD_REPLIES",
                  fieldId: field.id,
                  replyId: reply.id,
                },
              });
            }
          }
        }

        if (includeXlsx && !isFileTypeField(field.type)) {
          await excelWorkbook.addPetitionFieldReply(field);
        }
      }
    };

    for (const field of visibleFields) {
      await processField(field, options);
    }

    await excelWorkbook.addPetitionFieldComments(visibleFields);

    if (includeXlsx && (excelWorkbook.hasRows() || options.includeEmptyExcel)) {
      // this.logger.info(`Exporting excel file...`);
      const filename = `${intl.formatMessage({
        id: "petition-excel-export.replies",
        defaultMessage: "Replies",
      })}.xlsx`;

      results.push({
        filename,
        getDownloadUrl: async () => {
          const path = random(16);
          await this.storage.temporaryFiles.uploadFile(
            path,
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            await excelWorkbook.export(options.includeEmptyExcel),
          );
          return this.storage.temporaryFiles.getSignedDownloadEndpoint(path, filename, "inline");
        },
        getStream: () => {
          return excelWorkbook.export(options.includeEmptyExcel);
        },
        metadata: { type: "PETITION_EXCEL_EXPORT", petitionId },
      });
    }

    if (includeSignature && latestPetitionSignature?.status === "COMPLETED") {
      if (isNonNullish(latestPetitionSignature.file_upload_id)) {
        const signedPetition = await this.files.loadFileUpload(
          latestPetitionSignature.file_upload_id,
        );
        if (signedPetition?.upload_complete) {
          // this.logger.info(
          //   `Exporting PetitionSignature:${latestPetitionSignature.id} signed doc...`,
          // );
          results.push({
            filename: signedPetition.filename,
            getDownloadUrl: () => {
              return this.storage.fileUploads.getSignedDownloadEndpoint(
                signedPetition.path,
                signedPetition.filename,
                "inline",
              );
            },
            getStream: () => {
              return this.storage.fileUploads.downloadFile(signedPetition.path);
            },
            metadata: {
              type: "PETITION_LATEST_SIGNATURE",
              subtype: "SIGNED_DOCUMENT",
              petitionSignatureRequestId: latestPetitionSignature.id,
            },
          });
        }
        if (isNonNullish(latestPetitionSignature.file_upload_audit_trail_id)) {
          const auditTrail = await this.files.loadFileUpload(
            latestPetitionSignature.file_upload_audit_trail_id,
          );
          if (auditTrail?.upload_complete) {
            // this.logger.info(
            //   `Exporting PetitionSignature:${latestPetitionSignature.id} audit trail...`,
            // );
            results.push({
              filename: auditTrail.filename,
              getDownloadUrl: () => {
                return this.storage.fileUploads.getSignedDownloadEndpoint(
                  auditTrail.path,
                  auditTrail.filename,
                  "inline",
                );
              },
              getStream: () => {
                return this.storage.fileUploads.downloadFile(auditTrail.path);
              },
              metadata: {
                type: "PETITION_LATEST_SIGNATURE",
                subtype: "AUDIT_TRAIL",
                petitionSignatureRequestId: latestPetitionSignature.id,
              },
            });
          }
        }
      }
    }

    return results;
  }
}
