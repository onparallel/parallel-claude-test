import {
  booleanArg,
  floatArg,
  idArg,
  list,
  mutationField,
  nonNull,
  objectType,
  stringArg,
} from "nexus";
import { RESULT } from "../..";
import { random } from "../../../util/token";
import { and, chain } from "../../helpers/authorize";
import { globalIdArg } from "../../helpers/globalIdPlugin";
import { fileUploadInputMaxSize } from "../../helpers/validators/maxFileSize";
import {
  fieldCanBeReplied,
  fieldHasType,
  replyCanBeUpdated,
  replyIsForFieldOfType,
} from "../../petition/authorizers";
import { validateFieldReply, validateReplyUpdate } from "../../petition/validations";
import {
  authenticatePublicAccess,
  fieldBelongsToAccess,
  replyBelongsToAccess,
} from "../authorizers";

export const publicCreatePetitionFieldReply = mutationField("publicCreatePetitionFieldReply", {
  description: "Creates a reply on a petition field as recipient.",
  type: "PublicPetitionFieldReply",
  args: {
    keycode: nonNull(idArg()),
    fieldId: nonNull(globalIdArg("PetitionField")),
    reply: nonNull("JSON"),
  },
  authorize: chain(
    authenticatePublicAccess("keycode"),
    and(
      fieldBelongsToAccess("fieldId"),
      fieldHasType("fieldId", [
        "TEXT",
        "SHORT_TEXT",
        "SELECT",
        "PHONE",
        "NUMBER",
        "DYNAMIC_SELECT",
        "DATE",
        "CHECKBOX",
      ]),
      fieldCanBeReplied("fieldId")
    )
  ),
  validateArgs: validateFieldReply("fieldId", "reply", "reply"),
  resolve: async (_, args, ctx) => {
    const field = (await ctx.petitions.loadField(args.fieldId))!;
    return await ctx.petitions.createPetitionFieldReply(
      {
        petition_field_id: args.fieldId,
        petition_access_id: ctx.access!.id,
        type: field.type,
        content: { value: args.reply },
      },
      ctx.contact!
    );
  },
});

export const publicUpdatePetitionFieldReply = mutationField("publicUpdatePetitionFieldReply", {
  description: "Creates a reply on a petition field as recipient.",
  type: "PublicPetitionFieldReply",
  args: {
    keycode: nonNull(idArg()),
    replyId: nonNull(globalIdArg("PetitionFieldReply")),
    reply: nonNull("JSON"),
  },
  authorize: chain(
    authenticatePublicAccess("keycode"),
    and(
      replyBelongsToAccess("replyId"),
      replyIsForFieldOfType("replyId", [
        "TEXT",
        "SHORT_TEXT",
        "SELECT",
        "PHONE",
        "NUMBER",
        "DYNAMIC_SELECT",
        "DATE",
        "CHECKBOX",
      ]),
      replyCanBeUpdated("replyId")
    )
  ),
  validateArgs: validateReplyUpdate("replyId", "reply", "reply"),
  resolve: async (_, args, ctx) => {
    return await ctx.petitions.updatePetitionFieldReply(
      args.replyId,
      {
        petition_access_id: ctx.access!.id,
        user_id: null,
        content: { value: args.reply },
        status: "PENDING",
      },
      ctx.access!
    );
  },
});

