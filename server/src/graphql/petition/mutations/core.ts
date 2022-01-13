import { ApolloError } from "apollo-server-core";
import {
  arg,
  booleanArg,
  enumType,
  inputObjectType,
  intArg,
  list,
  mutationField,
  nonNull,
  nullable,
  stringArg,
} from "nexus";
import pMap from "p-map";
import { isDefined, omit, zip } from "remeda";
import { defaultFieldOptions } from "../../../db/helpers/fieldOptions";
import { isValueCompatible } from "../../../db/helpers/utils";
import {
  CreatePetition,
  CreatePetitionField,
  CreatePublicPetitionLink,
  Petition,
  PetitionPermission,
} from "../../../db/__types";
import { unMaybeArray } from "../../../util/arrays";
import { fromGlobalId, toGlobalId } from "../../../util/globalId";
import { getRequiredPetitionSendCredits } from "../../../util/organizationUsageLimits";
import { withError } from "../../../util/promises/withError";
import { hash, random } from "../../../util/token";
import { userHasAccessToContactGroups, userHasAccessToContacts } from "../../contact/authorizers";
import {
  and,
  argIsDefined,
  authenticate,
  authenticateAnd,
  chain,
  ifArgDefined,
  ifSomeDefined,
  or,
} from "../../helpers/authorize";
import { datetimeArg } from "../../helpers/date";
import { globalIdArg } from "../../helpers/globalIdPlugin";
import { importFromExcel } from "../../helpers/importDataFromExcel";
import { jsonArg, jsonObjectArg } from "../../helpers/json";
import { parseDynamicSelectValues } from "../../helpers/parseDynamicSelectValues";
import { presendPetition, sendPetitionMessageEmails } from "../../helpers/presendPetition";
import { RESULT } from "../../helpers/result";
import { uploadArg } from "../../helpers/upload";
import { validateAnd, validateIf, validateIfDefined, validateOr } from "../../helpers/validateArgs";
import { inRange } from "../../helpers/validators/inRange";
import { jsonSchema } from "../../helpers/validators/jsonSchema";
import { maxLength } from "../../helpers/validators/maxLength";
import { notEmptyArray } from "../../helpers/validators/notEmptyArray";
import { notEmptyObject } from "../../helpers/validators/notEmptyObject";
import { notEmptyString } from "../../helpers/validators/notEmptyString";
import { validateFile } from "../../helpers/validators/validateFile";
import { validBooleanValue } from "../../helpers/validators/validBooleanValue";
import { validFieldVisibilityJson } from "../../helpers/validators/validFieldVisibility";
import { validIsDefined } from "../../helpers/validators/validIsDefined";
import { validRemindersConfig } from "../../helpers/validators/validRemindersConfig";
import { validRichTextContent } from "../../helpers/validators/validRichTextContent";
import { validSignatureConfig } from "../../helpers/validators/validSignatureConfig";
import { orgHasAvailablePetitionSendCredits } from "../../organization/authorizers";
import { contextUserHasRole } from "../../users/authorizers";
import {
  accessesBelongToPetition,
  accessesBelongToValidContacts,
  fieldHasType,
  fieldIsNotFixed,
  fieldsBelongsToPetition,
  messageBelongToPetition,
  petitionHasRepliableFields,
  petitionsAreEditable,
  petitionsAreNotPublicTemplates,
  petitionsAreOfTypePetition,
  petitionsAreOfTypeTemplate,
  petitionsArePublicTemplates,
  repliesBelongsToField,
  repliesBelongsToPetition,
  templateDoesNotHavePublicPetitionLink,
  userHasAccessToPetitions,
} from "../authorizers";
import {
  petitionAccessesNotOptedOut,
  validateAccessesRemindersLeft,
  validateAccessesStatus,
  validatePetitionStatus,
  validatePublicPetitionLinkSlug,
} from "../validations";
import { ArgValidationError, WhitelistedError } from "./../../helpers/errors";
import {
  userHasAccessToPublicPetitionLink,
  userHasAccessToUserOrUserGroupPermissions,
  userHasAccessToUsers,
} from "./authorizers";

export const createPetition = mutationField("createPetition", {
  description: "Create petition.",
  type: "PetitionBase",
  authorize: authenticateAnd(
    ifArgDefined(
      "petitionId",
      or(
        userHasAccessToPetitions("petitionId" as never),
        petitionsArePublicTemplates("petitionId" as never)
      ),
      and(argIsDefined("locale"), contextUserHasRole("NORMAL"))
    )
  ),
  args: {
    name: stringArg(),
    locale: arg({ type: "PetitionLocale" }),
    petitionId: globalIdArg("Petition", {
      description: "GID of petition to base from",
    }),
    type: arg({
      type: "PetitionBaseType",
      description: "Type of petition to create",
      default: "PETITION",
    }),
  },
  resolve: async (_, { name, locale, petitionId, type }, ctx) => {
    const isTemplate = type === "TEMPLATE";
    let petition: Petition;
    if (petitionId) {
      const original = (await ctx.petitions.loadPetition(petitionId))!;
      petition = await ctx.petitions.clonePetition(petitionId, ctx.user!, {
        is_template: isTemplate,
        status: isTemplate ? null : "DRAFT",
        name: original.is_template && !isTemplate ? name : original.name,
      });

      if (original.is_template && original.org_id === ctx.user!.org_id) {
        await ctx.petitions.createPermissionsFromTemplateDefaultPermissions(
          petition.id,
          original.id,
          `User:${ctx.user!.id}`
        );
      }

      if (original.is_template && !isTemplate) {
        await ctx.petitions.createEvent({
          type: "TEMPLATE_USED",
          petition_id: original.id,
          data: {
            new_petition_id: petition.id,
            org_id: ctx.user!.org_id,
            user_id: ctx.user!.id,
          },
        });
      } else if (!original.is_template) {
        await ctx.petitions.createEvent({
          type: "PETITION_CLONED",
          petition_id: original.id,
          data: {
            new_petition_id: petition.id,
            org_id: petition.org_id,
            user_id: ctx.user!.id,
            type: petition.is_template ? "TEMPLATE" : "PETITION",
          },
        });
      }
    } else {
      petition = await ctx.petitions.createPetition(
        {
          name,
          locale: locale!,
          email_subject: name,
          is_template: isTemplate,
        },
        ctx.user!
      );

      await ctx.petitions.createEvent({
        type: "PETITION_CREATED",
        petition_id: petition.id,
        data: {
          user_id: ctx.user!.id,
        },
      });
    }
    return petition;
  },
});

export const clonePetitions = mutationField("clonePetitions", {
  description: "Clone petition.",
  type: list(nonNull("PetitionBase")),
  authorize: authenticateAnd(
    contextUserHasRole("NORMAL"),
    or(userHasAccessToPetitions("petitionIds"), petitionsArePublicTemplates("petitionIds"))
  ),
  args: {
    petitionIds: nonNull(list(nonNull(globalIdArg("Petition")))),
  },
  validateArgs: notEmptyArray((args) => args.petitionIds, "petitionIds"),
  resolve: async (_, args, ctx) => {
    return await pMap(
      unMaybeArray(args.petitionIds),
      async (petitionId) => {
        const { name, locale } = (await ctx.petitions.loadPetition(petitionId))!;
        const mark = `(${locale === "es" ? "copia" : "copy"})`;

        const cloned = await ctx.petitions.clonePetition(petitionId, ctx.user!, {
          name: `${name ? `${name} ` : ""}${mark}`.slice(0, 255),
        });

        await ctx.petitions.createEvent({
          type: "PETITION_CLONED",
          petition_id: petitionId,
          data: {
            new_petition_id: cloned.id,
            org_id: cloned.org_id,
            user_id: ctx.user!.id,
            type: cloned.is_template ? "TEMPLATE" : "PETITION",
          },
        });

        return cloned;
      },
      { concurrency: 1 }
    );
  },
});

