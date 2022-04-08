import { spawnSync } from "child_process";
import { createWriteStream } from "fs";
import { stat, writeFile } from "fs/promises";
import { inject, injectable } from "inversify";
import { tmpdir } from "os";
import pMap from "p-map";
import { resolve } from "path";
import { pick, zip } from "remeda";
import { Readable } from "stream";
import { FileRepository } from "../db/repositories/FileRepository";
import { PetitionRepository } from "../db/repositories/PetitionRepository";
import { PetitionField, PetitionFieldReply } from "../db/__types";
import { evaluateFieldVisibility } from "../util/fieldVisibility";
import { random } from "../util/token";
import { AWS_SERVICE, IAws } from "./aws";
import { Printer, PRINTER } from "./printer";

function getFieldTitleByFileUploadId(
  fileUploadId: number,
  replies: PetitionFieldReply[],
  fields: PetitionField[]
) {
  const reply = replies.find((r) => r.content.file_upload_id === fileUploadId);
  if (!reply) return null;
  const field = fields.find((f) => f.id === reply.petition_field_id);
  return field?.title ?? null;
}

function isPrintableContentType(contentType?: string) {
  return (
    contentType !== undefined &&
    ["application/pdf", "image/png", "image/jpeg", "image/gif"].includes(contentType)
  );
}

type PetitionBinderOptions = {
  petitionId: number;
  showSignatureBoxes: boolean;
  documentTitle: string;
  maxOutputSize?: number;
  includeAnnexedDocuments?: boolean;
  outputFileName?: string;
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
    @inject(AWS_SERVICE) private aws: IAws,
    @inject(PRINTER) private printer: Printer
  ) {}

  async createBinder(
    userId: number,
    {
      petitionId,
      documentTitle,
      showSignatureBoxes,
      maxOutputSize,
      includeAnnexedDocuments,
      outputFileName,
    }: PetitionBinderOptions
  ) {
    const [petition, fields] = await Promise.all([
      this.petitions.loadPetition(petitionId),
      this.petitions.loadFieldsForPetition(petitionId),
    ]);

    const printableFiles = includeAnnexedDocuments ? await this.getPrintableFiles(fields) : [];

    const mainDocStream = await this.printer.petitionExport(userId, {
      petitionId,
      documentTitle,
      showSignatureBoxes,
    });

    const annexedDocumentStreams = (
      await pMap(printableFiles, async ({ file, title }, index) => {
        const coverPage = await this.printer.annexCoverPage(
          userId,
          { fieldNumber: index + 1, fieldTitle: title },
          petition?.locale ?? "en"
        );

        if (file.content_type.startsWith("image/")) {
          const filePath = ["image/png", "image/gif"].includes(file.content_type)
            ? await this.flattenImage(file.path, file.content_type)
            : await this.aws.fileUploads.getSignedDownloadEndpoint(
                file.path,
                title ?? `file_${index}`,
                "inline"
              );

          const pdfStream = await this.printer.imageToPdf(userId, {
            imageUrl: filePath,
          });

          return [coverPage, pdfStream];
        } else if (file.content_type === "application/pdf") {
          return [coverPage, await this.aws.fileUploads.downloadFile(file.path)];
        } else {
          throw new Error(`Cannot annex ${file.content_type} to pdf binder`);
        }
      })
    ).flat();

    const tmpDocPaths = await pMap([mainDocStream, ...annexedDocumentStreams], this.writeStream);

    return await this.merge(tmpDocPaths, { maxOutputSize, outputFileName });
  }

  private async merge(paths: string[], opts?: { maxOutputSize?: number; outputFileName?: string }) {
    const DPIValues = [300, 144, 110, 96, 72];
    let iteration = -1;
    let mergedFilePath = null;
    let mergedFileSize = 0;
    do {
      iteration++;
      mergedFilePath = this.mergeFiles(
        paths,
        resolve(tmpdir(), opts?.outputFileName ?? `${random(10)}.pdf`),
        DPIValues[iteration]
      );
      mergedFileSize = (await stat(mergedFilePath)).size;
    } while (
      mergedFileSize > (opts?.maxOutputSize ?? Infinity) &&
      iteration < DPIValues.length - 1
    );

    if (mergedFileSize > (opts?.maxOutputSize ?? Infinity)) {
      throw new Error("MAX_SIZE_EXCEEDED");
    }

    return mergedFilePath;
  }

  private mergeFiles(paths: string[], output: string, dpi: number) {
    const { stderr, status } = spawnSync("gs", [
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
    ]);
    if (status === 0) {
      return output;
    } else {
      throw new Error((stderr || "").toString());
    }
  }

  private async flattenImage(fileS3Path: string, contentType: string) {
    const fileStream = await this.aws.fileUploads.downloadFile(fileS3Path);
    const tmpPath = resolve(tmpdir(), random(10));
    await writeFile(tmpPath, fileStream);

    const output = resolve(tmpdir(), `${random(10)}.png`);
    const { stderr, status } = spawnSync("convert", [
      // for GIF images, we only need the first frame
      contentType === "image/gif" ? `${tmpPath}[0]` : tmpPath,
      "-background",
      "white",
      "-flatten",
      output,
    ]);

    if (status === 0) {
      return output;
    } else {
      throw new Error((stderr || "").toString());
    }
  }

  private async getPrintableFiles(fields: PetitionField[]) {
    const fieldIds = fields.map((f) => f.id);
    const fieldReplies = await this.petitions.loadRepliesForField(fieldIds);
    const repliesByFieldId = Object.fromEntries(
      fieldIds.map((id, index) => [id, fieldReplies[index]])
    );
    const fieldsWithReplies = fields.map((f) => ({ ...f, replies: repliesByFieldId[f.id] }));

    const visibleFieldIds = zip(fieldsWithReplies, evaluateFieldVisibility(fieldsWithReplies))
      .filter(
        ([field, isVisible]) =>
          isVisible && field.type === "FILE_UPLOAD" && !!field.options.attachToPdf
      )
      .map(([field]) => field.id);

    const visibleFileReplies = fieldReplies
      .flat()
      .filter((r) => visibleFieldIds.includes(r.petition_field_id));

    return (
      await this.files.loadFileUpload(visibleFileReplies.map((r) => r.content.file_upload_id))
    )
      .filter((f) => isPrintableContentType(f?.content_type))
      .map((f) => ({
        title: getFieldTitleByFileUploadId(f!.id, visibleFileReplies, fields),
        file: pick(f!, ["path", "content_type"]),
      }));
  }

  private async writeStream(stream: Readable | NodeJS.ReadableStream) {
    return await new Promise<string>((res, rej) => {
      const tmpPath = resolve(tmpdir(), random(10));
      const writeStream = createWriteStream(tmpPath);
      writeStream.on("close", () => res(tmpPath));
      writeStream.on("error", rej);
      stream.pipe(writeStream);
    });
  }
}
