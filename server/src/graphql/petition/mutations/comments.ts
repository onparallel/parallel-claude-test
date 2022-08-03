import { ApolloError } from "apollo-server-core";
import { booleanArg, mutationField, nonNull } from "nexus";
import { difference, isDefined, partition } from "remeda";
import { ApiContext } from "../../../context";
import { PetitionFieldComment } from "../../../db/__types";
import { fullName } from "../../../util/fullName";
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
  userHasAccessToPetitions,
} from "../authorizers";
import { userIsCommentAuthor } from "./authorizers";

async function manageMentionsSharing(
  mentions: ReturnType<typeof getMentions>,
  petitionId: number,
  throwOnNoPermission: boolean,
  sharePetition: boolean,
  ctx: ApiContext
) {
  const [userMentions, userGroupMentions] = partition(mentions, (m) => m.type === "User");
  const { users: userIdsWithPermission, userGroups: groupIdsWithPermission } =
    await ctx.petitions.filterUsersWithPetitionPermission(
      petitionId,
      userMentions.map((m) => m.id),
      userGroupMentions.map((m) => m.id)
    );

  const userIdsWithNoPermissions = difference(
    userMentions.map((m) => m.id),
    userIdsWithPermission
  );

  const userGroupIdsWithNoPermissions = difference(
    userGroupMentions.map((m) => m.id),
    groupIdsWithPermission
  );

  if (userIdsWithNoPermissions.length > 0 || userGroupIdsWithNoPermissions.length > 0) {
    if (throwOnNoPermission) {
      const users =
        userIdsWithNoPermissions.length > 0
          ? (await ctx.users.loadUserDataByUserId(userIdsWithNoPermissions)).filter(isDefined)
          : [];
      const groups =
        userGroupIdsWithNoPermissions.length > 0
          ? (await ctx.userGroups.loadUserGroup(userGroupIdsWithNoPermissions)).filter(isDefined)
          : [];
      throw new ApolloError(`Mentioned users with no permissions`, "NO_PERMISSIONS_MENTION_ERROR", {
        names: [
          ...users.map((u) => fullName(u.first_name, u.last_name)),
          ...groups.map((g) => g.name),
        ],
      });
    } else if (sharePetition) {
      await ctx.petitions.withTransaction(async (t) => {
        const { newPermissions } = await ctx.petitions.addPetitionPermissions(
          [petitionId],
          [
            ...userIdsWithNoPermissions.map((userId) => ({
              type: "User" as const,
              id: userId,
              isSubscribed: false,
              permissionType: "READ" as const,
            })),
            ...userGroupIdsWithNoPermissions.map((groupId) => ({
              type: "UserGroup" as const,
              id: groupId,
              isSubscribed: false,
              permissionType: "READ" as const,
            })),
          ],
          `User:${ctx.user!.id}`,
          t
        );

        const [directlyAssigned, groupAssigned] = partition(
          newPermissions.filter((p) => p.from_user_group_id === null),
          (p) => p.user_group_id === null
        );

        await ctx.petitions.createEvent(
          [
            ...directlyAssigned.map((p) => ({
              petition_id: p.petition_id,
              type: "USER_PERMISSION_ADDED" as const,
              data: {
                user_id: ctx.user!.id,
                permission_type: p.type,
                permission_user_id: p.user_id!,
              },
            })),
            ...groupAssigned.map((p) => ({
              petition_id: p.petition_id,
              type: "GROUP_PERMISSION_ADDED" as const,
              data: {
                user_id: ctx.user!.id,
                permission_type: p.type,
                user_group_id: p.user_group_id!,
              },
            })),
          ],
          t
        );
      });
    }
  }
}

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
    validPetitionFieldCommentContent(
      "content",
      "petitionFieldId",
      // only internal comments can use mentions
      (args) => args.isInternal
    )
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
    await manageMentionsSharing(
      getMentions(args.content),
      args.petitionId,
      args.throwOnNoPermission ?? true,
      args.sharePetition ?? false,
      ctx
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
  },
});

export const deletePetitionFieldComment = mutationField("deletePetitionFieldComment", {
  description: "Delete a petition field comment.",
  type: "PetitionField",
  authorize: authenticateAnd(
    async (root, args, ctx, info) => {
      // if the comment is external, user must have OWNER or WRITE permissions on the petition
      const comment = (await ctx.petitions.loadPetitionFieldComment(
        args.petitionFieldCommentId
      )) as PetitionFieldComment;
      return await userHasAccessToPetitions(
        "petitionId",
        comment?.is_internal || comment?.user_id === ctx.user!.id ? undefined : ["OWNER", "WRITE"]
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
      // if the comment is external:
      // - user must have OWNER or WRITE permissions on the petition
      // - comment can't contain mentions
      const comment = await ctx.petitions.loadPetitionFieldComment(args.petitionFieldCommentId);
      return and(
        userHasAccessToPetitions(
          "petitionId",
          comment?.is_internal || comment?.user_id === ctx.user!.id ? undefined : ["OWNER", "WRITE"]
        ),
        validPetitionFieldCommentContent("content", "petitionFieldId", () => comment?.is_internal)
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
    content: nonNull(jsonArg()),
    sharePetition: booleanArg({
      description: "Automatically share the petition with mentioned users that have no permissions",
    }),
    throwOnNoPermission: booleanArg({
      description: "Throw error if set to true and a user with no permissions is mentioned",
    }),
  },
  resolve: async (_, args, ctx) => {
    await manageMentionsSharing(
      getMentions(args.content),
      args.petitionId,
      args.throwOnNoPermission ?? true,
      args.sharePetition ?? false,
      ctx
    );

    return await ctx.petitions.updatePetitionFieldCommentFromUser(
      args.petitionFieldCommentId,
      {
        content: toPlainText(args.content),
        contentJson: args.content,
      },
      ctx.user!
    );
  },
});
