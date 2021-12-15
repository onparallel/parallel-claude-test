import { differenceInDays } from "date-fns";
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
import { countBy, isDefined, omit } from "remeda";
import { getClientIp } from "request-ip";
import { ApiContext } from "../../context";
import { PetitionSignatureConfigSigner } from "../../db/repositories/PetitionRepository";
import { Petition } from "../../db/__types";
import { toGlobalId } from "../../util/globalId";
import { stallFor } from "../../util/promises/stallFor";
import { random } from "../../util/token";
import { Maybe } from "../../util/types";
import { and, chain, checkClientServerToken } from "../helpers/authorize";
import { InvalidOptionError, WhitelistedError } from "../helpers/errors";
import { globalIdArg } from "../helpers/globalIdPlugin";
import { jsonArg } from "../helpers/json";
import { presendPetition } from "../helpers/presendPetition";
import { RESULT } from "../helpers/result";
import { fileUploadInputMaxSize } from "../helpers/validators/maxFileSize";
import { notEmptyArray } from "../helpers/validators/notEmptyArray";
import { validEmail } from "../helpers/validators/validEmail";
import { validRichTextContent } from "../helpers/validators/validRichTextContent";
import {
  fieldCanBeReplied,
  fieldAttachmentBelongsToField,
  fieldHasType,
  fieldsHaveCommentsEnabled,
  replyCanBeUpdated,
  replyIsForFieldOfType,
} from "../petition/authorizers";
import { validateCheckboxReplyValues, validateDynamicSelectReplyValues } from "../utils";
import {
  authenticatePublicAccess,
  commentsBelongsToAccess,
  fetchPetitionAccess,
  fieldBelongsToAccess,
  getContactAuthCookieValue,
  replyBelongsToAccess,
  validPublicPetitionLinkSlug,
} from "./authorizers";

function anonymizePart(part: string) {
  return part.length > 2
    ? part[0] + "*".repeat(part.length - 2) + part[part.length - 1]
    : part[0] + "*".repeat(part.length - 1);
}

function anonymizeEmail(email: string) {
  const [, local, domain] = email.match(/^(.+)@(.+)$/)!;
  const match = domain.match(/(^[^\.]*)\.(.*)$/);
  const _domain = match ? anonymizePart(match[1]) + "." + match[2] : anonymizePart(domain);
  return anonymizePart(local) + "@" + _domain;
}

export const verifyPublicAccess = mutationField("verifyPublicAccess", {
  type: objectType({
    name: "PublicAccessVerification",
    definition(t) {
      t.boolean("isAllowed");
      t.nullable.string("cookieName");
      t.nullable.string("cookieValue");
      t.nullable.string("email");
      t.nullable.string("orgLogoUrl");
      t.nullable.string("orgName");
      t.nullable.field("tone", {
        type: "Tone",
      });
    },
  }),
  authorize: chain(checkClientServerToken("token"), fetchPetitionAccess("keycode")),
  args: {
    token: nonNull(idArg()),
    keycode: nonNull(idArg()),
    ip: stringArg(),
    userAgent: stringArg(),
  },
  resolve: async (_, args, ctx) => {
    const petition = (await ctx.petitions.loadPetition(ctx.access!.petition_id))!;
    if (petition.skip_forward_security) {
      await ctx.petitions.createEvent({
        type: "ACCESS_OPENED",
        petition_id: ctx.access!.petition_id,
        data: {
          petition_access_id: ctx.access!.id,
        },
      });
      return { isAllowed: true };
    }
    const logEntry = {
      ip: args.ip ?? null,
      userAgent: args.userAgent ?? null,
    };
    const contactId = ctx.contact!.id;
    if (await ctx.contacts.hasContactAuthentication(contactId)) {
      const cookieValue = getContactAuthCookieValue(ctx.req, contactId);
      const authenticationId = cookieValue
        ? await ctx.contacts.verifyContact(contactId, cookieValue)
        : null;
      if (authenticationId) {
        await ctx.petitions.createEvent({
          type: "ACCESS_OPENED",
          petition_id: ctx.access!.petition_id,
          data: {
            petition_access_id: ctx.access!.id,
          },
        });
        await ctx.contacts.addContactAuthenticationLogAccessEntry(authenticationId, logEntry);
        return { isAllowed: true };
      } else {
        const [org, logoUrl] = await Promise.all([
          ctx.organizations.loadOrg(ctx.contact!.org_id),
          ctx.organizations.getOrgLogoUrl(ctx.contact!.org_id),
        ]);
        return {
          isAllowed: false,
          email: anonymizeEmail(ctx.contact!.email),
          orgName: org!.name,
          orgLogoUrl: logoUrl,
          tone: org!.preferred_tone,
        };
      }
    } else {
      await ctx.petitions.createEvent({
        type: "ACCESS_OPENED",
        petition_id: ctx.access!.petition_id,
        data: {
          petition_access_id: ctx.access!.id,
        },
      });
      const { cookieValue, contactAuthentication } = await ctx.contacts.createContactAuthentication(
        contactId
      );
      await ctx.contacts.addContactAuthenticationLogAccessEntry(contactAuthentication.id, logEntry);
      return {
        isAllowed: true,
        cookieName: `parallel_contact_auth_${toGlobalId("Contact", contactId)}`,
        cookieValue,
      };
    }
  },
});

