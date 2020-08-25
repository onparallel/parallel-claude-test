import {
  idArg,
  inputObjectType,
  mutationField,
  objectType,
  stringArg,
} from "@nexus/schema";
import { prop } from "remeda";
import { random } from "../../util/token";
import { and, chain } from "../helpers/authorize";
import { WhitelistedError } from "../helpers/errors";
import { RESULT } from "../helpers/result";
import {
  commentsBelongsToAccess,
  fetchPetitionAccess,
  fieldBelongsToAccess,
  fieldHasType,
  replyBelongsToAccess,
} from "./authorizers";
import { notEmptyArray } from "../helpers/validators/notEmptyArray";
import { globalIdArg } from "../helpers/globalIdPlugin";
import { userIsCommentAuthor } from "../petition/mutations/authorizers";

export const publicDeletePetitionReply = mutationField(
  "publicDeletePetitionReply",
  {
    description: "Deletes a reply to a petition field.",
    type: "Result",
    authorize: chain(
      fetchPetitionAccess("keycode"),
      replyBelongsToAccess("replyId")
    ),
    args: {
      replyId: globalIdArg("PetitionFieldReply", { required: true }),
      keycode: idArg({ required: true }),
    },
    resolve: async (_, args, ctx) => {
      const reply = (await ctx.petitions.loadFieldReply(args.replyId))!;
      if (reply.status === "APPROVED") {
        throw new WhitelistedError(
          "Can't delete an approved reply",
          "INVALID_REPLY_STATUS"
        );
      }
      if (reply.type === "FILE_UPLOAD") {
        const file = await ctx.files.loadFileUpload(
          reply.content["file_upload_id"]
        );
        await Promise.all([
          ctx.files.deleteFileUpload(file!.id, ctx.contact!),
          ctx.aws.deleteFile(file!.path),
        ]);
      }
      await ctx.petitions.deletePetitionFieldReply(args.replyId, ctx.contact!);
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
      replyId: globalIdArg("PetitionFieldReply", { required: true }),
    },
    authorize: chain(
      fetchPetitionAccess("keycode"),
      replyBelongsToAccess("replyId")
    ),
    resolve: async (_, args, ctx) => {
      const reply = await ctx.petitions.loadFieldReply(args.replyId);
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
      fieldId: globalIdArg("PetitionField", { required: true }),
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
      fetchPetitionAccess("keycode"),
      fieldBelongsToAccess("fieldId"),
      fieldHasType("fieldId", "FILE_UPLOAD")
    ),
    resolve: async (_, args, ctx) => {
      const key = random(16);
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
            petition_field_id: args.fieldId,
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
    fieldId: globalIdArg("PetitionField", { required: true }),
    data: inputObjectType({
      name: "CreateTextReplyInput",
      definition(t) {
        t.string("text", { required: true });
      },
    }).asArg({ required: true }),
  },
  authorize: chain(
    fetchPetitionAccess("keycode"),
    fieldBelongsToAccess("fieldId"),
    fieldHasType("fieldId", "TEXT")
  ),
  resolve: async (_, args, ctx) => {
    const reply = await ctx.petitions.createPetitionFieldReply(
      {
        petition_field_id: args.fieldId,
        petition_access_id: ctx.access!.id,
        type: "TEXT",
        content: { text: args.data.text },
      },
      ctx.contact!
    );
    return reply;
  },
});

export const publicCompletePetition = mutationField("publicCompletePetition", {
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
    await ctx.emails.sendPetitionCompletedEmail(ctx.access!.id);
    return petition;
  },
});

export const publicCreatePetitionFieldComment = mutationField(
  "publicCreatePetitionFieldComment",
  {
    description: "Create a petition field comment.",
    type: "PublicPetitionFieldComment",
    authorize: chain(
      fetchPetitionAccess("keycode"),
      fieldBelongsToAccess("petitionFieldId")
    ),
    args: {
      keycode: idArg({ required: true }),
      petitionFieldId: globalIdArg("PetitionField", { required: true }),
      content: stringArg({ required: true }),
    },
    resolve: async (_, args, ctx) => {
      return await ctx.petitions.createPetitionFieldCommentFromAccess(
        {
          petitionId: ctx.access!.petition_id,
          petitionFieldId: args.petitionFieldId,
          petitionFieldReplyId: null,
          content: args.content,
        },
        ctx.access!
      );
    },
  }
);

