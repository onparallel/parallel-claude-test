import {
  arg,
  idArg,
  inputObjectType,
  list,
  mutationField,
  nonNull,
  objectType,
  stringArg,
} from "@nexus/schema";
import { prop } from "remeda";
import { random } from "../../util/token";
import { and, chain } from "../helpers/authorize";
import { WhitelistedError } from "../helpers/errors";
import { RESULT } from "../helpers/result";
import {
  commentsBelongsToAccess,
  fetchPetitionAccess,
  fieldBelongsToAccess,
  fieldHasType,
  replyBelongsToAccess,
} from "./authorizers";
import { notEmptyArray } from "../helpers/validators/notEmptyArray";
import { globalIdArg } from "../helpers/globalIdPlugin";
import { userIsCommentAuthor } from "../petition/mutations/authorizers";
import { toGlobalId } from "../../util/globalId";

export const publicDeletePetitionReply = mutationField(
  "publicDeletePetitionReply",
  {
    description: "Deletes a reply to a petition field.",
    type: "Result",
    authorize: chain(
      fetchPetitionAccess("keycode"),
      replyBelongsToAccess("replyId")
    ),
    args: {
      replyId: nonNull(globalIdArg("PetitionFieldReply")),
      keycode: nonNull(idArg()),
    },
    resolve: async (_, args, ctx) => {
      const reply = (await ctx.petitions.loadFieldReply(args.replyId))!;
      if (reply.status === "APPROVED") {
        throw new WhitelistedError(
          "Can't delete an approved reply",
          "INVALID_REPLY_STATUS"
        );
      }
      if (reply.type === "FILE_UPLOAD") {
        const file = await ctx.files.loadFileUpload(
          reply.content["file_upload_id"]
        );
        await Promise.all([
          ctx.files.deleteFileUpload(file!.id, ctx.contact!),
          ctx.aws.deleteFile(file!.path),
        ]);
      }
      await ctx.petitions.deletePetitionFieldReply(args.replyId, ctx.contact!);
      return RESULT.SUCCESS;
    },
  }
);

export const publicFileUploadReplyComplete = mutationField(
  "publicFileUploadReplyComplete",
  {
    description: "Notifies the backend that the upload is complete.",
    type: "PublicPetitionFieldReply",
    args: {
      keycode: nonNull(idArg()),
      replyId: nonNull(globalIdArg("PetitionFieldReply")),
    },
    authorize: chain(
      fetchPetitionAccess("keycode"),
      replyBelongsToAccess("replyId")
    ),
    resolve: async (_, args, ctx) => {
      const reply = await ctx.petitions.loadFieldReply(args.replyId);
      if (reply?.type !== "FILE_UPLOAD") {
        throw new Error("Invalid");
      }
      const file = await ctx.files.loadFileUpload(
        reply.content["file_upload_id"]
      );
      // Try to get metadata
      await ctx.aws.getFileMetadata(file!.path);
      await ctx.files.markFileUploadComplete(file!.id);
      return reply;
    },
  }
);

export const publicCreateFileUploadReply = mutationField(
  "publicCreateFileUploadReply",
  {
    description: "Creates a reply to a file upload field.",
    type: objectType({
      name: "CreateFileUploadReply",
      definition(t) {
        t.string("endpoint", {
          description: "Endpoint where to upload the file.",
        });
        t.field("reply", { type: "PublicPetitionFieldReply" });
      },
    }),
    args: {
      keycode: nonNull(idArg()),
      fieldId: nonNull(globalIdArg("PetitionField")),
      data: nonNull(
        inputObjectType({
          name: "CreateFileUploadReplyInput",
          definition(t) {
            t.nonNull.string("filename");
            t.nonNull.int("size");
            t.nonNull.string("contentType");
          },
        }).asArg()
      ),
    },
    authorize: chain(
      fetchPetitionAccess("keycode"),
      fieldBelongsToAccess("fieldId"),
      fieldHasType("fieldId", "FILE_UPLOAD")
    ),
    resolve: async (_, args, ctx) => {
      const key = random(16);
      const { filename, size, contentType } = args.data;
      const file = await ctx.files.createFileUpload(
        {
          path: key,
          filename,
          size,
          content_type: contentType,
        },
        `Contact:${ctx.contact!.id}`
      );
      const [endpoint, reply] = await Promise.all([
        ctx.aws.getSignedUploadEndpoint(key, contentType),
        ctx.petitions.createPetitionFieldReply(
          {
            petition_field_id: args.fieldId,
            petition_access_id: ctx.access!.id,
            type: "FILE_UPLOAD",
            content: { file_upload_id: file.id },
          },
          ctx.contact!
        ),
      ]);
      return { endpoint, reply };
    },
  }
);

