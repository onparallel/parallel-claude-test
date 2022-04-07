import { createWriteStream } from "fs";
import { inject, injectable } from "inversify";
import { tmpdir } from "os";
import pMap from "p-map";
import path from "path";

import { pick, zip } from "remeda";
import { FileRepository } from "../db/repositories/FileRepository";
import { PetitionRepository } from "../db/repositories/PetitionRepository";
import { PetitionField, PetitionFieldReply } from "../db/__types";
import { evaluateFieldVisibility } from "../util/fieldVisibility";
import { random } from "../util/token";
import { AWS_SERVICE, IAws } from "./aws";
import { PdfService, PDF_SERVICE } from "./pdf";
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
    ["application/pdf", "image/png", "image/jpeg"].includes(contentType)
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
    @inject(PRINTER) private printer: Printer,
    @inject(PDF_SERVICE) private pdf: PdfService
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
      this.petitions.loadPetition(petitionId, { refresh: true }),
      this.petitions.loadFieldsForPetition(petitionId, { refresh: true }),
    ]);

    const fieldIds = fields.map((f) => f.id);
    const fieldReplies = await this.petitions.loadRepliesForField(fieldIds, { refresh: true });
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

    const printableFiles = includeAnnexedDocuments
      ? (
          await this.files.loadFileUpload(
            visibleFileReplies.map((r) => r.content.file_upload_id),
            { refresh: true }
          )
        )
          .filter((f) => isPrintableContentType(f?.content_type))
          .map((f) => ({
            title: getFieldTitleByFileUploadId(f!.id, visibleFileReplies, fields),
            file: pick(f!, ["path", "content_type"]),
          }))
      : [];

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
        const pdfStream = file.content_type.startsWith("image/")
          ? await this.printer.imageToPdf(userId, {
              imageUrl: await this.aws.fileUploads.getSignedDownloadEndpoint(
                file.path,
                title ?? `file_${index}`,
                "inline"
              ),
            })
          : file.content_type === "application/pdf"
          ? await this.aws.fileUploads.downloadFile(file.path)
          : null;
        if (!pdfStream) {
          throw new Error(`Unsupported format ${file.content_type}`);
        }
        return [coverPage, pdfStream];
      })
    ).flat();

    const tmpDocPaths = await pMap([mainDocStream, ...annexedDocumentStreams], async (stream) => {
      return new Promise<string>((resolve, reject) => {
        const tmpPath = path.resolve(tmpdir(), random(10));
        const writeStream = createWriteStream(tmpPath);
        writeStream.on("close", () => resolve(tmpPath));
        writeStream.on("error", reject);
        stream.pipe(writeStream);
      });
    });

    return await this.pdf.merge(tmpDocPaths, { maxOutputSize, outputFileName });
  }
}