export const publicSendVerificationCode = mutationField("publicSendVerificationCode", {
  type: objectType({
    name: "VerificationCodeRequest",
    definition(t) {
      t.id("token");
      t.datetime("expiresAt");
      t.int("remainingAttempts");
    },
  }),
  authorize: fetchPetitionAccess("keycode"),
  args: {
    keycode: nonNull(idArg()),
  },
  resolve: async (_, args, ctx) => {
    return await stallFor(async function () {
      const { token, request } = await ctx.contacts.createContactAuthenticationRequest({
        petition_access_id: ctx.access!.id,
        user_agent: ctx.req!.headers["user-agent"] ?? null,
        ip: getClientIp(ctx.req),
      });
      await ctx.emails.sendContactAuthenticationRequestEmail(request.id);
      return {
        token,
        expiresAt: request.expires_at,
        remainingAttempts: request.remaining_attempts,
      };
    }, 2000);
  },
});

export const publicCheckVerificationCode = mutationField("publicCheckVerificationCode", {
  type: objectType({
    name: "VerificationCodeCheck",
    definition(t) {
      t.field("result", { type: "Result" });
      t.nullable.int("remainingAttempts");
    },
  }),
  authorize: fetchPetitionAccess("keycode"),
  args: {
    keycode: nonNull(idArg()),
    token: nonNull(idArg()),
    code: nonNull(stringArg()),
  },
  resolve: async (_, args, ctx) => {
    return await stallFor(async function () {
      try {
        const result = await ctx.contacts.verifyContactAuthenticationRequest(
          ctx.access!.id,
          args.token,
          args.code
        );
        const { contactAuthentication, cookieValue } =
          await ctx.contacts.createContactAuthentication(ctx.contact!.id);
        await ctx.contacts.addContactAuthenticationLogAccessEntry(contactAuthentication.id, {
          ip: getClientIp(ctx.req),
          userAgent: ctx.req.headers["user-agent"] ?? null,
        });
        if (result.success) {
          ctx.req.res?.cookie(
            `parallel_contact_auth_${toGlobalId("Contact", ctx.contact!.id)}`,
            cookieValue,
            {
              path: "/",
              httpOnly: true,
              sameSite: "lax",
              secure: process.env.NODE_ENV === "production",
              maxAge: 60 * 60 * 24 * 365 * 10,
            }
          );
        }
        return {
          result: result.success ? RESULT.SUCCESS : RESULT.FAILURE,
          remainingAttempts: result.remainingAttempts,
        };
      } catch (e: any) {
        throw new WhitelistedError("INVALID_TOKEN", "The token is no longer valid");
      }
    }, 2000);
  },
});

