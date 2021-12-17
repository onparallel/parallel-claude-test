import { objectType } from "nexus";

export const FileAttachment = objectType({
  name: "FileAttachment",
  description: "A file attachment",
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
  sourceType: /* ts */ `{
    id: number;
    file_upload_id: number;
    created_at: Date;
  }`,
});

export const FileAttachmentUploadData = objectType({
  name: "FileAttachmentUploadData",
  definition(t) {
    t.field("presignedPostData", {
      type: "AWSPresignedPostData",
    });
    t.field("attachment", { type: "FileAttachment" });
  },
});
