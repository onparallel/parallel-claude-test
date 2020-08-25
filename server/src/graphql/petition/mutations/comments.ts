import { mutationField, stringArg } from "@nexus/schema";
import {
  and,
  authenticate,
  chain,
  ifArgDefined,
} from "../../helpers/authorize";
import { RESULT } from "../../helpers/result";
import {
  commentsBelongsToPetition,
  fieldsBelongsToPetition,
  repliesBelongsToPetition,
  userHasAccessToPetitions,
} from "../authorizers";
import { prop } from "remeda";
import { notEmptyArray } from "../../helpers/validators/notEmptyArray";
import { globalIdArg } from "../../helpers/globalIdPlugin";
import { userIsCommentAuthor } from "./authorizers";

export const createPetitionFieldComment = mutationField(
  "createPetitionFieldComment",
  {
    description: "Create a petition field comment.",
    type: "PetitionFieldComment",
    authorize: chain(
      authenticate(),
      and(
        userHasAccessToPetitions("petitionId"),
        fieldsBelongsToPetition("petitionId", "petitionFieldId"),
        ifArgDefined(
          "petitionFieldReplyId",
          repliesBelongsToPetition("petitionId", "petitionFieldReplyId" as any)
        )
      )
    ),
    args: {
      petitionId: globalIdArg("Petition", { required: true }),
      petitionFieldId: globalIdArg("PetitionField", { required: true }),
      petitionFieldReplyId: globalIdArg("PetitionFieldReply", {
        required: false,
      }),
      content: stringArg({ required: true }),
    },
    resolve: async (_, args, ctx) => {
      return await ctx.petitions.createPetitionFieldCommentFromUser(
        {
          petitionId: args.petitionId,
          petitionFieldId: args.petitionFieldId,
          petitionFieldReplyId: args.petitionFieldReplyId ?? null,
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
        userHasAccessToPetitions("petitionId"),
        fieldsBelongsToPetition("petitionId", "petitionFieldId"),
        commentsBelongsToPetition("petitionId", "petitionFieldCommentId")
      )
    ),
    args: {
      petitionId: globalIdArg("Petition", { required: true }),
      petitionFieldId: globalIdArg("PetitionField", { required: true }),
      petitionFieldCommentId: globalIdArg("PetitionFieldComment", {
        required: true,
      }),
    },
    resolve: async (_, args, ctx) => {
      await ctx.petitions.deletePetitionFieldCommentFromUser(
        args.petitionId,
        args.petitionFieldId,
        args.petitionFieldCommentId,
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
        userHasAccessToPetitions("petitionId"),
        fieldsBelongsToPetition("petitionId", "petitionFieldId"),
        commentsBelongsToPetition("petitionId", "petitionFieldCommentId"),
        userIsCommentAuthor("petitionFieldCommentId")
      )
    ),
    args: {
      petitionId: globalIdArg("Petition", { required: true }),
      petitionFieldId: globalIdArg("PetitionField", { required: true }),
      petitionFieldCommentId: globalIdArg("PetitionFieldComment", {
        required: true,
      }),
      content: stringArg({ required: true }),
    },
    resolve: async (_, args, ctx) => {
      return await ctx.petitions.updatePetitionFieldCommentFromUser(
        args.petitionFieldCommentId,
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
    authorize: chain(authenticate(), userHasAccessToPetitions("petitionId")),
    args: {
      petitionId: globalIdArg("Petition", { required: true }),
    },
    resolve: async (_, args, ctx) => {
      const {
        comments,
        accesses,
      } = await ctx.petitions.publishPetitionFieldCommentsForUser(
        args.petitionId,
        ctx.user!
      );
      await ctx.emails.sendPetitionCommentsContactNotificationEmail(
        args.petitionId,
        ctx.user!.id,
        accesses.map(prop("id")),
        comments.map(prop("id"))
      );
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
        userHasAccessToPetitions("petitionId"),
        commentsBelongsToPetition("petitionId", "petitionFieldCommentIds")
      )
    ),
    args: {
      petitionId: globalIdArg("Petition", { required: true }),
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
      return await ctx.petitions.markPetitionFieldCommentsAsReadForUser(
        args.petitionFieldCommentIds,
        ctx.user!
      );
    },
  }
);
