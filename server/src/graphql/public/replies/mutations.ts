import { booleanArg, idArg, list, mutationField, nonNull, objectType } from "nexus";
import { isDefined, uniq } from "remeda";
import { CreatePetitionFieldReply } from "../../../db/__types";
import { fieldReplyContent } from "../../../util/fieldReplyContent";
import { toGlobalId } from "../../../util/globalId";
import { random } from "../../../util/token";
import { RESULT } from "../../helpers/Result";
import { and, chain } from "../../helpers/authorize";
import { globalIdArg } from "../../helpers/globalIdPlugin";
import { validateAnd } from "../../helpers/validateArgs";
import { notEmptyArray } from "../../helpers/validators/notEmptyArray";
import { validFileUploadInput } from "../../helpers/validators/validFileUploadInput";
import {
  fieldCanBeReplied,
  fieldHasType,
  replyCanBeDeleted,
  replyCanBeUpdated,
  replyIsForFieldOfType,
} from "../../petition/authorizers";
import {
  validateCreateFileReplyInput,
  validateCreatePetitionFieldReplyInput,
  validateUpdatePetitionFieldReplyInput,
} from "../../petition/validations";
import {
  authenticatePublicAccess,
  fieldBelongsToAccess,
  fieldIsExternal,
  replyBelongsToAccess,
  replyBelongsToExternalField,
} from "../authorizers";

export const publicCreatePetitionFieldReplies = mutationField("publicCreatePetitionFieldReplies", {
  description: "Creates replies on a petition field as recipient.",
  type: list("PublicPetitionFieldReply"),
  args: {
    keycode: nonNull(idArg()),
    fields: nonNull(list(nonNull("CreatePetitionFieldReplyInput"))),
  },
  authorize: chain(
    authenticatePublicAccess("keycode"),
    and(
      fieldBelongsToAccess((args) => args.fields.map((f) => f.id)),
      fieldIsExternal((args) => args.fields.map((f) => f.id)),
      fieldHasType(
        (args) => args.fields.map((f) => f.id),
        [
          "TEXT",
          "SHORT_TEXT",
          "SELECT",
          "PHONE",
          "NUMBER",
          "DYNAMIC_SELECT",
          "DATE",
          "DATE_TIME",
          "CHECKBOX",
          "FIELD_GROUP",
        ],
      ),
      fieldCanBeReplied((args) => args.fields),
      replyIsForFieldOfType(
        (args) => args.fields.map((f) => f.parentReplyId).filter(isDefined),
        "FIELD_GROUP",
      ),
      replyBelongsToAccess((args) => args.fields.map((f) => f.parentReplyId).filter(isDefined)),
    ),
  ),
  validateArgs: validateAnd(
    notEmptyArray((args) => args.fields, "fields"),
    validateCreatePetitionFieldReplyInput((args) => args.fields, "fields"),
  ),
  resolve: async (_, args, ctx) => {
    const fields = await ctx.petitions.loadField(uniq(args.fields.map((field) => field.id)));

    const data: CreatePetitionFieldReply[] = args.fields.map((fieldReply) => {
      const field = fields.find((f) => f!.id === fieldReply.id)!;
      return {
        content: fieldReplyContent(field.type, fieldReply.content),
        petition_field_id: fieldReply.id,
        parent_petition_field_reply_id: fieldReply.parentReplyId ?? null,
        type: field.type,
        petition_access_id: ctx.access!.id,
      };
    });

    return await ctx.petitions.createPetitionFieldReply(
      ctx.access!.petition_id,
      data,
      `Contact:${ctx.contact!.id}`,
    );
  },
});

