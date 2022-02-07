import escapeStringRegexp from "escape-string-regexp";
import { indexBy, isDefined, zip } from "remeda";
import { PetitionExcelExport } from "../../api/helpers/PetitionExcelExport";
import { createZipFile, ZipFileInput } from "../../util/createZipFile";
import { evaluateFieldVisibility } from "../../util/fieldVisibility";
import { sanitizeFilenameWithSuffix } from "../../util/sanitizeFilenameWithSuffix";
import { random } from "../../util/token";
import { TaskRunner } from "../helpers/TaskRunner";

const placeholders = ["field-number", "field-title", "file-name"] as const;

export class ExportRepliesRunner extends TaskRunner<"EXPORT_REPLIES"> {
  async run() {
    const { petition_id: petitionId, pattern } = this.task.input;

    const hasAccess = await this.ctx.petitions.userHasAccessToPetitions(this.task.user_id, [
      petitionId,
    ]);
    if (!hasAccess) {
      throw new Error(`User ${this.task.user_id} has no access to petition ${petitionId}`);
    }
    const petition = (await this.ctx.petitions.loadPetition(petitionId))!;
    const name = petition.name?.replace(/\./g, "_") ?? "files";

    const zipFile = createZipFile(
      this.getPetitionFiles(petitionId, pattern ?? "#file-name#", petition.locale)
    );

    const path = random(16);
    const res = await this.ctx.aws.temporaryFiles.uploadFile(path, "application/zip", zipFile);
    const tmpFile = await this.ctx.files.createTemporaryFile(
      {
        path,
        content_type: "application/zip",
        filename: sanitizeFilenameWithSuffix(name, ".zip"),
        size: res["ContentLength"]!.toString(),
      },
      `TaskWorker:${this.task.id}`
    );

    return { temporary_file_id: tmpFile.id };
  }
  private previousProgress = 0;
  private async notifyProgress(value: number) {
    const currentProgress = value * 100;
    // Avoid updating progress too many times.
    if (currentProgress > this.previousProgress + 10) {
      await this.onProgress(currentProgress);
      this.previousProgress = currentProgress;
    }
  }

  private async *getPetitionFiles(petitionId: number, pattern: string, locale: string) {
    const fields = await this.ctx.petitions.loadFieldsForPetition(petitionId);
    const fieldIds = fields.map((f) => f.id);
    const fieldReplies = await this.ctx.petitions.loadRepliesForField(fieldIds);
    const repliesByFieldId = Object.fromEntries(
      fieldIds.map((id, index) => [id, fieldReplies[index]])
    );
    const fieldsWithReplies = fields.map((f) => ({
      ...f,
      replies: repliesByFieldId[f.id],
    }));

    const visibleFields = zip(fieldsWithReplies, evaluateFieldVisibility(fieldsWithReplies))
      .filter(([, isVisible]) => isVisible)
      .map(([field]) => field);

    const files = await this.ctx.files.loadFileUpload(
      fieldReplies
        .flat()
        .filter((r) => r.type === "FILE_UPLOAD")
        .map((reply) => reply.content["file_upload_id"])
    );
    const filesById = indexBy(
      files.filter((f) => f !== null),
      (f) => f!.id
    );

    const latestPetitionSignature =
      await this.ctx.petitions.loadLatestPetitionSignatureByPetitionId(petitionId);

    const totalFiles = Math.max(
      Number(fieldReplies.flat().some((r) => r.type !== "HEADING" && r.type !== "FILE_UPLOAD")) +
        files.length +
        Number(isDefined(latestPetitionSignature?.file_upload_id)) +
        Number(isDefined(latestPetitionSignature?.file_upload_audit_trail_id)),
      1
    );
    let processedFiles = 0;

    const excelWorkbook = new PetitionExcelExport(locale, this.ctx);
    const seen = new Set<string>();
    let headingCount = 0;

    for (const field of visibleFields) {
      if (field.type === "HEADING") {
        headingCount++;
      } else if (field.type === "FILE_UPLOAD") {
        for (const reply of field.replies) {
          const file = filesById[reply.content["file_upload_id"]];
          if (file?.upload_complete) {
            const extension = file.filename.match(/\.[a-z0-9]+$/i)?.[0] ?? "";
            const name = rename(pattern, placeholders, (placeholder) => {
              switch (placeholder) {
                case "field-number":
                  return `${field.position + 1 - headingCount}`;
                case "field-title":
                  return field.title ?? "";
                case "file-name":
                  // remove file extension since it's added back later
                  return file.filename.replace(/\.[a-z0-9]+$/, "");
              }
            });
            let filename = sanitizeFilenameWithSuffix(name, extension.toLowerCase());
            let counter = 1;
            while (seen.has(filename)) {
              filename = sanitizeFilenameWithSuffix(
                name,
                ` ${counter++}${extension.toLowerCase()}`
              );
            }
            seen.add(filename);
            yield {
              filename,
              stream: this.ctx.aws.fileUploads.downloadFile(file.path),
            } as ZipFileInput;
            await this.notifyProgress(++processedFiles / totalFiles);
          }
        }
      } else if (
        ["TEXT", "SHORT_TEXT", "SELECT", "DYNAMIC_SELECT", "CHECKBOX", "NUMBER"].includes(
          field.type
        )
      ) {
        excelWorkbook.addPetitionFieldReply(field, field.replies);
      }

      await excelWorkbook.addPetitionFieldComments(field);
    }

    if (excelWorkbook.hasRows()) {
      yield await excelWorkbook.export();
      await this.notifyProgress(++processedFiles / totalFiles);
    }

    if (latestPetitionSignature?.status === "COMPLETED") {
      if (isDefined(latestPetitionSignature.file_upload_id)) {
        const signedPetition = await this.ctx.files.loadFileUpload(
          latestPetitionSignature.file_upload_id
        );
        if (signedPetition?.upload_complete) {
          yield {
            filename: signedPetition.filename,
            stream: this.ctx.aws.fileUploads.downloadFile(signedPetition.path),
          };
          await this.notifyProgress(++processedFiles / totalFiles);
        }
      }
      if (isDefined(latestPetitionSignature.file_upload_audit_trail_id)) {
        const auditTrail = await this.ctx.files.loadFileUpload(
          latestPetitionSignature.file_upload_audit_trail_id
        );
        if (auditTrail?.upload_complete) {
          yield {
            filename: auditTrail.filename,
            stream: this.ctx.aws.fileUploads.downloadFile(auditTrail.path),
          };
          await this.notifyProgress(++processedFiles / totalFiles);
        }
      }
    }
  }
}

function rename<T extends string>(
  pattern: string,
  placeholders: readonly T[],
  replacer: (value: T) => string
) {
  const parts = pattern.split(
    new RegExp(`(#(?:${placeholders.map((p) => escapeStringRegexp(p)).join("|")})#)`, "g")
  );
  return parts
    .map((part) => {
      if (part.startsWith("#") && part.endsWith("#")) {
        const value = part.slice(1, -1);
        if (placeholders.includes(value as any)) {
          return replacer(value as T);
        }
      }
      return part;
    })
    .join("");
}
