import { idArg, mutationField, stringArg } from "@nexus/schema";
import { fromGlobalId, fromGlobalIds } from "../../../util/globalId";
import {
  and,
  authenticate,
  chain,
  ifArgDefined,
} from "../../helpers/authorize";
import { RESULT } from "../../helpers/result";
import {
  commentsBelongsToPetition,
  fieldBelongsToPetition,
  replyBelongsToPetition,
  userHasAccessToPetition,
} from "../authorizers";

export const createPetitionFieldComment = mutationField(
  "createPetitionFieldComment",
  {
    description: "Create a petition field comment.",
    type: "PetitionFieldComment",
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
      return await ctx.petitions.createPetitionFieldComment(
        {
          petitionId,
          petitionFieldId,
          petitionFieldReplyId,
          content: args.content,
        },
        ctx.user!
      );
    },
  }
);

export const deletePetitionFieldComment = mutationField(
  "deletePetitionFieldComment",
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

export const updatePetitionFieldComment = mutationField(
  "updatePetitionFieldComment",
  {
    description: "Update a petition field comment.",
    type: "PetitionFieldComment",
    authorize: chain(
      authenticate(),
      and(
        userHasAccessToPetition("petitionId"),
        fieldBelongsToPetition("petitionId", "petitionFieldId"),
        commentsBelongsToPetition("petitionId", "petitionFieldCommentId"),
        async function commentAuhtorIsContextUser(root, args, ctx, info) {
          const petitionFieldCommentId = fromGlobalId(
            args.petitionFieldCommentId,
            "PetitionFieldComment"
          ).id;
          const comment = await ctx.petitions.loadPetitionFieldComment(
            petitionFieldCommentId
          );
          return (comment && comment.user_id === ctx.user!.id) ?? false;
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
      return await ctx.petitions.updatePetitionFieldComment(
        petitionFieldCommentId,
        args.content,
        ctx.user!
      );
    },
  }
);

export const submitUnpublishedComments = mutationField(
  "submitUnpublishedComments",
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
      const comments = await ctx.petitions.publishPetitionFieldCommentsForUser(
        petitionId,
        ctx.user!
      );
      // TODO enqueue email to notify recipients about comments
      return comments;
    },
  }
);

export const markPetitionFieldCommentsAsRead = mutationField(
  "markPetitionFieldCommentsAsRead",
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
      return await ctx.petitions.markPetitionFieldCommentsAsRead(
        petitionFieldCommentIds,
        ctx.user!
      );
    },
  }
);
