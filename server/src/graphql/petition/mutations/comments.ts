import { booleanArg, list, mutationField, nonNull, stringArg } from "nexus";
import { prop } from "remeda";
import { and, authenticate, authenticateAnd, chain, ifArgEquals } from "../../helpers/authorize";
import { WhitelistedError } from "../../helpers/errors";
import { globalIdArg } from "../../helpers/globalIdPlugin";
import { notEmptyArray } from "../../helpers/validators/notEmptyArray";
import {
  commentsBelongsToPetition,
  fieldsBelongsToPetition,
  userHasAccessToPetitions,
  userHasFeatureFlag,
} from "../authorizers";
import { userIsCommentAuthor } from "./authorizers";

export const createPetitionFieldComment = mutationField("createPetitionFieldComment", {
  description: "Create a petition field comment.",
  type: "PetitionField",
  authorize: chain(
    authenticate(),
    and(
      userHasAccessToPetitions("petitionId"),
      fieldsBelongsToPetition("petitionId", "petitionFieldId"),
      ifArgEquals("isInternal", true, userHasFeatureFlag("INTERNAL_COMMENTS"))
    )
  ),
  args: {
    petitionId: nonNull(globalIdArg("Petition")),
    petitionFieldId: nonNull(globalIdArg("PetitionField")),
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
        content: args.content,
        isInternal: args.isInternal ?? false,
      },
      ctx.user!
    );
    return (await ctx.petitions.loadField(args.petitionFieldId))!;
  },
});

export const deletePetitionFieldComment = mutationField("deletePetitionFieldComment", {
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
});

export const updatePetitionFieldComment = mutationField("updatePetitionFieldComment", {
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
});

export const updatePetitionFieldCommentsReadStatus = mutationField(
  "updatePetitionFieldCommentsReadStatus",
  {
    deprecation: "Use `updatePetitionUserNotificationReadStatus` instead.",
    description: "Marks the specified comments as read or unread.",
    type: list(nonNull("PetitionFieldComment")),
    authorize: authenticateAnd(
      userHasAccessToPetitions("petitionId"),
      commentsBelongsToPetition("petitionId", "petitionFieldCommentIds")
    ),
    args: {
      petitionId: nonNull(globalIdArg("Petition")),
      isRead: nonNull(booleanArg()),
      petitionFieldCommentIds: nonNull(list(nonNull(globalIdArg("PetitionFieldComment")))),
    },
    validateArgs: notEmptyArray(prop("petitionFieldCommentIds"), "petitionFieldCommentIds"),
    resolve: async (_, args, ctx) => {
      return await ctx.petitions.updatePetitionFieldCommentsReadStatusForUser(
        args.petitionFieldCommentIds,
        args.isRead,
        ctx.user!
      );
    },
  }
);
