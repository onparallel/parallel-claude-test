import {
  idArg,
  inputObjectType,
  mutationField,
  objectType,
} from "@nexus/schema";
import { fromGlobalId } from "../../util/globalId";
import { random } from "../../util/token";
import { chain, and } from "../helpers/authorize";
import { RESULT } from "../helpers/result";
import {
  fetchPetitionAccess,
  fieldBelongsToAccess,
  fieldHastype,
  replyBelongsToAccess,
} from "./authorizers";

export const publicDeletePetitionReply = mutationField(
  "publicDeletePetitionReply",
  {
    description: "Deletes a reply to a petition field.",
    type: "Result",
    authorize: and(
      fetchPetitionAccess("keycode"),
      replyBelongsToAccess("replyId", "keycode")
    ),
    args: {
      replyId: idArg({ required: true }),
      keycode: idArg({ required: true }),
    },
    resolve: async (_, args, ctx) => {
      const { id: replyId } = fromGlobalId(args.replyId, "PetitionFieldReply");
      const reply = (await ctx.petitions.loadFieldReply(replyId))!;
      if (reply.type === "FILE_UPLOAD") {
        const file = await ctx.files.loadFileUpload(
          reply.content["file_upload_id"]
        );
        await Promise.all([
          ctx.files.deleteFileUpload(file!.id, ctx.contact!),
          ctx.aws.deleteFile(file!.path),
        ]);
      }
      await ctx.petitions.deletePetitionFieldReply(replyId, ctx.contact!);
      return RESULT.SUCCESS;
    },
  }
);

export const publicFileUploadReplyComplete = mutationField(
  "publicFileUploadReplyComplete",
  {
    description: "Notifies the backend that the upload is complete.",
    type: "PublicPetitionFieldReply",
    args: {
      keycode: idArg({ required: true }),
      replyId: idArg({ required: true }),
    },
    authorize: and(
      fetchPetitionAccess("keycode"),
      replyBelongsToAccess("replyId", "keycode")
    ),
    resolve: async (_, args, ctx) => {
      const { id: replyId } = fromGlobalId(args.replyId, "PetitionFieldReply");
      const reply = await ctx.petitions.loadFieldReply(replyId);
      if (reply?.type !== "FILE_UPLOAD") {
        throw new Error("Invalid");
      }
      const file = await ctx.files.loadFileUpload(
        reply.content["file_upload_id"]
      );
      // Try to get metadata
      await ctx.aws.getFileMetadata(file!.path);
      await ctx.files.markFileUploadComplete(file!.id);
      return reply;
    },
  }
);

export const publicCreateFileUploadReply = mutationField(
  "publicCreateFileUploadReply",
  {
    description: "Creates a reply to a file upload field.",
    type: objectType({
      name: "CreateFileUploadReply",
      definition(t) {
        t.string("endpoint", {
          description: "Endpoint where to upload the file.",
        });
        t.field("reply", { type: "PublicPetitionFieldReply" });
      },
    }),
    args: {
      keycode: idArg({ required: true }),
      fieldId: idArg({ required: true }),
      data: inputObjectType({
        name: "CreateFileUploadReplyInput",
        definition(t) {
          t.string("filename", { required: true });
          t.int("size", { required: true });
          t.string("contentType", { required: true });
        },
      }).asArg({ required: true }),
    },
    authorize: chain(
      and(
        fetchPetitionAccess("keycode"),
        fieldBelongsToAccess("fieldId", "keycode")
      ),
      fieldHastype("fieldId", "FILE_UPLOAD")
    ),
    resolve: async (_, args, ctx) => {
      const key = random(16);
      const { id: fieldId } = fromGlobalId(args.fieldId, "PetitionField");
      const { filename, size, contentType } = args.data;
      const file = await ctx.files.createFileUpload(
        {
          path: key,
          filename,
          size,
          content_type: contentType,
        },
        ctx.contact!
      );
      const [endpoint, reply] = await Promise.all([
        ctx.aws.getSignedUploadEndpoint(key, contentType),
        ctx.petitions.createPetitionFieldReply(
          {
            petition_field_id: fieldId,
            petition_access_id: ctx.access!.id,
            type: "FILE_UPLOAD",
            content: { file_upload_id: file.id },
          },
          ctx.contact!
        ),
      ]);
      return { endpoint, reply };
    },
  }
);

export const publicCreateTextReply = mutationField("publicCreateTextReply", {
  description: "Creates a reply to a text field.",
  type: "PublicPetitionFieldReply",
  args: {
    keycode: idArg({ required: true }),
    fieldId: idArg({ required: true }),
    data: inputObjectType({
      name: "CreateTextReplyInput",
      definition(t) {
        t.string("text", { required: true });
      },
    }).asArg({ required: true }),
  },
  authorize: chain(
    and(
      fetchPetitionAccess("keycode"),
      fieldBelongsToAccess("fieldId", "keycode")
    ),
    fieldHastype("fieldId", "TEXT")
  ),
  resolve: async (_, args, ctx) => {
    const { id: fieldId } = fromGlobalId(args.fieldId, "PetitionField");
    const reply = await ctx.petitions.createPetitionFieldReply(
      {
        petition_field_id: fieldId,
        petition_access_id: ctx.access!.id,
        type: "TEXT",
        content: { text: args.data.text },
      },
      ctx.contact!
    );
    return reply;
  },
});

export const completePetition = mutationField("publicCompletePetition", {
  description: "Marks a filled petition as ready for review.",
  type: "PublicPetition",
  args: {
    keycode: idArg({ required: true }),
  },
  authorize: fetchPetitionAccess("keycode"),
  resolve: async (_, args, ctx) => {
    const petition = await ctx.petitions.completePetition(
      ctx.access!.petition_id,
      ctx.access!.id
    );
    await ctx.aws.enqueuePetitionCompleted(ctx.access!.id);
    return petition;
  },
});
