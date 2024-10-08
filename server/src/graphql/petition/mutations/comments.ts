import { arg, booleanArg, mutationField, nonNull, nullable } from "nexus";
import { isNonNullish } from "remeda";
import { collectMentionsFromSlate } from "../../../util/slate/mentions";
import { and, authenticateAnd, ifArgDefined, ifArgEquals, not } from "../../helpers/authorize";
import { ApolloError } from "../../helpers/errors";
import { globalIdArg } from "../../helpers/globalIdPlugin";
import { jsonArg } from "../../helpers/scalars/JSON";
import { validPetitionFieldCommentContent } from "../../public/authorizers";
import {
  commentsBelongsToPetition,
  fieldHasParent,
  fieldsAreNotInternal,
  fieldsBelongsToPetition,
  fieldsHaveCommentsEnabled,
  petitionIsNotAnonymized,
  petitionsAreOfTypePetition,
  userHasAccessToPetitions,
  userIsOwnerOfPetitionFieldComment,
} from "../authorizers";

export const createPetitionComment = mutationField("createPetitionComment", {
  description: "Create a petition comment.",
  type: "PetitionFieldComment",
  authorize: authenticateAnd(
    ifArgEquals(
      "isInternal",
      false,
      and(
        userHasAccessToPetitions("petitionId", ["OWNER", "WRITE"]),
        ifArgDefined(
          "petitionFieldId",
          and(
            fieldsHaveCommentsEnabled("petitionFieldId" as never),
            fieldsAreNotInternal("petitionFieldId" as never),
          ),
        ),
      ),
      userHasAccessToPetitions("petitionId"),
    ),
    ifArgEquals(
      "sharePetitionPermission",
      "WRITE",
      userHasAccessToPetitions("petitionId", ["OWNER", "WRITE"]),
    ),
    ifArgDefined(
      "petitionFieldId",
      and(
        fieldsBelongsToPetition("petitionId", "petitionFieldId" as never),
        not(fieldHasParent("petitionFieldId" as never)),
      ),
    ),
    petitionIsNotAnonymized("petitionId"),
    validPetitionFieldCommentContent("content", true),
    petitionsAreOfTypePetition("petitionId"),
  ),
  args: {
    petitionId: nonNull(globalIdArg("Petition")),
    petitionFieldId: nullable(globalIdArg("PetitionField")),
    content: nonNull(jsonArg()),
    isInternal: nonNull(booleanArg()),
    sharePetition: booleanArg({
      description: "Automatically share the petition with mentioned users that have no permissions",
    }),
    throwOnNoPermission: booleanArg({
      description: "Throw error if set to true and a user with no permissions is mentioned",
    }),
    sharePetitionPermission: arg({
      type: "PetitionPermissionTypeRW",
      description: "Permission to assign to the mentioned users if sharePetition=true",
    }),
    sharePetitionSubscribed: booleanArg({
      description:
        "Wether to subscribe or not to notifications the mentioned users if sharePetition=true",
    }),
  },
  resolve: async (_, args, ctx) => {
    try {
      await ctx.petitions.checkUserMentions(
        collectMentionsFromSlate(args.content),
        args.petitionId,
        args.throwOnNoPermission ?? true,
        ctx.user!.id,
        args.sharePetition
          ? {
              isSubscribed: args.sharePetitionSubscribed ?? false,
              permissionType: args.sharePetitionPermission ?? "READ",
            }
          : undefined,
      );

      return await ctx.petitions.createPetitionFieldCommentFromUser(
        {
          petitionId: args.petitionId,
          petitionFieldId: args.petitionFieldId ?? null,
          contentJson: args.content,
          isInternal: args.isInternal ?? false,
        },
        ctx.user!,
      );
    } catch (e: any) {
      if (e.code === "NO_PERMISSIONS_MENTION_ERROR") {
        throw new ApolloError(
          `Mentioned users with no permissions`,
          "NO_PERMISSIONS_MENTION_ERROR",
          { ids: e.ids },
        );
      } else {
        throw e;
      }
    }
  },
});