export const publicDeletePetitionFieldReply = mutationField("publicDeletePetitionFieldReply", {
  description: "Deletes a reply to a petition field.",
  type: "PublicPetitionField",
  authorize: chain(
    authenticatePublicAccess("keycode"),
    replyBelongsToAccess("replyId"),
    replyCanBeUpdated("replyId")
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
    replyIsForFieldOfType("replyId", "FILE_UPLOAD")
  ),
  resolve: async (_, args, ctx) => {
    const reply = await ctx.petitions.loadFieldReply(args.replyId);
    if (reply?.type !== "FILE_UPLOAD") {
      throw new Error("Invalid");
    }
    const file = await ctx.files.loadFileUpload(reply.content["file_upload_id"]);
    // Try to get metadata
    await ctx.aws.fileUploads.getFileMetadata(file!.path);
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
  },
  authorize: chain(
    authenticatePublicAccess("keycode"),
    and(
      fieldBelongsToAccess("fieldId"),
      fieldHasType("fieldId", "FILE_UPLOAD"),
      fieldCanBeReplied("fieldId")
    )
  ),
  validateArgs: fileUploadInputMaxSize((args) => args.data, 50 * 1024 * 1024, "data"),
  resolve: async (_, args, ctx) => {
    const key = random(16);
    const { filename, size, contentType } = args.data;
    const file = await ctx.files.createFileUpload(
      {
        path: key,
        filename,
        size: size.toString(),
        content_type: contentType,
      },
      `Contact:${ctx.contact!.id}`
    );
    const [presignedPostData, reply] = await Promise.all([
      ctx.aws.fileUploads.getSignedUploadEndpoint(key, contentType, size),
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
    return { presignedPostData, reply };
  },
});

export const publicFileUploadReplyDownloadLink = mutationField(
  "publicFileUploadReplyDownloadLink",
  {
    description: "Generates a download link for a file reply on a public context.",
    type: "FileUploadDownloadLinkResult",
    authorize: chain(authenticatePublicAccess("keycode"), replyBelongsToAccess("replyId")),
    args: {
      keycode: nonNull(idArg()),
      replyId: nonNull(globalIdArg("PetitionFieldReply")),
      preview: booleanArg({
        description: "If true will use content-disposition inline instead of attachment",
      }),
    },
    resolve: async (_, args, ctx) => {
      try {
        const reply = await ctx.petitions.loadFieldReply(args.replyId);
        if (reply!.type !== "FILE_UPLOAD") {
          throw new Error("Invalid field type");
        }
        const file = await ctx.files.loadFileUpload(reply!.content["file_upload_id"]);
        if (!file) {
          throw new Error(`FileUpload not found with id ${reply!.content["file_upload_id"]}`);
        }
        if (!file.upload_complete) {
          await ctx.aws.fileUploads.getFileMetadata(file!.path);
          await ctx.files.markFileUploadComplete(file.id, `Contact:${ctx.access!.contact_id}`);
        }
        return {
          result: RESULT.SUCCESS,
          file: file.upload_complete
            ? file
            : await ctx.files.loadFileUpload(file.id, { refresh: true }),
          url: await ctx.aws.fileUploads.getSignedDownloadEndpoint(
            file!.path,
            file!.filename,
            args.preview ? "inline" : "attachment"
          ),
        };
      } catch {
        return {
          result: RESULT.FAILURE,
        };
      }
    },
  }
);

/** DEPRECATED MUTATIONS FROM HERE */

export const publicCreateSimpleReply = mutationField("publicCreateSimpleReply", {
  description: "Creates a reply to a text or select field.",
  deprecation: "use publicCreatePetitionFieldReply instead",
  type: "PublicPetitionFieldReply",
  args: {
    keycode: nonNull(idArg()),
    fieldId: nonNull(globalIdArg("PetitionField")),
    value: nonNull(stringArg()),
  },
  authorize: chain(
    authenticatePublicAccess("keycode"),
    and(
      fieldBelongsToAccess("fieldId"),
      fieldHasType("fieldId", ["TEXT", "SHORT_TEXT", "SELECT", "DATE"]),
      fieldCanBeReplied("fieldId")
    )
  ),
  validateArgs: validateFieldReply("fieldId", "value", "value"),
  resolve: async (_, args, ctx) => {
    const field = (await ctx.petitions.loadField(args.fieldId))!;
    return await ctx.petitions.createPetitionFieldReply(
      {
        petition_field_id: args.fieldId,
        petition_access_id: ctx.access!.id,
        type: field.type,
        content: { value: args.value },
      },
      ctx.contact!
    );
  },
});

export const publicUpdateSimpleReply = mutationField("publicUpdateSimpleReply", {
  description: "Updates a reply to a text or select field.",
  deprecation: "use publicUpdatePetitionFieldReply instead",
  type: "PublicPetitionFieldReply",
  args: {
    keycode: nonNull(idArg()),
    replyId: nonNull(globalIdArg("PetitionFieldReply")),
    value: nonNull(stringArg()),
  },
  authorize: chain(
    authenticatePublicAccess("keycode"),
    and(
      replyBelongsToAccess("replyId"),
      replyIsForFieldOfType("replyId", ["TEXT", "SHORT_TEXT", "SELECT", "DATE"]),
      replyCanBeUpdated("replyId")
    )
  ),
  validateArgs: validateReplyUpdate("replyId", "value", "value"),
  resolve: async (_, args, ctx) => {
    return await ctx.petitions.updatePetitionFieldReply(
      args.replyId,
      {
        petition_access_id: ctx.access!.id,
        user_id: null,
        content: { value: args.value },
        status: "PENDING",
      },
      ctx.access!
    );
  },
});

export const publicCreateNumericReply = mutationField("publicCreateNumericReply", {
  description: "Creates a reply to a numeric field.",
  deprecation: "use publicCreatePetitionFieldReply instead",
  type: "PublicPetitionFieldReply",
  args: {
    keycode: nonNull(idArg()),
    fieldId: nonNull(globalIdArg("PetitionField")),
    value: nonNull(floatArg()),
  },
  authorize: chain(
    authenticatePublicAccess("keycode"),
    and(
      fieldBelongsToAccess("fieldId"),
      fieldHasType("fieldId", ["NUMBER"]),
      fieldCanBeReplied("fieldId")
    )
  ),
  validateArgs: validateFieldReply("fieldId", "value", "value"),
  resolve: async (_, args, ctx) => {
    return await ctx.petitions.createPetitionFieldReply(
      {
        petition_field_id: args.fieldId,
        petition_access_id: ctx.access!.id,
        type: "NUMBER",
        content: { value: args.value },
      },
      ctx.contact!
    );
  },
});

export const publicUpdateNumericReply = mutationField("publicUpdateNumericReply", {
  description: "Updates a reply to a numeric field.",
  deprecation: "use publicUpdatePetitionFieldReply instead",
  type: "PublicPetitionFieldReply",
  args: {
    keycode: nonNull(idArg()),
    replyId: nonNull(globalIdArg("PetitionFieldReply")),
    value: nonNull(floatArg()),
  },
  authorize: chain(
    authenticatePublicAccess("keycode"),
    and(
      replyBelongsToAccess("replyId"),
      replyIsForFieldOfType("replyId", ["NUMBER"]),
      replyCanBeUpdated("replyId")
    )
  ),
  validateArgs: validateReplyUpdate("replyId", "value", "value"),
  resolve: async (_, args, ctx) => {
    return await ctx.petitions.updatePetitionFieldReply(
      args.replyId,
      {
        petition_access_id: ctx.access!.id,
        user_id: null,
        content: { value: args.value },
        status: "PENDING",
      },
      ctx.access!
    );
  },
});

export const publicCreateCheckboxReply = mutationField("publicCreateCheckboxReply", {
  description: "Creates a reply to a checkbox field.",
  deprecation: "use publicCreatePetitionFieldReply instead",
  type: "PublicPetitionFieldReply",
  args: {
    keycode: nonNull(idArg()),
    fieldId: nonNull(globalIdArg("PetitionField")),
    values: nonNull(list(nonNull(stringArg()))),
  },
  authorize: chain(
    authenticatePublicAccess("keycode"),
    and(
      fieldBelongsToAccess("fieldId"),
      fieldHasType("fieldId", ["CHECKBOX"]),
      fieldCanBeReplied("fieldId")
    )
  ),
  validateArgs: validateFieldReply("fieldId", "values", "values"),
  resolve: async (_, args, ctx) => {
    return await ctx.petitions.createPetitionFieldReply(
      {
        petition_field_id: args.fieldId,
        petition_access_id: ctx.access!.id,
        type: "CHECKBOX",
        content: { value: args.values },
      },
      ctx.contact!
    );
  },
});

export const publicUpdateCheckboxReply = mutationField("publicUpdateCheckboxReply", {
  description: "Updates a reply of checkbox field.",
  deprecation: "use publicUpdatePetitionFieldReply instead",
  type: "PublicPetitionFieldReply",
  args: {
    keycode: nonNull(idArg()),
    replyId: nonNull(globalIdArg("PetitionFieldReply")),
    values: nonNull(list(nonNull(stringArg()))),
  },
  authorize: chain(
    authenticatePublicAccess("keycode"),
    and(
      replyBelongsToAccess("replyId"),
      replyIsForFieldOfType("replyId", ["CHECKBOX"]),
      replyCanBeUpdated("replyId")
    )
  ),
  validateArgs: validateReplyUpdate("replyId", "values", "values"),
  resolve: async (_, args, ctx) => {
    return await ctx.petitions.updatePetitionFieldReply(
      args.replyId,
      {
        petition_access_id: ctx.access!.id,
        user_id: null,
        content: { value: args.values },
        status: "PENDING",
      },
      ctx.access!
    );
  },
});

export const publicCreateDynamicSelectReply = mutationField("publicCreateDynamicSelectReply", {
  description: "Creates a reply for a dynamic select field.",
  deprecation: "use publicCreatePetitionFieldReply instead",
  type: "PublicPetitionFieldReply",
  args: {
    keycode: nonNull(idArg()),
    fieldId: nonNull(globalIdArg("PetitionField")),
    value: nonNull(list(nonNull(list(stringArg())))),
  },
  authorize: chain(
    authenticatePublicAccess("keycode"),
    and(
      fieldBelongsToAccess("fieldId"),
      fieldHasType("fieldId", ["DYNAMIC_SELECT"]),
      fieldCanBeReplied("fieldId")
    )
  ),
  validateArgs: validateFieldReply("fieldId", "value", "value"),
  resolve: async (_, args, ctx) => {
    return await ctx.petitions.createPetitionFieldReply(
      {
        petition_field_id: args.fieldId,
        petition_access_id: ctx.access!.id,
        type: "DYNAMIC_SELECT",
        content: { value: args.value },
      },
      ctx.contact!
    );
  },
});

export const publicUpdateDynamicSelectReply = mutationField("publicUpdateDynamicSelectReply", {
  description: "Updates a reply for a dynamic select field.",
  deprecation: "use publicUpdatePetitionFieldReply instead",
  type: "PublicPetitionFieldReply",
  args: {
    keycode: nonNull(idArg()),
    replyId: nonNull(globalIdArg("PetitionFieldReply")),
    value: nonNull(list(nonNull(list(stringArg())))),
  },
  authorize: chain(
    authenticatePublicAccess("keycode"),
    and(
      replyBelongsToAccess("replyId"),
      replyIsForFieldOfType("replyId", "DYNAMIC_SELECT"),
      replyCanBeUpdated("replyId")
    )
  ),
  validateArgs: validateReplyUpdate("replyId", "value", "value"),
  resolve: async (_, args, ctx) => {
    return await ctx.petitions.updatePetitionFieldReply(
      args.replyId,
      {
        petition_access_id: ctx.access!.id,
        user_id: null,
        content: { value: args.value },
        status: "PENDING",
      },
      ctx.access!
    );
  },
});
