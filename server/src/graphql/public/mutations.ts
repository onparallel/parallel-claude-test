import { differenceInDays } from "date-fns";
import { decode, JwtPayload } from "jsonwebtoken";
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
import { DatabaseError } from "pg";
import { isNonNullish, isNullish } from "remeda";
import { getClientIp } from "request-ip";
import { PetitionAccess, User } from "../../db/__types";
import { Task } from "../../db/repositories/TaskRepository";
import { fullName } from "../../util/fullName";
import { toGlobalId } from "../../util/globalId";
import { petitionIsCompleted } from "../../util/petitionIsCompleted";
import { stallFor } from "../../util/promises/stallFor";
import {
  interpolatePlaceholdersInSlate,
  renderTextWithPlaceholders,
} from "../../util/slate/placeholders";
import { fromPlainText } from "../../util/slate/utils";
import { and, chain, checkClientServerToken, ifArgDefined, not } from "../helpers/authorize";
import { ApolloError, ArgValidationError, ForbiddenError } from "../helpers/errors";
import { globalIdArg } from "../helpers/globalIdPlugin";
import { RESULT } from "../helpers/Result";
import { validateAnd, validateIf } from "../helpers/validateArgs";
import { maxLength } from "../helpers/validators/maxLength";
import { notEmptyArray } from "../helpers/validators/notEmptyArray";
import { validEmail } from "../helpers/validators/validEmail";
import { validPetitionSignerData } from "../helpers/validators/validSignatureConfig";
import {
  fieldAttachmentBelongsToField,
  fieldHasParent,
  fieldsHaveCommentsEnabled,
} from "../petition/authorizers";
import { tasksAreOfType } from "../task/authorizers";
import {
  authenticatePublicAccess,
  commentsBelongsToAccess,
  fetchPetitionAccess,
  fieldBelongsToAccess,
  getContactAuthCookieValue,
  publicPetitionDoesNotHaveOngoingProcess,
  taskBelongsToAccess,
  validPublicPetitionLinkPrefill,
  validPublicPetitionLinkPrefillDataKeycode,
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
      t.nullable.boolean("isContactlessAccess");
      t.nullable.string("cookieName");
      t.nullable.string("cookieValue");
      t.nullable.string("email");
      t.nullable.string("ownerName");
      t.nullable.field("organization", { type: "PublicOrganization" });
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
    if (petition.skip_forward_security && isNonNullish(ctx.access!.contact_id)) {
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

    if (isNullish(ctx.access!.contact_id)) {
      const owner = (await ctx.petitions.loadPetitionOwner(petition.id))!;
      const data = (await ctx.users.loadUserData(owner.user_data_id))!;

      // TODO: Add petition tone indepdendetly to organization
      return {
        isAllowed: false,
        isContactlessAccess: true,
        ownerName: fullName(data.first_name, data.last_name),
        organization: await ctx.organizations.loadOrg(petition.org_id),
      };
    }
    const contactId = ctx.access!.contact_id;
    if (await ctx.contacts.hasContactAuthentication(contactId)) {
      const cookieValue = getContactAuthCookieValue(ctx.req, contactId);
      const contactAuthentication = cookieValue
        ? await ctx.contacts.loadContactAuthenticationByContactId({ contactId, cookieValue })
        : null;
      if (contactAuthentication) {
        await ctx.petitions.createEvent({
          type: "ACCESS_OPENED",
          petition_id: ctx.access!.petition_id,
          data: {
            petition_access_id: ctx.access!.id,
          },
        });
        await ctx.contacts.addContactAuthenticationLogAccessEntry(
          contactAuthentication.id,
          logEntry,
        );
        return { isAllowed: true };
      } else {
        return {
          isAllowed: false,
          email: anonymizeEmail(ctx.contact!.email),
          organization: await ctx.organizations.loadOrg(ctx.contact!.org_id),
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
      const { cookieValue, contactAuthentication } =
        await ctx.contacts.createContactAuthentication(contactId);
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
    firstName: stringArg(),
    lastName: stringArg(),
    email: stringArg(),
  },
  resolve: async (_, args, ctx) => {
    return await stallFor(async function () {
      const isContactless = isNullish(ctx.access!.contact_id);
      const { firstName, lastName, email } = args;

      if (isContactless) {
        if (isNullish(firstName) || isNullish(lastName) || isNullish(email)) {
          throw new ApolloError(
            "The information to create a contact is not valid",
            "INVALID_CONTACT_FORM",
          );
        }

        const petition = await ctx.petitions.loadPetition(ctx.access!.petition_id);
        const contact = await ctx.contacts.loadContactByEmail({
          email: email.toLowerCase(),
          orgId: petition!.org_id,
        });

        const accesses = await ctx.petitions.loadAccessesForPetition(petition!.id);
        if (
          accesses.some(
            (access) =>
              access.contact_id !== null &&
              access.status === "ACTIVE" &&
              access.contact_id === contact?.id,
          )
        ) {
          throw new ApolloError(
            "The contact already has an access in this petition",
            "ACCESS_ALREADY_EXISTS",
          );
        }
      }

      const { token, request } = await ctx.contacts.createContactAuthenticationRequest({
        petition_access_id: ctx.access!.id,
        user_agent: ctx.req!.headers["user-agent"] ?? null,
        ip: getClientIp(ctx.req),
        contact_first_name: firstName,
        contact_last_name: lastName,
        contact_email: email?.toLowerCase(),
      });
      await ctx.emails.sendContactAuthenticationRequestEmail(request.id, isContactless);
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
          args.code,
        );

        // if is a contactless petition access
        if (result.success && isNullish(ctx.access!.contact_id)) {
          const access = await ctx.petitions.loadAccessByKeycode(args.keycode);
          const petition = await ctx.petitions.loadPetition(access!.petition_id);

          if (petition) {
            const email = result.data!.contact_email!.toLowerCase();

            await ctx.orgCredits.ensurePetitionHasConsumedCredit(
              petition.id,
              `PetitionAccess:${access!.id}`,
            );

            ctx.contact = (
              await ctx.contacts.loadOrCreate(
                {
                  email,
                  org_id: petition.org_id,
                  first_name: result.data!.contact_first_name!,
                  last_name: result.data!.contact_last_name || null,
                },
                `PetitionAccess:${access!.id}`,
              )
            )[0];
            try {
              await ctx.petitions.addContactToPetitionAccess(
                access!,
                ctx.contact!.id,
                `PetitionAccess:${access!.id}`,
              );

              await ctx.petitions.createEvent({
                type: "CONTACTLESS_ACCESS_USED",
                petition_id: petition.id,
                data: {
                  petition_access_id: ctx.access!.id,
                  contact_id: ctx.contact!.id,
                },
              });
            } catch (e) {
              if (
                e instanceof DatabaseError &&
                e.constraint === "petition_access__petition_id_contact_id_active"
              ) {
                throw new ApolloError(
                  "The contact already has an access in this petition",
                  "ACCESS_ALREADY_EXISTS",
                );
              } else {
                throw e;
              }
            }

            await ctx.petitions.updatePetition(
              petition.id,
              { status: "PENDING", closed_at: null },
              `PetitionAccess:${access!.id}`,
            );
          }
        }

        if (result.success) {
          // if there is an email in the authentication request it is coming from a non-contact link,
          // if it is not the same contact it throws an error to force 2FA.
          if (
            isNonNullish(ctx.contact) &&
            isNonNullish(result.data?.contact_email) &&
            ctx.contact.email.toLowerCase() !== result.data!.contact_email!.toLowerCase()
          ) {
            throw new ApolloError(
              "Access already has a contact assigned to it",
              "ACCESS_ALREADY_WITH_CONTACT",
            );
          }

          const { contactAuthentication, cookieValue } =
            await ctx.contacts.createContactAuthentication(ctx.contact!.id);
          await ctx.contacts.addContactAuthenticationLogAccessEntry(contactAuthentication.id, {
            ip: getClientIp(ctx.req),
            userAgent: ctx.req.headers["user-agent"] ?? null,
          });
          ctx.req.res?.cookie(
            `parallel_contact_auth_${toGlobalId("Contact", ctx.contact!.id)}`,
            cookieValue,
            {
              path: "/",
              httpOnly: true,
              sameSite: "lax",
              secure: process.env.NODE_ENV === "production",
              maxAge: 60 * 60 * 24 * 365 * 10 * 1000,
            },
          );

          await ctx.petitions.createEvent({
            type: "ACCESS_OPENED",
            petition_id: ctx.access!.petition_id,
            data: {
              petition_access_id: ctx.access!.id,
            },
          });
        }
        return {
          result: result.success ? RESULT.SUCCESS : RESULT.FAILURE,
          remainingAttempts: result.remainingAttempts,
        };
      } catch (error) {
        if (error instanceof Error) {
          if (error.message === "PETITION_SEND_LIMIT_REACHED") {
            throw new ApolloError(
              `Can't send the parallel due to lack of credits`,
              "PETITION_SEND_LIMIT_REACHED",
            );
          } else if (error.message === "INVALID_TOKEN") {
            throw new ApolloError("The token is no longer valid", "INVALID_TOKEN");
          }
        }
        throw error;
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
  authorize: and(
    authenticatePublicAccess("keycode"),
    publicPetitionDoesNotHaveOngoingProcess("keycode"),
  ),
  validateArgs: validPetitionSignerData("additionalSigners"),
  resolve: async (_, args, ctx) => {
    try {
      const petitionId = ctx.access!.petition_id;
      const [composedPetition] = await ctx.petitions.getComposedPetitionFieldsAndVariables([
        petitionId,
      ]);
      const canComplete = petitionIsCompleted(composedPetition, true);
      if (!canComplete) {
        throw new Error("CANT_COMPLETE_PETITION_ERROR");
      }

      let [petition] = await ctx.petitions.updatePetition(
        petitionId,
        { status: "COMPLETED" },
        `PetitionAccess:${ctx.access!.id}`,
      );

      await ctx.petitions.updateRemindersForPetitions(petitionId, null);

      if (petition.signature_config?.isEnabled) {
        if (petition.signature_config.review === false) {
          // start a new signature request, cancelling previous pending requests if any
          const { petition: updatedPetition } = await ctx.signature.createSignatureRequest(
            petition.id,
            {
              ...petition.signature_config,
              additionalSignersInfo: args.additionalSigners ?? [],
              message: args.message ?? undefined,
            },
            ctx.access!,
          );
          petition = updatedPetition ?? petition;
        }
      }

      if (
        !petition.signature_config?.isEnabled || // signature is not configured, process has finished
        petition.signature_config.review === true // signature needs to be manually started, send email to user
      ) {
        await ctx.emails.sendPetitionCompletedEmail(
          petition.id,
          { accessId: ctx.access!.id },
          `PetitionAccess:${ctx.access!.id}`,
        );
      }

      await ctx.approvalRequests.deleteNotStartedPetitionApprovalRequestStepsAndApproversByPetitionId(
        petition.id,
      );

      await ctx.petitions.createEvent({
        type: "PETITION_COMPLETED",
        petition_id: ctx.access!.petition_id,
        data: { petition_access_id: ctx.access!.id },
      });

      return petition;
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "REQUIRED_SIGNER_INFO_ERROR") {
          throw new ApolloError(
            "Can't complete the petition without signers information",
            "REQUIRED_SIGNER_INFO_ERROR",
          );
        } else if (error.message === "CANT_COMPLETE_PETITION_ERROR") {
          throw new ApolloError(
            "Can't transition status to COMPLETED",
            "CANT_COMPLETE_PETITION_ERROR",
          );
        }
      }
      throw error;
    }
  },
});

export const publicCreatePetitionComment = mutationField("publicCreatePetitionComment", {
  description: "Create a petition comment.",
  type: "PublicPetitionFieldComment",
  authorize: chain(
    authenticatePublicAccess("keycode"),
    and(
      ifArgDefined(
        "petitionFieldId",
        and(
          fieldBelongsToAccess("petitionFieldId" as never),
          fieldsHaveCommentsEnabled("petitionFieldId" as never),
          not(fieldHasParent("petitionFieldId" as never)),
        ),
      ),
    ),
  ),
  args: {
    keycode: nonNull(idArg()),
    petitionFieldId: nullable(globalIdArg("PetitionField")),
    content: nonNull(stringArg()),
  },
  resolve: async (_, args, ctx) => {
    return await ctx.petitions.createPetitionFieldCommentFromAccess(
      {
        petitionId: ctx.access!.petition_id,
        petitionFieldId: args.petitionFieldId ?? null,
        contentJson: fromPlainText(args.content),
      },
      ctx.access!,
    );
  },
});

export const publicDeletePetitionComment = mutationField("publicDeletePetitionComment", {
  description: "Delete a petition comment.",
  type: "PublicPetitionFieldOrPublicPetition",
  authorize: chain(
    authenticatePublicAccess("keycode"),
    commentsBelongsToAccess("petitionFieldCommentId"),
  ),
  args: {
    keycode: nonNull(idArg()),
    petitionFieldCommentId: nonNull(globalIdArg("PetitionFieldComment")),
  },
  resolve: async (_, args, ctx) => {
    const comment = await ctx.petitions.deletePetitionFieldCommentFromAccess(
      ctx.access!.petition_id,
      args.petitionFieldCommentId,
      ctx.access!,
    );

    if (isNonNullish(comment?.petition_field_id)) {
      const publicPetitionField = await ctx.petitions.loadField(comment.petition_field_id);
      if (!publicPetitionField) {
        throw new ApolloError("PublicPetitionField not found", "PUBLIC_PETITION_FIELD_NOT_FOUND");
      }
      return { __type: "PublicPetitionField", ...publicPetitionField };
    } else {
      const publicPetition = await ctx.petitions.loadPetition(ctx.access!.petition_id);
      if (!publicPetition) {
        throw new ApolloError("PublicPetition not found", "PUBLIC_PETITION_NOT_FOUND");
      }
      return { __type: "PublicPetition", ...publicPetition };
    }
  },
});

export const publicUpdatePetitionComment = mutationField("publicUpdatePetitionComment", {
  description: "Update a petition comment.",
  type: "PublicPetitionFieldComment",
  authorize: chain(
    authenticatePublicAccess("keycode"),
    commentsBelongsToAccess("petitionFieldCommentId"),
  ),
  args: {
    keycode: nonNull(idArg()),
    petitionFieldCommentId: nonNull(globalIdArg("PetitionFieldComment")),
    content: nonNull(stringArg()),
  },
  resolve: async (_, args, ctx) => {
    return await ctx.petitions.updatePetitionFieldCommentFromContact(
      args.petitionFieldCommentId,
      {
        contentJson: fromPlainText(args.content),
      },
      ctx.contact!,
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
      commentsBelongsToAccess("petitionFieldCommentIds"),
    ),
    args: {
      keycode: nonNull(idArg()),
      petitionFieldCommentIds: nonNull(list(nonNull(globalIdArg("PetitionFieldComment")))),
    },
    validateArgs: notEmptyArray("petitionFieldCommentIds"),
    resolve: async (_, args, ctx) => {
      return await ctx.petitions.markPetitionFieldCommentsAsReadForAccess(
        args.petitionFieldCommentIds,
        ctx.access!.id,
      );
    },
  },
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
    messageBody: nonNull(stringArg()),
  },
  authorize: authenticatePublicAccess("keycode"),
  validateArgs: validateAnd(validEmail("email"), maxLength("messageBody", 1000)),
  resolve: async (_, args, ctx) => {
    const access = ctx.access!;
    const recipient = ctx.contact!;
    const petitionId = access.petition_id;

    const petition = await ctx.petitions.loadPetition(petitionId);
    if (petition?.enable_delegate_access === false) {
      throw new ForbiddenError("Delegate access is not enabled for this petition.");
    }

    const [contactToDelegate] = await ctx.contacts.loadOrCreate(
      {
        email: args.email,
        org_id: recipient.org_id,
        first_name: args.firstName,
        last_name: args.lastName,
      },
      `Contact:${recipient.id}`,
    );

    try {
      const newAccess = await ctx.petitions.createAccessFromRecipient(
        petitionId,
        access.granter_id,
        contactToDelegate.id,
        recipient,
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
    } catch (error) {
      // if the access already exists, just send the email
      if (
        error instanceof DatabaseError &&
        error.constraint === "petition_access__petition_id_contact_id_active"
      ) {
        const petitionAccesses = await ctx.petitions.loadAccessesForPetition(petitionId);

        const contactAccess = petitionAccesses.find((a) => a.contact_id === contactToDelegate!.id)!;

        await ctx.emails.sendAccessDelegatedEmail(
          petitionId,
          access.id,
          contactAccess.id,
          args.messageBody,
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
      and(
        fieldBelongsToAccess("fieldId"),
        fieldAttachmentBelongsToField("fieldId", "attachmentId"),
      ),
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

export const publicRemindersOptOut = mutationField("publicRemindersOptOut", {
  description: "Cancel a reminder for a contact.",
  type: "Result",
  args: {
    keycode: nonNull(idArg()),
    reason: nonNull(stringArg()),
    other: nonNull(stringArg()),
    referer: nullable(stringArg()),
  },
  resolve: async (_, args, ctx) => {
    try {
      const access = await ctx.petitions.loadAccessByKeycode(args.keycode);
      if (!access) throw new Error();

      if (!access.reminders_opt_out) {
        await ctx.petitions.createEvent({
          type: "REMINDERS_OPT_OUT",
          petition_id: access!.petition_id,
          data: {
            petition_access_id: access!.id,
            reason: args.reason,
            other: args.other,
            referer: args.referer,
          },
        });
      }

      await ctx.petitions.optOutReminders([access!.id]);
      return RESULT.SUCCESS;
    } catch {}
    return RESULT.FAILURE;
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
        }),
      ),
      prefill: nullable(
        stringArg({
          description:
            "JWT token containing information to prefill the petition after creating it.",
        }),
      ),
      prefillDataKey: nullable(
        idArg({ description: "key to fetch prefill information from the database." }),
      ),
    },
    authorize: chain(
      validPublicPetitionLinkSlug("slug"),
      ifArgDefined("prefill", validPublicPetitionLinkPrefill("prefill" as never, "slug")),
      ifArgDefined(
        "prefillDataKey",
        validPublicPetitionLinkPrefillDataKeycode("prefillDataKey" as never),
      ),
    ),
    validateArgs: validateAnd(
      validEmail("contactEmail"),
      validateIf(
        (args) =>
          [isNonNullish(args.prefill), isNonNullish(args.prefillDataKey)].filter((v) => v).length >
          1,
        (_, args, ctx, info) => {
          throw new ArgValidationError(info, "prefill", "Only one of prefill or prefillDataKey");
        },
      ),
    ),
    resolve: async (_, args, ctx) => {
      const link = (await ctx.petitions.loadPublicPetitionLinkBySlug(args.slug))!;

      const hasAccess = await ctx.petitions.contactHasAccessFromPublicPetitionLink(
        args.contactEmail,
        link.id,
      );

      if (!args.force && hasAccess) {
        throw new ApolloError(
          "Contact already has access on this link.",
          "PUBLIC_LINK_ACCESS_ALREADY_CREATED_ERROR",
        );
      }

      if (hasAccess && !link.allow_multiple_petitions) {
        throw new ForbiddenError("Can't create more than one parallel from this link.");
      }

      const owner = await ctx.petitions.loadTemplateDefaultOwner(link.template_id);
      if (isNullish(owner)) {
        throw new Error(`Can't find owner of PublicPetitionLink:${link.id}`);
      }

      try {
        await ctx.orgCredits.consumePetitionSendCredits(owner.user.org_id, 1);
        const petition = await ctx.petitions.clonePetition(
          link!.template_id,
          owner.user,
          {
            is_template: false,
            status: "DRAFT",
            from_public_petition_link_id: link.id,
            credits_used: 1,
          },
          { insertPermissions: !owner.isDefault },
          `PublicPetitionLink:${link.id}`,
        );

        const [contact] = await ctx.contacts.loadOrCreate(
          {
            email: args.contactEmail,
            first_name: args.contactFirstName,
            last_name: args.contactLastName,
            org_id: owner.user.org_id,
          },
          `PublicPetitionLink:${link.id}`,
        );

        // prefill before creating message subject and body so replies are available on PetitionMessageContext
        if (isNonNullish(args.prefill)) {
          const payload = decode(args.prefill) as JwtPayload;
          if ("replies" in payload && typeof payload.replies === "object") {
            await ctx.petitions.prefillPetition(petition.id, payload.replies, owner.user);
          }
        } else if (isNonNullish(args.prefillDataKey)) {
          const prefillData = (await ctx.petitions.loadPublicPetitionLinkPrefillDataByKeycode(
            args.prefillDataKey,
          ))!;
          await ctx.petitions.prefillPetition(petition.id, prefillData.data, owner.user);
          await ctx.petitions.updatePetition(
            petition.id,
            { path: prefillData.path },
            `PublicPetitionLink:${link.id}`,
          );
        }

        const getValues = await ctx.petitionMessageContext.fetchPlaceholderValues({
          petitionId: petition.id,
          contactId: contact.id,
          userId: owner.user.id,
        });

        const messageSubject = petition.email_subject
          ? renderTextWithPlaceholders(petition.email_subject, getValues)
          : link!.title;

        const messageBody = petition.email_body
          ? interpolatePlaceholdersInSlate(JSON.parse(petition.email_body), getValues)
          : null;

        const petitionName =
          typeof link.petition_name_pattern === "string"
            ? renderTextWithPlaceholders(link.petition_name_pattern, getValues)
            : petition.name;

        await ctx.petitions.updatePetition(
          petition.id,
          {
            name: (petitionName ?? messageSubject).slice(0, 255),
            status: "PENDING",
            closed_at: null,
          },
          `PublicPetitionLink:${link.id}`,
        );
        const { messages } = await ctx.petitions.createAccessesAndMessages(
          petition,
          [contact.id],
          {
            subject: messageSubject,
            body: messageBody,
            remindersConfig: petition.reminders_config ?? null,
          },
          owner.user,
          null,
          true,
        );

        await ctx.petitions.createPermissionsFromTemplateDefaultPermissions(
          petition.id,
          link.template_id,
          "PublicPetitionLink",
          link.id,
        );

        // trigger emails and events
        // in this case the messages array should always have one unscheduled message, so there is no need to check what to send
        if (messages && messages.length > 0) {
          await Promise.all([
            ctx.emails.sendPublicPetitionLinkAccessEmail(messages.map((s) => s.id)),
            ctx.petitions.createEvent(
              messages.map((message) => ({
                type: "MESSAGE_SENT",
                data: { petition_message_id: message.id },
                petition_id: message.petition_id,
              })),
            ),
          ]);
        }

        return RESULT.SUCCESS;
      } catch (error) {
        if (error instanceof Error && error.message === "PETITION_SEND_LIMIT_REACHED") {
          throw new ApolloError(
            `Can't send the parallel due to lack of credits`,
            "PETITION_SEND_LIMIT_REACHED",
          );
        }
        return RESULT.FAILURE;
      }
    },
  },
);

export const publicSendReminder = mutationField("publicSendReminder", {
  description:
    "Sends an access reminder for a contact that is trying to open a petition through a contactless access but already has another active access",
  type: "Result",
  args: {
    contactEmail: nonNull(stringArg()),
    keycode: idArg({ description: "keycode of the contactless access" }),
    slug: idArg(),
  },
  authorize: chain(
    ifArgDefined("slug", validPublicPetitionLinkSlug("slug" as never)),
    ifArgDefined("keycode", fetchPetitionAccess("keycode" as never)),
  ),
  validateArgs: validEmail("contactEmail"),
  resolve: async (_, args, ctx) => {
    let access: PetitionAccess;
    let owner: User;

    if (args.keycode) {
      const petition = (await ctx.petitions.loadPetition(ctx.access!.petition_id))!;
      const contact = await ctx.contacts.loadContactByEmail({
        email: args.contactEmail.toLowerCase(),
        orgId: petition.org_id,
      });
      const allPetitionAccesses = await ctx.petitions.loadAccessesForPetition(
        ctx.access!.petition_id,
      );
      access = allPetitionAccesses.find(
        (a) => a.contact_id === contact?.id && a.status === "ACTIVE",
      )!;
      if (!access) {
        return RESULT.FAILURE;
      }
      owner = (await ctx.petitions.loadPetitionOwner(petition.id))!;
    } else {
      const link = (await ctx.petitions.loadPublicPetitionLinkBySlug(args.slug!))!;
      access = await ctx.petitions.getLatestPetitionAccessFromPublicPetitionLink(
        link.id,
        args.contactEmail,
      );
      const defaultOwner = await ctx.petitions.loadTemplateDefaultOwner(link.template_id);
      owner = defaultOwner!.user;
    }

    if (!access || access.status === "INACTIVE" || access.reminders_left === 0 || !owner) {
      return RESULT.FAILURE;
    }

    if (access.reminders_opt_out) {
      throw new ApolloError(`Contact has opted-out of reminders`, "REMINDER_OPTED_OUT_ERROR");
    }

    const [latestReminder] = await ctx.petitions.loadRemindersByAccessId(access.id);
    if (latestReminder && differenceInDays(latestReminder.created_at, new Date()) < 1) {
      throw new ApolloError(
        `You can only send one reminder each 24 hours`,
        "REMINDER_ALREADY_SENT_ERROR",
      );
    }

    try {
      const [reminder] = await ctx.petitions.createReminders("MANUAL", [
        {
          petition_access_id: access.id,
          sender_id: owner.id,
          email_body: null,
          created_by: `Contact:${access.contact_id}`,
        },
      ]);

      if (!reminder) {
        throw new Error("Failed to create reminder");
      }

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
    } catch (error) {
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
      `PetitionAccess:${ctx.access!.id}`,
    ),
});

export const publicGetTaskResultFileUrl = mutationField("publicGetTaskResultFileUrl", {
  description: "Returns a signed download url for tasks with file output on a recipient context",
  type: "String",
  authorize: chain(
    authenticatePublicAccess("keycode"),
    taskBelongsToAccess("taskId"),
    tasksAreOfType("taskId", ["PRINT_PDF"]),
  ),
  args: {
    taskId: nonNull(globalIdArg("Task")),
    keycode: nonNull(idArg()),
  },
  resolve: async (_, args, ctx) => {
    const task = (await ctx.tasks.loadTask(args.taskId)) as Task<"PRINT_PDF">;

    const file = isNonNullish(task.output)
      ? await ctx.files.loadTemporaryFile(task.output.temporary_file_id)
      : null;
    if (
      !file ||
      // temporary files are deleted after 30 days on S3 bucket
      differenceInDays(new Date(), file.created_at) >= 30
    ) {
      throw new ApolloError(
        `Temporary file not found for Task:${task.id} output`,
        "FILE_NOT_FOUND_ERROR",
      );
    }
    return await ctx.storage.temporaryFiles.getSignedDownloadEndpoint(
      file.path,
      file.filename,
      "inline",
    );
  },
});
