import { booleanArg, mutationField, nonNull, stringArg } from "nexus";
import { authenticateAnd, ifArgEquals } from "../../helpers/authorize";
import { globalIdArg } from "../../helpers/globalIdPlugin";
import {
  commentsBelongsToPetition,
  fieldsAreNotInternal,
  fieldsBelongsToPetition,
  fieldsHaveCommentsEnabled,
  petitionIsNotAnonymized,
  userHasAccessToPetitions,
  userHasFeatureFlag,
} from "../authorizers";
import { userIsCommentAuthor } from "./authorizers";

export const createPetitionFieldComment = mutationField("createPetitionFieldComment", {
  description: "Create a petition field comment.",
  type: "PetitionFieldComment",
  authorize: authenticateAnd(
    userHasAccessToPetitions("petitionId"),
    fieldsBelongsToPetition("petitionId", "petitionFieldId"),
    ifArgEquals(
      "isInternal",
      true,
      userHasFeatureFlag("INTERNAL_COMMENTS"),
      fieldsHaveCommentsEnabled("petitionFieldId")
    ),
    ifArgEquals(
      "isInternal",
      false,
      fieldsAreNotInternal("petitionFieldId"),
      userHasAccessToPetitions("petitionId", ["OWNER", "WRITE"])
    ),
    petitionIsNotAnonymized("petitionId")
  ),
  args: {
    petitionId: nonNull(globalIdArg("Petition")),
    petitionFieldId: nonNull(globalIdArg("PetitionField")),
    content: nonNull(stringArg()),
    isInternal: booleanArg(),
  },
  resolve: async (_, args, ctx) => {
    const loadInternalComments = await ctx.featureFlags.userHasFeatureFlag(
      ctx.user!.id,
      "INTERNAL_COMMENTS"
    );
    ctx.petitions.loadPetitionFieldCommentsForField.dataloader.clear({
      loadInternalComments,
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
    userHasAccessToPetitions("petitionId"),
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
    userHasAccessToPetitions("petitionId"),
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
