import { createReadStream, PathLike } from "fs";
import { mkdir, rm, stat, writeFile } from "fs/promises";
import { inject, injectable } from "inversify";
import { tmpdir } from "os";
import pMap from "p-map";
import { resolve } from "path";
import { isNonNullish, isNullish } from "remeda";
import sanitizeFilename from "sanitize-filename";
import {
  FileUpload,
  OrganizationTheme,
  PetitionAttachmentType,
  PetitionAttachmentTypeValues,
} from "../db/__types";
import { FeatureFlagRepository } from "../db/repositories/FeatureFlagRepository";
import { FileRepository } from "../db/repositories/FileRepository";
import { OrganizationRepository } from "../db/repositories/OrganizationRepository";
import { PetitionRepository } from "../db/repositories/PetitionRepository";
import { applyFieldVisibility } from "../util/fieldLogic";
import { isFileTypeField } from "../util/isFileTypeField";
import { removePasswordFromPdf } from "../util/pdf";
import { pFlatMap } from "../util/promises/pFlatMap";
import { retry } from "../util/retry";
import { spawn as _spawn, ChildProcessNonSuccessError } from "../util/spawn";
import { random } from "../util/token";
import { MaybePromise } from "../util/types";
import { ENCRYPTION_SERVICE, IEncryptionService } from "./EncryptionService";
import { ILogger, LOGGER } from "./Logger";
import { IPrinter, PRINTER } from "./Printer";
import { IStorageService, STORAGE_SERVICE } from "./StorageService";

interface PetitionBinderOptions {
  petitionId: number;
  documentTitle: string | null;
  maxOutputSize?: number;
  outputFileName?: string;
  showSignatureBoxes?: boolean;
  includeAnnexedDocuments?: boolean;
  includeNetDocumentsLinks?: boolean;
  customDocumentTemporaryFileId?: number;
}

export interface IPetitionBinder {
  createBinder(userId: number, options: PetitionBinderOptions): Promise<string>;
}

export const PETITION_BINDER = Symbol.for("PETITION_BINDER");

@injectable()
export class PetitionBinder implements IPetitionBinder {
  constructor(
    @inject(PetitionRepository) private petitions: PetitionRepository,
    @inject(FileRepository) private files: FileRepository,
    @inject(OrganizationRepository) private organizations: OrganizationRepository,
    @inject(FeatureFlagRepository) private featureFlags: FeatureFlagRepository,
    @inject(ENCRYPTION_SERVICE) private encryption: IEncryptionService,
    @inject(STORAGE_SERVICE) private storage: IStorageService,
    @inject(PRINTER) private printer: IPrinter,
    @inject(LOGGER) private logger: ILogger,
  ) {}

  private temporaryDirectory = "";
  private petitionId = 0;

  private info(message: string) {
    this.logger.info(`[PetitionBinder:${this.petitionId}] - ${message}`);
  }

  private async spawn(...args: Parameters<typeof _spawn>) {
    this.info(`Spawn: ${args[0]} ${args[1].join(" ")}`);
    await _spawn(...args);
  }

