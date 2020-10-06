import contentDisposition from "content-disposition";
import escapeStringRegexp from "escape-string-regexp";
import { Router } from "express";
import { indexBy } from "remeda";
import sanitize from "sanitize-filename";
import { ApiContext } from "../context";
import { createZipFile, ZipFileInput } from "../util/createZipFile";
import { fromGlobalId } from "../util/globalId";
import { zip } from "../util/remedaExtensions";
import { authenticate } from "./helpers/authenticate";
import { TextRepliesExcel } from "./helpers/TextRepliesExcel";

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
      const pattern = req.query.pattern as string;
      if (typeof pattern !== "string") {
        throw new Error("Missing pattern");
      }
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
  });

const placeholders = [
  "field-number",
  "field-title",
  "contact-first-name",
  "contact-last-name",
  "file-name",
] as const;

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
  const accesses = await ctx.petitions.loadAccess(
    fieldReplies.flat().map((reply) => reply.petition_access_id)
  );
  const accessesById = indexBy(
    accesses.filter((a) => a !== null),
    (a) => a!.id
  );
  const contacts = await ctx.contacts.loadContact(
    accesses.map((a) => a!.contact_id)
  );
  const contactsById = indexBy(
    contacts.filter((c) => c !== null),
    (c) => c!.id
  );

  const textReplies = new TextRepliesExcel(locale);
  const seen = new Set<string>();
  let headingCount = 0;
  for (const [field, replies] of zip(fields, fieldReplies)) {
    if (field.type === "HEADING") {
      headingCount++;
    } else if (field.type === "FILE_UPLOAD") {
      for (const reply of replies) {
        const file = filesById[reply.content["file_upload_id"]];
        const contact =
          contactsById[accessesById[reply.petition_access_id]!.contact_id];
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
              case "contact-first-name":
                return contact?.first_name ?? "";
              case "contact-last-name":
                return contact?.last_name ?? "";
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
            stream: ctx.aws.downloadFile(file.path),
          } as ZipFileInput;
        }
      }
    } else if (field.type === "TEXT") {
      if (replies.length > 0) {
        textReplies.addRows(
          replies.map((r, i) => ({
            title:
              field.title?.concat(field.multiple ? ` [${i + 1}]` : "") || "",
            description: field.description?.slice(0, 200) || "",
            answer: r.content.text,
          }))
        );
      } else {
        textReplies.addRows(
          [
            {
              title: field.title || "",
              description: field.description?.slice(0, 200) || "",
              answer: textReplies.labels.noAnswer,
            },
          ],
          {
            fontColorARGB: "FFA6A6A6",
          }
        );
      }
    }
  }

  if (textReplies.hasRows()) {
    yield await textReplies.export();
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