export const deletePetitions = mutationField("deletePetitions", {
  description: "Delete petitions.",
  type: "Result",
  authorize: chain(authenticate(), userHasAccessToPetitions("ids")),
  args: {
    ids: nonNull(list(nonNull(globalIdArg("Petition")))),
    force: booleanArg({ default: false }),
  },
  validateArgs: notEmptyArray((args) => args.ids, "ids"),
  resolve: async (_, args, ctx) => {
    function petitionIsSharedByOwner(p: PetitionPermission[]) {
      return (
        p?.length > 1 && // the petition is being shared to another user
        p.find(
          (u) => u.type === "OWNER" && u.user_id === ctx.user!.id // logged user is the owner
        )
      );
    }

    function userHasAccessViaGroup(p: PetitionPermission[]) {
      return (
        p?.length > 1 &&
        !p.find(
          (u) => u.user_id === ctx.user!.id && u.type === "OWNER" // user is not the owner
        ) &&
        p.find(
          (u) => u.user_id === ctx.user!.id && u.from_user_group_id !== null // has access via group
        )
      );
    }

    // user permissions grouped by permission_id
    const userPermissions = await ctx.petitions.loadUserPermissionsByPetitionId(args.ids);

    if (userPermissions.some(userHasAccessViaGroup)) {
      throw new WhitelistedError(
        "Can't delete a petition shared with a group",
        "DELETE_GROUP_PETITION_ERROR",
        {
          petitionIds: zip(args.ids, userPermissions)
            .filter(([, permissions]) => userHasAccessViaGroup(permissions))
            .map(([id]) => toGlobalId("Petition", id)),
        }
      );
    }

    if (userPermissions.some(petitionIsSharedByOwner) && !args.force) {
      throw new WhitelistedError(
        "Petition to delete is shared to another user",
        "DELETE_SHARED_PETITION_ERROR",
        {
          petitionIds: zip(args.ids, userPermissions)
            .filter(([, permissions]) => petitionIsSharedByOwner(permissions))
            .map(([id]) => toGlobalId("Petition", id)),
        }
      );
    }

    const petitions = await ctx.petitions.loadPetition(args.ids);
    const publicTemplates = petitions.filter((p) => p && p.is_template && p.template_public);
    if (publicTemplates.length > 0) {
      throw new WhitelistedError("Can't delete a public template", "DELETE_PUBLIC_TEMPLATE_ERROR", {
        petitionIds: publicTemplates.map((p) => toGlobalId("Petition", p!.id)),
      });
    }

    await ctx.petitions.withTransaction(async (t) => {
      // delete my permissions to the petitions
      const deletedPermissions = await ctx.petitions.deleteUserPermissions(
        args.ids,
        ctx.user!.id,
        ctx.user!,
        t
      );

      const ownerPermissions = deletedPermissions.filter((p) => p.type === "OWNER");

      const [, deletedPetitions] = await Promise.all([
        // make sure to also remove every remaining permission on deleted owned petitions
        ctx.petitions.deleteAllPermissions(
          ownerPermissions.map((p) => p.petition_id),
          ctx.user!,
          t
        ),
        //finally, delete only petitions OWNED by me
        ctx.petitions.deletePetition(
          ownerPermissions.map((p) => p.petition_id),
          ctx.user!,
          t
        ),
        // delete every user notification on the deleted petitions
        ctx.petitions.deletePetitionUserNotificationsByPetitionId(
          deletedPermissions.map((p) => p.petition_id),
          undefined,
          t
        ),
      ]);

      await ctx.petitions.createEvent(
        deletedPetitions.map((petition) => ({
          type: "PETITION_DELETED",
          petition_id: petition.id,
          data: {
            user_id: ctx.user!.id,
            status: petition.status!,
          },
        })),
        t
      );

      // check if there are pending signature requests on this petitions and cancel those
      const pendingSignatureRequests = (
        await ctx.petitions.loadPetitionSignaturesByPetitionId(deletedPetitions.map((p) => p.id))
      ).flat();

      if (pendingSignatureRequests.length > 0) {
        await Promise.all([
          ctx.petitions.cancelPetitionSignatureRequest(
            pendingSignatureRequests.map((s) => s.id),
            "CANCELLED_BY_USER",
            { user_id: ctx.user!.id }
          ),
          ctx.petitions.createEvent(
            pendingSignatureRequests.map((s) => ({
              type: "SIGNATURE_CANCELLED",
              petition_id: s.petition_id,
              data: {
                petition_signature_request_id: s.id,
                cancel_reason: "CANCELLED_BY_USER",
                cancel_data: {
                  user_id: ctx.user!.id,
                },
              },
            }))
          ),
          ctx.aws.enqueueMessages(
            "signature-worker",
            pendingSignatureRequests
              .filter((s) => s.status === "PROCESSING")
              .map((s) => ({
                id: `signature-${toGlobalId("Petition", s.petition_id)}`,
                groupId: `signature-${toGlobalId("Petition", s.petition_id)}`,
                body: {
                  type: "cancel-signature-process",
                  payload: { petitionSignatureRequestId: s.id },
                },
              }))
          ),
        ]);
      }
    });

    return RESULT.SUCCESS;
  },
});

export const updateFieldPositions = mutationField("updateFieldPositions", {
  description: "Updates the positions of the petition fields",
  type: "PetitionBase",
  authorize: authenticateAnd(
    userHasAccessToPetitions("petitionId"),
    petitionsAreEditable("petitionId"),
    petitionsAreNotPublicTemplates("petitionId")
  ),
  args: {
    petitionId: nonNull(globalIdArg("Petition")),
    fieldIds: nonNull(list(nonNull(globalIdArg("PetitionField")))),
  },
  resolve: async (_, args, ctx) => {
    try {
      return await ctx.petitions.updateFieldPositions(args.petitionId, args.fieldIds, ctx.user!);
    } catch (e: any) {
      if (e.message === "INVALID_PETITION_FIELD_IDS") {
        throw new WhitelistedError("Invalid petition field ids", "INVALID_PETITION_FIELD_IDS");
      } else if (e.message === "INVALID_FIELD_CONDITIONS_ORDER") {
        throw new WhitelistedError(
          "Invalid field conditions order",
          "INVALID_FIELD_CONDITIONS_ORDER"
        );
      } else {
        throw e;
      }
    }
  },
});

export const RemindersConfigInput = inputObjectType({
  name: "RemindersConfigInput",
  description: "The reminders settings for the petition",
  definition(t) {
    t.nonNull.int("offset", {
      description: "The amount of days between reminders.",
    });
    t.nonNull.string("time", {
      description: "The time at which the reminder should be sent.",
    });
    t.nonNull.string("timezone", {
      description: "The timezone the time is referring to.",
    });
    t.nonNull.boolean("weekdaysOnly", {
      description: "Whether to send reminders only from monday to friday.",
    });
  },
});

export const SignatureConfigInput = inputObjectType({
  name: "SignatureConfigInput",
  description: "The signature settings for the petition",
  definition(t) {
    t.nonNull.globalId("orgIntegrationId", {
      prefixName: "OrgIntegration",
      description: "The Global ID of the signature integration to be used.",
    });
    t.nonNull.list.nonNull.field("signersInfo", {
      type: inputObjectType({
        name: "SignatureConfigInputSigner",
        description: "The signer that need to sign the generated document.",
        definition(t) {
          t.nonNull.globalId("contactId", { prefixName: "Contact" });
          t.nonNull.string("firstName");
          t.nonNull.string("lastName");
          t.nonNull.string("email");
        },
      }),
    });
    t.nonNull.string("timezone", {
      description: "The timezone used to generate the document.",
    });
    t.nonNull.string("title", {
      description: "The title of the signing document",
    });
    t.nonNull.boolean("review", {
      description:
        "If true, lets the user review the replies before starting the signature process",
    });
    t.nonNull.boolean("letRecipientsChooseSigners", {
      description: "If true, allows the recipients of the petition to select additional signers",
    });
  },
});