  async createBinder(
    userId: number,
    {
      petitionId,
      documentTitle,
      showSignatureBoxes,
      maxOutputSize,
      outputFileName,
      includeAnnexedDocuments,
      includeNetDocumentsLinks,
      customDocumentTemporaryFileId,
    }: PetitionBinderOptions,
  ) {
    try {
      this.petitionId = petitionId;
      this.info("Creating binder");
      // first of all, create temporary directory to store all tmp files and delete it when finished
      this.temporaryDirectory = await this.buildTmpDir();

      this.info(`Temporary directory created at ${this.temporaryDirectory}`);

      const [petition, fieldsWithFiles, attachments] = await Promise.all([
        this.petitions.loadPetition(petitionId, { refresh: true }), // refresh to get the correct petition.locale in case it has been recently updated
        this.getPrintableFiles(petitionId),
        this.petitions.loadPetitionAttachmentsByPetitionId(petitionId),
      ]);

      if (!petition) {
        throw new Error(`Petition:${petitionId} not found`);
      }

      const documentTheme = await this.organizations.loadOrganizationTheme(
        petition.document_organization_theme_id,
      );

      if (documentTheme?.type !== "PDF_DOCUMENT") {
        throw new Error(`Expected theme of type PDF_DOCUMENT on Petition:${petition.id}`);
      }

      const mainDocs: { path: string; filename?: string }[] = [];

      const userHasExportV2 = await this.featureFlags.userHasFeatureFlag(userId, "PDF_EXPORT_V2");

      if (isNullish(customDocumentTemporaryFileId)) {
        const petitionExport = await this.printer.petitionExport(userId, {
          petitionId,
          documentTitle,
          showSignatureBoxes,
          includeNetDocumentsLinks,
          locale: petition.recipient_locale,
          useExportV2: userHasExportV2,
        });

        mainDocs.push({
          path: await this.writeTemporaryFile(petitionExport.stream, "pdf"),
        });
      } else {
        const customFile = await this.files.loadTemporaryFile(customDocumentTemporaryFileId);
        mainDocs.push({
          path: await this.writeTemporaryFile(
            await this.storage.temporaryFiles.downloadFile(customFile!.path),
            "pdf",
          ),
        });
        if (showSignatureBoxes) {
          const signatureBoxesPage = await this.printer.signatureBoxesPage(userId, {
            petitionId,
            locale: petition.recipient_locale,
            useExportV2: userHasExportV2,
          });
          mainDocs.push({
            path: await this.writeTemporaryFile(signatureBoxesPage.stream, "pdf"),
          });
        }
      }

      this.info(`Main document created at ${mainDocs[0].path}`);

      const annexedDocumentPaths = includeAnnexedDocuments
        ? await pFlatMap(
            fieldsWithFiles,
            async ([field, files], fieldIndex) => {
              const coverPagePath = await this.writeTemporaryFile(
                this.printer.annexCoverPage(
                  userId,
                  {
                    fieldNumber: fieldIndex + 1,
                    fieldTitle: field.title,
                    theme: documentTheme.data,
                  },
                  petition?.recipient_locale ?? "en",
                ),
                "pdf",
              );

              const filePaths = await this.downloadFileUpload(files, userId, documentTheme);

              return [{ path: coverPagePath }, ...filePaths];
            },
            { concurrency: 2 },
          )
        : [];

      this.info(
        `${annexedDocumentPaths.length} annexed documents created: ${JSON.stringify(annexedDocumentPaths)}`,
      );

      const attachmentPaths = Object.fromEntries(
        await pMap(
          PetitionAttachmentTypeValues,
          async (type) => [
            type,
            await this.downloadFileUpload(
              (
                await this.files.loadFileUpload(
                  attachments.filter((a) => a.type === type).map((a) => a.file_upload_id),
                )
              ).filter(isNonNullish),
              userId,
              documentTheme,
            ),
          ],
          { concurrency: 5 },
        ),
      ) as Record<PetitionAttachmentType, { path: string; filename?: string }[]>;

      this.info(`Attachment documents created: ${JSON.stringify(attachmentPaths)}`);

      return await this.merge(
        [
          ...attachmentPaths.FRONT,
          ...mainDocs,
          ...attachmentPaths.ANNEX,
          ...annexedDocumentPaths,
          ...attachmentPaths.BACK,
        ],
        {
          maxOutputSize,
          outputFileName: outputFileName ? sanitizeFilename(outputFileName) : undefined,
          onReplaceDamagedFile: async (fileName) => {
            const { stream } = await this.printer.damagedFilePage(
              { fileName, theme: documentTheme.data },
              petition?.recipient_locale ?? "en",
            );
            return await this.writeTemporaryFile(stream, "pdf");
          },
        },
      );
    } finally {
      try {
        await rm(this.temporaryDirectory, { recursive: true });
      } catch {}
    }
  }

  private async merge(
    files: { path: string; filename?: string }[],
    opts: {
      maxOutputSize?: number;
      outputFileName?: string;
      onReplaceDamagedFile?: (filename: string) => Promise<string>;
    },
  ) {
    this.info(`Merging ${files.length} files. opts: ${JSON.stringify(opts)}`);
    const DPIValues = [144, 110, 96, 72];
    let resultFilePath = resolve(this.temporaryDirectory, `${random(10)}.pdf`);

    await this.mergeFiles(files, resultFilePath, opts.onReplaceDamagedFile);

    this.info(`Merged file created at ${resultFilePath}`);

    let iteration = 0;
    let mergedFileSize = await this.getFileSize(resultFilePath);

    this.info(`Merged file size: ${mergedFileSize}`);

    while (mergedFileSize > (opts?.maxOutputSize ?? Infinity) && DPIValues[iteration]) {
      this.info(`Compressing file with DPI: ${DPIValues[iteration]}`);
      resultFilePath = await this.compressFile(resultFilePath, DPIValues[iteration++]);
      mergedFileSize = await this.getFileSize(resultFilePath);
      this.info(`Merged file size: ${mergedFileSize}`);
    }

    if (mergedFileSize > (opts?.maxOutputSize ?? Infinity)) {
      throw new Error("MAX_SIZE_EXCEEDED");
    }

    // don't use temporaryDirectory here, as we dont want to delete the final result after the binder completed
    const path = resolve(tmpdir(), random(10));
    await mkdir(path, { recursive: true });
    const output = resolve(path, `${opts?.outputFileName ?? random(10)}.pdf`);
    this.info(`Stripping metadata from file: ${resultFilePath}`);
    await this.stripMetadata(resultFilePath, output);
    this.info(`Final file created at ${output}`);
    return output;
  }