export const publicDeletePetitionReply = mutationField("publicDeletePetitionReply", {
  description: "Deletes a reply to a petition field.",
  type: "Result",
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
    await ctx.petitions.deletePetitionFieldReply(args.replyId, `Contact:${ctx.contact!.id}`);
    return RESULT.SUCCESS;
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

export const publicCreateSimpleReply = mutationField("publicCreateSimpleReply", {
  description: "Creates a reply to a text or select field.",
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
      fieldHasType("fieldId", ["TEXT", "SHORT_TEXT", "SELECT"]),
      fieldCanBeReplied("fieldId")
    )
  ),
  validateArgs: async (_, args, ctx, info) => {
    const field = (await ctx.petitions.loadField(args.fieldId))!;
    if (field.type === "SELECT") {
      const options = field.options.values as Maybe<string[]>;
      if (!options?.includes(args.value)) {
        throw new InvalidOptionError(info, "reply", "Invalid option");
      }
    }
  },
  resolve: async (_, args, ctx) => {
    const field = (await ctx.petitions.loadField(args.fieldId))!;
    return await ctx.petitions.createPetitionFieldReply(
      {
        petition_field_id: args.fieldId,
        petition_access_id: ctx.access!.id,
        type: field.type,
        content: { text: args.value },
      },
      ctx.contact!
    );
  },
});

export const publicUpdateSimpleReply = mutationField("publicUpdateSimpleReply", {
  description: "Updates a reply to a text or select field.",
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
      replyIsForFieldOfType("replyId", ["TEXT", "SHORT_TEXT", "SELECT"]),
      replyCanBeUpdated("replyId")
    )
  ),
  validateArgs: async (_, args, ctx, info) => {
    const field = (await ctx.petitions.loadFieldForReply(args.replyId))!;
    if (field.type === "SELECT") {
      const options = field.options.values as Maybe<string[]>;
      if (!options?.includes(args.value)) {
        throw new InvalidOptionError(info, "value", "Invalid option");
      }
    }
  },
  resolve: async (_, args, ctx) => {
    return await ctx.petitions.updatePetitionFieldReply(
      args.replyId,
      { content: { text: args.value }, status: "PENDING" },
      ctx.access!
    );
  },
});

export const publicCreateCheckboxReply = mutationField("publicCreateCheckboxReply", {
  description: "Creates a reply to a checkbox field.",
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
  validateArgs: async (_, args, ctx, info) => {
    try {
      const field = (await ctx.petitions.loadField(args.fieldId))!;
      validateCheckboxReplyValues(field, args.values);
    } catch (error: any) {
      throw new InvalidOptionError(info, "values", error.message);
    }
  },
  resolve: async (_, args, ctx) => {
    return await ctx.petitions.createPetitionFieldReply(
      {
        petition_field_id: args.fieldId,
        petition_access_id: ctx.access!.id,
        type: "CHECKBOX",
        content: { choices: args.values },
      },
      ctx.contact!
    );
  },
});

export const publicUpdateCheckboxReply = mutationField("publicUpdateCheckboxReply", {
  description: "Updates a reply of checkbox field.",
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
  validateArgs: async (_, args, ctx, info) => {
    try {
      const field = (await ctx.petitions.loadFieldForReply(args.replyId))!;
      validateCheckboxReplyValues(field, args.values);
    } catch (error: any) {
      throw new InvalidOptionError(info, "values", error.message);
    }
  },
  resolve: async (_, args, ctx) => {
    return await ctx.petitions.updatePetitionFieldReply(
      args.replyId,
      {
        content: { choices: args.values },
        status: "PENDING",
      },
      ctx.access!
    );
  },
});

export const publicCreateDynamicSelectReply = mutationField("publicCreateDynamicSelectReply", {
  description: "Creates a reply for a dynamic select field.",
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
  validateArgs: async (_, args, ctx, info) => {
    try {
      const field = (await ctx.petitions.loadField(args.fieldId))!;
      validateDynamicSelectReplyValues(field, args.value);
    } catch (error: any) {
      throw new InvalidOptionError(info, "value", error.message);
    }
  },
  resolve: async (_, args, ctx) => {
    return await ctx.petitions.createPetitionFieldReply(
      {
        petition_field_id: args.fieldId,
        petition_access_id: ctx.access!.id,
        type: "DYNAMIC_SELECT",
        content: { columns: args.value },
      },
      ctx.contact!
    );
  },
});

export const publicUpdateDynamicSelectReply = mutationField("publicUpdateDynamicSelectReply", {
  description: "Updates a reply for a dynamic select field.",
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
  validateArgs: async (_, args, ctx, info) => {
    try {
      const field = (await ctx.petitions.loadFieldForReply(args.replyId))!;
      validateDynamicSelectReplyValues(field, args.value);
    } catch (error: any) {
      throw new InvalidOptionError(info, "reply", error.message);
    }
  },
  resolve: async (_, args, ctx) => {
    return await ctx.petitions.updatePetitionFieldReply(
      args.replyId,
      {
        content: { columns: args.value },
        status: "PENDING",
      },
      ctx.access!
    );
  },
});