export const updatePetitionRestriction = mutationField("updatePetitionRestriction", {
  description: "Updates the restriction preferences",
  type: "PetitionBase",
  authorize: authenticateAnd(
    userHasAccessToPetitions("petitionId"),
    petitionsAreNotPublicTemplates("petitionId")
  ),
  args: {
    petitionId: nonNull(globalIdArg("Petition")),
    isRestricted: nonNull(booleanArg()),
    password: nullable(stringArg()),
  },
  resolve: async (_, { petitionId, isRestricted, password }, ctx) => {
    const { restricted_password_hash: passwordHash, restricted_password_salt: passwordSalt } =
      (await ctx.petitions.loadPetition(petitionId))!;

    if (
      isDefined(passwordHash) &&
      (!isDefined(password) || passwordHash !== (await hash(password, passwordSalt!)))
    ) {
      throw new WhitelistedError(
        "The petition is restricted with a password.",
        "INVALID_PETITION_RESTRICTION_PASSWORD"
      );
    }

    let data: Partial<CreatePetition>;
    if (isRestricted) {
      const salt = isDefined(password) ? random(10) : null;
      data = {
        restricted_by_user_id: ctx.user!.id,
        restricted_at: new Date(),
        restricted_password_hash: isDefined(password) ? await hash(password, salt!) : null,
        restricted_password_salt: salt,
      };
    } else {
      data = {
        restricted_by_user_id: null,
        restricted_at: null,
        restricted_password_hash: null,
        restricted_password_salt: null,
      };
    }
    const [petition] = await ctx.petitions.updatePetition(petitionId, data, `User:${ctx.user!.id}`);
    return petition;
  },
});

export const updatePetition = mutationField("updatePetition", {
  description: "Updates a petition.",
  type: "PetitionBase",
  authorize: authenticateAnd(
    userHasAccessToPetitions("petitionId"),
    petitionsAreNotPublicTemplates("petitionId"),
    ifSomeDefined(
      (args) => [args.data.locale, args.data.description],
      petitionsAreEditable("petitionId")
    ),
    ifSomeDefined(
      (args) => [args.data.emailBody, args.data.emailSubject],
      or(petitionsAreEditable("petitionId"), petitionsAreOfTypePetition("petitionId"))
    )
  ),
  args: {
    petitionId: nonNull(globalIdArg("Petition")),
    data: nonNull(
      inputObjectType({
        name: "UpdatePetitionInput",
        definition(t) {
          t.nullable.string("name");
          t.nullable.field("locale", { type: "PetitionLocale" });
          t.nullable.datetime("deadline");
          t.nullable.string("emailSubject");
          t.nullable.json("emailBody");
          t.nullable.field("remindersConfig", {
            type: "RemindersConfigInput",
          });
          t.nullable.boolean("skipForwardSecurity");
          t.nullable.boolean("isRecipientViewContentsHidden");
          t.nullable.field("signatureConfig", { type: "SignatureConfigInput" });
          t.nullable.json("description");
        },
      }).asArg()
    ),
  },
  validateArgs: validateAnd(
    notEmptyObject((args) => args.data, "data"),
    maxLength((args) => args.data.name, "data.name", 255),
    maxLength((args) => args.data.emailSubject, "data.emailSubject", 255),
    maxLength((args) => args.data.description, "data.description", 1000),
    validRichTextContent((args) => args.data.emailBody, "data.emailBody"),
    validRichTextContent((args) => args.data.description, "data.description"),
    validRemindersConfig((args) => args.data.remindersConfig, "data.remindersConfig"),
    validSignatureConfig((args) => args.data.signatureConfig, "data.signatureConfig")
  ),
  resolve: async (_, args, ctx) => {
    const {
      name,
      locale,
      deadline,
      emailSubject,
      emailBody,
      remindersConfig,
      skipForwardSecurity,
      isRecipientViewContentsHidden,
      signatureConfig,
      description,
    } = args.data;
    const data: Partial<CreatePetition> = {};
    if (name !== undefined) {
      data.name = name?.trim() || null;
    }
    if (isDefined(locale)) {
      data.locale = locale;
    }
    if (deadline !== undefined) {
      data.deadline = deadline;
    }
    if (emailSubject !== undefined) {
      data.email_subject = emailSubject?.trim() || null;
    }
    if (emailBody !== undefined) {
      data.email_body = emailBody && JSON.stringify(emailBody);
    }
    if (remindersConfig !== undefined) {
      if (remindersConfig === null) {
        data.reminders_config = null;
        data.reminders_active = false;
      } else {
        data.reminders_config = remindersConfig;
        data.reminders_active = true;
      }
    }
    if (isDefined(skipForwardSecurity)) {
      data.skip_forward_security = skipForwardSecurity;
    }
    if (isDefined(isRecipientViewContentsHidden)) {
      data.hide_recipient_view_contents = isRecipientViewContentsHidden;
    }
    if (signatureConfig !== undefined) {
      const contacts = await ctx.contacts.loadContact(
        signatureConfig?.signersInfo.map((c) => c.contactId) ?? []
      );
      // TODO: signersInfo should be just a list of ids
      data.signature_config = signatureConfig && {
        ...signatureConfig,
        signersInfo:
          signatureConfig.signersInfo.length > 0
            ? contacts.map((c) => ({
                contactId: c!.id,
                email: c!.email,
                lastName: c!.last_name,
                firstName: c!.first_name,
              }))
            : [],
      };
    }
    if (description !== undefined) {
      data.template_description = description === null ? null : JSON.stringify(description);
    }

    const [petition] = await ctx.petitions.updatePetition(
      args.petitionId,
      data,
      `User:${ctx.user!.id}`
    );
    return petition;
  },
});

export const createPetitionField = mutationField("createPetitionField", {
  description: "Creates a petition field",
  type: "PetitionField",
  authorize: authenticateAnd(
    userHasAccessToPetitions("petitionId"),
    petitionsAreEditable("petitionId"),
    petitionsAreNotPublicTemplates("petitionId")
  ),
  args: {
    petitionId: nonNull(globalIdArg("Petition")),
    type: nonNull(arg({ type: "PetitionFieldType" })),
    position: intArg(),
  },
  validateArgs: inRange((args) => args.position, "position", 0),
  resolve: async (_, args, ctx) => {
    ctx.petitions.loadPetition.dataloader.clear(args.petitionId);
    return await ctx.petitions.createPetitionFieldAtPosition(
      args.petitionId,
      {
        type: args.type,
        ...defaultFieldOptions(args.type),
      },
      args.position ?? -1,
      ctx.user!
    );
  },
});

export const clonePetitionField = mutationField("clonePetitionField", {
  description: "Clones a petition field",
  type: "PetitionField",
  authorize: authenticateAnd(
    userHasAccessToPetitions("petitionId"),
    fieldsBelongsToPetition("petitionId", "fieldId"),
    petitionsAreEditable("petitionId"),
    petitionsAreNotPublicTemplates("petitionId")
  ),
  args: {
    petitionId: nonNull(globalIdArg("Petition")),
    fieldId: nonNull(globalIdArg("PetitionField")),
  },
  resolve: async (_, args, ctx) => {
    return await ctx.petitions.clonePetitionField(args.petitionId, args.fieldId, ctx.user!);
  },
});