export const publicUpdatePetitionFieldReplies = mutationField("publicUpdatePetitionFieldReplies", {
  description: "Updates replies on a petition field as recipient.",
  type: list("PublicPetitionFieldReply"),
  args: {
    keycode: nonNull(idArg()),
    replies: nonNull(list(nonNull("UpdatePetitionFieldReplyInput"))),
  },
  authorize: chain(
    authenticatePublicAccess("keycode"),
    and(
      replyBelongsToAccess((args) => args.replies.map((r) => r.id)),
      replyBelongsToExternalField((args) => args.replies.map((r) => r.id)),
      replyIsForFieldOfType(
        (args) => args.replies.map((r) => r.id),
        [
          "TEXT",
          "SHORT_TEXT",
          "SELECT",
          "PHONE",
          "NUMBER",
          "DYNAMIC_SELECT",
          "DATE",
          "DATE_TIME",
          "CHECKBOX",
        ],
      ),
      replyCanBeUpdated((args) => args.replies.map((r) => r.id)),
    ),
  ),
  validateArgs: validateAnd(
    notEmptyArray((args) => args.replies, "replies"),
    validateUpdatePetitionFieldReplyInput((args) => args.replies, "replies"),
  ),
  resolve: async (_, args, ctx) => {
    const replyIds = uniq(args.replies.map((r) => r.id));
    const replies = await ctx.petitions.loadFieldReply(replyIds);

    const repliesInput = args.replies.map((replyData) => {
      const reply = replies.find((r) => r!.id === replyData.id)!;
      return {
        ...replyData,
        type: reply.type,
      };
    });

    return await ctx.petitions.updatePetitionFieldRepliesContent(
      ctx.access!.petition_id,
      repliesInput.map((replyData) => ({
        id: replyData.id,
        content: fieldReplyContent(replyData.type, replyData.content),
      })),
      ctx.access!,
    );
  },
});

export const publicDeletePetitionFieldReply = mutationField("publicDeletePetitionFieldReply", {
  description: "Deletes a reply to a petition field.",
  type: "PublicPetitionField",
  authorize: chain(
    authenticatePublicAccess("keycode"),
    replyBelongsToAccess("replyId"),
    replyBelongsToExternalField("replyId"),
    replyCanBeUpdated("replyId"),
    replyCanBeDeleted("replyId"),
  ),
  args: {
    keycode: nonNull(idArg()),
    replyId: nonNull(globalIdArg("PetitionFieldReply")),
  },
  resolve: async (_, args, ctx) => {
    return await ctx.petitions.deletePetitionFieldReply(args.replyId, ctx.access!);
  },
});

export const publicFileUploadReplyComplete = mutationField("publicFileUploadReplyComplete", {
  description: "Notifies the backend that the upload is complete.",
  type: "PublicPetitionFieldReply",
  args: {
    keycode: nonNull(idArg()),
    replyId: nonNull(globalIdArg("PetitionFieldReply")),
  },
  authorize: chain(
    authenticatePublicAccess("keycode"),
    replyBelongsToAccess("replyId"),
    replyBelongsToExternalField("replyId"),
    replyIsForFieldOfType("replyId", "FILE_UPLOAD"),
  ),
  resolve: async (_, args, ctx) => {
    const reply = (await ctx.petitions.loadFieldReply(args.replyId))!;
    const file = await ctx.files.loadFileUpload(reply.content["file_upload_id"]);
    // Try to get metadata
    await ctx.storage.fileUploads.getFileMetadata(file!.path);
    await ctx.files.markFileUploadComplete(file!.id, `Contact:${ctx.access!.contact_id}`);
    ctx.files.loadFileUpload.dataloader.clear(file!.id);
    return reply;
  },
});

export const publicCreateFileUploadReply = mutationField("publicCreateFileUploadReply", {
  description: "Creates a reply to a file upload field.",
  type: objectType({
    name: "PublicCreateFileUploadReply",
    definition(t) {
      t.field("presignedPostData", {
        type: "AWSPresignedPostData",
      });
      t.field("reply", { type: "PublicPetitionFieldReply" });
    },
  }),
  args: {
    keycode: nonNull(idArg()),
    fieldId: nonNull(globalIdArg("PetitionField")),
    data: nonNull("FileUploadInput"),
    parentReplyId: globalIdArg("PetitionFieldReply"),
  },
  authorize: chain(
    authenticatePublicAccess("keycode"),
    and(
      fieldBelongsToAccess("fieldId"),
      fieldIsExternal("fieldId"),
      fieldHasType("fieldId", "FILE_UPLOAD"),
      fieldCanBeReplied((args) => ({ id: args.fieldId, parentReplyId: args.parentReplyId })),
    ),
  ),
  validateArgs: validateAnd(
    validFileUploadInput((args) => args.data, { maxSizeBytes: 50 * 1024 * 1024 }, "data"),
    validateCreateFileReplyInput(
      (args) => [{ id: args.fieldId, parentReplyId: args.parentReplyId }],
      "fieldId",
    ),
  ),
  resolve: async (_, args, ctx) => {
    const key = random(16);
    const { filename, size, contentType } = args.data;
    const [file] = await ctx.files.createFileUpload(
      {
        path: key,
        filename,
        size: size.toString(),
        content_type: contentType,
      },
      `Contact:${ctx.contact!.id}`,
    );
    const [presignedPostData, [reply]] = await Promise.all([
      ctx.storage.fileUploads.getSignedUploadEndpoint(key, contentType, size),
      ctx.petitions.createPetitionFieldReply(
        ctx.access!.petition_id,
        {
          petition_field_id: args.fieldId,
          petition_access_id: ctx.access!.id,
          type: "FILE_UPLOAD",
          content: { file_upload_id: file.id },
          parent_petition_field_reply_id: args.parentReplyId ?? null,
        },
        `Contact:${ctx.contact!.id}`,
      ),
    ]);
    return { presignedPostData, reply };
  },
});

