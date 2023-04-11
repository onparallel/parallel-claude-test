import { PathLike } from "fs";
import { mkdir, rm, stat, writeFile } from "fs/promises";
import { inject, injectable } from "inversify";
import { tmpdir } from "os";
import pMap from "p-map";
import { resolve } from "path";
import { isDefined, zip } from "remeda";
import sanitizeFilename from "sanitize-filename";
import { FileRepository } from "../db/repositories/FileRepository";
import { OrganizationRepository } from "../db/repositories/OrganizationRepository";
import { PetitionRepository } from "../db/repositories/PetitionRepository";
import {
  FileUpload,
  OrganizationTheme,
  PetitionAttachmentType,
  PetitionAttachmentTypeValues,
} from "../db/__types";
import { evaluateFieldVisibility } from "../util/fieldVisibility";
import { isFileTypeField } from "../util/isFileTypeField";
import { pFlatMap } from "../util/promises/pFlatMap";
import { ChildProcessNonSuccessError, spawn } from "../util/spawn";
import { random } from "../util/token";
import { MaybePromise } from "../util/types";
import { ILogger, LOGGER } from "./Logger";
import { IPrinter, PRINTER } from "./Printer";
import { IStorageService, STORAGE_SERVICE } from "./StorageService";

function isPrintableContentType(contentType: string) {
  return [
    "application/pdf",
    "image/png",
    "image/jpeg",
    "image/gif",
    "image/heic",
    "image/tiff",
    "image/webp",
  ].includes(contentType);
}

type PetitionBinderOptions = {
  petitionId: number;
  documentTitle: string | null;
  maxOutputSize?: number;
  outputFileName?: string;
  showSignatureBoxes?: boolean;
  includeAnnexedDocuments?: boolean;
  includeNetDocumentsLinks?: boolean;
};

export interface IPetitionBinder {
  createBinder(petitionId: number, options: PetitionBinderOptions): Promise<string>;
}

export const PETITION_BINDER = Symbol.for("PETITION_BINDER");

@injectable()
export class PetitionBinder implements IPetitionBinder {
  constructor(
    @inject(PetitionRepository) private petitions: PetitionRepository,
    @inject(FileRepository) private files: FileRepository,
    @inject(OrganizationRepository) private organizations: OrganizationRepository,
    @inject(STORAGE_SERVICE) private storage: IStorageService,
    @inject(PRINTER) private printer: IPrinter,
    @inject(LOGGER) private logger: ILogger
  ) {}

