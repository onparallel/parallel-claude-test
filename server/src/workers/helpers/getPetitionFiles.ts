import { indexBy, isNonNullish, isNullish } from "remeda";
import { Readable } from "stream";
import { PetitionExcelExport } from "../../api/helpers/PetitionExcelExport";
import { WorkerContext } from "../../context";
import { PetitionField, UserLocale } from "../../db/__types";
import { ZipFileInput } from "../../util/createZipFile";
import { getAllFieldsWithIndices } from "../../util/fieldIndices";
import { applyFieldVisibility, evaluateFieldLogic } from "../../util/fieldLogic";
import { isFileTypeField } from "../../util/isFileTypeField";
import { sanitizeFilenameWithSuffix } from "../../util/sanitizeFilenameWithSuffix";
import { renderTextWithPlaceholders } from "../../util/slate/placeholders";
import { Maybe, UnwrapArray } from "../../util/types";

interface GetPetitionFilesOptions {
  locale: UserLocale;
  pattern?: string;
  xlsxOnly?: boolean;
  onProgress?: (value: number) => Promise<void>;
}

export async function* getPetitionFiles(
  petitionId: number,
  userId: number,
  options: GetPetitionFilesOptions,
  ctx: WorkerContext,
) {
  const [composedPetition] = await ctx.petitions.getComposedPetitionFieldsAndVariables([
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

  const textReplies = allReplies.filter((r) => !isFileTypeField(r.type));

  const files = await ctx.files.loadFileUpload(
    fileReplies.map((reply) => reply.content["file_upload_id"]),
  );
  const filesById = indexBy(files.filter(isNonNullish), (f) => f.id);

  const latestPetitionSignature =
    await ctx.petitions.loadLatestPetitionSignatureByPetitionId(petitionId);

  const totalFiles = options.xlsxOnly
    ? 1
    : Math.max(
        (textReplies.length > 0 ? 1 : 0) + // text replies excel
          fileReplies.length +
          backgroundCheckEntityReplies.length + // each reply is 1 pdf file
          Number(isNonNullish(latestPetitionSignature?.file_upload_id)) +
          Number(isNonNullish(latestPetitionSignature?.file_upload_audit_trail_id)),
        1,
      );
  let processedFiles = 0;

  const excelWorkbook = new PetitionExcelExport(options.locale, ctx);
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
  ): AsyncGenerator<ZipFileInput> {
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
          );
        }
      }
    } else if (isFileTypeField(field.type) && !options.xlsxOnly) {
      for (const reply of field.replies) {
        const file = filesById[reply.content["file_upload_id"]];
        if (file?.upload_complete) {
          yield {
            filename: resolveFileName(field, options.pattern, file.filename),
            stream: await ctx.storage.fileUploads.downloadFile(file.path),
          } as ZipFileInput;
          await options.onProgress?.(++processedFiles / totalFiles);
        }
      }
    } else if (field.type === "BACKGROUND_CHECK") {
      // on BACKGROUND_CHECK fields, export the PDF if reply has set "entity"
      if (!options.xlsxOnly) {
        for (const reply of field.replies.filter((r) => isNonNullish(r.content.entity))) {
          yield {
            filename: resolveFileName(
              field,
              options.pattern,
              `${reply.content.entity.type}-${reply.content.entity.id}.pdf`,
            ),
            stream: Readable.from(await ctx.printer.backgroundCheckProfile(userId, reply.content)),
          } as ZipFileInput;
          await options.onProgress?.(++processedFiles / totalFiles);
        }
      }
      // also, add the reply (entity or search) to the excel file
      excelWorkbook.addPetitionFieldReply(field);
    } else if (!isFileTypeField(field.type)) {
      excelWorkbook.addPetitionFieldReply(field);
    }
  }

  excelWorkbook.addPetitionVariables(logic[0].finalVariables);

  for (const field of visibleFields) {
    yield* processField(field, options);
  }

  await excelWorkbook.addPetitionFieldComments(visibleFields);

  if (excelWorkbook.hasRows()) {
    yield await excelWorkbook.export();
  }

  if (latestPetitionSignature?.status === "COMPLETED" && !options.xlsxOnly) {
    if (isNonNullish(latestPetitionSignature.file_upload_id)) {
      const signedPetition = await ctx.files.loadFileUpload(latestPetitionSignature.file_upload_id);
      if (signedPetition?.upload_complete) {
        yield {
          filename: signedPetition.filename,
          stream: await ctx.storage.fileUploads.downloadFile(signedPetition.path),
        };
        await options.onProgress?.(++processedFiles / totalFiles);
      }
    }
    if (isNonNullish(latestPetitionSignature.file_upload_audit_trail_id)) {
      const auditTrail = await ctx.files.loadFileUpload(
        latestPetitionSignature.file_upload_audit_trail_id,
      );
      if (auditTrail?.upload_complete) {
        yield {
          filename: auditTrail.filename,
          stream: await ctx.storage.fileUploads.downloadFile(auditTrail.path),
        };
        await options.onProgress?.(++processedFiles / totalFiles);
      }
    }
  }
}
