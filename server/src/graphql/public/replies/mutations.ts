import {
  booleanArg,
  idArg,
  list,
  mutationField,
  nonNull,
  nullable,
  objectType,
  stringArg,
} from "nexus";
import { isNonNullish, isNullish, unique } from "remeda";
import { assert } from "ts-essentials";
import { CreatePetitionFieldReply } from "../../../db/__types";
import { PetitionFieldOptions } from "../../../db/helpers/fieldOptions";
import { fieldReplyContent } from "../../../util/fieldReplyContent";
import { toGlobalId } from "../../../util/globalId";
import { random } from "../../../util/token";
import { RESULT } from "../../helpers/Result";
import { and, chain } from "../../helpers/authorize";
import { ApolloError } from "../../helpers/errors";
import { globalIdArg } from "../../helpers/globalIdPlugin";
import { validateAnd } from "../../helpers/validateArgs";
import { notEmptyArray } from "../../helpers/validators/notEmptyArray";
import {
  fieldCanBeReplied,
  fieldHasType,
  fieldTypeSwitch,
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
  organizationHasFeatureFlag,
  publicPetitionIsNotClosed,
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
    fieldIsExternal((args) => args.fields.map((f) => f.id)),
    replyIsForFieldOfType(
      (args) => args.fields.map((f) => f.parentReplyId).filter(isNonNullish),
      "FIELD_GROUP",
    ),
    and(
      publicPetitionIsNotClosed(),
      fieldBelongsToAccess((args) => args.fields.map((f) => f.id)),
      replyBelongsToAccess((args) => args.fields.map((f) => f.parentReplyId).filter(isNonNullish)),
    ),
  ),
  validateArgs: validateAnd(
    notEmptyArray((args) => args.fields, "fields"),
    validateCreatePetitionFieldReplyInput((args) => args.fields, "fields"),
  ),
  resolve: async (_, args, ctx) => {
    const fields = await ctx.petitions.loadField(unique(args.fields.map((field) => field.id)));

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
    and(
      publicPetitionIsNotClosed(),
      replyBelongsToAccess((args) => args.replies.map((r) => r.id)),
    ),
  ),
  validateArgs: validateAnd(
    notEmptyArray((args) => args.replies, "replies"),
    validateUpdatePetitionFieldReplyInput((args) => args.replies, "replies"),
  ),
  resolve: async (_, args, ctx) => {
    const replyIds = unique(args.replies.map((r) => r.id));
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
    replyCanBeDeleted("replyId"),
    replyBelongsToExternalField("replyId"),
    replyCanBeUpdated("replyId"),
    and(publicPetitionIsNotClosed(), replyBelongsToAccess("replyId")),
  ),
  args: {
    keycode: nonNull(idArg()),
    replyId: nonNull(globalIdArg("PetitionFieldReply")),
  },
  resolve: async (_, args, ctx) => {
    const { field, reply } = await ctx.petitions.deletePetitionFieldReply(
      args.replyId,
      ctx.access!,
    );

    if (reply.associated_profile_id) {
      const removedAssociation = await ctx.petitions.safeRemovePetitionProfileAssociation(
        ctx.access!.petition_id,
        reply.associated_profile_id,
      );
      if (removedAssociation) {
        await ctx.petitions.createEvent({
          type: "PROFILE_DISASSOCIATED",
          petition_id: removedAssociation.petition_id,
          data: {
            profile_id: removedAssociation.profile_id,
            petition_access_id: ctx.access!.id,
          },
        });
        const petition = await ctx.petitions.loadPetition(ctx.access!.petition_id);
        assert(petition, "Petition not found");
        await ctx.profiles.createEvent({
          type: "PETITION_DISASSOCIATED",
          profile_id: removedAssociation.profile_id,
          org_id: petition.org_id,
          data: {
            petition_id: removedAssociation.petition_id,
            petition_access_id: ctx.access!.id,
          },
        });
      }
    }

    return field;
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
    replyBelongsToExternalField("replyId"),
    replyIsForFieldOfType("replyId", "FILE_UPLOAD"),
    and(publicPetitionIsNotClosed(), replyBelongsToAccess("replyId")),
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
    password: nullable(
      stringArg({ description: "provide the password if the file is password-protected" }),
    ),
  },
  authorize: chain(
    authenticatePublicAccess("keycode"),
    fieldIsExternal("fieldId"),
    fieldHasType("fieldId", "FILE_UPLOAD"),
    fieldCanBeReplied((args) => ({ id: args.fieldId, parentReplyId: args.parentReplyId })),
    and(publicPetitionIsNotClosed(), fieldBelongsToAccess("fieldId")),
  ),
  validateArgs: validateCreateFileReplyInput(
    (args) => ({ id: args.fieldId, parentReplyId: args.parentReplyId, file: args.data }),
    "fieldId",
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
        password: args.password ? ctx.encryption.encrypt(args.password, "hex") : null,
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
      replyBelongsToExternalField("replyId"),
      replyIsForFieldOfType("replyId", [
        "FILE_UPLOAD",
        "ES_TAX_DOCUMENTS",
        "DOW_JONES_KYC",
        "ID_VERIFICATION",
      ]),
      replyBelongsToAccess("replyId"),
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
    fieldIsExternal("fieldId"),
    fieldHasType("fieldId", ["ES_TAX_DOCUMENTS", "ID_VERIFICATION"]),
    fieldTypeSwitch("fieldId", {
      ES_TAX_DOCUMENTS: and(
        organizationHasFeatureFlag("ES_TAX_DOCUMENTS_FIELD"),
        fieldCanBeReplied((args) => ({ id: args.fieldId, parentReplyId: args.parentReplyId })),
      ),
      ID_VERIFICATION: fieldCanBeReplied(
        (args) => ({ id: args.fieldId, parentReplyId: args.parentReplyId }),
        true,
      ),
    }),
    and(publicPetitionIsNotClosed(), fieldBelongsToAccess("fieldId")),
  ),
  resolve: async (_, { fieldId, parentReplyId }, ctx) => {
    const petition = await ctx.petitions.loadPetition(ctx.access!.petition_id);
    const field = await ctx.petitions.loadField(fieldId);

    assert(petition, "Petition not found");
    assert(field, "Field not found");

    if (field.type === "ES_TAX_DOCUMENTS") {
      const session = await ctx.bankflip.createSession(
        {
          petitionId: toGlobalId("Petition", petition!.id),
          orgId: toGlobalId("Organization", petition!.org_id),
          fieldId: toGlobalId("PetitionField", fieldId),
          accessId: toGlobalId("PetitionAccess", ctx.access!.id),
          parentReplyId: isNonNullish(parentReplyId)
            ? toGlobalId("PetitionFieldReply", parentReplyId)
            : null,
        },
        petition.recipient_locale,
      );

      return {
        type: "WINDOW",
        url: session.widgetLink,
      };
    } else if (field.type === "ID_VERIFICATION") {
      const options = field.options as PetitionFieldOptions["ID_VERIFICATION"];
      let integrationId = options.integrationId;

      if (isNullish(integrationId)) {
        const integrations = await ctx.integrations.loadIntegrationsByOrgId(
          petition.org_id,
          "ID_VERIFICATION",
        );

        integrationId = integrations.find((i) => i.is_default)?.id ?? integrations[0]?.id ?? null;

        if (isNullish(integrationId)) {
          throw new ApolloError(
            "An enabled integration is required for ID_VERIFICATION field",
            "MISSING_ID_VERIFICATION_INTEGRATION",
          );
        }
      }

      try {
        const session = await ctx.idVerification.createSession(
          options.config,
          {
            integrationId: toGlobalId("OrgIntegration", integrationId),
            petitionId: toGlobalId("Petition", petition.id),
            orgId: toGlobalId("Organization", petition.org_id),
            fieldId: toGlobalId("PetitionField", fieldId),
            accessId: toGlobalId("PetitionAccess", ctx.access!.id),
            parentReplyId: parentReplyId ? toGlobalId("PetitionFieldReply", parentReplyId) : null,
          },
          petition.recipient_locale,
        );

        return {
          type: "WINDOW",
          url: session.url,
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "unknown";
        throw new ApolloError(
          `Failed to create ID verification session: ${message}`,
          "ID_VERIFICATION_FAILED",
        );
      }
    }

    return null as never;
  },
});

