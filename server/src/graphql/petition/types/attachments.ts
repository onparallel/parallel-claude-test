import { objectType } from "nexus";

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
    t.implements("CreatedAt");
    t.field("file", {
      type: "FileUpload",
      resolve: async (o, _, ctx) => {
        return (await ctx.files.loadFileUpload(o.file_upload_id))!;
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