export const deletePetitionField = mutationField("deletePetitionField", {
  description: "Deletes a petition field.",
  type: "PetitionBase",
  authorize: authenticateAnd(
    userHasAccessToPetitions("petitionId"),
    fieldsBelongsToPetition("petitionId", "fieldId"),
    fieldIsNotFixed("fieldId"),
    petitionsAreEditable("petitionId"),
    petitionsAreNotPublicTemplates("petitionId")
  ),
  args: {
    petitionId: nonNull(globalIdArg("Petition")),
    fieldId: nonNull(globalIdArg("PetitionField")),
    force: booleanArg({ default: false }),
  },
  resolve: async (_, args, ctx) => {
    const replies = await ctx.petitions.loadRepliesForField(args.fieldId);
    if (!args.force && replies.length > 0) {
      throw new WhitelistedError("The petition field has replies.", "FIELD_HAS_REPLIES_ERROR");
    }

    const petitionFields = await ctx.petitions.loadFieldsForPetition(args.petitionId, {
      cache: false,
    });
    if (
      petitionFields.some((f) =>
        f.visibility?.conditions.some((c: any) => c.fieldId === args.fieldId)
      )
    ) {
      throw new WhitelistedError(
        "The petition field is being referenced in another field.",
        "FIELD_IS_REFERENCED_ERROR"
      );
    }

    return await ctx.petitions.deletePetitionField(args.petitionId, args.fieldId, ctx.user!);
  },
});

export const updatePetitionField = mutationField("updatePetitionField", {
  description: "Updates a petition field.",
  type: "PetitionField",
  authorize: authenticateAnd(
    userHasAccessToPetitions("petitionId"),
    fieldsBelongsToPetition("petitionId", "fieldId"),
    petitionsAreEditable("petitionId"),
    petitionsAreNotPublicTemplates("petitionId")
  ),
  args: {
    petitionId: nonNull(globalIdArg("Petition")),
    fieldId: nonNull(globalIdArg("PetitionField")),
    data: nonNull(
      inputObjectType({
        name: "UpdatePetitionFieldInput",
        definition(t) {
          t.nullable.string("title");
          t.nullable.string("description");
          t.nullable.field("options", { type: "JSONObject" });
          t.nullable.boolean("optional");
          t.nullable.boolean("multiple");
          t.nullable.field("visibility", { type: "JSONObject" });
          t.nullable.string("alias");
        },
      }).asArg()
    ),
  },
  validateArgs: validateAnd(
    notEmptyObject((args) => args.data, "data"),
    maxLength((args) => args.data.title, "data.title", 500),
    maxLength((args) => args.data.alias, "data.alias", 100),
    validateIf(
      (args) => isDefined(args.data.visibility),
      validFieldVisibilityJson(
        (args) => args.petitionId,
        (args) => args.fieldId,
        (args) => args.data.visibility,
        "data.visibility"
      )
    )
  ),
  resolve: async (_, args, ctx, info) => {
    const { title, description, optional, multiple, options, visibility, alias } = args.data;
    const data: Partial<CreatePetitionField> = {};
    if (title !== undefined) {
      data.title = title?.trim() || null;
    }
    if (description !== undefined) {
      data.description = description?.trim() || null;
    }
    if (isDefined(optional)) {
      data.optional = optional;
    }
    if (isDefined(multiple)) {
      data.multiple = multiple;
    }
    if (alias !== undefined) {
      data.alias = alias?.trim() || null;
    }

    if (isDefined(options)) {
      try {
        const field = await ctx.petitions.validateFieldData(args.fieldId, {
          options,
        });
        data.options = { ...field.options, ...options };
      } catch (e: any) {
        throw new ArgValidationError(info, "data.options", e.toString());
      }
    }

    if (visibility !== undefined) {
      data.visibility =
        visibility === null
          ? null
          : {
              ...visibility,
              conditions: visibility.conditions.map((c: any) => ({
                ...c,
                fieldId: fromGlobalId(c.fieldId, "PetitionField").id,
              })),
            };
    }

    try {
      ctx.petitions.loadPetition.dataloader.clear(args.petitionId);
      return await ctx.petitions.updatePetitionField(
        args.petitionId,
        args.fieldId,
        data,
        ctx.user!
      );
    } catch (error: any) {
      if (error.constraint === "petition_field__petition_id__alias__unique") {
        throw new WhitelistedError(
          "The alias for this field already exists in this petition",
          "ALIAS_ALREADY_EXISTS"
        );
      } else {
        throw error;
      }
    }
  },
});

export const uploadDynamicSelectFile = mutationField("uploadDynamicSelectFieldFile", {
  description:
    "Uploads the xlsx file used to parse the options of a dynamic select field, and sets the field options",
  type: "PetitionField",
  authorize: authenticateAnd(
    userHasAccessToPetitions("petitionId"),
    fieldsBelongsToPetition("petitionId", "fieldId"),
    fieldHasType("fieldId", ["DYNAMIC_SELECT"]),
    petitionsAreNotPublicTemplates("petitionId")
  ),
  args: {
    petitionId: nonNull(globalIdArg("Petition")),
    fieldId: nonNull(globalIdArg("PetitionField")),
    file: nonNull(uploadArg()),
  },
  validateArgs: validateFile(
    (args) => args.file,
    {
      contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      maxSize: 1024 * 1024 * 10,
    },
    "file"
  ),
  resolve: async (_, args, ctx) => {
    const file = await args.file;

    const [importError, importResult] = await withError(importFromExcel(file.createReadStream()));
    if (importError) {
      throw new WhitelistedError("Invalid file", "INVALID_FORMAT_ERROR");
    }
    const [parseError, parseResult] = await withError(() =>
      parseDynamicSelectValues(importResult!)
    );
    if (parseError) {
      throw new WhitelistedError(parseError.message, "INVALID_FORMAT_ERROR");
    }
    const { labels, values } = parseResult!;

    const key = random(16);
    const res = await ctx.aws.fileUploads.uploadFile(key, file.mimetype, file.createReadStream());

    const fileUpload = await ctx.files.createFileUpload(
      {
        content_type: file.mimetype,
        filename: file.filename,
        path: key,
        size: res["ContentLength"]!.toString(),
        upload_complete: true,
      },
      `User:${ctx.user!.id}`
    );

    const options = {
      values,
      labels,
      file: {
        id: toGlobalId("FileUpload", fileUpload.id),
        name: fileUpload.filename,
        size: res["ContentLength"],
        updatedAt: fileUpload.updated_at.toISOString(),
      },
    };
    await ctx.petitions.validateFieldData(args.fieldId, { options });
    return await ctx.petitions.updatePetitionField(
      args.petitionId,
      args.fieldId,
      { options },
      ctx.user!
    );
  },
});

export const dynamicSelectFieldFileDownloadLink = mutationField(
  "dynamicSelectFieldFileDownloadLink",
  {
    description:
      "generates a signed download link for the xlsx file containing the listings of a dynamic select field",
    type: "FileUploadDownloadLinkResult",
    authorize: authenticateAnd(
      userHasAccessToPetitions("petitionId"),
      fieldsBelongsToPetition("petitionId", "fieldId"),
      fieldHasType("fieldId", ["DYNAMIC_SELECT"])
    ),
    args: {
      petitionId: nonNull(globalIdArg("Petition")),
      fieldId: nonNull(globalIdArg("PetitionField")),
    },
    resolve: async (_, args, ctx) => {
      try {
        const field = await ctx.petitions.loadField(args.fieldId);
        const fileId = field?.options.file?.id
          ? fromGlobalId(field.options.file.id, "FileUpload").id
          : null;
        const file = await ctx.files.loadFileUpload(fileId as any);
        return {
          result: RESULT.SUCCESS,
          file,
          url: await ctx.aws.fileUploads.getSignedDownloadEndpoint(
            file!.path,
            file!.filename,
            "attachment"
          ),
        };
      } catch {
        return { result: RESULT.FAILURE };
      }
    },
  }
);