export const publicDeletePetitionFieldComment = mutationField(
  "publicDeletePetitionFieldComment",
  {
    description: "Delete a petition field comment.",
    type: "Result",
    authorize: chain(
      fetchPetitionAccess("keycode"),
      and(
        fieldBelongsToAccess("petitionFieldId"),
        commentsBelongsToAccess("petitionFieldCommentId")
      )
    ),
    args: {
      keycode: idArg({ required: true }),
      petitionFieldId: globalIdArg("PetitionField", { required: true }),
      petitionFieldCommentId: globalIdArg("PetitionFieldComment", {
        required: true,
      }),
    },
    resolve: async (_, args, ctx) => {
      await ctx.petitions.deletePetitionFieldCommentFromAccess(
        ctx.access!.petition_id,
        args.petitionFieldId,
        args.petitionFieldCommentId,
        ctx.access!
      );
      return RESULT.SUCCESS;
    },
  }
);

export const publicUpdatePetitionFieldComment = mutationField(
  "publicUpdatePetitionFieldComment",
  {
    description: "Update a petition field comment.",
    type: "PublicPetitionFieldComment",
    authorize: chain(
      fetchPetitionAccess("keycode"),
      and(
        fieldBelongsToAccess("petitionFieldId"),
        commentsBelongsToAccess("petitionFieldCommentId"),
        userIsCommentAuthor("petitionFieldCommentId")
      )
    ),
    args: {
      keycode: idArg({ required: true }),
      petitionFieldId: globalIdArg("PetitionField", { required: true }),
      petitionFieldCommentId: globalIdArg("PetitionFieldComment", {
        required: true,
      }),
      content: stringArg({ required: true }),
    },
    resolve: async (_, args, ctx) => {
      return await ctx.petitions.updatePetitionFieldCommentFromContact(
        args.petitionFieldCommentId,
        args.content,
        ctx.contact!
      );
    },
  }
);

export const publicSubmitUnpublishedComments = mutationField(
  "publicSubmitUnpublishedComments",
  {
    description: "Submits all unpublished comments.",
    type: "PublicPetitionFieldComment",
    list: [true],
    authorize: chain(fetchPetitionAccess("keycode")),
    args: {
      keycode: idArg({ required: true }),
    },
    resolve: async (_, args, ctx) => {
      const {
        comments,
        users,
      } = await ctx.petitions.publishPetitionFieldCommentsForAccess(
        ctx.access!.petition_id,
        ctx.access!
      );
      await ctx.emails.sendPetitionCommentsUserNotificationEmail(
        ctx.access!.petition_id,
        ctx.access!.id,
        users.map(prop("id")),
        comments.map(prop("id"))
      );
      return comments;
    },
  }
);

export const publicMarkPetitionFieldCommentsAsRead = mutationField(
  "publicMarkPetitionFieldCommentsAsRead",
  {
    description: "Marks the specified comments as read.",
    type: "PublicPetitionFieldComment",
    list: [true],
    authorize: chain(
      fetchPetitionAccess("keycode"),
      commentsBelongsToAccess("petitionFieldCommentIds")
    ),
    args: {
      keycode: idArg({ required: true }),
      petitionFieldCommentIds: globalIdArg("PetitionFieldComment", {
        required: true,
        list: [true],
      }),
    },
    validateArgs: notEmptyArray(
      prop("petitionFieldCommentIds"),
      "petitionFieldCommentIds"
    ),
    resolve: async (_, args, ctx) => {
      return await ctx.petitions.markPetitionFieldCommentsAsReadForAccess(
        args.petitionFieldCommentIds,
        ctx.access!.id
      );
    },
  }
);
