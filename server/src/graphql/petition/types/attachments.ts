import { enumType, objectType } from "nexus";
import { isNonNullish } from "remeda";
import { assert } from "ts-essentials";
import { PetitionAttachmentTypeValues } from "../../../db/__types";
import { mapFieldLogic, PetitionFieldVisibility } from "../../../util/fieldLogic";
import { toGlobalId } from "../../../util/globalId";

export const PetitionFieldAttachment = objectType({
  name: "PetitionFieldAttachment",
  description: "A file attachment on the petition",
  definition(t) {
    t.globalId("id");
    t.implements("CreatedAt");
    t.field("file", {
      type: "FileUpload",
      resolve: async (o, _, ctx) => {
        return (await ctx.files.loadFileUpload(o.file_upload_id))!;
      },
    });
    t.field("field", {
      type: "PetitionField",
      resolve: async (o, _, ctx) => (await ctx.petitions.loadField(o.petition_field_id))!,
    });
  },
});

export const PetitionFieldAttachmentUploadData = objectType({
  name: "PetitionFieldAttachmentUploadData",
  definition(t) {
    t.field("presignedPostData", {
      type: "AWSPresignedPostData",
    });
    t.field("attachment", { type: "PetitionFieldAttachment" });
  },
});

export const PetitionAttachment = objectType({
  name: "PetitionAttachment",
  definition(t) {
    t.globalId("id");
    t.field("type", {
      type: enumType({ name: "PetitionAttachmentType", members: PetitionAttachmentTypeValues }),
    });
    t.field("file", {
      type: "FileUpload",
      resolve: async (o, _, ctx) => {
        return (await ctx.files.loadFileUpload(o.file_upload_id))!;
      },
    });
    t.field("petition", {
      type: "PetitionBase",
      resolve: async (o, _, ctx) => {
        return (await ctx.petitions.loadPetition(o.petition_id))!;
      },
    });
    t.nullable.field("visibility", {
      type: "JSONObject",
      description: "A JSON object representing the conditions for the attachment to be visible",
      resolve: (o) => {
        if (isNonNullish(o.visibility)) {
          // map numeric IDs to GlobalId
          const visibility = o.visibility as PetitionFieldVisibility;
          return (
            mapFieldLogic<number>({ visibility }, (fieldId) => {
              assert(typeof fieldId === "number", "Expected fieldId to be a number");
              return toGlobalId("PetitionField", fieldId);
            }).field.visibility ?? null
          );
        }

        return null;
      },
    });
  },
});

export const PetitionAttachmentUploadData = objectType({
  name: "PetitionAttachmentUploadData",
  definition(t) {
    t.field("presignedPostData", {
      type: "AWSPresignedPostData",
    });
    t.field("attachment", { type: "PetitionAttachment" });
  },
});
