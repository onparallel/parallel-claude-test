import {
  booleanArg,
  list,
  mutationField,
  nonNull,
  stringArg,
} from "@nexus/schema";
import {
  and,
  authenticate,
  chain,
  ifArgDefined,
  ifArgEquals,
} from "../../helpers/authorize";
import {
  commentsBelongsToPetition,
  fieldsBelongsToPetition,
  repliesBelongsToPetition,
  userHasAccessToPetitions,
  userHasFeatureFlag,
} from "../authorizers";
import { prop } from "remeda";
import { notEmptyArray } from "../../helpers/validators/notEmptyArray";
import { globalIdArg } from "../../helpers/globalIdPlugin";
import { userIsCommentAuthor } from "./authorizers";
import { WhitelistedError } from "../../helpers/errors";

export const createPetitionFieldComment = mutationField(
  "createPetitionFieldComment",
  {
    description: "Create a petition field comment.",
    type: "PetitionField",
    authorize: chain(
      authenticate(),
      and(
        userHasAccessToPetitions("petitionId"),
        fieldsBelongsToPetition("petitionId", "petitionFieldId"),
        ifArgDefined(
          "petitionFieldReplyId",
          repliesBelongsToPetition("petitionId", "petitionFieldReplyId" as any)
        ),
        ifArgEquals("isInternal", true, userHasFeatureFlag("INTERNAL_COMMENTS"))
      )
    ),
    args: {
      petitionId: nonNull(globalIdArg("Petition")),
      petitionFieldId: nonNull(globalIdArg("PetitionField")),
      petitionFieldReplyId: globalIdArg("PetitionFieldReply"),
      content: nonNull(stringArg()),
      isInternal: booleanArg(),
    },
    resolve: async (_, args, ctx) => {
      const petition = (await ctx.petitions.loadPetition(args.petitionId))!;
      if (!petition.comments_enabled && !args.isInternal) {
        throw new WhitelistedError(
          "Comments are not enabled for this petition",
          "COMMENTS_NOT_ENABLED"
        );
      }
      await ctx.petitions.createPetitionFieldCommentFromUser(
        {
          petitionId: args.petitionId,
          petitionFieldId: args.petitionFieldId,
          petitionFieldReplyId: args.petitionFieldReplyId ?? null,
          content: args.content,
          isInternal: args.isInternal ?? false,
        },
        ctx.user!
      );
      return (await ctx.petitions.loadField(args.petitionFieldId))!;
    },
  }
);

export const deletePetitionFieldComment = mutationField(
  "deletePetitionFieldComment",
  {
    description: "Delete a petition field comment.",
    type: "PetitionField",
    authorize: chain(
      authenticate(),
      and(
        userHasAccessToPetitions("petitionId"),
        fieldsBelongsToPetition("petitionId", "petitionFieldId"),
        commentsBelongsToPetition("petitionId", "petitionFieldCommentId")
      )
    ),
    args: {
      petitionId: nonNull(globalIdArg("Petition")),
      petitionFieldId: nonNull(globalIdArg("PetitionField")),
      petitionFieldCommentId: nonNull(globalIdArg("PetitionFieldComment")),
    },
    resolve: async (_, args, ctx) => {
      await ctx.petitions.deletePetitionFieldCommentFromUser(
        args.petitionId,
        args.petitionFieldId,
        args.petitionFieldCommentId,
        ctx.user!
      );
      return (await ctx.petitions.loadField(args.petitionFieldId))!;
    },
  }
);

export const updatePetitionFieldComment = mutationField(
  "updatePetitionFieldComment",
  {
    description: "Update a petition field comment.",
    type: "PetitionField",
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
      petitionId: nonNull(globalIdArg("Petition")),
      petitionFieldId: nonNull(globalIdArg("PetitionField")),
      petitionFieldCommentId: nonNull(globalIdArg("PetitionFieldComment")),
      content: nonNull(stringArg()),
    },
    resolve: async (_, args, ctx) => {
      await ctx.petitions.updatePetitionFieldCommentFromUser(
        args.petitionFieldCommentId,
        args.content,
        ctx.user!
      );
      return (await ctx.petitions.loadField(args.petitionFieldId))!;
    },
  }
);

export const markPetitionFieldCommentsAsRead = mutationField(
  "markPetitionFieldCommentsAsRead",
  {
    description: "Marks the specified comments as read.",
    type: list(nonNull("PetitionFieldComment")),
    authorize: chain(
      authenticate(),
      and(
        userHasAccessToPetitions("petitionId"),
        commentsBelongsToPetition("petitionId", "petitionFieldCommentIds")
      )
    ),
    args: {
      petitionId: nonNull(globalIdArg("Petition")),
      petitionFieldCommentIds: nonNull(
        list(nonNull(globalIdArg("PetitionFieldComment")))
      ),
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
