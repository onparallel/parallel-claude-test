import contentDisposition from "content-disposition";
import escapeStringRegexp from "escape-string-regexp";
import { Router } from "express";
import { indexBy, isDefined, zip } from "remeda";
import sanitize from "sanitize-filename";
import { URLSearchParams } from "url";
import { ApiContext } from "../context";
import { createZipFile, ZipFileInput } from "../util/createZipFile";
import { evaluateFieldVisibility } from "../util/fieldVisibility";
import { fromGlobalId } from "../util/globalId";
import { authenticate } from "./helpers/authenticate";
import { PetitionExcelExport } from "./helpers/PetitionExcelExport";

/**
 * This code is a bit messy. It needs some cleanup and tests
 */

export const downloads = Router()
  .use(authenticate())
  .get("/petition/:petitionId/files", async (req, res, next) => {
    try {
      const ctx = req.context;
      const user = ctx.user!;
      const { id: petitionId } = fromGlobalId(req.params.petitionId, "Petition");
      const hasAccess = await ctx.petitions.userHasAccessToPetitions(user.id, [petitionId]);
      if (!hasAccess) {
        throw new Error("No access");
      }
      const pattern = (req.query.pattern as string) ?? "#file-name#";
      const petition = await ctx.petitions.loadPetition(petitionId);

      const name = petition?.name?.replace(/\./g, "_") ?? "files";
      res.header(
        "content-disposition",
        contentDisposition(sanitize(`${name}.zip`), { type: "attachment" })
      );
      const zipFile = createZipFile(getPetitionFiles(ctx, petitionId, pattern, petition?.locale));
      zipFile.pipe(res);
    } catch (error: any) {
      next(error);
    }
  })
  .get("/petition/:petitionId/pdf", async (req, res, next) => {
    try {
      const ctx = req.context;
      const user = ctx.user!;
      const { id: petitionId } = fromGlobalId(req.params.petitionId, "Petition");

      const hasAccess = await ctx.petitions.userHasAccessToPetitions(user.id, [petitionId]);
      if (!hasAccess) {
        throw new Error("No access");
      }

      const hasFeatureFlag = await ctx.featureFlags.userHasFeatureFlag(
        user.id,
        "PETITION_PDF_EXPORT"
      );
      if (!hasFeatureFlag) {
        throw new Error("FORBIDDEN");
      }

      const petition = await ctx.petitions.loadPetition(petitionId);
      if (!petition) {
        throw new Error(`Petition with id ${petitionId} not found`);
      }

      const token = ctx.security.generateAuthToken({
        petitionId,
      });

      const buffer = await ctx.printer.pdf(
        `http://localhost:3000/${petition.locale}/print/petition-pdf?${new URLSearchParams({
          token,
        })}`,
        {
          height: "297mm",
          width: "210mm",
          margin: {
            top: "10mm",
            bottom: "10mm",
            left: "10mm",
            right: "10mm",
          },
        }
      );

      res
        .header(
          "content-disposition",
          contentDisposition(sanitize(`${petition.name}.pdf`), {
            type: "inline",
          })
        )
        .header("content-type", "application/pdf")
        .send(buffer)
        .end();
    } catch (error: any) {
      next(error);
    }
  });

const placeholders = ["field-number", "field-title", "file-name"] as const;

async function* getPetitionFiles(
  ctx: ApiContext,
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
        if (file) {
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
          let filename = sanitize(`${name}${extension.toLowerCase()}`);
          let counter = 1;
          while (seen.has(filename)) {
            filename = sanitize(`${name} ${++counter}${extension.toLowerCase()}`);
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
      if (signedPetition) {
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
      if (auditTrail) {
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
