import {
  arg,
  booleanArg,
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
import { and, chain, checkClientServerToken } from "../helpers/authorize";
import { WhitelistedError } from "../helpers/errors";
import { RESULT } from "../helpers/result";
import {
  commentsBelongsToAccess,
  authenticatePublicAccess,
  fieldBelongsToAccess,
  fieldHasType,
  replyBelongsToAccess,
  fetchPetitionAccess,
  getContactAuthCookieValue,
} from "./authorizers";
import { notEmptyArray } from "../helpers/validators/notEmptyArray";
import { globalIdArg } from "../helpers/globalIdPlugin";
import { userIsCommentAuthor } from "../petition/mutations/authorizers";
import { toGlobalId } from "../../util/globalId";
import { getClientIp } from "request-ip";
import { stallFor } from "../../util/stallFor";
import { jsonArg } from "../helpers/json";
import { validRichTextContent } from "../helpers/validators/validRichTextContent";

function anonymizePart(part: string) {
  return part.length > 2
    ? part[0] + "*".repeat(part.length - 2) + part[part.length - 1]
    : part[0] + "*".repeat(part.length - 1);
}

function anonymizeEmail(email: string) {
  const [, local, domain] = email.match(/^(.+)@(.+)$/)!;
  const match = domain.match(/(^[^\.]*)\.(.*)$/);
  const _domain = match
    ? anonymizePart(match[1]) + "." + match[2]
    : anonymizePart(domain);
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
    },
  }),
  authorize: chain(
    checkClientServerToken("token"),
    fetchPetitionAccess("keycode")
  ),
  args: {
    token: nonNull(idArg()),
    keycode: nonNull(idArg()),
    ip: stringArg(),
    userAgent: stringArg(),
  },
  resolve: async (_, args, ctx) => {
    const petition = (await ctx.petitions.loadPetition(
      ctx.access!.petition_id
    ))!;
    if (petition.skip_forward_security) {
      await ctx.petitions.createEvent({
        petitionId: ctx.access!.petition_id,
        type: "ACCESS_OPENED",
        data: { petition_access_id: ctx.access!.id },
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
          petitionId: ctx.access!.petition_id,
          type: "ACCESS_OPENED",
          data: { petition_access_id: ctx.access!.id },
        });
        await ctx.contacts.addContactAuthenticationLogAccessEntry(
          authenticationId,
          logEntry
        );
        return { isAllowed: true };
      } else {
        const org = await ctx.organizations.loadOrg(ctx.contact!.org_id);
        return {
          isAllowed: false,
          email: anonymizeEmail(ctx.contact!.email),
          orgName: org!.name,
          orgLogoUrl: await ctx.organizations.getOrgLogoUrl(org!.id),
        };
      }
    } else {
      await ctx.petitions.createEvent({
        petitionId: ctx.access!.petition_id,
        type: "ACCESS_OPENED",
        data: { petition_access_id: ctx.access!.id },
      });
      const {
        cookieValue,
        contactAuthentication,
      } = await ctx.contacts.createContactAuthentication(contactId);
      await ctx.contacts.addContactAuthenticationLogAccessEntry(
        contactAuthentication.id,
        logEntry
      );
      return {
        isAllowed: true,
        cookieName: `parallel_contact_auth_${toGlobalId("Contact", contactId)}`,
        cookieValue,
      };
    }
  },
});

export const publicSendVerificationCode = mutationField(
  "publicSendVerificationCode",
  {
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
        const {
          token,
          request,
        } = await ctx.contacts.createContactAuthenticationRequest({
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
  }
);

export const publicCheckVerificationCode = mutationField(
  "publicCheckVerificationCode",
  {
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
          const {
            contactAuthentication,
            cookieValue,
          } = await ctx.contacts.createContactAuthentication(ctx.contact!.id);
          await ctx.contacts.addContactAuthenticationLogAccessEntry(
            contactAuthentication.id,
            {
              ip: getClientIp(ctx.req),
              userAgent: ctx.req.headers["user-agent"] ?? null,
            }
          );
          if (result.success) {
            ctx.req.res?.cookie(
              `parallel_contact_auth_${toGlobalId("Contact", ctx.contact!.id)}`,
              cookieValue,
              {
                path: "/",
                httpOnly: true,
                sameSite: "strict",
                secure: process.env.NODE_ENV === "production",
                maxAge: 60 * 60 * 24 * 365 * 10,
              }
            );
          }
          return {
            result: result.success ? RESULT.SUCCESS : RESULT.FAILURE,
            remainingAttempts: result.remainingAttempts,
          };
        } catch (e) {
          throw new WhitelistedError(
            "INVALID_TOKEN",
            "The token is no longer valid"
          );
        }
      }, 2000);
    },
  }
);

