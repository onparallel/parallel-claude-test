import escapeStringRegexp from "escape-string-regexp";
import { indexBy, isDefined, zip } from "remeda";
import { PetitionExcelExport } from "../../api/helpers/PetitionExcelExport";
import { WorkerContext } from "../../context";
import { Task } from "../../db/repositories/TaskRepository";
import { createZipFile, ZipFileInput } from "../../util/createZipFile";
import { evaluateFieldVisibility } from "../../util/fieldVisibility";
import { sanitizeFilenameWithSuffix } from "../../util/sanitizeFilenameWithSuffix";
import { random } from "../../util/token";
import { TaskUpdateHandler } from "../task-worker";

const placeholders = ["field-number", "field-title", "file-name"] as const;

async function* getPetitionFiles(
  ctx: WorkerContext,
  petitionId: number,
  pattern: string,
  locale = "en"
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

  const files = await ctx.files.loadFileUpload(
    fieldReplies
      .flat()
      .filter((r) => r.type === "FILE_UPLOAD")
      .map((reply) => reply.content["file_upload_id"])
  );
  const filesById = indexBy(
    files.filter((f) => f !== null),
    (f) => f!.id
  );
  const excelWorkbook = new PetitionExcelExport(locale, ctx);
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
            filename = sanitizeFilenameWithSuffix(name, ` ${counter++}${extension.toLowerCase()}`);
          }
          seen.add(filename);
          yield {
            filename,
            stream: ctx.aws.fileUploads.downloadFile(file.path),
          } as ZipFileInput;
        }
      }
    } else if (
      ["TEXT", "SHORT_TEXT", "SELECT", "DYNAMIC_SELECT", "CHECKBOX"].includes(field.type)
    ) {
      excelWorkbook.addPetitionFieldReply(field, field.replies);
    }

    await excelWorkbook.addPetitionFieldComments(field);
  }

  if (excelWorkbook.hasRows()) {
    yield await excelWorkbook.export();
  }

  const latestPetitionSignature = await ctx.petitions.loadLatestPetitionSignatureByPetitionId(
    petitionId
  );

  if (latestPetitionSignature?.status === "COMPLETED") {
    if (isDefined(latestPetitionSignature.file_upload_id)) {
      const signedPetition = await ctx.files.loadFileUpload(latestPetitionSignature.file_upload_id);
      if (signedPetition?.upload_complete) {
        yield {
          filename: signedPetition.filename,
          stream: ctx.aws.fileUploads.downloadFile(signedPetition.path),
        };
      }
    }
    if (isDefined(latestPetitionSignature.file_upload_audit_trail_id)) {
      const auditTrail = await ctx.files.loadFileUpload(
        latestPetitionSignature.file_upload_audit_trail_id
      );
      if (auditTrail?.upload_complete) {
        yield {
          filename: auditTrail.filename,
          stream: ctx.aws.fileUploads.downloadFile(auditTrail.path),
        };
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

export async function runExportRepliesTask(
  task: Task<"EXPORT_REPLIES">,
  ctx: WorkerContext,
  onUpdate: TaskUpdateHandler<"EXPORT_REPLIES">
) {
  try {
    const { petitionId, pattern } = task.input;

    const hasAccess = await ctx.petitions.userHasAccessToPetitions(task.user_id, [petitionId]);
    if (!hasAccess) {
      return;
    }
    const petition = (await ctx.petitions.loadPetition(petitionId))!;
    const name = petition.name?.replace(/\./g, "_") ?? "files";

    onUpdate(25);

    const zipFile = createZipFile(
      getPetitionFiles(ctx, petitionId, pattern ?? "#file-name#", petition?.locale)
    );

    onUpdate(75);

    const path = random(16);
    const res = await ctx.aws.temporaryFiles.uploadFile(path, "application/zip", zipFile);
    const tmpFile = await ctx.files.createTemporaryFile(
      {
        path,
        content_type: "application/zip",
        filename: sanitizeFilenameWithSuffix(name, ".zip"),
        size: res["ContentLength"]!.toString(),
      },
      `TaskWorker:${task.id}`
    );

    const url = await ctx.aws.temporaryFiles.getSignedDownloadEndpoint(
      tmpFile.path,
      tmpFile.filename,
      "attachment"
    );

    onUpdate(100, undefined, { url });
  } catch (error: any) {
    onUpdate(null, { message: error.message });
  }
}