export const publicCompletePetition = mutationField("publicCompletePetition", {
  description: `
    Marks a filled petition as COMPLETED.
    If the petition does not require a review, starts the signing process. Otherwise sends email to user.`,
  type: "PublicPetition",
  args: {
    keycode: nonNull(idArg()),
    additionalSigners: list(nonNull("PublicPetitionSignerDataInput")),
    message: nullable("String"),
  },
  authorize: authenticatePublicAccess("keycode"),
  resolve: async (_, args, ctx) => {
    let petition = await ctx.petitions.completePetition(ctx.access!.petition_id, ctx.access!.id);

    if (petition.signature_config?.review === false) {
      const updatedPetition = await publicStartSignatureRequest(
        petition,
        args.additionalSigners ?? [],
        args.message ?? null,
        ctx
      );
      petition = updatedPetition ?? petition;
    } else {
      await ctx.emails.sendPetitionCompletedEmail(petition.id, {
        accessId: ctx.access!.id,
      });
    }
    return petition;
  },
});

export const publicCreatePetitionFieldComment = mutationField("publicCreatePetitionFieldComment", {
  description: "Create a petition field comment.",
  type: "PublicPetitionFieldComment",
  authorize: chain(
    authenticatePublicAccess("keycode"),
    and(fieldBelongsToAccess("petitionFieldId"), fieldsHaveCommentsEnabled("petitionFieldId"))
  ),
  args: {
    keycode: nonNull(idArg()),
    petitionFieldId: nonNull(globalIdArg("PetitionField")),
    content: nonNull(stringArg()),
  },
  resolve: async (_, args, ctx) => {
    const petitionId = ctx.access!.petition_id;
    return await ctx.petitions.createPetitionFieldCommentFromAccess(
      {
        petitionId: petitionId,
        petitionFieldId: args.petitionFieldId,
        content: args.content,
      },
      ctx.access!
    );
  },
});