  private temporaryDirectory = "";
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
    }: PetitionBinderOptions
  ) {
    try {
      // first of all, create temporary directory to store all tmp files and delete it when finished
      this.temporaryDirectory = await this.buildTmpDir();

      const [petition, fieldsWithFiles, attachments] = await Promise.all([
        this.petitions.loadPetition(petitionId),
        this.getPrintableFiles(petitionId),
        this.petitions.loadPetitionAttachmentsByPetitionId(petitionId),
      ]);

      if (!petition) {
        throw new Error(`Petition:${petitionId} not found`);
      }

      const documentTheme = await this.organizations.loadOrganizationTheme(
        petition.document_organization_theme_id
      );

      if (documentTheme?.type !== "PDF_DOCUMENT") {
        throw new Error(`Expected theme of type PDF_DOCUMENT on Petition:${petition.id}`);
      }

      const mainDocPath = await this.writeTemporaryFile(
        this.printer.petitionExport(userId, {
          petitionId,
          documentTitle,
          showSignatureBoxes,
          includeNetDocumentsLinks,
        })
      );

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
                  petition?.recipient_locale ?? "en"
                )
              );

              const filePaths = await this.downloadFileUpload(files, userId, documentTheme);
              return [coverPagePath, ...filePaths];
            },
            { concurrency: 2 }
          )
        : [];

      const attachmentPaths = Object.fromEntries(
        await pMap(PetitionAttachmentTypeValues, async (type) => [
          type,
          await this.downloadFileUpload(
            (
              await this.files.loadFileUpload(
                attachments.filter((a) => a.type === type).map((a) => a.file_upload_id)
              )
            ).filter(isDefined),
            userId,
            documentTheme
          ),
        ])
      ) as Record<PetitionAttachmentType, string[]>;

      return await this.merge(
        [
          ...attachmentPaths.FRONT,
          mainDocPath,
          ...attachmentPaths.ANNEX,
          ...annexedDocumentPaths,
          ...attachmentPaths.BACK,
        ],
        {
          maxOutputSize,
          outputFileName: outputFileName ? sanitizeFilename(outputFileName) : undefined,
        }
      );
    } finally {
      try {
        await rm(this.temporaryDirectory, { recursive: true });
      } catch {}
    }
  }

  private async merge(paths: string[], opts?: { maxOutputSize?: number; outputFileName?: string }) {
    const DPIValues = [144, 110, 96, 72];
    let iteration = -1;
    let mergedFileSize = 0;
    const file = resolve(this.temporaryDirectory, `${random(10)}.pdf`);
    do {
      iteration++;
      await this.mergeFiles(paths, file, DPIValues[iteration]);
      mergedFileSize = await this.getFileSize(file);
    } while (
      mergedFileSize > (opts?.maxOutputSize ?? Infinity) &&
      iteration < DPIValues.length - 1
    );

    if (mergedFileSize > (opts?.maxOutputSize ?? Infinity)) {
      throw new Error("MAX_SIZE_EXCEEDED");
    }

    // don't use temporaryDirectory here, as we dont want to delete the final result after the binder completed
    const path = resolve(tmpdir(), random(10));
    await mkdir(path, { recursive: true });
    const output = resolve(path, `${opts?.outputFileName ?? random(10)}.pdf`);
    await this.stripMetadata(file, output);
    return output;
  }

  private async getFileSize(path: PathLike) {
    return (await stat(path)).size;
  }

  private async mergeFiles(paths: string[], output: string, dpi: number) {
    await spawn(
      "gs",
      [
        "-sDEVICE=pdfwrite",
        "-dBATCH",
        "-dPDFSETTINGS=/screen",
        "-dNOPAUSE",
        "-dQUIET",
        "-dCompatibilityLevel=1.5",
        "-dSubsetFonts=true",
        "-dCompressFonts=true",
        "-dEmbedAllFonts=true",
        "-sProcessColorModel=DeviceRGB",
        "-sColorConversionStrategy=RGB",
        "-sColorConversionStrategyForImages=RGB",
        "-dConvertCMYKImagesToRGB=true",
        "-dDetectDuplicateImages=true",
        "-dColorImageDownsampleType=/Bicubic",
        "-dGrayImageDownsampleType=/Bicubic",
        "-dMonoImageDownsampleType=/Bicubic",
        "-dDownsampleColorImages=true",
        "-dDoThumbnails=false",
        "-dCreateJobTicket=false",
        "-dPreserveEPSInfo=false",
        "-dPreserveOPIComments=false",
        "-dPreserveOverprintSettings=false",
        "-dUCRandBGInfo=/Remove",
        `-dColorImageResolution=${dpi}`,
        `-dGrayImageResolution=${dpi}`,
        `-dMonoImageResolution=${dpi}`,
        `-sOutputFile=${output}`,
        ...paths,
      ],
      { timeout: 60_000, stdio: "inherit" }
    );
  }

  private async stripMetadata(path: string, output: string) {
    await spawn("exiftool", ["-all=", "-overwrite_original", path], {
      timeout: 60_000,
      stdio: "inherit",
    });
    try {
      await spawn("qpdf", ["--linearize", path, output], { timeout: 60_000, stdio: "inherit" });
    } catch (e) {
      if (e instanceof ChildProcessNonSuccessError && e.exitCode === 3) {
        // it's just warnings
        return;
      } else {
        throw e;
      }
    }
  }

  private async convertImage(fileS3Path: string, contentType: string) {
    const tmpPath = await this.writeTemporaryFile(
      await this.storage.fileUploads.downloadFile(fileS3Path)
    );

    const outputFormat = ["image/png", "image/gif"].includes(contentType) ? "png" : "jpeg";
    const output = resolve(this.temporaryDirectory, `${random(10)}.${outputFormat}`);
    await spawn(
      "convert",
      [
        // for GIF images, we only need the first frame
        contentType === "image/gif" ? `${tmpPath}[0]` : tmpPath,
        "-background",
        "white",
        "-flatten",
        output,
      ],
      { timeout: 60_000, stdio: "inherit" }
    );
    return output;
  }

  private async getPrintableFiles(petitionId: number) {
    const fields = await this.petitions.loadFieldsForPetition(petitionId);
    const replies = await this.petitions.loadRepliesForField(fields.map((f) => f.id));
    const fieldsWithReplies = zip(fields, replies).map(([field, replies]) => ({
      ...field,
      replies,
    }));

    const visibleFieldWithReplies = zip(
      fieldsWithReplies,
      evaluateFieldVisibility(fieldsWithReplies)
    )
      .filter(
        ([field, isVisible]) =>
          isVisible && isFileTypeField(field.type) && !!field.options.attachToPdf
      )
      .map(([field]) => field);

    return pFlatMap(visibleFieldWithReplies, async ({ replies, ...field }) => {
      const files = await this.files.loadFileUpload(replies.map((r) => r.content.file_upload_id));
      const printable = files
        .filter(isDefined)
        .filter((f) => f.upload_complete && isPrintableContentType(f.content_type));
      return printable.length > 0 ? [[field, printable] as const] : [];
    });
  }

  private async downloadFileUpload(files: FileUpload[], userId: number, theme: OrganizationTheme) {
    return (
      await pMap(
        files,
        async (file) => {
          if (file.content_type.startsWith("image/")) {
            // jpeg can be used directly, other types need processing
            const imageUrl =
              file.content_type === "image/jpeg"
                ? await this.storage.fileUploads.getSignedDownloadEndpoint(
                    file.path,
                    file.filename,
                    "inline"
                  )
                : await this.convertImage(file.path, file.content_type);

            return await this.writeTemporaryFile(
              this.printer.imageToPdf(userId, { imageUrl, theme: theme.data })
            );
          } else if (file.content_type === "application/pdf") {
            return await this.writeTemporaryFile(
              await this.storage.fileUploads.downloadFile(file.path)
            );
          } else {
            this.logger.warn(
              `Cannot annex ${file.content_type} FileUpload:${file.id} to pdf binder. Skipping...`
            );
            return null;
          }
        },
        { concurrency: 1 }
      )
    ).filter(isDefined);
  }

  private async writeTemporaryFile(stream: MaybePromise<NodeJS.ReadableStream>) {
    const path = resolve(this.temporaryDirectory, random(10));
    await writeFile(path, await stream);
    return path;
  }

  private async buildTmpDir() {
    const path = resolve(tmpdir(), random(10));
    await mkdir(path, { recursive: true });
    return path;
  }
}