export const publicCreateTextReply = mutationField("publicCreateTextReply", {
  description: "Creates a reply to a text field.",
  type: "PublicPetitionFieldReply",
  args: {
    keycode: nonNull(idArg()),
    fieldId: nonNull(globalIdArg("PetitionField")),
    data: nonNull(
      inputObjectType({
        name: "CreateTextReplyInput",
        definition(t) {
          t.nonNull.string("text");
        },
      }).asArg()
    ),
  },
  authorize: chain(
    fetchPetitionAccess("keycode"),
    fieldBelongsToAccess("fieldId"),
    fieldHasType("fieldId", "TEXT")
  ),
  resolve: async (_, args, ctx) => {
    const reply = await ctx.petitions.createPetitionFieldReply(
      {
        petition_field_id: args.fieldId,
        petition_access_id: ctx.access!.id,
        type: "TEXT",
        content: { text: args.data.text },
      },
      ctx.contact!
    );
    return reply;
  },
});

export const publicCreateSelectReply = mutationField(
  "publicCreateSelectReply",
  {
    description: "Creates a reply to a select field.",
    type: "PublicPetitionFieldReply",
    args: {
      keycode: nonNull(idArg()),
      fieldId: nonNull(globalIdArg("PetitionField")),
      // use the same input data as Text replies
      data: nonNull(arg({ type: "CreateTextReplyInput" })),
    },
    authorize: chain(
      fetchPetitionAccess("keycode"),
      fieldBelongsToAccess("fieldId"),
      fieldHasType("fieldId", "SELECT")
    ),
    resolve: async (_, args, ctx) => {
      const reply = await ctx.petitions.createPetitionFieldReply(
        {
          petition_field_id: args.fieldId,
          petition_access_id: ctx.access!.id,
          type: "SELECT",
          content: { text: args.data.text },
        },
        ctx.contact!
      );
      return reply;
    },
  }
);

export const publicCompletePetition = mutationField("publicCompletePetition", {
  description:
    "Marks a filled petition as COMPLETED. If the petition requires signature, starts the signing. Otherwise sends email to user.",
  type: "PublicPetition",
  args: {
    keycode: nonNull(idArg()),
  },
  authorize: fetchPetitionAccess("keycode"),
  resolve: async (_, args, ctx) => {
    const petition = await ctx.petitions.completePetition(
      ctx.access!.petition_id,
      ctx.access!.id
    );

    const signatureConfig = petition.signature_config as {
      contactIds: number[];
    };
    const requiresSignature =
      signatureConfig && signatureConfig.contactIds.length > 0;
    if (requiresSignature) {
      const signatureRequest = await ctx.petitions.createPetitionSignature(
        petition.id,
        petition.signature_config
      );
      await ctx.aws.enqueueMessages("signature-worker", {
        groupId: `signature-${toGlobalId("Petition", petition.id)}`,
        body: {
          type: "start-signature-process",
          payload: { petitionSignatureRequestId: signatureRequest.id },
        },
      });
    } else {
      await ctx.emails.sendPetitionCompletedEmail(petition.id, {
        accessIds: ctx.access!.id,
      });
    }
    ctx.analytics.trackEvent(
      "PETITION_COMPLETED",
      {
        access_id: ctx.access!.id,
        petition_id: petition.id,
        requiresSignature,
      },
      toGlobalId("User", ctx.access!.granter_id)
    );
    return petition;
  },
});

