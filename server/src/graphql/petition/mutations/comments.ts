import { booleanArg, mutationField, nonNull, stringArg } from "nexus";
import { authenticateAnd, ifArgEquals, and } from "../../helpers/authorize";
import { globalIdArg } from "../../helpers/globalIdPlugin";
import {
  commentsBelongsToPetition,
  fieldsAreNotInternal,
  fieldsBelongsToPetition,
  fieldsHaveCommentsEnabled,
  petitionIsNotAnonymized,
  userHasAccessToPetitions,
} from "../authorizers";
import { userIsCommentAuthor } from "./authorizers";

export const createPetitionFieldComment = mutationField("createPetitionFieldComment", {
  description: "Create a petition field comment.",
  type: "PetitionFieldComment",
  authorize: authenticateAnd(
    userHasAccessToPetitions("petitionId"),
    fieldsBelongsToPetition("petitionId", "petitionFieldId"),
    ifArgEquals("isInternal", false, userHasAccessToPetitions("petitionId", ["OWNER", "WRITE"]), fieldsHaveCommentsEnabled("petitionFieldId")),
    ifArgEquals("isInternal", false, fieldsAreNotInternal("petitionFieldId")),
    petitionIsNotAnonymized("petitionId")
  ),
  args: {
    petitionId: nonNull(globalIdArg("Petition")),
    petitionFieldId: nonNull(globalIdArg("PetitionField")),
    content: nonNull(stringArg()),
    isInternal: booleanArg(),
  },
  resolve: async (_, args, ctx) => {
    ctx.petitions.loadPetitionFieldCommentsForField.dataloader.clear({
      loadInternalComments: true,
      petitionFieldId: args.petitionFieldId,
      petitionId: args.petitionId,
    });
    return await ctx.petitions.createPetitionFieldCommentFromUser(
      {
        petitionId: args.petitionId,
        petitionFieldId: args.petitionFieldId,
        content: args.content,
        isInternal: args.isInternal ?? false,
      },
      ctx.user!
    );
  },
});

export const deletePetitionFieldComment = mutationField("deletePetitionFieldComment", {
  description: "Delete a petition field comment.",
  type: "PetitionField",
  authorize: authenticateAnd(
    async (root, args, ctx, info) => {
      // if the comment is external, user must have OWNER or WRITE permissions on the petition
      const comment = await ctx.petitions.loadPetitionFieldComment(args.petitionFieldCommentId);
      return await userHasAccessToPetitions(
        "petitionId",
        comment?.is_internal ? undefined : ["OWNER", "WRITE"]
      )(root, args, ctx, info);
    },
    fieldsBelongsToPetition("petitionId", "petitionFieldId"),
    commentsBelongsToPetition("petitionId", "petitionFieldCommentId"),
    petitionIsNotAnonymized("petitionId"),
    userIsCommentAuthor("petitionFieldCommentId")
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
  type: "PetitionFieldComment",
  authorize: authenticateAnd(
    async (root, args, ctx, info) => {
      // if the comment is external, user must have OWNER or WRITE permissions on the petition
      const comment = await ctx.petitions.loadPetitionFieldComment(args.petitionFieldCommentId);
      return await userHasAccessToPetitions(
        "petitionId",
        comment?.is_internal ? undefined : ["OWNER", "WRITE"]
      )(root, args, ctx, info);
    },
    fieldsBelongsToPetition("petitionId", "petitionFieldId"),
    commentsBelongsToPetition("petitionId", "petitionFieldCommentId"),
    userIsCommentAuthor("petitionFieldCommentId"),
    petitionIsNotAnonymized("petitionId")
  ),
  args: {
    petitionId: nonNull(globalIdArg("Petition")),
    petitionFieldId: nonNull(globalIdArg("PetitionField")),
    petitionFieldCommentId: nonNull(globalIdArg("PetitionFieldComment")),
    content: nonNull(stringArg()),
  },
  resolve: async (_, args, ctx) => {
    return await ctx.petitions.updatePetitionFieldCommentFromUser(
      args.petitionFieldCommentId,
      args.content,
      ctx.user!
    );
  },
});