export const validatePetitionFields = mutationField("validatePetitionFields", {
  description:
    "Updates the validation of a field and sets the petition as closed if all fields are validated.",
  type: "PetitionAndPartialFields",
  authorize: chain(
    authenticate(),
    and(userHasAccessToPetitions("petitionId"), fieldsBelongsToPetition("petitionId", "fieldIds"))
  ),
  args: {
    petitionId: nonNull(globalIdArg("Petition")),
    fieldIds: nonNull(list(nonNull(globalIdArg("PetitionField")))),
    value: nonNull(booleanArg()),
    validateRepliesWith: arg({ type: "PetitionFieldReplyStatus" }),
  },
  validateArgs: notEmptyArray((args) => args.fieldIds, "fieldIds"),
  resolve: async (_, args, ctx) => {
    const fields = await ctx.petitions.validatePetitionFields(
      args.petitionId,
      args.fieldIds,
      args.value,
      ctx.user!
    );
    if (args.value || args.validateRepliesWith) {
      const replies = await ctx.petitions.loadRepliesForField(args.fieldIds, {
        cache: false,
      });
      await ctx.petitions.updatePetitionFieldRepliesStatus(
        replies.flatMap((r) => r.filter((r) => r.status === "PENDING").map((r) => r.id)),
        args.validateRepliesWith || "APPROVED",
        `User:${ctx.user!.id}`
      );
    }

    const petition = (await ctx.petitions.loadPetition(args.petitionId, {
      cache: false,
    }))!;

    if (
      args.validateRepliesWith &&
      args.validateRepliesWith !== "PENDING" &&
      petition.status === "CLOSED"
    ) {
      await ctx.petitions.createEvent({
        type: "PETITION_CLOSED",
        petition_id: petition.id,
        data: {
          user_id: ctx.user!.id,
        },
      });
    }
    return { petition, fields };
  },
});

export const updatePetitionFieldRepliesStatus = mutationField("updatePetitionFieldRepliesStatus", {
  description:
    "Updates the status of a petition field reply and sets the petition as closed if all fields are validated.",
  type: "PetitionField",
  authorize: authenticateAnd(
    userHasAccessToPetitions("petitionId"),
    fieldsBelongsToPetition("petitionId", "petitionFieldId"),
    repliesBelongsToField("petitionFieldId", "petitionFieldReplyIds")
  ),
  args: {
    petitionId: nonNull(globalIdArg("Petition")),
    petitionFieldId: nonNull(globalIdArg("PetitionField")),
    petitionFieldReplyIds: nonNull(list(nonNull(globalIdArg("PetitionFieldReply")))),
    status: nonNull(arg({ type: "PetitionFieldReplyStatus" })),
    validateFields: booleanArg({
      description:
        "If true, the field will be validated if all the replies are approved or rejected",
    }),
  },
  validateArgs: notEmptyArray((args) => args.petitionFieldReplyIds, "petitionFieldReplyIds"),
  resolve: async (_, args, ctx) => {
    await ctx.petitions.updatePetitionFieldRepliesStatus(
      args.petitionFieldReplyIds,
      args.status,
      `User:${ctx.user!.id}`
    );
    if (args.status === "APPROVED" && args.validateFields) {
      const allReplies = await ctx.petitions.loadRepliesForField(args.petitionFieldId);
      if (allReplies.every((r) => ["APPROVED", "REJECTED"].includes(r.status))) {
        const [field] = await ctx.petitions.validatePetitionFields(
          args.petitionId,
          [args.petitionFieldId],
          true,
          ctx.user!
        );
        return field;
      }
    }
    return (await ctx.petitions.loadField(args.petitionFieldId))!;
  },
});