export const deletePetitionComment = mutationField("deletePetitionComment", {
  description: "Delete a petition comment.",
  type: "PetitionFieldOrPetition",
  authorize: authenticateAnd(
    userHasAccessToPetitions("petitionId"),
    commentsBelongsToPetition("petitionId", "petitionFieldCommentId"),
    userIsOwnerOfPetitionFieldComment("petitionFieldCommentId"),
    petitionIsNotAnonymized("petitionId"),
  ),
  args: {
    petitionId: nonNull(globalIdArg("Petition")),
    petitionFieldCommentId: nonNull(globalIdArg("PetitionFieldComment")),
  },
  resolve: async (_, args, ctx) => {
    const comment = await ctx.petitions.deletePetitionFieldCommentFromUser(
      args.petitionId,
      args.petitionFieldCommentId,
      ctx.user!,
    );

    if (isNonNullish(comment?.petition_field_id)) {
      const petitionField = await ctx.petitions.loadField(comment?.petition_field_id);
      if (!petitionField) {
        throw new ApolloError("Petition field not found", "PETITION_FIELD_NOT_FOUND");
      }
      return { __type: "PetitionField", ...petitionField };
    } else {
      const petition = await ctx.petitions.loadPetition(args.petitionId);
      if (!petition) {
        throw new ApolloError("Petition not found", "PETITION_NOT_FOUND");
      }
      return { __type: "Petition", ...petition };
    }
  },
});

export const updatePetitionComment = mutationField("updatePetitionComment", {
  description: "Update a petition comment.",
  type: "PetitionFieldComment",
  authorize: authenticateAnd(
    ifArgEquals(
      "sharePetitionPermission",
      "WRITE",
      userHasAccessToPetitions("petitionId", ["OWNER"]),
      userHasAccessToPetitions("petitionId"),
    ),
    commentsBelongsToPetition("petitionId", "petitionFieldCommentId"),
    userIsOwnerOfPetitionFieldComment("petitionFieldCommentId"),
    petitionIsNotAnonymized("petitionId"),
    validPetitionFieldCommentContent("content", true),
  ),
  args: {
    petitionId: nonNull(globalIdArg("Petition")),
    petitionFieldCommentId: nonNull(globalIdArg("PetitionFieldComment")),
    content: nonNull(jsonArg()),
    sharePetition: booleanArg({
      description: "Automatically share the petition with mentioned users that have no permissions",
    }),
    throwOnNoPermission: booleanArg({
      description: "Throw error if set to true and a user with no permissions is mentioned",
    }),
    sharePetitionPermission: arg({
      type: "PetitionPermissionTypeRW",
      description: "Permission to assign to the mentioned users if sharePetition=true",
    }),
    sharePetitionSubscribed: booleanArg({
      description:
        "Wether to subscribe or not to notifications the mentioned users if sharePetition=true",
    }),
  },
  resolve: async (_, args, ctx) => {
    try {
      await ctx.petitions.checkUserMentions(
        collectMentionsFromSlate(args.content),
        args.petitionId,
        args.throwOnNoPermission ?? true,
        ctx.user!.id,
        args.sharePetition
          ? {
              isSubscribed: args.sharePetitionSubscribed ?? false,
              permissionType: args.sharePetitionPermission ?? "READ",
            }
          : undefined,
      );

      return await ctx.petitions.updatePetitionFieldCommentFromUser(
        args.petitionFieldCommentId,
        {
          contentJson: args.content,
        },
        ctx.user!,
      );
    } catch (e: any) {
      if (e.code === "NO_PERMISSIONS_MENTION_ERROR") {
        throw new ApolloError(
          `Mentioned users with no permissions`,
          "NO_PERMISSIONS_MENTION_ERROR",
          { ids: e.ids },
        );
      } else {
        throw e;
      }
    }
  },
});
