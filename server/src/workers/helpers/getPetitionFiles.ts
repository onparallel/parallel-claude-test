import escapeStringRegexp from "escape-string-regexp";
import { indexBy, isDefined, zip } from "remeda";
import { PetitionExcelExport } from "../../api/helpers/PetitionExcelExport";
import { WorkerContext } from "../../context";
import { ZipFileInput } from "../../util/createZipFile";
import { evaluateFieldVisibility } from "../../util/fieldVisibility";
import { isFileTypeField } from "../../util/isFileTypeField";
import { sanitizeFilenameWithSuffix } from "../../util/sanitizeFilenameWithSuffix";

const placeholders = ["field-number", "field-title", "file-name"] as const;

export async function* getPetitionFiles(
  petitionId: number,
  options: {
    locale: string;
    pattern?: string;
    xlsxOnly?: boolean;
    onProgress?: (value: number) => Promise<void>;
  },
  ctx: WorkerContext
) {
  const fields = await ctx.petitions.loadFieldsForPetition(petitionId);
  const fieldIds = fields.map((f) => f.id);
  const fieldReplies = await ctx.petitions.loadRepliesForField(fieldIds);
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

  const fileReplies = fieldReplies.flat().filter((r) => isFileTypeField(r.type));

  const files = await ctx.files.loadFileUpload(
    fileReplies.map((reply) => reply.content["file_upload_id"])
  );
  const filesById = indexBy(
    files.filter((f) => f !== null),
    (f) => f!.id
  );

  const latestPetitionSignature = await ctx.petitions.loadLatestPetitionSignatureByPetitionId(
    petitionId
  );

  const totalFiles = options.xlsxOnly
    ? 1
    : Math.max(
        Math.min(
          visibleFields.filter((f) => f.type !== "HEADING" && !isFileTypeField(f.type)).length,
          1
        ) +
          fileReplies.length +
          Number(isDefined(latestPetitionSignature?.file_upload_id)) +
          Number(isDefined(latestPetitionSignature?.file_upload_audit_trail_id)),
        1
      );
  let processedFiles = 0;

  const excelWorkbook = new PetitionExcelExport(options.locale, ctx);
  await excelWorkbook.init();
  const seen = new Set<string>();
  let headingCount = 0;

  for (const field of visibleFields) {
    if (field.type === "HEADING") {
      headingCount++;
    } else if (isFileTypeField(field.type) && !options.xlsxOnly) {
      for (const reply of field.replies) {
        const file = filesById[reply.content["file_upload_id"]];
        if (file?.upload_complete) {
          const extension = file.filename.match(/\.[a-z0-9]+$/i)?.[0] ?? "";
          const name = rename(options.pattern ?? "#file-name#", placeholders, (placeholder) => {
            switch (placeholder) {
              case "field-number":
                return `${field.position! + 1 - headingCount}`;
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
            filename = sanitizeFilenameWithSuffix(name, ` ${counter++}${extension.toLowerCase()}`);
          }
          seen.add(filename);
          yield {
            filename,
            stream: await ctx.aws.fileUploads.downloadFile(file.path),
          } as ZipFileInput;
          await options.onProgress?.(++processedFiles / totalFiles);
        }
      }
    } else if (!isFileTypeField(field.type)) {
      excelWorkbook.addPetitionFieldReply(field, field.replies);
    }

    await excelWorkbook.addPetitionFieldComments(field);
  }

  if (excelWorkbook.hasRows()) {
    yield await excelWorkbook.export();
    await options.onProgress?.(++processedFiles / totalFiles);
  }

  if (latestPetitionSignature?.status === "COMPLETED" && !options.xlsxOnly) {
    if (isDefined(latestPetitionSignature.file_upload_id)) {
      const signedPetition = await ctx.files.loadFileUpload(latestPetitionSignature.file_upload_id);
      if (signedPetition?.upload_complete) {
        yield {
          filename: signedPetition.filename,
          stream: await ctx.aws.fileUploads.downloadFile(signedPetition.path),
        };
        await options.onProgress?.(++processedFiles / totalFiles);
      }
    }
    if (isDefined(latestPetitionSignature.file_upload_audit_trail_id)) {
      const auditTrail = await ctx.files.loadFileUpload(
        latestPetitionSignature.file_upload_audit_trail_id
      );
      if (auditTrail?.upload_complete) {
        yield {
          filename: auditTrail.filename,
          stream: await ctx.aws.fileUploads.downloadFile(auditTrail.path),
        };
        await options.onProgress?.(++processedFiles / totalFiles);
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
