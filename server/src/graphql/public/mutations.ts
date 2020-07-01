import {
  idArg,
  inputObjectType,
  mutationField,
  objectType,
  stringArg,
} from "@nexus/schema";
import { fromGlobalId, fromGlobalIds } from "../../util/globalId";
import { random } from "../../util/token";
import { chain, and, authenticate, ifArgDefined } from "../helpers/authorize";
import { RESULT } from "../helpers/result";
import {
  fetchPetitionAccess,
  fieldBelongsToAccess,
  fieldHastype,
  replyBelongsToAccess,
} from "./authorizers";
import {
  userHasAccessToPetition,
  fieldBelongsToPetition,
  replyBelongsToPetition,
  commentsBelongsToPetition,
} from "../petition/authorizers";

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
    await ctx.aws.enqueuePetitionCompleted(ctx.access!.id);
    return petition;
  },
});

export const publicCreatePetitionFieldComment = mutationField(
  "publicCreatePetitionFieldComment",
  {
    description: "Create a petition field comment.",
    type: "PublicPetitionFieldComment",
    authorize: chain(
      authenticate(),
      and(
        userHasAccessToPetition("petitionId"),
        fieldBelongsToPetition("petitionId", "petitionFieldId"),
        ifArgDefined(
          "petitionFieldReplyId",
          replyBelongsToPetition("petitionId", "petitionFieldReplyId" as any)
        )
      )
    ),
    args: {
      petitionId: idArg({ required: true }),
      petitionFieldId: idArg({ required: true }),
      petitionFieldReplyId: idArg(),
      content: stringArg({ required: true }),
    },
    resolve: async (_, args, ctx) => {
      const petitionId = fromGlobalId(args.petitionId, "Petition").id;
      const petitionFieldId = fromGlobalId(
        args.petitionFieldId,
        "PetitionField"
      ).id;
      const petitionFieldReplyId = args.petitionFieldReplyId
        ? fromGlobalId(args.petitionFieldReplyId, "PetitionFieldReply").id
        : null;
      return await ctx.petitions.createPetitionFieldCommentFromContact(
        {
          petitionId,
          petitionFieldId,
          petitionFieldReplyId,
          content: args.content,
        },
        ctx.contact!
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
      authenticate(),
      and(
        userHasAccessToPetition("petitionId"),
        fieldBelongsToPetition("petitionId", "petitionFieldId"),
        commentsBelongsToPetition("petitionId", "petitionFieldCommentId")
      )
    ),
    args: {
      petitionId: idArg({ required: true }),
      petitionFieldId: idArg({ required: true }),
      petitionFieldCommentId: idArg({ required: true }),
    },
    resolve: async (_, args, ctx) => {
      const petitionFieldCommentId = fromGlobalId(
        args.petitionFieldCommentId,
        "PetitionFieldComment"
      ).id;
      await ctx.petitions.deletePetitionFieldComment(
        petitionFieldCommentId,
        ctx.user!
      );
      return RESULT.SUCCESS;
    },
  }
);

export const publicUpdatePetitionFieldComment = mutationField(
  "publicUpdatePetitionFieldComment",
  {
    description: "Update a petition field comment.",
    type: "PetitionFieldComment",
    authorize: chain(
      authenticate(),
      and(
        userHasAccessToPetition("petitionId"),
        fieldBelongsToPetition("petitionId", "petitionFieldId"),
        commentsBelongsToPetition("petitionId", "petitionFieldCommentId"),
        async function commentAuhtorIsContextContact(root, args, ctx, info) {
          const petitionFieldCommentId = fromGlobalId(
            args.petitionFieldCommentId,
            "PetitionFieldComment"
          ).id;
          const comment = await ctx.petitions.loadPetitionFieldComment(
            petitionFieldCommentId
          );
          return (comment && comment.contact_id === ctx.contact!.id) ?? false;
        }
      )
    ),
    args: {
      petitionId: idArg({ required: true }),
      petitionFieldId: idArg({ required: true }),
      petitionFieldCommentId: idArg({ required: true }),
      content: stringArg({ required: true }),
    },
    resolve: async (_, args, ctx) => {
      const petitionFieldCommentId = fromGlobalId(
        args.petitionFieldCommentId,
        "PetitionFieldComment"
      ).id;
      return await ctx.petitions.updatePetitionFieldCommentFromContact(
        petitionFieldCommentId,
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
    type: "PetitionFieldComment",
    list: [true],
    authorize: chain(authenticate(), userHasAccessToPetition("petitionId")),
    args: {
      petitionId: idArg({ required: true }),
    },
    resolve: async (_, args, ctx) => {
      const petitionId = fromGlobalId(args.petitionId, "Petition").id;
      const comments = await ctx.petitions.publishPetitionFieldCommentsForContact(
        petitionId,
        ctx.contact!
      );
      // TODO enqueue email to notify users about comments
      return comments;
    },
  }
);

export const publicMarkPetitionFieldCommentsAsRead = mutationField(
  "publicMarkPetitionFieldCommentsAsRead",
  {
    description: "Marks the specified comments as read.",
    type: "PetitionFieldComment",
    list: [true],
    authorize: chain(
      authenticate(),
      and(
        userHasAccessToPetition("petitionId"),
        commentsBelongsToPetition("petitionId", "petitionFieldCommentIds")
      )
    ),
    args: {
      petitionId: idArg({ required: true }),
      petitionFieldCommentIds: idArg({ required: true, list: [true] }),
    },
    resolve: async (_, args, ctx) => {
      const petitionFieldCommentIds = fromGlobalIds(
        args.petitionFieldCommentIds,
        "PetitionFieldComment"
      ).ids;
      return await ctx.petitions.markPetitionFieldCommentsAsReadForContact(
        petitionFieldCommentIds,
        ctx.contact!
      );
    },
  }
);
