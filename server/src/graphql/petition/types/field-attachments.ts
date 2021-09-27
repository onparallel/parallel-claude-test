import { objectType } from "nexus";

export const PetitionFieldAttachment = objectType({
  name: "PetitionFieldAttachment",
  description: "An attachment on a petition field",
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
