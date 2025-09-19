import { arg, booleanArg, mutationField, nonNull, nullable } from "nexus";
import { isNonNullish } from "remeda";
import { assert } from "ts-essentials";
import { collectMentionsFromSlate } from "../../../util/slate/mentions";
import { and, authenticateAnd, ifArgDefined, ifArgEquals, not } from "../../helpers/authorize";
import { ApolloError } from "../../helpers/errors";
import { globalIdArg } from "../../helpers/globalIdPlugin";
import { RESULT } from "../../helpers/Result";
import { jsonArg } from "../../helpers/scalars/JSON";
import {
  attachmentBelongsToPetitionComment,
  commentIsNotFromApprovalRequest,
  commentsBelongsToPetition,
  fieldHasParent,
  fieldsAreNotInternal,
  fieldsBelongsToPetition,
  fieldsHaveCommentsEnabled,
  petitionIsNotAnonymized,
  petitionsAreNotScheduledForDeletion,
  petitionsAreOfTypePetition,
  userHasAccessToPetitions,
  userIsOwnerOfPetitionFieldComment,
  usersCanBeMentionedInComment,
} from "../authorizers";
import { validateCommentContentSchema } from "../validations";

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
    usersCanBeMentionedInComment("content"),
    petitionsAreOfTypePetition("petitionId"),
    petitionsAreNotScheduledForDeletion("petitionId"),
  ),
  validateArgs: validateCommentContentSchema("content"),
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
    petitionsAreNotScheduledForDeletion("petitionId"),
    commentsBelongsToPetition("petitionId", "petitionFieldCommentId"),
    userIsOwnerOfPetitionFieldComment("petitionFieldCommentId"),
    petitionIsNotAnonymized("petitionId"),
    commentIsNotFromApprovalRequest("petitionFieldCommentId"),
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
    usersCanBeMentionedInComment("content"),
    commentIsNotFromApprovalRequest("petitionFieldCommentId"),
    petitionsAreNotScheduledForDeletion("petitionId"),
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
  validateArgs: validateCommentContentSchema("content"),
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

export const petitionCommentAttachmentDownloadLink = mutationField(
  "petitionCommentAttachmentDownloadLink",
  {
    type: "FileUploadDownloadLinkResult",
    description: "Generates a download link for a comment attachment",
    authorize: authenticateAnd(
      userHasAccessToPetitions("petitionId"),
      commentsBelongsToPetition("petitionId", "commentId"),
      attachmentBelongsToPetitionComment("attachmentId", "commentId"),
    ),
    args: {
      petitionId: nonNull(globalIdArg("Petition")),
      commentId: nonNull(globalIdArg("PetitionFieldComment")),
      attachmentId: nonNull(globalIdArg("PetitionCommentAttachment")),
      preview: booleanArg({
        description: "If true will use content-disposition inline instead of attachment",
      }),
    },
    resolve: async (_, args, ctx) => {
      try {
        const attachment = await ctx.petitionComments.loadPetitionCommentAttachment(
          args.attachmentId,
        );
        assert(attachment, "Attachment not found");

        const file = await ctx.files.loadFileUpload(attachment.file_upload_id);
        if (!file) {
          throw new Error(`FileUpload not found with id ${attachment.file_upload_id}`);
        }
        if (!file.upload_complete) {
          await ctx.storage.fileUploads.getFileMetadata(file.path);
          await ctx.files.markFileUploadComplete(file.id, `User:${ctx.user!.id}`);
        }
        return {
          result: RESULT.SUCCESS,
          file: file.upload_complete
            ? file
            : await ctx.files.loadFileUpload(file.id, { refresh: true }),
          url: await ctx.storage.fileUploads.getSignedDownloadEndpoint(
            file.path,
            file.filename,
            args.preview ? "inline" : "attachment",
          ),
        };
      } catch {
        return {
          result: RESULT.FAILURE,
        };
      }
    },
  },
);