  private async getFileSize(path: PathLike) {
    return (await stat(path)).size;
  }

  private async compressFile(path: string, dpi: number) {
    // gs can't overwrite input with output, so we create a random output path on temporary directory
    const output = resolve(this.temporaryDirectory, `${random(10)}.pdf`);
    await this.spawn(
      "gs",
      [
        "-dNOPAUSE",
        "-dBATCH",
        "-sDEVICE=pdfwrite",
        "-dCompatibilityLevel=1.5",
        "-dPDFSETTINGS=/screen",
        "-dQUIET",
        "-dSubsetFonts=true",
        "-dCompressFonts=true",
        "-dEmbedAllFonts=true",
        "-dColorImageDownsampleType=/Bicubic",
        `-dColorImageResolution=${dpi}`,
        "-dGrayImageDownsampleType=/Bicubic",
        `-dGrayImageResolution=${dpi}`,
        "-dMonoImageDownsampleType=/Bicubic",
        `-dMonoImageResolution=${dpi}`,
        `-sOutputFile=${output}`,
        path,
      ],
      { timeout: 120_000, stdio: "inherit" },
    );

    return output;
  }

  private async stripMetadata(path: string, output: string) {
    await this.spawn("exiftool", ["-all=", "-overwrite_original", path], {
      timeout: 120_000,
      stdio: "inherit",
    });
    try {
      await this.spawn("qpdf", ["--linearize", path, output], {
        timeout: 120_000,
        stdio: "inherit",
      });
    } catch (e) {
      if (e instanceof ChildProcessNonSuccessError && e.exitCode === 3) {
        this.info("qpdf exited with warnings");
        return;
      } else {
        throw e;
      }
    }
  }

  private async mergeFiles(
    files: { path: string; filename?: string }[],
    output: string,
    onReplaceDamagedFile?: (filename: string) => Promise<string>,
  ) {
    let filePaths = files.map((f) => f.path);

    await retry(
      async () => {
        try {
          if (filePaths.length > 0) {
            await this.spawn("qpdf", ["--empty", "--pages", ...filePaths, "--", output], {
              timeout: 120_000,
              stdio: "pipe",
            });
          }
        } catch (e) {
          if (e instanceof ChildProcessNonSuccessError && e.exitCode === 3) {
            this.info("qpdf exited with warnings");
            return;
          }

          if (e instanceof ChildProcessNonSuccessError) {
            const damagedFilePaths = e.data.stderr
              .split("\n")
              .map((l) => {
                const match = l.match(/^WARNING: (.*): file is damaged$/);
                if (match) {
                  return match[1];
                } else {
                  return null;
                }
              })
              .filter(isNonNullish);
            if (damagedFilePaths.length > 0) {
              this.info(`Found ${damagedFilePaths.length} damaged files. Attempting to repair...`);
              filePaths = (
                await pMap(
                  filePaths,
                  async (path) => {
                    if (damagedFilePaths.includes(path)) {
                      const repairedPath = await this.repairDocument(path);
                      if (repairedPath === null) {
                        this.info(`Failed to repair document ${path}, will ignore it...`);
                        const file = files.find((f) => f.path === path);
                        return onReplaceDamagedFile
                          ? await onReplaceDamagedFile(file?.filename ?? "")
                          : null;
                      }
                      return repairedPath;
                    } else {
                      return path;
                    }
                  },
                  { concurrency: 1 },
                )
              ).filter(isNonNullish);
            }
          }

          throw e;
        }
      },
      { maxRetries: 20 },
    );
  }

