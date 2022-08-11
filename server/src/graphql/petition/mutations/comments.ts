import { ApolloError } from "apollo-server-core";
import { booleanArg, mutationField, nonNull } from "nexus";
import { getMentions, toPlainText } from "../../../util/slate";
import { and, authenticateAnd, ifArgEquals } from "../../helpers/authorize";
import { globalIdArg } from "../../helpers/globalIdPlugin";
import { jsonArg } from "../../helpers/scalars";
import { validPetitionFieldCommentContent } from "../../public/authorizers";
import {
  commentsBelongsToPetition,
  fieldsAreNotInternal,
  fieldsBelongsToPetition,
  fieldsHaveCommentsEnabled,
  petitionIsNotAnonymized,
  userHasAccessToPetitionFieldComment,
  userHasAccessToPetitions,
} from "../authorizers";

export const createPetitionFieldComment = mutationField("createPetitionFieldComment", {
  description: "Create a petition field comment.",
  type: "PetitionFieldComment",
  authorize: authenticateAnd(
    userHasAccessToPetitions("petitionId"),
    fieldsBelongsToPetition("petitionId", "petitionFieldId"),
    ifArgEquals(
      "isInternal",
      false,
      and(
        userHasAccessToPetitions("petitionId", ["OWNER", "WRITE"]),
        fieldsHaveCommentsEnabled("petitionFieldId"),
        fieldsAreNotInternal("petitionFieldId")
      )
    ),
    petitionIsNotAnonymized("petitionId"),
    validPetitionFieldCommentContent("content", "petitionFieldId", true)
  ),
  args: {
    petitionId: nonNull(globalIdArg("Petition")),
    petitionFieldId: nonNull(globalIdArg("PetitionField")),
    content: nonNull(jsonArg()),
    isInternal: booleanArg(),
    sharePetition: booleanArg({
      description: "Automatically share the petition with mentioned users that have no permissions",
    }),
    throwOnNoPermission: booleanArg({
      description: "Throw error if set to true and a user with no permissions is mentioned",
    }),
  },
  resolve: async (_, args, ctx) => {
    try {
      await ctx.petitions.checkUserMentions(
        getMentions(args.content),
        args.petitionId,
        args.throwOnNoPermission ?? true,
        args.sharePetition ?? false,
        ctx.user!.id
      );

      ctx.petitions.loadPetitionFieldCommentsForField.dataloader.clear({
        loadInternalComments: true,
        petitionFieldId: args.petitionFieldId,
        petitionId: args.petitionId,
      });
      return await ctx.petitions.createPetitionFieldCommentFromUser(
        {
          petitionId: args.petitionId,
          petitionFieldId: args.petitionFieldId,
          contentJson: args.content,
          content: toPlainText(args.content),
          isInternal: args.isInternal ?? false,
        },
        ctx.user!
      );
    } catch (e: any) {
      if (e.code === "NO_PERMISSIONS_MENTION_ERROR") {
        throw new ApolloError(
          `Mentioned users with no permissions`,
          "NO_PERMISSIONS_MENTION_ERROR",
          { ids: e.ids }
        );
      } else {
        throw e;
      }
    }
  },
});

export const deletePetitionFieldComment = mutationField("deletePetitionFieldComment", {
  description: "Delete a petition field comment.",
  type: "PetitionField",
  authorize: authenticateAnd(
    fieldsBelongsToPetition("petitionId", "petitionFieldId"),
    commentsBelongsToPetition("petitionId", "petitionFieldCommentId"),
    userHasAccessToPetitionFieldComment("petitionFieldCommentId"),
    petitionIsNotAnonymized("petitionId")
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
    fieldsBelongsToPetition("petitionId", "petitionFieldId"),
    commentsBelongsToPetition("petitionId", "petitionFieldCommentId"),
    userHasAccessToPetitionFieldComment("petitionFieldCommentId"),
    petitionIsNotAnonymized("petitionId"),
    validPetitionFieldCommentContent("content", "petitionFieldId", true)
  ),
  args: {
    petitionId: nonNull(globalIdArg("Petition")),
    petitionFieldId: nonNull(globalIdArg("PetitionField")),
    petitionFieldCommentId: nonNull(globalIdArg("PetitionFieldComment")),
    content: nonNull(jsonArg()),
    sharePetition: booleanArg({
      description: "Automatically share the petition with mentioned users that have no permissions",
    }),
    throwOnNoPermission: booleanArg({
      description: "Throw error if set to true and a user with no permissions is mentioned",
    }),
  },
  resolve: async (_, args, ctx) => {
    try {
      await ctx.petitions.checkUserMentions(
        getMentions(args.content),
        args.petitionId,
        args.throwOnNoPermission ?? true,
        args.sharePetition ?? false,
        ctx.user!.id
      );

      return await ctx.petitions.updatePetitionFieldCommentFromUser(
        args.petitionFieldCommentId,
        {
          content: toPlainText(args.content),
          contentJson: args.content,
        },
        ctx.user!
      );
    } catch (e: any) {
      if (e.code === "NO_PERMISSIONS_MENTION_ERROR") {
        throw new ApolloError(
          `Mentioned users with no permissions`,
          "NO_PERMISSIONS_MENTION_ERROR",
          { ids: e.ids }
        );
      } else {
        throw e;
      }
    }
  },
});