export const publicDeletePetitionReply = mutationField(
  "publicDeletePetitionReply",
  {
    description: "Deletes a reply to a petition field.",
    type: "Result",
    authorize: chain(
      authenticatePublicAccess("keycode"),
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
          ctx.aws.fileUploads.deleteFile(file!.path),
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
      authenticatePublicAccess("keycode"),
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
      await ctx.aws.fileUploads.getFileMetadata(file!.path);
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
      authenticatePublicAccess("keycode"),
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
        ctx.aws.fileUploads.getSignedUploadEndpoint(key, contentType),
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
    authenticatePublicAccess("keycode"),
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
  authorize: authenticatePublicAccess("keycode"),
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
      authenticatePublicAccess("keycode"),
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
      authenticatePublicAccess("keycode"),
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
      authenticatePublicAccess("keycode"),
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
    authorize: authenticatePublicAccess("keycode"),
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
      authenticatePublicAccess("keycode"),
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

export const publicFileUploadReplyDownloadLink = mutationField(
  "publicFileUploadReplyDownloadLink",
  {
    description:
      "Generates a download link for a file reply on a public context.",
    type: "FileUploadReplyDownloadLinkResult",
    authorize: fetchPetitionAccess("keycode"),
    args: {
      keycode: nonNull(idArg()),
      replyId: nonNull(globalIdArg("PetitionFieldReply")),
      preview: booleanArg({
        description:
          "If true will use content-disposition inline instead of attachment",
      }),
    },
    resolve: async (_, args, ctx) => {
      try {
        const reply = await ctx.petitions.loadFieldReply(args.replyId);
        if (reply!.type !== "FILE_UPLOAD") {
          throw new Error("Invalid field type");
        }
        const file = await ctx.files.loadFileUpload(
          reply!.content["file_upload_id"]
        );
        if (file && !file.upload_complete) {
          await ctx.aws.fileUploads.getFileMetadata(file!.path);
          await ctx.files.markFileUploadComplete(file.id);
        }
        return {
          result: RESULT.SUCCESS,
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

export const publicDelegateAccessToContact = mutationField(
  "publicDelegateAccessToContact",
  {
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
    authorize: fetchPetitionAccess("keycode"),
    validateArgs: validRichTextContent(
      (args) => args.messageBody,
      "messageBody"
    ),
    resolve: async (_, args, ctx) => {
      const access = ctx.access!;
      const recipient = ctx.contact!;
      const petitionId = access.petition_id;

      let contactToDelegate = await ctx.contacts.loadContactByEmail({
        email: args.email,
        orgId: recipient.org_id,
      });

      if (!contactToDelegate) {
        contactToDelegate = await ctx.contacts.createContact(
          {
            email: args.email,
            first_name: args.firstName,
            last_name: args.lastName,
          },
          recipient,
          `Contact:${recipient.id}`
        );
      }
      try {
        const newAccess = await ctx.petitions.createAccessFromRecipient(
          petitionId,
          access.granter_id,
          contactToDelegate.id,
          recipient
        );

        await Promise.all([
          ctx.emails.sendAccessDelegatedEmail(
            petitionId,
            access.id,
            newAccess.id,
            args.messageBody
          ),
          ctx.petitions.createEvent({
            type: "ACCESS_DELEGATED",
            petitionId,
            data: {
              contact_id: recipient.id,
              petition_access_id: newAccess.id,
            },
          }),
        ]);

        return newAccess;
      } catch (error) {
        // if the access already exists, just send the email
        if (error.constraint === "petition_access__petition_id_contact_id") {
          const petitionAccesses = await ctx.petitions.loadAccessesForPetition(
            petitionId
          );

          const contactAccess = petitionAccesses.find(
            (a) => a.contact_id === contactToDelegate!.id
          )!;

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
  }
);
