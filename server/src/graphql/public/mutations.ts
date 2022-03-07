import { ApolloError } from "apollo-server-core";
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
import { outdent } from "outdent";
import { isDefined } from "remeda";
import { getClientIp } from "request-ip";
import { Task } from "../../db/repositories/TaskRepository";
import { toGlobalId } from "../../util/globalId";
import { stallFor } from "../../util/promises/stallFor";
import { and, chain, checkClientServerToken } from "../helpers/authorize";
import { WhitelistedError } from "../helpers/errors";
import { globalIdArg } from "../helpers/globalIdPlugin";
import { jsonArg } from "../helpers/json";
import { presendPetition } from "../helpers/presendPetition";
import { RESULT } from "../helpers/result";
import { notEmptyArray } from "../helpers/validators/notEmptyArray";
import { validEmail } from "../helpers/validators/validEmail";
import { validRichTextContent } from "../helpers/validators/validRichTextContent";
import { fieldAttachmentBelongsToField, fieldsHaveCommentsEnabled } from "../petition/authorizers";
import { tasksAreOfType } from "../task/authorizers";
import {
  authenticatePublicAccess,
  commentsBelongsToAccess,
  fetchPetitionAccess,
  fieldBelongsToAccess,
  getContactAuthCookieValue,
  taskBelongsToAccess,
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
              maxAge: 60 * 60 * 24 * 365 * 10 * 1000,
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

export const publicCompletePetition = mutationField("publicCompletePetition", {
  description: outdent`
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
    try {
      return await ctx.petitions.withTransaction(async (t) => {
        let petition = await ctx.petitions.completePetition(
          ctx.access!.petition_id,
          ctx.access!,
          {},
          t
        );

        if (petition.signature_config?.review === false) {
          const { petition: updatedPetition } = await ctx.signature.createSignatureRequest(
            petition.id,
            {
              ...petition.signature_config,
              additionalSignersInfo: args.additionalSigners ?? [],
              message: args.message ?? undefined,
            },
            ctx.access!,
            t
          );
          petition = updatedPetition ?? petition;
        } else {
          await ctx.emails.sendPetitionCompletedEmail(petition.id, {
            accessId: ctx.access!.id,
          });
        }
        await ctx.petitions.createEvent(
          {
            type: "PETITION_COMPLETED",
            petition_id: ctx.access!.petition_id,
            data: { petition_access_id: ctx.access!.id },
          },
          t
        );
        return petition;
      });
    } catch (error: any) {
      if (error.message === "REQUIRED_SIGNER_INFO_ERROR") {
        throw new ApolloError(
          "Can't complete the petition without signers information",
          "REQUIRED_SIGNER_INFO_ERROR"
        );
      } else if (error.message === "SIGNATURIT_SHARED_APIKEY_LIMIT_REACHED") {
        // update signature_config with additional signers specified by recipient so user can restart the signature request knowing who are the signers
        let petition = (await ctx.petitions.loadPetition(ctx.access!.petition_id))!;
        petition = await ctx.petitions.completePetition(ctx.access!.petition_id, ctx.access!, {
          signature_config: {
            ...petition.signature_config,
            signersInfo: (petition.signature_config!.signersInfo ?? []).concat(
              args.additionalSigners ?? []
            ),
          },
        });
        await ctx.petitions.createEvent({
          type: "PETITION_COMPLETED",
          petition_id: ctx.access!.petition_id,
          data: { petition_access_id: ctx.access!.id },
        });
        await ctx.petitions.createEvent({
          type: "SIGNATURE_CANCELLED",
          data: {
            cancel_reason: "REQUEST_ERROR",
            cancel_data: {
              error: "The signature request could not be started due to lack of signature credits",
              error_code: "INSUFFICIENT_SIGNATURE_CREDITS",
            },
          },
          petition_id: ctx.access!.petition_id,
        });
        return petition;
      } else {
        throw error;
      }
    }
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
    ctx.petitions.loadPetitionFieldCommentsForField.dataloader.clear({
      petitionId: ctx.access!.petition_id,
      petitionFieldId: args.petitionFieldId,
    });
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
  type: "PublicPetitionField",
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
    ctx.petitions.loadPetitionFieldCommentsForField.dataloader.clear({
      petitionId: ctx.access!.petition_id,
      petitionFieldId: args.petitionFieldId,
    });
    return (await ctx.petitions.loadField(args.petitionFieldId))!;
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
        org_id: recipient.org_id,
        first_name: args.firstName,
        last_name: args.lastName,
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
    authorize: chain(
      validPublicPetitionLinkSlug("slug"),
      // check if the organization has PETITION_SEND credits for this
      async (_, { slug }, ctx) => {
        const publicLink = (await ctx.petitions.loadPublicPetitionLinkBySlug(slug))!;
        const template = await ctx.petitions.loadPetition(publicLink.template_id);
        if (!template) {
          return false;
        }
        const petitionSendLimit = await ctx.organizations.getOrganizationCurrentUsageLimit(
          template.org_id,
          "PETITION_SEND"
        );
        if (!petitionSendLimit || petitionSendLimit.used >= petitionSendLimit.limit) {
          return false;
        }

        return true;
      }
    ),
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

      const owner = await ctx.petitions.getPublicPetitionLinkOwner(link.id);
      if (!isDefined(owner)) {
        throw new Error(`Can't find owner of PublicPetitionLink:${link.id}`);
      }

      const { messages, result, petition } = await ctx.petitions.withTransaction(async (t) => {
        const [petition, [contact]] = await Promise.all([
          ctx.petitions.clonePetition(
            link!.template_id,
            owner,
            {
              is_template: false,
              status: "DRAFT",
              from_public_petition_link_id: link.id,
            },
            undefined,
            `PublicPetitionLink:${link.id}`,
            t
          ),
          ctx.contacts.loadOrCreate(
            {
              email: args.contactEmail,
              first_name: args.contactFirstName,
              last_name: args.contactLastName,
              org_id: owner!.org_id,
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

        return { messages: messages ?? [], result, petition };
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
          ctx.organizations.updateOrganizationCurrentUsageLimitCredits(
            petition.org_id,
            "PETITION_SEND",
            1
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
      ctx.petitions.getPublicPetitionLinkOwner(link.id),
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

export const publicCreatePrintPdfTask = mutationField("publicCreatePrintPdfTask", {
  description: "Starts an export pdf task in a recipient context",
  type: "Task",
  authorize: authenticatePublicAccess("keycode"),
  args: { keycode: nonNull(idArg()) },
  resolve: async (_, args, ctx) =>
    await ctx.tasks.createTask(
      {
        name: "PRINT_PDF",
        petition_access_id: ctx.access!.id,
        input: {
          petition_id: ctx.access!.petition_id,
        },
      },
      `PetitionAccess:${ctx.access!.id}`
    ),
});

export const publicGetTaskResultFileUrl = mutationField("publicGetTaskResultFileUrl", {
  description: "Returns a signed download url for tasks with file output on a recipient context",
  type: "String",
  authorize: chain(
    authenticatePublicAccess("keycode"),
    taskBelongsToAccess("taskId"),
    tasksAreOfType("taskId", ["PRINT_PDF"])
  ),
  args: {
    taskId: nonNull(globalIdArg("Task")),
    keycode: nonNull(idArg()),
  },
  resolve: async (_, args, ctx) => {
    const task = (await ctx.tasks.loadTask(args.taskId)) as Task<"PRINT_PDF">;

    const file = isDefined(task.output)
      ? await ctx.files.loadTemporaryFile(task.output.temporary_file_id)
      : null;
    if (
      !file ||
      // temporary files are deleted after 30 days on S3 bucket
      differenceInDays(new Date(), file.created_at) >= 30
    ) {
      throw new ApolloError(
        `Temporary file not found for Task:${task.id} output`,
        "FILE_NOT_FOUND_ERROR"
      );
    }
    return await ctx.aws.temporaryFiles.getSignedDownloadEndpoint(
      file.path,
      file.filename,
      "inline"
    );
  },
});