export const publicDeletePetitionFieldComment = mutationField("publicDeletePetitionFieldComment", {
  description: "Delete a petition field comment.",
  type: "Result",
  authorize: chain(
    authenticatePublicAccess("keycode"),
    and(fieldBelongsToAccess("petitionFieldId"), commentsBelongsToAccess("petitionFieldCommentId"))
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
});

export const publicUpdatePetitionFieldComment = mutationField("publicUpdatePetitionFieldComment", {
  description: "Update a petition field comment.",
  type: "PublicPetitionFieldComment",
  authorize: chain(
    authenticatePublicAccess("keycode"),
    and(fieldBelongsToAccess("petitionFieldId"), commentsBelongsToAccess("petitionFieldCommentId"))
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
});

export const publicMarkPetitionFieldCommentsAsRead = mutationField(
  "publicMarkPetitionFieldCommentsAsRead",
  {
    description: "Marks the specified comments as read.",
    type: list(nonNull("PublicPetitionFieldComment")),
    authorize: chain(
      authenticatePublicAccess("keycode"),
      commentsBelongsToAccess("petitionFieldCommentIds")
    ),
    args: {
      keycode: nonNull(idArg()),
      petitionFieldCommentIds: nonNull(list(nonNull(globalIdArg("PetitionFieldComment")))),
    },
    validateArgs: notEmptyArray((args) => args.petitionFieldCommentIds, "petitionFieldCommentIds"),
    resolve: async (_, args, ctx) => {
      return await ctx.petitions.markPetitionFieldCommentsAsReadForAccess(
        args.petitionFieldCommentIds,
        ctx.access!.id
      );
    },
  }
);

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

export const publicDelegateAccessToContact = mutationField("publicDelegateAccessToContact", {
  description:
    "Lets a recipient delegate access to the petition to another contact in the same organization",
  type: nonNull("PublicPetitionAccess"),
  args: {
    keycode: nonNull(idArg()),
    email: nonNull(stringArg()),
    firstName: nonNull(stringArg()),
    lastName: nonNull(stringArg()),
    messageBody: nonNull(jsonArg()),
  },
  authorize: authenticatePublicAccess("keycode"),
  validateArgs: validRichTextContent((args) => args.messageBody, "messageBody"),
  resolve: async (_, args, ctx) => {
    const access = ctx.access!;
    const recipient = ctx.contact!;
    const petitionId = access.petition_id;

    const [contactToDelegate] = await ctx.contacts.loadOrCreate(
      {
        email: args.email,
        orgId: recipient.org_id,
        firstName: args.firstName,
        lastName: args.lastName,
      },
      `Contact:${recipient.id}`
    );

    try {
      const newAccess = await ctx.petitions.createAccessFromRecipient(
        petitionId,
        access.granter_id,
        contactToDelegate.id,
        recipient
      );

      await Promise.all([
        ctx.emails.sendAccessDelegatedEmail(petitionId, access.id, newAccess.id, args.messageBody),
        ctx.petitions.createEvent({
          type: "ACCESS_DELEGATED",
          petition_id: petitionId,
          data: {
            petition_access_id: access.id,
            new_petition_access_id: newAccess.id,
          },
        }),
      ]);

      return newAccess;
    } catch (error: any) {
      // if the access already exists, just send the email
      if (error.constraint === "petition_access__petition_id_contact_id") {
        const petitionAccesses = await ctx.petitions.loadAccessesForPetition(petitionId);

        const contactAccess = petitionAccesses.find((a) => a.contact_id === contactToDelegate!.id)!;

        await ctx.emails.sendAccessDelegatedEmail(
          petitionId,
          access.id,
          contactAccess.id,
          args.messageBody
        );

        return contactAccess;
      } else {
        throw error;
      }
    }
  },
});

async function publicStartSignatureRequest(
  petition: Petition,
  additionalSignersInfo: Omit<PetitionSignatureConfigSigner, "contactId">[], // additional signers don't have a contactId
  message: string | null,
  ctx: ApiContext
) {
  let updatedPetition = null;
  const userSigners = petition.signature_config.signersInfo as PetitionSignatureConfigSigner[];

  if (userSigners.length === 0 && additionalSignersInfo.length === 0) {
    throw new Error(`Can't complete Petition:${petition.id}. Signer info is not specified.`);
  }

  if (additionalSignersInfo.length > 0 && isDefined(petition.signature_config)) {
    [updatedPetition] = await ctx.petitions.updatePetition(
      petition.id,
      {
        signature_config: {
          ...petition.signature_config,
          // save the signer info specified by the recipient, so we can show this later on recipient view
          additionalSignersInfo,
        },
      },
      `Contact:${ctx.contact!.id}`
    );
  }

  const previousSignatureRequests = await ctx.petitions.loadPetitionSignaturesByPetitionId(
    petition.id
  );

  // avoid recipients restarting the signature process too many times
  if (countBy(previousSignatureRequests, (r) => r.cancel_reason === "REQUEST_RESTARTED") >= 20) {
    throw new Error(`Signature request on Petition:${petition.id} was restarted too many times`);
  }

  const enqueuedSignatureRequest = previousSignatureRequests.find((r) => r.status === "ENQUEUED");
  // ENQUEUED signature requests cannot be cancelled because those still don't have an external_id
  if (enqueuedSignatureRequest) {
    throw new WhitelistedError(
      `Can't cancel enqueued PetitionSignatureRequest:${enqueuedSignatureRequest.id}`,
      "CANCEL_ENQUEUED_SIGNATURE_REQUEST_ERROR"
    );
  }
  const pendingSignatureRequest = previousSignatureRequests.find((r) => r.status === "PROCESSING");

  // cancel pending signature request before starting a new one
  if (pendingSignatureRequest) {
    await Promise.all([
      ctx.petitions.cancelPetitionSignatureRequest(
        pendingSignatureRequest.id,
        "REQUEST_RESTARTED",
        {
          canceller_id: ctx.contact!.id,
        }
      ),
      ctx.petitions.createEvent({
        type: "SIGNATURE_CANCELLED",
        petition_id: petition.id,
        data: {
          petition_signature_request_id: pendingSignatureRequest.id,
          cancel_reason: "REQUEST_RESTARTED",
          cancel_data: {
            canceller_id: ctx.contact!.id,
          },
        },
      }),
      ctx.aws.enqueueMessages("signature-worker", {
        groupId: `signature-${toGlobalId("Petition", pendingSignatureRequest.petition_id)}`,
        body: {
          type: "cancel-signature-process",
          payload: { petitionSignatureRequestId: pendingSignatureRequest.id },
        },
      }),
    ]);
  }

  const signatureRequest = await ctx.petitions.createPetitionSignature(petition.id, {
    ...(omit(petition.signature_config, ["additionalSignersInfo"]) as any),
    signersInfo: userSigners.concat(additionalSignersInfo),
    message,
  });

  await Promise.all([
    ctx.aws.enqueueMessages("signature-worker", {
      groupId: `signature-${toGlobalId("Petition", petition.id)}`,
      body: {
        type: "start-signature-process",
        payload: { petitionSignatureRequestId: signatureRequest.id },
      },
    }),
    ctx.petitions.createEvent({
      type: "SIGNATURE_STARTED",
      petition_id: petition.id,
      data: {
        petition_signature_request_id: signatureRequest.id,
      },
    }),
  ]);

  return updatedPetition;
}

export const publicPetitionFieldAttachmentDownloadLink = mutationField(
  "publicPetitionFieldAttachmentDownloadLink",
  {
    description: "Generates a download link for a field attachment on a public context.",
    type: "FileUploadDownloadLinkResult",
    authorize: chain(
      authenticatePublicAccess("keycode"),
      and(fieldBelongsToAccess("fieldId"), fieldAttachmentBelongsToField("fieldId", "attachmentId"))
    ),
    args: {
      keycode: nonNull(idArg()),
      fieldId: nonNull(globalIdArg("PetitionField")),
      attachmentId: nonNull(globalIdArg("PetitionFieldAttachment")),
      preview: booleanArg({
        description: "If true will use content-disposition inline instead of attachment",
      }),
    },
    resolve: async (_, args, ctx) => {
      try {
        const attachment = await ctx.petitions.loadFieldAttachment(args.attachmentId);

        if (!attachment) {
          throw new Error(`Can't load PetitionFieldAttachment with id ${args.attachmentId}`);
        }

        const file = await ctx.files.loadFileUpload(attachment.file_upload_id);
        if (!file) {
          throw new Error(`FileUpload not found with id ${attachment.file_upload_id}`);
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

export const publicOptOutReminders = mutationField("publicOptOutReminders", {
  description: "Cancel a reminder for a contact.",
  type: "PublicPetitionAccess",
  authorize: authenticatePublicAccess("keycode"),
  args: {
    keycode: nonNull(idArg()),
    reason: nonNull(stringArg()),
    other: nonNull(stringArg()),
    referer: nullable(stringArg()),
  },
  resolve: async (_, args, ctx) => {
    const petitionId = ctx.access!.petition_id;
    const access = ctx.access!;

    if (!access.reminders_opt_out) {
      ctx.petitions.createEvent({
        type: "REMINDERS_OPT_OUT",
        petition_id: petitionId,
        data: {
          petition_access_id: access!.id,
          reason: args.reason,
          other: args.other,
          referer: args.referer,
        },
      });
    }

    return (await ctx.petitions.optOutReminders([access!.id]))[0];
  },
});

export const publicCreateAndSendPetitionFromPublicLink = mutationField(
  "publicCreateAndSendPetitionFromPublicLink",
  {
    description:
      "Creates and sends the petition linked to the PublicPetitionLink to the contact passed in args",
    type: "Result",
    args: {
      slug: nonNull(idArg()),
      contactFirstName: nonNull(stringArg()),
      contactLastName: nonNull(stringArg()),
      contactEmail: nonNull(stringArg()),
      force: nullable(
        booleanArg({
          description:
            "Set to true to force the creation + send of a new petition if the contact already has an active access on this public link",
        })
      ),
    },
    authorize: validPublicPetitionLinkSlug("slug"),
    validateArgs: validEmail((args) => args.contactEmail, "contactEmail"),
    resolve: async (_, args, ctx) => {
      const link = (await ctx.petitions.loadPublicPetitionLinkBySlug(args.slug))!;
      if (
        !args.force &&
        (await ctx.petitions.contactHasAccessFromPublicPetitionLink(args.contactEmail, link.id))
      ) {
        throw new WhitelistedError(
          "Contact already has access on this link.",
          "PUBLIC_LINK_ACCESS_ALREADY_CREATED_ERROR"
        );
      }

      const owner = await ctx.users.loadUser(link.owner_id);
      if (!isDefined(owner)) {
        throw new Error(`User not found for public_petition_link.owner_id ${link.owner_id}`);
      }

      const { messages, result } = await ctx.petitions.withTransaction(async (t) => {
        const [petition, [contact]] = await Promise.all([
          ctx.petitions.clonePetition(
            link!.template_id,
            owner,
            {
              is_template: false,
              status: "DRAFT",
              from_public_petition_link_id: link.id,
            },
            `PublicPetitionLink:${link.id}`,
            t
          ),
          ctx.contacts.loadOrCreate(
            {
              email: args.contactEmail,
              firstName: args.contactFirstName,
              lastName: args.contactLastName,
              orgId: owner!.org_id,
            },
            `PublicPetitionLink:${link.id}`,
            t
          ),
        ]);

        const [{ result, messages, error }] = await presendPetition(
          [[petition, [contact.id]]],
          {
            subject: petition.email_subject ?? link!.title,
            body: JSON.parse(petition.email_body!),
            remindersConfig: petition.reminders_config ?? null,
          },
          owner!,
          true,
          ctx,
          new Date(),
          t
        );

        // don't do in parallel with presend so the owner gets created before any possible default permission
        await ctx.petitions.createPermissionsFromTemplateDefaultPermissions(
          petition.id,
          link.template_id,
          `PublicPetitionLink:${link.id}`,
          t
        );

        if (error) throw error; // transaction rollback

        return { messages: messages ?? [], result };
      });

      // trigger emails and events
      // in this case the messages array should always have one unscheduled message, so there is no need to check what to send
      if (result === "SUCCESS" && messages.length > 0) {
        await Promise.all([
          ctx.emails.sendPublicPetitionLinkAccessEmail(messages.map((s) => s.id)),
          ctx.petitions.createEvent(
            messages.map((message) => ({
              type: "MESSAGE_SENT",
              data: { petition_message_id: message.id },
              petition_id: message.petition_id,
            }))
          ),
        ]);
      }

      return result;
    },
  }
);

export const publicSendReminder = mutationField("publicSendReminder", {
  type: "Result",
  args: {
    slug: nonNull(idArg()),
    contactEmail: nonNull(stringArg()),
  },
  authorize: validPublicPetitionLinkSlug("slug"),
  validateArgs: validEmail((args) => args.contactEmail, "contactEmail"),
  resolve: async (_, args, ctx) => {
    const link = (await ctx.petitions.loadPublicPetitionLinkBySlug(args.slug))!;
    const [access, owner] = await Promise.all([
      ctx.petitions.getLatestPetitionAccessFromPublicPetitionLink(link.id, args.contactEmail),
      ctx.users.loadUser(link.owner_id),
    ]);

    if (!access || access.status === "INACTIVE" || access.reminders_left === 0 || !owner) {
      return RESULT.FAILURE;
    }

    if (access.reminders_opt_out) {
      throw new WhitelistedError(`Contact has opted-out of reminders`, "REMINDER_OPTED_OUT_ERROR");
    }

    const [latestReminder] = await ctx.petitions.loadRemindersByAccessId(access.id);
    if (latestReminder && differenceInDays(latestReminder.created_at, new Date()) < 1) {
      throw new WhitelistedError(
        `You can only send one reminder each 24 hours`,
        "REMINDER_ALREADY_SENT_ERROR"
      );
    }

    try {
      const [reminder] = await ctx.petitions.createReminders([
        {
          type: "MANUAL",
          status: "PROCESSING",
          petition_access_id: access.id,
          sender_id: owner.id,
          email_body: null,
          created_by: `Contact:${access.contact_id}`,
        },
      ]);

      await Promise.all([
        ctx.petitions.createEvent({
          type: "REMINDER_SENT",
          petition_id: access.petition_id,
          data: {
            petition_reminder_id: reminder.id,
          },
        }),
        ctx.emails.sendPetitionReminderEmail(reminder.id),
      ]);

      return RESULT.SUCCESS;
    } catch (error: any) {
      return RESULT.FAILURE;
    }
  },
});
