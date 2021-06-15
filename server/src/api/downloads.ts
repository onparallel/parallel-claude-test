import contentDisposition from "content-disposition";
import escapeStringRegexp from "escape-string-regexp";
import { Router } from "express";
import { indexBy, zip } from "remeda";
import sanitize from "sanitize-filename";
import { URLSearchParams } from "url";
import { ApiContext } from "../context";
import { Contact, PetitionFieldComment, User } from "../db/__types";
import { createZipFile, ZipFileInput } from "../util/createZipFile";
import { fullName } from "../util/fullName";
import { fromGlobalId } from "../util/globalId";
import { isDefined } from "../util/remedaExtensions";
import { authenticate } from "./helpers/authenticate";
import { ExcelWorkbookExport } from "./helpers/ExcelWorkbookExport";

/**
 * This code is a bit messy. It needs some cleanup and tests
 */

export const downloads = Router()
  .use(authenticate())
  .get("/petition/:petitionId/files", async (req, res, next) => {
    try {
      const ctx = req.context;
      const user = ctx.user!;
      const { id: petitionId } = fromGlobalId(
        req.params.petitionId,
        "Petition"
      );
      const hasAccess = await ctx.petitions.userHasAccessToPetitions(user.id, [
        petitionId,
      ]);
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
      const zipFile = createZipFile(
        getPetitionFiles(ctx, petitionId, pattern, petition?.locale)
      );
      zipFile.pipe(res);
    } catch (error) {
      next(error);
    }
  })
  .get("/petition/:petitionId/pdf", async (req, res, next) => {
    try {
      const ctx = req.context;
      const user = ctx.user!;
      const { id: petitionId } = fromGlobalId(
        req.params.petitionId,
        "Petition"
      );

      const hasAccess = await ctx.petitions.userHasAccessToPetitions(user.id, [
        petitionId,
      ]);
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
        `http://localhost:3000/${
          petition.locale
        }/print/petition-pdf?${new URLSearchParams({ token })}`,
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
    } catch (error) {
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
  const fieldReplies = await ctx.petitions.loadRepliesForField(
    fields.map((f) => f.id)
  );
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
  const excelWorkbook = new ExcelWorkbookExport(locale);
  const seen = new Set<string>();
  let headingCount = 0;

  for (const [field, replies] of zip(fields, fieldReplies)) {
    if (field.type === "HEADING") {
      headingCount++;
    } else if (field.type === "FILE_UPLOAD") {
      for (const reply of replies) {
        const file = filesById[reply.content["file_upload_id"]];
        if (file) {
          const extension = file.filename.match(/\.[a-z0-9]+$/)?.[0] ?? "";
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
          let filename = sanitize(`${name}${extension}`);
          let counter = 1;
          while (seen.has(filename)) {
            filename = sanitize(`${name} ${++counter}${extension}`);
          }
          seen.add(filename);
          yield {
            filename,
            stream: ctx.aws.fileUploads.downloadFile(file.path),
          } as ZipFileInput;
        }
      }
    } else if (["TEXT", "SHORT_TEXT", "SELECT"].includes(field.type)) {
      if (replies.length > 0) {
        excelWorkbook.textRepliesTab.addRows(
          replies.map((r, i) => ({
            title:
              field.title?.concat(field.multiple ? ` [${i + 1}]` : "") || "",
            description: field.description?.slice(0, 200) || "",
            answer: r.content.text,
          }))
        );
      } else {
        excelWorkbook.textRepliesTab.addEmptyReply(field);
      }
    } else if (field.type === "DYNAMIC_SELECT") {
      if (replies.length > 0) {
        excelWorkbook.textRepliesTab.addRows(
          replies.flatMap((r, i) =>
            (r.content.columns as [string, string | null][]).map(
              ([label, value]) => ({
                title:
                  field.title?.concat(
                    ` (${label})`,
                    field.multiple ? ` [${i + 1}]` : ""
                  ) || "",
                description: field.description?.slice(0, 200) || "",
                answer: value ?? excelWorkbook.textRepliesTab.noAnswerLabel,
              })
            )
          )
        );
      } else {
        excelWorkbook.textRepliesTab.addEmptyReply(field);
      }
    }

    const fieldComments = await ctx.petitions.loadPetitionFieldCommentsForField(
      {
        petitionFieldId: field.id,
        petitionId: field.petition_id,
        loadInternalComments: true,
      }
    );

    for (const comment of fieldComments) {
      const { author, isUnread } = await loadCommentData(comment, ctx);
      excelWorkbook.fieldCommentsTab.addRows({
        authorEmail: author.email,
        authorFullName: fullName(author.first_name, author.last_name),
        content: comment.content,
        createdAt: comment.created_at.toISOString(),
        fieldName: field.title,
        isInternal: boolToLocaleString(comment.is_internal, locale),

        isRead: boolToLocaleString(!isUnread, locale),
      });
    }
  }

  if (excelWorkbook.hasRows()) {
    yield await excelWorkbook.export();
  }

  const latestPetitionSignature =
    await ctx.petitions.loadLatestPetitionSignatureByPetitionId(petitionId);

  if (latestPetitionSignature?.status === "COMPLETED") {
    if (isDefined(latestPetitionSignature.file_upload_id)) {
      const signedPetition = await ctx.files.loadFileUpload(
        latestPetitionSignature.file_upload_id
      );
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
    new RegExp(
      `(#(?:${placeholders.map((p) => escapeStringRegexp(p)).join("|")})#)`,
      "g"
    )
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

async function loadCommentData(
  comment: PetitionFieldComment,
  ctx: ApiContext
): Promise<{ author: User | Contact; isUnread: boolean }> {
  if (comment.user_id) {
    const [author, isUnread] = await Promise.all([
      ctx.users.loadUser(comment.user_id),
      ctx.petitions.getPetitionFieldCommentIsUnreadForUser({
        userId: comment.user_id,
        petitionFieldCommentId: comment.id,
        petitionFieldId: comment.petition_field_id,
        petitionId: comment.petition_id,
      }),
    ]);
    if (!author) {
      throw new Error(`User with id ${comment.user_id} not found`);
    }
    return { author, isUnread };
  }

  if (comment.petition_access_id) {
    const [author, isUnread] = await Promise.all([
      ctx.contacts.loadContactByAccessId(comment.petition_access_id),
      ctx.petitions.getPetitionFieldCommentIsUnreadForContact({
        petitionAccessId: comment.petition_access_id,
        petitionFieldCommentId: comment.id,
        petitionFieldId: comment.petition_field_id,
        petitionId: comment.petition_id,
      }),
    ]);
    if (!author) {
      throw new Error(
        `Contact not found for PetitionAccess with id ${comment.petition_access_id}`
      );
    }
    return { author, isUnread };
  }

  throw new Error(
    `expected user_id or petition_access_id to be defined in PetitionFieldComment with id ${comment.id}`
  );
}

function boolToLocaleString(value: boolean, locale: string) {
  if (value) {
    return locale === "en" ? "Yes" : "Si";
  }
  return locale === "en" ? "No" : "No";
}