  private async repairDocument(filePath: string) {
    const output = resolve(this.temporaryDirectory, `${random(10)}.pdf`);
    try {
      await this.spawn(
        "gs",
        ["-o", output, "-sDEVICE=pdfwrite", "-dPDFSETTINGS=/default", filePath],
        {
          timeout: 120_000,
          stdio: "inherit",
        },
      );
      return output;
    } catch (error) {
      this.info(`Error repairing document: ${error}`);
      return null;
    }
  }

  private async convertImage(fileS3Path: string, contentType: string) {
    const outputFormat = ["image/png", "image/gif"].includes(contentType) ? "png" : "jpeg";
    const tmpPath = await this.writeTemporaryFile(
      await this.storage.fileUploads.downloadFile(fileS3Path),
      outputFormat,
    );

    const output = resolve(this.temporaryDirectory, `${random(10)}.${outputFormat}`);
    await this.spawn(
      "convert",
      [
        // for GIF images, we only need the first frame
        contentType === "image/gif" ? `${tmpPath}[0]` : tmpPath,
        "-resize",
        "2000x2000>", // ">" means only shrink larger images
        "-background",
        "white",
        "-flatten",
        output,
      ],
      { timeout: 120_000, stdio: "inherit" },
    );
    return output;
  }

  private async getPrintableFiles(petitionId: number) {
    const [composedPetition] = await this.petitions.getComposedPetitionFieldsAndVariables([
      petitionId,
    ]);
    const fileTypeFields = applyFieldVisibility(composedPetition)
      .flatMap((f) => [f, ...(f.children ?? [])])
      .filter((f) => isFileTypeField(f.type) && !!f.options.attachToPdf);

    const fileUploadIds = fileTypeFields
      .flatMap((field) =>
        field.replies.filter(
          (r) =>
            isNullish(r.content.error) &&
            isNonNullish(r.content.file_upload_id) &&
            r.status !== "REJECTED",
        ),
      )
      .map((r) => r.content.file_upload_id);

    const files = await this.files.loadFileUpload(fileUploadIds);

    return fileTypeFields.flatMap(({ replies, ...field }) => {
      const fileUploadIds: number[] = replies
        .filter((r) => isNullish(r.content.error) && isNonNullish(r.content.file_upload_id))
        .map((r) => r.content.file_upload_id);

      if (fileUploadIds.length === 0) {
        return [];
      }

      const printable = files
        .filter(isNonNullish)
        .filter(
          (file) =>
            fileUploadIds.includes(file.id) &&
            file.upload_complete &&
            this.isPrintableContentType(file.content_type),
        );

      return printable.length > 0 ? [[field, printable] as const] : [];
    });
  }

  private async downloadFileUpload(files: FileUpload[], userId: number, theme: OrganizationTheme) {
    return (
      await pMap(
        files,
        async (file) => {
          const fileHasSize = file.size !== "0";
          if (fileHasSize && file.content_type.startsWith("image/")) {
            const imageUrl = await this.convertImage(file.path, file.content_type);
            return {
              filename: file.filename,
              path: await this.writeTemporaryFile(
                this.printer.imageToPdf(userId, { imageUrl, theme: theme.data }),
                "pdf",
              ),
            };
          } else if (fileHasSize && file.content_type === "application/pdf") {
            let readable = await this.storage.fileUploads.downloadFile(file.path);
            if (file.password) {
              const decryptedFilePath = await removePasswordFromPdf(
                readable,
                this.encryption.decrypt(Buffer.from(file.password, "hex"), "utf8"),
              );
              readable = createReadStream(decryptedFilePath);
            }
            return {
              filename: file.filename,
              path: await this.writeTemporaryFile(readable, "pdf"),
            };
          } else {
            this.logger.warn(
              `Cannot annex ${file.content_type} FileUpload:${file.id} to pdf binder. Skipping...`,
            );
            return null;
          }
        },
        { concurrency: 1 },
      )
    ).filter(isNonNullish);
  }

  private async writeTemporaryFile(stream: MaybePromise<NodeJS.ReadableStream>, extension: string) {
    const path = resolve(this.temporaryDirectory, `${random(10)}.${extension}`);
    await writeFile(path, await stream);
    return path;
  }

  private async buildTmpDir() {
    const path = resolve(tmpdir(), random(10));
    await mkdir(path, { recursive: true });
    return path;
  }

  private isPrintableContentType(contentType: string) {
    return ["application/pdf", "image/png", "image/jpeg", "image/gif"].includes(contentType);
  }
}