export const publicFileUploadReplyDownloadLink = mutationField(
  "publicFileUploadReplyDownloadLink",
  {
    description: "Generates a download link for a file reply on a public context.",
    type: "FileUploadDownloadLinkResult",
    authorize: chain(
      authenticatePublicAccess("keycode"),
      and(
        replyBelongsToAccess("replyId"),
        replyBelongsToExternalField("replyId"),
        replyIsForFieldOfType("replyId", ["FILE_UPLOAD", "ES_TAX_DOCUMENTS", "DOW_JONES_KYC"]),
      ),
    ),
    args: {
      keycode: nonNull(idArg()),
      replyId: nonNull(globalIdArg("PetitionFieldReply")),
      preview: booleanArg({
        description: "If true will use content-disposition inline instead of attachment",
      }),
    },
    resolve: async (_, args, ctx) => {
      try {
        const reply = (await ctx.petitions.loadFieldReply(args.replyId))!;
        const file = await ctx.files.loadFileUpload(reply!.content["file_upload_id"]);
        if (!file) {
          throw new Error(`FileUpload not found with id ${reply!.content["file_upload_id"]}`);
        }
        if (!file.upload_complete) {
          await ctx.storage.fileUploads.getFileMetadata(file!.path);
          await ctx.files.markFileUploadComplete(file.id, `Contact:${ctx.access!.contact_id}`);
        }
        return {
          result: RESULT.SUCCESS,
          file: file.upload_complete
            ? file
            : await ctx.files.loadFileUpload(file.id, { refresh: true }),
          url: await ctx.storage.fileUploads.getSignedDownloadEndpoint(
            file!.path,
            file!.filename,
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

export const publicStartAsyncFieldCompletion = mutationField("publicStartAsyncFieldCompletion", {
  description: "Starts the completion of an async field",
  type: objectType({
    name: "AsyncFieldCompletionResponse",
    definition(t) {
      t.string("type");
      t.string("url");
    },
  }),
  args: {
    keycode: nonNull(idArg()),
    fieldId: nonNull(globalIdArg("PetitionField")),
    parentReplyId: globalIdArg("PetitionFieldReply"),
  },
  authorize: chain(
    authenticatePublicAccess("keycode"),
    and(
      fieldBelongsToAccess("fieldId"),
      fieldIsExternal("fieldId"),
      fieldHasType("fieldId", ["ES_TAX_DOCUMENTS"]),
      fieldCanBeReplied((args) => ({ id: args.fieldId, parentReplyId: args.parentReplyId })),
    ),
  ),
  resolve: async (_, { fieldId, parentReplyId }, ctx) => {
    const petition = await ctx.petitions.loadPetition(ctx.access!.petition_id);
    const session = await ctx.bankflip.createSession({
      petitionId: toGlobalId("Petition", petition!.id),
      orgId: toGlobalId("Organization", petition!.org_id),
      fieldId: toGlobalId("PetitionField", fieldId),
      accessId: toGlobalId("PetitionAccess", ctx.access!.id),
      parentReplyId: isDefined(parentReplyId)
        ? toGlobalId("PetitionFieldReply", parentReplyId)
        : null,
    });

    return {
      type: "WINDOW",
      url: session.widgetLink,
    };
  },
});