export const fileUploadReplyDownloadLink = mutationField("fileUploadReplyDownloadLink", {
  description: "Generates a download link for a file reply.",
  type: "FileUploadDownloadLinkResult",
  authorize: chain(
    authenticate(),
    and(userHasAccessToPetitions("petitionId"), repliesBelongsToPetition("petitionId", "replyId"))
  ),
  args: {
    petitionId: nonNull(globalIdArg("Petition")),
    replyId: nonNull(globalIdArg("PetitionFieldReply")),
    preview: booleanArg({
      description: "If true will use content-disposition inline instead of attachment",
    }),
  },
  resolve: async (_, args, ctx) => {
    try {
      const reply = await ctx.petitions.loadFieldReply(args.replyId);
      if (reply!.type !== "FILE_UPLOAD") {
        throw new WhitelistedError(
          "Only FILE_UPLOAD replies can be downloaded",
          "INVALID_FIELD_TYPE"
        );
      }
      const file = await ctx.files.loadFileUpload(reply!.content["file_upload_id"]);
      if (!file) {
        throw new Error(`FileUpload not found with id ${reply!.content["file_upload_id"]}`);
      }
      if (!file.upload_complete) {
        await ctx.aws.fileUploads.getFileMetadata(file!.path);
        await ctx.files.markFileUploadComplete(file.id, `User:${ctx.user!.id}`);
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
    } catch (error: any) {
      if (error instanceof WhitelistedError) {
        throw error;
      }
      return {
        result: RESULT.FAILURE,
      };
    }
  },
});

export const bulkSendPetition = mutationField("bulkSendPetition", {
  description:
    "Sends different petitions to each of the specified contact groups, creating corresponding accesses and messages",
  type: nonNull(list(nonNull("SendPetitionResult"))),
  authorize: authenticateAnd(
    userHasAccessToPetitions("petitionId"),
    petitionHasRepliableFields("petitionId"),
    userHasAccessToContactGroups("contactIdGroups"),
    orgHasAvailablePetitionSendCredits(
      (args) => args.petitionId,
      (args) => args.contactIdGroups.length
    )
  ),
  args: {
    petitionId: nonNull(globalIdArg("Petition")),
    contactIdGroups: nonNull(list(nonNull(list(nonNull(globalIdArg("Contact")))))),
    subject: nonNull(stringArg()),
    body: nonNull(jsonArg()),
    scheduledAt: datetimeArg(),
    remindersConfig: arg({ type: "RemindersConfigInput" }),
    bulkSendSigningMode: arg({
      type: enumType({
        name: "BulkSendSigningMode",
        members: [
          {
            name: "COPY_SIGNATURE_SETTINGS",
            description: "Allow configured signer(s) to sign every petition on the batch",
          },
          {
            name: "LET_RECIPIENT_CHOOSE",
            description: "Let recipients of each group to choose who will sign the petitions.",
          },
          {
            name: "DISABLE_SIGNATURE",
            description: "Disable eSignature on every petition of this batch.",
          },
        ],
      }),
    }),
  },
  validateArgs: validateAnd(
    notEmptyArray((args) => args.contactIdGroups, "contactIdGroups"),
    maxLength((args) => args.subject, "subject", 255),
    notEmptyString((args) => args.subject, "subject"),
    validRichTextContent((args) => args.body, "body"),
    validRemindersConfig((args) => args.remindersConfig, "remindersConfig")
  ),
  resolve: async (_, args, ctx) => {
    const [petition, owner, requiredCredits] = await Promise.all([
      ctx.petitions.loadPetition(args.petitionId),
      ctx.petitions.loadPetitionOwner(args.petitionId),
      getRequiredPetitionSendCredits(args.petitionId, args.contactIdGroups.length, ctx),
    ]);

    if (!petition) {
      throw new Error(`Petition:${args.petitionId} not found`);
    }
    if (!owner) {
      throw new Error(`Owner of Petition:${args.petitionId} not found`);
    }

    const clonedPetitions = await pMap(
      args.contactIdGroups.slice(1),
      async () =>
        await ctx.petitions.clonePetition(
          args.petitionId,
          owner, // set the owner of the original petition as owner of the cloned ones
          {},
          true, // also clone the petition replies
          `User:${ctx.user!.id}`
        ),
      { concurrency: 5 }
    );

    if (
      isDefined(args.bulkSendSigningMode) &&
      args.bulkSendSigningMode !== "COPY_SIGNATURE_SETTINGS"
    ) {
      await ctx.petitions.updatePetition(
        [petition.id, ...clonedPetitions.map((p) => p.id)],
        {
          signature_config:
            args.bulkSendSigningMode === "LET_RECIPIENT_CHOOSE"
              ? {
                  ...petition.signature_config!,
                  signersInfo: [],
                  review: false,
                  letRecipientsChooseSigners: true,
                }
              : null,
        },
        `User:${ctx.user!.id}`
      );
    }

    if (clonedPetitions.length > 0) {
      // clone the permissions of the original petition to the cloned ones
      await ctx.petitions.clonePetitionPermissions(
        args.petitionId,
        clonedPetitions.map((p) => p.id),
        `User:${ctx.user!.id}`
      );
    }

    const results = await presendPetition(
      zip([petition, ...clonedPetitions], args.contactIdGroups),
      args,
      ctx.user!,
      false,
      ctx
    );

    const successfulSends = results.filter((r) => r.result === "SUCCESS");

    await sendPetitionMessageEmails(
      successfulSends.flatMap((s) => s.messages?.filter((m) => !isDefined(m.scheduled_at)) ?? []),
      ctx
    );

    if (requiredCredits > 0) {
      await ctx.organizations.updateOrganizationCurrentUsageLimitCredits(
        ctx.user!.org_id,
        "PETITION_SEND",
        requiredCredits
      );
    }

    return results.map((r) => omit(r, ["messages"]));
  },
});

export const sendPetition = mutationField("sendPetition", {
  description: "Sends the petition and creates the corresponding accesses and messages.",
  type: "SendPetitionResult",
  authorize: authenticateAnd(
    userHasAccessToPetitions("petitionId"),
    userHasAccessToContacts("contactIds"),
    petitionHasRepliableFields("petitionId"),
    orgHasAvailablePetitionSendCredits(
      (args) => args.petitionId,
      () => 1
    )
  ),
  args: {
    petitionId: nonNull(globalIdArg("Petition")),
    contactIds: nonNull(list(nonNull(globalIdArg("Contact")))),
    subject: stringArg(),
    body: jsonArg(),
    scheduledAt: datetimeArg(),
    remindersConfig: arg({ type: "RemindersConfigInput" }),
  },
  validateArgs: validateAnd(
    notEmptyArray((args) => args.contactIds, "contactIds"),
    maxLength((args) => args.subject, "subject", 255),
    validateIfDefined(
      (args) => args.subject,
      notEmptyString((args) => args.subject, "subject")
    ),
    validRichTextContent((args) => args.body, "body"),
    validRemindersConfig((args) => args.remindersConfig, "remindersConfig")
  ),
  resolve: async (_, args, ctx) => {
    const [petition, requiredCredits] = await Promise.all([
      ctx.petitions.loadPetition(args.petitionId),
      getRequiredPetitionSendCredits(args.petitionId, 1, ctx),
    ]);
    if (!petition) {
      throw new Error("Petition not available");
    }
    const subject = args.subject ?? petition.email_subject;
    const body =
      args.body ?? (isDefined(petition.email_body) ? JSON.parse(petition.email_body) : null);
    if (!isDefined(subject) || !isDefined(body)) {
      throw new WhitelistedError("Missing email subject or email body", "MISSING_SUBJECT_OR_BODY");
    }

    const [{ result, error, accesses, messages, petition: updatedPetition }] =
      await presendPetition(
        [[petition, args.contactIds]],
        {
          ...omit(args, ["subject", "body"]),
          subject,
          body,
        },
        ctx.user!,
        false,
        ctx
      );

    if (result === "FAILURE" && error.constraint === "petition_access__petition_id_contact_id") {
      throw new WhitelistedError(
        "This petition was already sent to some of the contacts",
        "PETITION_ALREADY_SENT_ERROR"
      );
    }

    if (result === "SUCCESS") {
      await sendPetitionMessageEmails(
        messages?.filter((m) => !isDefined(m.scheduled_at)) ?? [],
        ctx
      );
    }

    if (requiredCredits > 0) {
      await ctx.organizations.updateOrganizationCurrentUsageLimitCredits(
        ctx.user!.org_id,
        "PETITION_SEND",
        requiredCredits
      );
    }

    return {
      petition: updatedPetition,
      accesses,
      result,
    };
  },
});

export const sendReminders = mutationField("sendReminders", {
  description: "Sends a reminder for the specified petition accesses.",
  type: "Result",
  authorize: chain(
    authenticate(),
    and(userHasAccessToPetitions("petitionId"), accessesBelongToPetition("petitionId", "accessIds"))
  ),
  args: {
    petitionId: nonNull(globalIdArg("Petition")),
    body: jsonArg(),
    accessIds: nonNull(list(nonNull(globalIdArg("PetitionAccess")))),
  },
  validateArgs: validRichTextContent((args) => args.body, "body"),
  resolve: async (_, args, ctx, info) => {
    const [petition, accesses] = await Promise.all([
      ctx.petitions.loadPetition(args.petitionId),
      ctx.petitions.loadAccess(args.accessIds),
    ]);

    validatePetitionStatus(petition, "PENDING", info);
    validateAccessesStatus(accesses, "ACTIVE", info);
    validateAccessesRemindersLeft(accesses, info);

    try {
      const reminders = await ctx.petitions.createReminders(
        args.accessIds.map((accessId) => ({
          type: "MANUAL",
          status: "PROCESSING",
          petition_access_id: accessId,
          sender_id: ctx.user!.id,
          email_body: args.body ? JSON.stringify(args.body) : null,
          created_by: `User:${ctx.user!.id}`,
        }))
      );

      await ctx.petitions.createEvent(
        reminders.filter(isDefined).map((reminder) => ({
          type: "REMINDER_SENT",
          petition_id: args.petitionId,
          data: {
            petition_reminder_id: reminder.id,
          },
        }))
      );

      await ctx.emails.sendPetitionReminderEmail(reminders.map((r) => r.id));

      return RESULT.SUCCESS;
    } catch (error: any) {
      return RESULT.FAILURE;
    }
  },
});

export const switchAutomaticReminders = mutationField("switchAutomaticReminders", {
  description: "Switches automatic reminders for the specified petition accesses.",
  type: list(nonNull("PetitionAccess")),
  authorize: chain(
    authenticate(),
    and(userHasAccessToPetitions("petitionId"), accessesBelongToPetition("petitionId", "accessIds"))
  ),
  args: {
    start: nonNull(booleanArg()),
    petitionId: nonNull(globalIdArg("Petition")),
    accessIds: nonNull(list(nonNull(globalIdArg("PetitionAccess")))),
    remindersConfig: arg({ type: "RemindersConfigInput" }),
  },
  validateArgs: validateOr(
    validBooleanValue((args) => args.start, "start", false),
    validateAnd(
      validIsDefined((args) => args.remindersConfig, "remindersConfig"),
      validRemindersConfig((args) => args.remindersConfig, "remindersConfig")
    )
  ),
  resolve: async (_, args, ctx, info) => {
    const [petition, accesses] = await Promise.all([
      ctx.petitions.loadPetition(args.petitionId),
      ctx.petitions.loadAccess(args.accessIds),
    ]);

    validatePetitionStatus(petition, "PENDING", info);
    validateAccessesStatus(accesses, "ACTIVE", info);
    petitionAccessesNotOptedOut(accesses, info);

    if (args.start) {
      validateAccessesRemindersLeft(accesses, info);
      const validAccessIds: number[] = accesses.filter((a) => a !== null).map((a) => a!.id);

      return await ctx.petitions.startAccessReminders(validAccessIds, args.remindersConfig!);
    } else {
      return await ctx.petitions.stopAccessReminders(args.accessIds);
    }
  },
});

export const deactivateAccesses = mutationField("deactivateAccesses", {
  description: "Deactivates the specified active petition accesses.",
  type: list(nonNull("PetitionAccess")),
  authorize: chain(
    authenticate(),
    and(userHasAccessToPetitions("petitionId"), accessesBelongToPetition("petitionId", "accessIds"))
  ),
  args: {
    petitionId: nonNull(globalIdArg("Petition")),
    accessIds: nonNull(list(nonNull(globalIdArg("PetitionAccess")))),
  },
  resolve: async (_, args, ctx) => {
    return await ctx.petitions.deactivateAccesses(args.petitionId, args.accessIds, ctx.user!);
  },
});

export const reactivateAccesses = mutationField("reactivateAccesses", {
  description: "Reactivates the specified inactive petition accesses.",
  type: list(nonNull("PetitionAccess")),
  authorize: chain(
    authenticate(),
    and(
      userHasAccessToPetitions("petitionId"),
      accessesBelongToPetition("petitionId", "accessIds"),
      accessesBelongToValidContacts("accessIds")
    )
  ),
  args: {
    petitionId: nonNull(globalIdArg("Petition")),
    accessIds: nonNull(list(nonNull(globalIdArg("PetitionAccess")))),
  },
  resolve: async (_, args, ctx, info) => {
    return await ctx.petitions.reactivateAccesses(args.petitionId, args.accessIds, ctx.user!);
  },
});

export const cancelScheduledMessage = mutationField("cancelScheduledMessage", {
  description: "Cancels a scheduled petition message.",
  type: nullable("PetitionMessage"),
  authorize: chain(
    authenticate(),
    and(userHasAccessToPetitions("petitionId"), messageBelongToPetition("petitionId", "messageId"))
  ),
  args: {
    petitionId: nonNull(globalIdArg("Petition")),
    messageId: nonNull(globalIdArg("PetitionMessage")),
  },
  resolve: async (_, args, ctx) => {
    return await ctx.petitions.cancelScheduledMessage(args.petitionId, args.messageId, ctx.user!);
  },
});

export const changePetitionFieldType = mutationField("changePetitionFieldType", {
  description: "Changes the type of a petition Field",
  type: "PetitionField",
  authorize: authenticateAnd(
    userHasAccessToPetitions("petitionId"),
    fieldsBelongsToPetition("petitionId", "fieldId"),
    petitionsAreEditable("petitionId"),
    petitionsAreNotPublicTemplates("petitionId")
  ),
  args: {
    petitionId: nonNull(globalIdArg("Petition")),
    fieldId: nonNull(globalIdArg("PetitionField")),
    type: nonNull(arg({ type: "PetitionFieldType" })),
    force: booleanArg({ default: false }),
  },
  resolve: async (_, args, ctx) => {
    const replies = await ctx.petitions.loadRepliesForField(args.fieldId, {
      cache: false,
    });

    const field = await ctx.petitions.loadField(args.fieldId);

    if (field && !args.force && replies.length > 0 && !isValueCompatible(field.type, args.type)) {
      throw new ApolloError("The petition field has replies.", "FIELD_HAS_REPLIES_ERROR");
    }
    try {
      return await ctx.petitions.changePetitionFieldType(
        args.petitionId,
        args.fieldId,
        args.type,
        ctx.user!
      );
    } catch (e: any) {
      if (e.message === "UPDATE_FIXED_FIELD_ERROR") {
        throw new ApolloError("Can't change type of a fixed field", "UPDATE_FIXED_FIELD_ERROR");
      } else {
        throw e;
      }
    }
  },
});

export const sendPetitionClosedNotification = mutationField("sendPetitionClosedNotification", {
  description: "Sends an email to all contacts of the petition confirming the replies are ok",
  type: "Petition",
  args: {
    petitionId: nonNull(globalIdArg("Petition")),
    emailBody: nonNull(jsonArg()),
    attachPdfExport: nonNull(booleanArg()),
    pdfExportTitle: stringArg(),
    force: booleanArg({ default: false }),
  },
  authorize: chain(authenticate(), userHasAccessToPetitions("petitionId")),
  validateArgs: validRichTextContent((args) => args.emailBody, "emailBody"),
  resolve: async (_, args, ctx) => {
    const shouldSendNotification = await ctx.petitions.shouldNotifyPetitionClosed(args.petitionId);
    if (!shouldSendNotification && !args.force) {
      throw new WhitelistedError(
        "You already notified the contacts",
        "ALREADY_NOTIFIED_PETITION_CLOSED_ERROR"
      );
    }

    const accesses = await ctx.petitions.loadAccessesForPetition(args.petitionId);

    const activeAccesses = accesses.filter((a) => a.status === "ACTIVE");

    await Promise.all([
      ctx.emails.sendPetitionClosedEmail(
        args.petitionId,
        ctx.user!.id,
        activeAccesses.map((a) => a.id),
        args.emailBody,
        args.attachPdfExport,
        args.pdfExportTitle ?? null
      ),
      ctx.petitions.createEvent(
        activeAccesses.map((access) => ({
          type: "PETITION_CLOSED_NOTIFIED",
          petition_id: args.petitionId,
          data: {
            user_id: ctx.user!.id,
            petition_access_id: access.id,
          },
        }))
      ),
    ]);

    return (await ctx.petitions.loadPetition(args.petitionId))!;
  },
});

export const reopenPetition = mutationField("reopenPetition", {
  description: "Reopens the petition",
  type: "Petition",
  authorize: authenticateAnd(userHasAccessToPetitions("petitionId")),
  args: {
    petitionId: nonNull(globalIdArg("Petition")),
  },
  resolve: async (_, args, ctx) => {
    return await ctx.petitions.withTransaction(async (t) => {
      const [[petition]] = await Promise.all([
        ctx.petitions.reopenPetition(args.petitionId, `User:${ctx.user!.id}`, false, t),
        ctx.petitions.createEvent(
          {
            type: "PETITION_REOPENED",
            petition_id: args.petitionId,
            data: { user_id: ctx.user!.id },
          },
          t
        ),
      ]);

      return petition;
    });
  },
});

export const updatePetitionFieldReplyMetadata = mutationField("updatePetitionFieldReplyMetadata", {
  description: "Updates the metada of the specified petition field reply",
  type: "PetitionFieldReply",
  authorize: chain(
    authenticate(),
    and(userHasAccessToPetitions("petitionId"), repliesBelongsToPetition("petitionId", "replyId"))
  ),
  args: {
    petitionId: nonNull(globalIdArg("Petition")),
    replyId: nonNull(globalIdArg("PetitionFieldReply")),
    metadata: nonNull(jsonObjectArg()),
  },
  validateArgs: jsonSchema({
    type: "object",
    additionalProperties: { type: ["string", "boolean", "number"] },
  })((args) => args.metadata, "metadata"),
  resolve: async (_, args, ctx) => {
    return await ctx.petitions.updatePetitionFieldReplyMetadata(args.replyId, args.metadata);
  },
});

export const updateTemplateDefaultPermissions = mutationField("updateTemplateDefaultPermissions", {
  description: "Updates the template default permissions",
  type: "PetitionTemplate",
  authorize: authenticateAnd(
    userHasAccessToPetitions("templateId"),
    petitionsAreOfTypeTemplate("templateId"),
    userHasAccessToUserOrUserGroupPermissions("permissions")
  ),
  args: {
    templateId: nonNull(globalIdArg("Petition")),
    permissions: nonNull(list(nonNull("UserOrUserGroupPermissionInput"))),
  },
  resolve: async (_, args, ctx) => {
    await ctx.petitions.updateTemplateDefaultPermissions(
      args.templateId,
      args.permissions as any,
      `User:${ctx.user!.id}`
    );
    return (await ctx.petitions.loadPetition(args.templateId))!;
  },
});

export const createPublicPetitionLink = mutationField("createPublicPetitionLink", {
  description: "Creates a public link from a user's template",
  type: "PublicPetitionLink",
  authorize: authenticateAnd(
    userHasAccessToPetitions("templateId"),
    petitionsAreOfTypeTemplate("templateId"),
    templateDoesNotHavePublicPetitionLink("templateId"),
    userHasAccessToUsers("ownerId")
  ),
  args: {
    templateId: nonNull(globalIdArg("Petition")),
    title: nonNull(stringArg()),
    description: nonNull(stringArg()),
    ownerId: nonNull(globalIdArg("User")),
    slug: nullable(stringArg()),
  },
  validateArgs: validateIfDefined(
    (args) => args.slug,
    validatePublicPetitionLinkSlug((args) => args.slug!, "slug")
  ),
  resolve: async (_, args, ctx) => {
    return await ctx.petitions.createPublicPetitionLink(
      {
        template_id: args.templateId,
        title: args.title,
        description: args.description,
        slug: args.slug ?? random(10),
        owner_id: args.ownerId,
        is_active: true,
      },
      `User:${ctx.user!.id}`
    );
  },
});

export const updatePublicPetitionLink = mutationField("updatePublicPetitionLink", {
  description: "Updates the info and permissions of a public link",
  type: "PublicPetitionLink",
  authorize: authenticateAnd(
    userHasAccessToPublicPetitionLink("publicPetitionLinkId"),
    ifArgDefined((args) => args.ownerId, userHasAccessToUsers("ownerId" as any))
  ),
  args: {
    publicPetitionLinkId: nonNull(globalIdArg("PublicPetitionLink")),
    isActive: booleanArg(),
    title: stringArg(),
    description: stringArg(),
    ownerId: globalIdArg("User"),
    slug: stringArg(),
  },
  validateArgs: validateIf(
    (args) => isDefined(args.slug),
    validatePublicPetitionLinkSlug(
      (args) => args.slug!,
      "slug",
      (args) => args.publicPetitionLinkId
    )
  ),
  resolve: async (_, args, ctx) => {
    const publicPetitionLinkData: Partial<CreatePublicPetitionLink> = {};
    if (isDefined(args.title)) {
      publicPetitionLinkData.title = args.title;
    }
    if (isDefined(args.description)) {
      publicPetitionLinkData.description = args.description;
    }
    if (isDefined(args.isActive)) {
      publicPetitionLinkData.is_active = args.isActive;
    }
    if (isDefined(args.slug)) {
      publicPetitionLinkData.slug = args.slug;
    }
    if (isDefined(args.ownerId)) {
      publicPetitionLinkData.owner_id = args.ownerId;
    }
    return await ctx.petitions.updatePublicPetitionLink(
      args.publicPetitionLinkId,
      publicPetitionLinkData,
      `User:${ctx.user!.id}`
    );
  },
});

export const modifyPetitionCustomProperty = mutationField("modifyPetitionCustomProperty", {
  description: "Adds, edits or deletes a custom property on the petition",
  type: "PetitionBase",
  authorize: authenticateAnd(userHasAccessToPetitions("petitionId")),
  args: {
    petitionId: nonNull(globalIdArg("Petition")),
    key: nonNull(stringArg()),
    value: stringArg(),
  },
  validateArgs: validateAnd(
    maxLength((args) => args.key, "key", 100),
    validateIfDefined(
      (args) => args.value,
      maxLength((args) => args.value!, "value", 1000)
    )
  ),
  resolve: async (_, { petitionId, key, value }, ctx) => {
    const petition = (await ctx.petitions.loadPetition(petitionId))!;

    if (
      Object.keys(petition.custom_properties).length >= 20 &&
      !isDefined(petition.custom_properties[key])
    ) {
      throw new WhitelistedError(
        "Max limit of properties reached",
        "CUSTOM_PROPERTIES_LIMIT_ERROR"
      );
    }
    return await ctx.petitions.modifyPetitionCustomProperty(
      petitionId,
      key,
      value ?? null,
      `User:${ctx.user!.id}`
    );
  },
});

export const completePetition = mutationField("completePetition", {
  description: `
    Marks a petition as COMPLETED.
    If the petition has a signature configured and does not require a review, starts the signing process.`,
  type: "Petition",
  args: {
    petitionId: nonNull(globalIdArg("Petition")),
    additionalSignersContactIds: list(nonNull(globalIdArg("Contact"))),
    message: nullable("String"),
  },
  authorize: authenticateAnd(
    userHasAccessToPetitions("petitionId"),
    userHasAccessToContacts("additionalSignersContactIds" as never),
    orgHasAvailablePetitionSendCredits(
      (args) => args.petitionId,
      () => 1
    )
  ),
  resolve: async (_, args, ctx) => {
    try {
      return await ctx.petitions.withTransaction(async (t) => {
        const requiredCredits = await getRequiredPetitionSendCredits(args.petitionId, 1, ctx);
        let petition = await ctx.petitions.completePetition(
          args.petitionId,
          ctx.user!,
          { credits_used: 1 },
          t
        );
        if (petition.signature_config?.review === false) {
          const contacts = await ctx.contacts.loadContact(args.additionalSignersContactIds ?? []);
          const { petition: updatedPetition } = await ctx.signature.createSignatureRequest(
            petition.id,
            {
              ...petition.signature_config,
              additionalSignersInfo: contacts.map((c) => ({
                contactId: c!.id,
                email: c!.email,
                firstName: c!.first_name!,
                lastName: c!.last_name!,
              })),
              message: args.message ?? undefined,
            },
            ctx.user!,
            t
          );
          petition = updatedPetition ?? petition;
        }
        await ctx.organizations.updateOrganizationCurrentUsageLimitCredits(
          ctx.user!.org_id,
          "PETITION_SEND",
          requiredCredits,
          t
        );
        await ctx.petitions.createEvent(
          {
            type: "PETITION_COMPLETED",
            petition_id: args.petitionId,
            data: { user_id: ctx.user!.id },
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
        // complete the petition anyways and send signature_cancelled event for later notification to the user
        const completedPetition = await ctx.petitions.withTransaction(async (t) => {
          const requiredCredits = await getRequiredPetitionSendCredits(args.petitionId, 1, ctx);
          const [petition] = await Promise.all([
            ctx.petitions.completePetition(
              args.petitionId,
              ctx.user!,
              {
                credits_used: 1,
              },
              t
            ),
            ctx.organizations.updateOrganizationCurrentUsageLimitCredits(
              ctx.user!.org_id,
              "PETITION_SEND",
              requiredCredits,
              t
            ),
          ]);
          await ctx.petitions.createEvent({
            type: "PETITION_COMPLETED",
            petition_id: petition.id,
            data: { user_id: ctx.user!.id },
          });
          return petition;
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
          petition_id: args.petitionId,
        });

        return completedPetition;
      } else {
        throw error;
      }
    }
  },
});