export const publicCreatePetitionFieldComment = mutationField(
  "publicCreatePetitionFieldComment",
  {
    description: "Create a petition field comment.",
    type: "PublicPetitionFieldComment",
    authorize: chain(
      fetchPetitionAccess("keycode"),
      fieldBelongsToAccess("petitionFieldId")
    ),
    args: {
      keycode: nonNull(idArg()),
      petitionFieldId: nonNull(globalIdArg("PetitionField")),
      content: nonNull(stringArg()),
    },
    resolve: async (_, args, ctx) => {
      const petitionId = ctx.access!.petition_id;
      const petition = (await ctx.petitions.loadPetition(petitionId))!;
      if (!petition.comments_enabled) {
        throw new WhitelistedError(
          "Comments are not enabled for this petition",
          "COMMENTS_NOT_ENABLED"
        );
      }
      return await ctx.petitions.createPetitionFieldCommentFromAccess(
        {
          petitionId: petitionId,
          petitionFieldId: args.petitionFieldId,
          petitionFieldReplyId: null,
          content: args.content,
        },
        ctx.access!
      );
    },
  }
);

export const publicDeletePetitionFieldComment = mutationField(
  "publicDeletePetitionFieldComment",
  {
    description: "Delete a petition field comment.",
    type: "Result",
    authorize: chain(
      fetchPetitionAccess("keycode"),
      and(
        fieldBelongsToAccess("petitionFieldId"),
        commentsBelongsToAccess("petitionFieldCommentId")
      )
    ),
    args: {
      keycode: nonNull(idArg()),
      petitionFieldId: nonNull(globalIdArg("PetitionField")),
      petitionFieldCommentId: nonNull(globalIdArg("PetitionFieldComment")),
    },
    resolve: async (_, args, ctx) => {
      await ctx.petitions.deletePetitionFieldCommentFromAccess(
        ctx.access!.petition_id,
        args.petitionFieldId,
        args.petitionFieldCommentId,
        ctx.access!
      );
      return RESULT.SUCCESS;
    },
  }
);

export const publicUpdatePetitionFieldComment = mutationField(
  "publicUpdatePetitionFieldComment",
  {
    description: "Update a petition field comment.",
    type: "PublicPetitionFieldComment",
    authorize: chain(
      fetchPetitionAccess("keycode"),
      and(
        fieldBelongsToAccess("petitionFieldId"),
        commentsBelongsToAccess("petitionFieldCommentId"),
        userIsCommentAuthor("petitionFieldCommentId")
      )
    ),
    args: {
      keycode: nonNull(idArg()),
      petitionFieldId: nonNull(globalIdArg("PetitionField")),
      petitionFieldCommentId: nonNull(globalIdArg("PetitionFieldComment")),
      content: nonNull(stringArg()),
    },
    resolve: async (_, args, ctx) => {
      return await ctx.petitions.updatePetitionFieldCommentFromContact(
        args.petitionFieldCommentId,
        args.content,
        ctx.contact!
      );
    },
  }
);

export const publicSubmitUnpublishedComments = mutationField(
  "publicSubmitUnpublishedComments",
  {
    description: "Submits all unpublished comments.",
    type: list(nonNull("PublicPetitionFieldComment")),
    authorize: chain(fetchPetitionAccess("keycode")),
    args: {
      keycode: nonNull(idArg()),
    },
    resolve: async (_, args, ctx) => {
      const {
        comments,
        userIds,
      } = await ctx.petitions.publishPetitionFieldCommentsForAccess(
        ctx.access!.petition_id,
        ctx.access!
      );
      await ctx.emails.sendPetitionCommentsUserNotificationEmail(
        ctx.access!.petition_id,
        ctx.access!.id,
        userIds,
        comments.map(prop("id")),
        false
      );
      return comments;
    },
  }
);

export const publicMarkPetitionFieldCommentsAsRead = mutationField(
  "publicMarkPetitionFieldCommentsAsRead",
  {
    description: "Marks the specified comments as read.",
    type: list(nonNull("PublicPetitionFieldComment")),
    authorize: chain(
      fetchPetitionAccess("keycode"),
      commentsBelongsToAccess("petitionFieldCommentIds")
    ),
    args: {
      keycode: nonNull(idArg()),
      petitionFieldCommentIds: nonNull(
        list(nonNull(globalIdArg("PetitionFieldComment")))
      ),
    },
    validateArgs: notEmptyArray(
      prop("petitionFieldCommentIds"),
      "petitionFieldCommentIds"
    ),
    resolve: async (_, args, ctx) => {
      return await ctx.petitions.markPetitionFieldCommentsAsReadForAccess(
        args.petitionFieldCommentIds,
        ctx.access!.id
      );
    },
  }
);