export const publicRetryAsyncFieldCompletion = mutationField("publicRetryAsyncFieldCompletion", {
  description: "Retries the completion of error replies for an async field",
  type: "AsyncFieldCompletionResponse",
  args: {
    keycode: nonNull(idArg()),
    fieldId: nonNull(globalIdArg("PetitionField")),
    parentReplyId: globalIdArg("PetitionFieldReply"),
  },
  authorize: chain(
    authenticatePublicAccess("keycode"),
    fieldIsExternal("fieldId"),
    fieldHasType("fieldId", ["ES_TAX_DOCUMENTS"]),
    organizationHasFeatureFlag("ES_TAX_DOCUMENTS_FIELD"),
    and(publicPetitionIsNotClosed(), fieldBelongsToAccess("fieldId")),
  ),
  resolve: async (_, { fieldId, parentReplyId }, ctx) => {
    const petition = await ctx.petitions.loadPetition(ctx.access!.petition_id);
    assert(petition, "Petition not found");

    const session = await ctx.bankflip.createRetrySession(
      {
        petitionId: toGlobalId("Petition", petition.id),
        orgId: toGlobalId("Organization", petition.org_id),
        fieldId: toGlobalId("PetitionField", fieldId),
        accessId: toGlobalId("PetitionAccess", ctx.access!.id),
        parentReplyId: isNonNullish(parentReplyId)
          ? toGlobalId("PetitionFieldReply", parentReplyId)
          : null,
      },
      petition.recipient_locale,
    );

    return {
      type: "WINDOW",
      url: session.widgetLink,
    };
  },
});
