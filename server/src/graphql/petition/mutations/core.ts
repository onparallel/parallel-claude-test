import { addMinutes } from "date-fns";
import {
  arg,
  booleanArg,
  enumType,
  idArg,
  inputObjectType,
  intArg,
  list,
  mutationField,
  nonNull,
  nullable,
  stringArg,
} from "nexus";
import { outdent } from "outdent";
import pMap from "p-map";
import { DatabaseError } from "pg";
import {
  filter,
  groupBy,
  isDefined,
  map,
  omit,
  partition,
  pipe,
  range,
  sumBy,
  uniq,
  zip,
  zipWith,
} from "remeda";
import {
  CreatePetition,
  CreatePetitionField,
  CreatePetitionReminder,
  CreatePublicPetitionLink,
  Petition,
  PetitionPermission,
  ProfileTypeFieldType,
} from "../../../db/__types";
import {
  ProfileFieldExpiryUpdatedEvent,
  ProfileFieldFileAddedEvent,
} from "../../../db/events/ProfileEvent";
import { defaultFieldProperties } from "../../../db/helpers/fieldOptions";
import {
  mapPetitionFieldReplyToProfileFieldValue,
  mapProfileTypeFieldToPetitionField,
} from "../../../db/helpers/petitionProfileMapper";
import { chunkWhile, unMaybeArray } from "../../../util/arrays";
import { buildAutomatedBackgroundCheckFieldQueries } from "../../../util/backgroundCheck";
import {
  PetitionFieldMath,
  PetitionFieldVisibility,
  applyFieldVisibility,
  mapFieldLogicCondition,
  mapFieldMathOperation,
} from "../../../util/fieldLogic";
import { fromGlobalId, fromGlobalIds, toGlobalId } from "../../../util/globalId";
import { isFileTypeField } from "../../../util/isFileTypeField";
import { isValueCompatible } from "../../../util/isValueCompatible";
import { isAtLeast } from "../../../util/profileTypeFieldPermission";
import { pFlatMap } from "../../../util/promises/pFlatMap";
import { withError } from "../../../util/promises/withError";
import {
  interpolatePlaceholdersInSlate,
  parseTextWithPlaceholders,
  renderTextWithPlaceholders,
} from "../../../util/slate/placeholders";
import { hash, random } from "../../../util/token";
import { userHasAccessToContactGroups } from "../../contact/authorizers";
import { RESULT } from "../../helpers/Result";
import { SUCCESS } from "../../helpers/Success";
import {
  and,
  argIsDefined,
  authenticateAnd,
  chain,
  ifArgDefined,
  ifArgEquals,
  ifNotEmptyArray,
  ifSomeDefined,
  not,
  or,
} from "../../helpers/authorize";
import { buildProfileUpdatedEventsData } from "../../helpers/buildProfileUpdatedEventsData";
import { globalIdArg } from "../../helpers/globalIdPlugin";
import { importFromExcel } from "../../helpers/importDataFromExcel";
import { parseDynamicSelectValues } from "../../helpers/parseDynamicSelectValues";
import { datetimeArg } from "../../helpers/scalars/DateTime";
import { jsonArg, jsonObjectArg } from "../../helpers/scalars/JSON";
import { uploadArg } from "../../helpers/scalars/Upload";
import { validateAnd, validateIfDefined, validateOr } from "../../helpers/validateArgs";
import { inRange } from "../../helpers/validators/inRange";
import { jsonSchema } from "../../helpers/validators/jsonSchema";
import { maxLength } from "../../helpers/validators/maxLength";
import { notEmptyArray } from "../../helpers/validators/notEmptyArray";
import { notEmptyObject } from "../../helpers/validators/notEmptyObject";
import { notEmptyString } from "../../helpers/validators/notEmptyString";
import { validBooleanValue } from "../../helpers/validators/validBooleanValue";
import { validFieldMath, validFieldVisibility } from "../../helpers/validators/validFieldLogic";
import { validFolderId } from "../../helpers/validators/validFolderId";
import { validIsDefined } from "../../helpers/validators/validIsDefined";
import { validPath } from "../../helpers/validators/validPath";
import { validRemindersConfig } from "../../helpers/validators/validRemindersConfig";
import { validRichTextContent } from "../../helpers/validators/validRichTextContent";
import { validSignatureConfig } from "../../helpers/validators/validSignatureConfig";
import {
  validPetitionSubject,
  validPublicPetitionLinkPetitionNamePattern,
} from "../../helpers/validators/validTextWithPlaceholders";
import { validateFile } from "../../helpers/validators/validateFile";
import { validateRegex } from "../../helpers/validators/validateRegex";
import {
  organizationHasEnoughPetitionSendCredits,
  userHasAccessToOrganizationTheme,
} from "../../organization/authorizers";
import {
  profileHasSameProfileTypeAsField,
  profileHasStatus,
  profileTypeFieldBelongsToPetitionFieldProfileType,
  profileTypeFieldsAreExpirable,
  profileTypeIsArchived,
  userHasAccessToProfile,
  userHasAccessToProfileType,
  userHasPermissionOnProfileTypeField,
} from "../../profile/authorizers";
import { contextUserHasPermission } from "../../users/authorizers";
import {
  accessesBelongToPetition,
  accessesBelongToValidContacts,
  accessesHaveRemindersLeft,
  accessesHaveStatus,
  accessesIsNotOptedOut,
  contextUserCanClonePetitions,
  defaultOnBehalfUserBelongsToContextOrganization,
  fieldAliasIsAvailable,
  fieldCanBeLinkedToProfileType,
  fieldHasParent,
  fieldHasType,
  fieldIsLinkedToProfileType,
  fieldIsLinkedToProfileTypeField,
  fieldIsNotBeingReferencedByAnotherFieldLogic,
  fieldIsNotFirstChild,
  fieldIsNotFixed,
  fieldsBelongsToPetition,
  firstChildHasType,
  foldersAreInPath,
  messageBelongToPetition,
  parentFieldIsInternal,
  petitionFieldsCanBeAssociated,
  petitionHasRepliableFields,
  petitionHasStatus,
  petitionIsNotAnonymized,
  petitionsAreEditable,
  petitionsAreInPath,
  petitionsAreNotPublicTemplates,
  petitionsAreOfTypePetition,
  petitionsAreOfTypeTemplate,
  petitionsArePublicTemplates,
  petitionsHaveEnabledInteractionWithRecipients,
  profileTypeFieldCanBeLinkedToFieldGroup,
  repliesBelongsToField,
  repliesBelongsToPetition,
  replyStatusCanBeUpdated,
  templateDoesNotHavePublicPetitionLink,
  userHasAccessToPetitions,
  userHasAccessToUpdatePetitionFieldGroupRelationshipsInput,
  userHasFeatureFlag,
  userHasPermissionInFolders,
} from "../authorizers";
import { validatePublicPetitionLinkSlug } from "../validations";
import { ApolloError, ArgValidationError, ForbiddenError } from "./../../helpers/errors";
import {
  fieldIsNotBeingUsedInAutoSearchConfig,
  fieldIsNotBeingUsedInMathOperation,
  userCanSendAs,
  userHasAccessToPublicPetitionLink,
  userHasAccessToUserAndUserGroups,
} from "./authorizers";
import { FIELD_REFERENCE_REGEX } from "./variables";

export const createPetition = mutationField("createPetition", {
  description: "Create parallel",
  type: "PetitionBase",
  authorize: authenticateAnd(
    ifArgEquals(
      "type",
      "TEMPLATE",
      and(
        contextUserHasPermission("PETITIONS:CREATE_TEMPLATES"),
        ifArgDefined(
          "petitionId",
          and(
            petitionIsNotAnonymized("petitionId" as never),
            or(
              userHasAccessToPetitions("petitionId" as never),
              and(
                petitionsArePublicTemplates("petitionId" as never),
                contextUserHasPermission("PETITIONS:LIST_PUBLIC_TEMPLATES"),
              ),
            ),
          ),
          argIsDefined("locale"),
        ),
      ),
      and(
        contextUserHasPermission("PETITIONS:CREATE_PETITIONS"),
        ifArgDefined(
          "petitionId",
          and(
            petitionIsNotAnonymized("petitionId" as never),
            or(
              userHasAccessToPetitions("petitionId" as never),
              and(
                petitionsArePublicTemplates("petitionId" as never),
                contextUserHasPermission("PETITIONS:LIST_PUBLIC_TEMPLATES"),
              ),
            ),
          ),
          argIsDefined("locale"),
        ),
      ),
    ),
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
    path: stringArg(),
  },
  validateArgs: validPath((args) => args.path, "path"),
  resolve: async (_, { name, locale, petitionId, type, path }, ctx) => {
    const isTemplate = type === "TEMPLATE";
    let petition: Petition;
    if (petitionId) {
      petition = await ctx.petitions.createPetitionFromId(
        petitionId,
        { isTemplate, name },
        ctx.user!,
      );
    } else {
      const intl = await ctx.i18n.getIntl(locale!);
      petition = await ctx.petitions.createPetition(
        {
          name,
          recipient_locale: locale!,
          email_subject: name,
          is_template: isTemplate,
          path: path ?? undefined,
          ...(isTemplate
            ? {
                is_completing_message_enabled: true,
                completing_message_subject: intl.formatMessage({
                  id: "petition-completing-message-subject",
                  defaultMessage: "Thank you for completing",
                }),
                completing_message_body: JSON.stringify([
                  {
                    type: "paragraph",
                    children: parseTextWithPlaceholders(
                      intl.formatMessage(
                        {
                          id: "petition-completing-message-body",
                          defaultMessage:
                            "We informed {name} that you have completed the information to continue with the process.",
                        },
                        { name: "{{ user-first-name }}" },
                      ),
                    ).map((p) =>
                      p.type === "text"
                        ? { text: p.text }
                        : { type: "placeholder", placeholder: p.value, children: [{ text: "" }] },
                    ),
                  },
                ]),
              }
            : {}),
        },
        ctx.user!,
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
    or(
      userHasAccessToPetitions("petitionIds"),
      and(
        petitionsArePublicTemplates("petitionIds"),
        contextUserHasPermission("PETITIONS:LIST_PUBLIC_TEMPLATES"),
      ),
    ),
    contextUserCanClonePetitions("petitionIds"),
  ),
  args: {
    petitionIds: nonNull(list(nonNull(globalIdArg("Petition")))),
    keepTitle: booleanArg({ default: false }),
    path: stringArg(),
  },
  validateArgs: validateAnd(
    notEmptyArray((args) => args.petitionIds, "petitionIds"),
    validPath((args) => args.path, "path"),
  ),
  resolve: async (_, args, ctx) => {
    const petitions = await ctx.petitions.loadPetition(args.petitionIds);
    return await pMap(
      petitions,
      async (petition) => {
        const { name, recipient_locale: locale, path } = petition!;
        const intl = await ctx.i18n.getIntl(locale);
        const mark = `(${intl.formatMessage({
          id: "generic.copy",
          defaultMessage: "copy",
        })})`;

        const cloned = await ctx.petitions.clonePetition(petition!.id, ctx.user!, {
          name: args.keepTitle
            ? name
              ? name.slice(0, 255)
              : ""
            : `${name ? `${name} ` : ""}${mark}`.slice(0, 255),
          path: args.path ?? path,
        });

        await ctx.petitions.createEvent({
          type: "PETITION_CLONED",
          petition_id: petition!.id,
          data: {
            new_petition_id: cloned.id,
            org_id: cloned.org_id,
            user_id: ctx.user!.id,
            type: cloned.is_template ? "TEMPLATE" : "PETITION",
          },
        });

        return cloned;
      },
      { concurrency: 1 },
    );
  },
});

export const deletePetitions = mutationField("deletePetitions", {
  description: "Delete petitions and folders.",
  type: "Success",
  authorize: authenticateAnd(ifArgDefined("ids", userHasAccessToPetitions("ids" as never))),
  args: {
    ids: list(nonNull(globalIdArg("Petition"))),
    folders: "FoldersInput",
    force: booleanArg({ default: false }),
    dryrun: booleanArg({
      default: false,
      description:
        "If true, this will do a dry-run of the mutation to throw possible errors but it will not perform any modification in DB",
    }),
  },
  validateArgs: validateAnd(
    validIsDefined((args) => args.ids ?? args.folders, "ids or folders"),
    notEmptyArray(
      (args) => ((args.ids ?? []) as any[]).concat(args.folders?.folderIds ?? []),
      "ids or folders",
    ),
  ),
  resolve: async (_, args, ctx) => {
    function petitionIsSharedByOwner(p: PetitionPermission[]) {
      return (
        p?.length > 1 && // the petition is being shared to another user
        p.find(
          (u) => u.type === "OWNER" && u.user_id === ctx.user!.id, // logged user is the owner
        )
      );
    }

    function userHasAccessViaGroup(p: PetitionPermission[]) {
      return (
        p?.length > 1 &&
        !p.find(
          (u) => u.user_id === ctx.user!.id && u.type === "OWNER", // user is not the owner
        ) &&
        p.find(
          (u) => u.user_id === ctx.user!.id && u.from_user_group_id !== null, // has access via group
        )
      );
    }

    let petitionIds = args.ids ?? [];
    if (isDefined(args.folders)) {
      const folderIds = fromGlobalIds(args.folders.folderIds, "PetitionFolder", true).ids;
      const folderPetitions = await ctx.petitions.getUserPetitionsInsideFolders(
        folderIds,
        args.folders.type === "TEMPLATE",
        ctx.user!,
      );
      petitionIds.push(...folderPetitions.map((p) => p.id));
    }

    petitionIds = uniq(petitionIds);
    if (petitionIds.length === 0) {
      // nothing to delete
      return SUCCESS;
    }

    // user permissions grouped by permission_id
    const userPermissions = await ctx.petitions.loadUserPermissionsByPetitionId(petitionIds);

    if (userPermissions.some(userHasAccessViaGroup)) {
      throw new ApolloError(
        "Can't delete a petition shared with a group",
        "DELETE_GROUP_PETITION_ERROR",
        {
          petitionIds: zip(petitionIds, userPermissions)
            .filter(([, permissions]) => userHasAccessViaGroup(permissions))
            .map(([id]) => toGlobalId("Petition", id)),
        },
      );
    }

    if (userPermissions.some(petitionIsSharedByOwner) && !args.force) {
      throw new ApolloError(
        "Petition to delete is shared to another user",
        "DELETE_SHARED_PETITION_ERROR",
        {
          petitionIds: zip(petitionIds, userPermissions)
            .filter(([, permissions]) => petitionIsSharedByOwner(permissions))
            .map(([id]) => toGlobalId("Petition", id)),
        },
      );
    }

    const petitions = await ctx.petitions.loadPetition(petitionIds);
    const publicTemplates = petitions.filter((p) => p && p.is_template && p.template_public);
    if (publicTemplates.length > 0) {
      throw new ApolloError("Can't delete a public template", "DELETE_PUBLIC_TEMPLATE_ERROR", {
        petitionIds: publicTemplates.map((p) => toGlobalId("Petition", p!.id)),
      });
    }

    if (args.dryrun) {
      return SUCCESS;
    }

    await ctx.petitions.withTransaction(async (t) => {
      // delete my permissions to the petitions
      const deletedPermissions = await ctx.petitions.deleteUserPermissions(
        petitionIds,
        ctx.user!.id,
        ctx.user!,
        t,
      );

      const ownerPermissions = deletedPermissions.filter((p) => p.type === "OWNER");

      const [, deletedPetitions] = await Promise.all([
        // make sure to also remove every remaining permission on deleted owned petitions
        ctx.petitions.deleteAllPermissions(
          ownerPermissions.map((p) => p.petition_id),
          ctx.user!,
          t,
        ),
        //finally, delete only petitions OWNED by me
        ctx.petitions.deletePetition(
          ownerPermissions.map((p) => p.petition_id),
          ctx.user!,
          t,
        ),
        // delete every user notification on the deleted petitions
        ctx.petitions.deletePetitionUserNotificationsByPetitionId(
          deletedPermissions.map((p) => p.petition_id),
          undefined,
          t,
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
        t,
      );

      // check if there are pending signature requests on this petitions and cancel those
      const pendingSignatureRequests = (
        await ctx.petitions.loadPetitionSignaturesByPetitionId(deletedPetitions.map((p) => p.id))
      ).flat();

      if (pendingSignatureRequests.length > 0) {
        await ctx.signature.cancelSignatureRequest(
          pendingSignatureRequests,
          "CANCELLED_BY_USER",
          { user_id: ctx.user!.id },
          {},
          t,
        );
      }
    });
    return SUCCESS;
  },
});

export const updateFieldPositions = mutationField("updateFieldPositions", {
  description:
    "Updates the positions of the petition fields. If parentFieldId is defined, it will update the positions of it's children fields.",
  type: "PetitionBase",
  authorize: authenticateAnd(
    userHasAccessToPetitions("petitionId", ["OWNER", "WRITE"]),
    petitionsAreEditable("petitionId"),
    petitionsAreNotPublicTemplates("petitionId"),
    petitionIsNotAnonymized("petitionId"),
    ifArgDefined(
      "parentFieldId",
      and(
        fieldHasType("parentFieldId" as never, "FIELD_GROUP"),
        fieldHasParent("fieldIds", "parentFieldId" as never),
      ),
    ),
  ),
  args: {
    petitionId: nonNull(globalIdArg("Petition")),
    fieldIds: nonNull(list(nonNull(globalIdArg("PetitionField")))),
    parentFieldId: globalIdArg("PetitionField"),
  },
  resolve: async (_, args, ctx) => {
    try {
      await ctx.petitions.updateFieldPositions(
        args.petitionId,
        args.fieldIds,
        args.parentFieldId ?? null,
        `User:${ctx.user!.id}`,
      );

      return await ctx.petitions.updatePetitionLastChangeAt(args.petitionId);
    } catch (e) {
      if (e instanceof Error) {
        if (e.message === "INVALID_PETITION_FIELD_IDS") {
          throw new ApolloError("Invalid petition field ids", "INVALID_PETITION_FIELD_IDS");
        } else if (e.message === "INVALID_FIELD_CONDITIONS_ORDER") {
          throw new ApolloError("Invalid field conditions order", "INVALID_FIELD_CONDITIONS_ORDER");
        } else if (e.message === "FIRST_CHILD_HAS_VISIBILITY_CONDITIONS_ERROR") {
          throw new ApolloError(
            "First child cannot have visibility conditions",
            "FIRST_CHILD_HAS_VISIBILITY_CONDITIONS_ERROR",
          );
        } else if (e.message === "FIRST_CHILD_IS_INTERNAL_ERROR") {
          throw new ApolloError(
            "First child of an external field cannot be internal",
            "FIRST_CHILD_IS_INTERNAL_ERROR",
          );
        }
      }
      throw e;
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
    t.nonNull.int("limit", {
      description: "The maximum amount of reminders.",
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
          t.nullable.globalId("contactId", { prefixName: "Contact" });
          t.nonNull.string("firstName");
          t.string("lastName");
          t.nonNull.string("email");
          t.nullable.boolean("isPreset");
        },
      }),
    });
    t.nonNull.string("timezone", {
      description: "The timezone used to generate the document.",
    });
    t.nullable.string("title", {
      description: "The title of the signing document",
    });
    t.nonNull.boolean("review", {
      description:
        "If true, lets the user review the replies before starting the signature process",
    });
    t.nonNull.boolean("allowAdditionalSigners", {
      description:
        "If true, allows the recipients or users of the petition to select additional signers",
    });
    t.nonNull.int("minSigners", {
      description: "The minimum amount of signers required to start the signature process",
    });
    t.nullable.string("instructions", {
      description:
        "The instructions to be shown to the user or recipient before starting the signature process",
    });
    t.nonNull.field("signingMode", {
      type: "SignatureConfigSigningMode",
    });
  },
});

export const updatePetitionRestriction = mutationField("updatePetitionRestriction", {
  description: "Updates the restriction preferences",
  type: "PetitionBase",
  authorize: authenticateAnd(
    userHasAccessToPetitions("petitionId", ["OWNER", "WRITE"]),
    petitionsAreNotPublicTemplates("petitionId"),
    petitionIsNotAnonymized("petitionId"),
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
      throw new ApolloError(
        "The petition is restricted with a password.",
        "INVALID_PETITION_RESTRICTION_PASSWORD",
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

export const closePetition = mutationField("closePetition", {
  description: "Closes an open petition.",
  type: "Petition",
  authorize: authenticateAnd(
    userHasAccessToPetitions("petitionId", ["OWNER", "WRITE"]),
    petitionsAreNotPublicTemplates("petitionId"),
    petitionIsNotAnonymized("petitionId"),
    async (_, args, ctx) => {
      const signature = await ctx.petitions.loadLatestPetitionSignatureByPetitionId(
        args.petitionId,
      );
      // all signature requests must be finished before the petition is closed
      if (signature && ["ENQUEUED", "PROCESSED", "PROCESSING"].includes(signature.status)) {
        return false;
      }
      return true;
    },
  ),
  args: {
    petitionId: nonNull(globalIdArg("Petition")),
  },
  resolve: async (_, args, ctx) => {
    return await ctx.petitions.withTransaction(async (t) => {
      const [petition] = await ctx.petitions.closePetition(
        args.petitionId,
        `User:${ctx.user!.id}`,
        t,
      );

      await ctx.petitions.updateRemindersForPetition(args.petitionId, null, t);
      await ctx.petitions.createEvent(
        {
          petition_id: args.petitionId,
          type: "PETITION_CLOSED",
          data: {
            user_id: ctx.user!.id,
          },
        },
        t,
      );

      return petition;
    });
  },
});

export const updatePetition = mutationField("updatePetition", {
  description: "Updates a petition.",
  type: "PetitionBase",
  authorize: authenticateAnd(
    userHasAccessToPetitions("petitionId", ["OWNER", "WRITE"]),
    petitionsAreNotPublicTemplates("petitionId"),
    ifSomeDefined(
      (args) => [
        args.data.locale,
        args.data.description,
        args.data.closingEmailBody,
        args.data.isCompletingMessageEnabled,
        args.data.completingMessageSubject,
        args.data.completingMessageBody,
        args.data.skipForwardSecurity,
        args.data.isRecipientViewContentsHidden,
        args.data.isDelegateAccessEnabled,
        args.data.anonymizeAfterMonths,
        args.data.anonymizePurpose,
        args.data.defaultPath,
        args.data.defaultOnBehalfId,
      ],
      petitionsAreEditable("petitionId"),
    ),
    ifSomeDefined(
      (args) => [args.data.emailBody, args.data.emailSubject],
      or(petitionsAreEditable("petitionId"), petitionsAreOfTypePetition("petitionId")),
    ),
    // only allow to update petition name if anonymized
    ifSomeDefined(
      (args) => [
        args.data.closingEmailBody,
        args.data.deadline,
        args.data.description,
        args.data.emailBody,
        args.data.emailSubject,
        args.data.isRecipientViewContentsHidden,
        args.data.isDelegateAccessEnabled,
        args.data.locale,
        args.data.remindersConfig,
        args.data.signatureConfig,
        args.data.skipForwardSecurity,
        args.data.anonymizeAfterMonths,
        args.data.anonymizePurpose,
        args.data.defaultPath,
        args.data.defaultOnBehalfId,
      ],
      petitionIsNotAnonymized("petitionId"),
    ),
    // only petition owners can edit compliance props
    ifSomeDefined(
      (args) => [args.data.anonymizeAfterMonths, args.data.anonymizePurpose],
      and(userHasFeatureFlag("AUTO_ANONYMIZE"), userHasAccessToPetitions("petitionId", ["OWNER"])),
    ),
    ifSomeDefined(
      (args) => [args.data.defaultOnBehalfId],
      defaultOnBehalfUserBelongsToContextOrganization("data"),
    ),
    ifSomeDefined(
      (args) => [
        args.data.isReviewFlowEnabled,
        args.data.isDocumentGenerationEnabled,
        args.data.isInteractionWithRecipientsEnabled,
      ],
      petitionsAreOfTypeTemplate("petitionId"),
    ),
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
          t.nullable.json("closingEmailBody");
          t.nullable.field("remindersConfig", {
            type: "RemindersConfigInput",
          });
          t.nullable.boolean("skipForwardSecurity");
          t.nullable.boolean("isRecipientViewContentsHidden");
          t.nullable.boolean("isDelegateAccessEnabled");
          t.nullable.boolean("isInteractionWithRecipientsEnabled");
          t.nullable.boolean("isReviewFlowEnabled");
          t.nullable.boolean("isDocumentGenerationEnabled");
          t.nullable.field("signatureConfig", { type: "SignatureConfigInput" });
          t.nullable.json("description");
          t.nullable.boolean("isCompletingMessageEnabled");
          t.nullable.string("completingMessageSubject");
          t.nullable.json("completingMessageBody");
          t.nullable.string("anonymizePurpose");
          t.nullable.int("anonymizeAfterMonths");
          t.nullable.string("defaultPath");
          t.nullable.globalId("defaultOnBehalfId", { prefixName: "User" });
        },
      }).asArg(),
    ),
  },
  validateArgs: validateAnd(
    notEmptyObject((args) => args.data, "data"),
    maxLength((args) => args.data.name, "data.name", 255),
    maxLength((args) => args.data.emailSubject, "data.emailSubject", 1000),
    maxLength((args) => args.data.completingMessageSubject, "data.completingMessageSubject", 255),
    maxLength((args) => args.data.description, "data.description", 1000),
    validPetitionSubject(
      (args) => args.data.emailSubject,
      (args) => args.petitionId,
      "data.emailSubject",
    ),
    validRichTextContent(
      (args) => args.data.emailBody,
      (args) => args.petitionId,
      "data.emailBody",
    ),
    validRichTextContent(
      (args) => args.data.closingEmailBody,
      (args) => args.petitionId,
      "data.closingEmailBody",
    ),
    validRichTextContent(
      (args) => args.data.description,
      undefined, // template description does not include PetitionField references
      "data.description",
    ),
    validRichTextContent(
      (args) => args.data.completingMessageBody,
      (args) => args.petitionId,
      "data.completingMessageBody",
    ),
    validRemindersConfig((args) => args.data.remindersConfig, "data.remindersConfig"),
    validSignatureConfig((args) => args.data.signatureConfig, "data.signatureConfig"),
    inRange((args) => args.data.anonymizeAfterMonths, "data.anonymizeAfterMonths", 1),
    validPath((args) => args.data.defaultPath, "data.defaultPath"),
  ),
  resolve: async (_, args, ctx) => {
    const {
      name,
      locale,
      deadline,
      emailSubject,
      emailBody,
      closingEmailBody,
      remindersConfig,
      skipForwardSecurity,
      isRecipientViewContentsHidden,
      isDelegateAccessEnabled,
      isInteractionWithRecipientsEnabled,
      isReviewFlowEnabled,
      isDocumentGenerationEnabled,
      signatureConfig,
      description,
      isCompletingMessageEnabled,
      completingMessageSubject,
      completingMessageBody,
      anonymizeAfterMonths,
      anonymizePurpose,
      defaultPath,
      defaultOnBehalfId,
    } = args.data;
    const data: Partial<CreatePetition> = {};
    if (name !== undefined) {
      data.name = name?.trim() || null;
    }
    if (isDefined(locale)) {
      data.recipient_locale = locale;
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
    if (closingEmailBody !== undefined) {
      data.closing_email_body = closingEmailBody && JSON.stringify(closingEmailBody);
    }
    if (remindersConfig !== undefined) {
      data.reminders_config = remindersConfig;
    }
    if (isDefined(skipForwardSecurity)) {
      data.skip_forward_security = skipForwardSecurity;
    }
    if (isDefined(isRecipientViewContentsHidden)) {
      data.hide_recipient_view_contents = isRecipientViewContentsHidden;
    }
    if (isDefined(isDelegateAccessEnabled)) {
      data.enable_delegate_access = isDelegateAccessEnabled;
    }
    if (isDefined(isInteractionWithRecipientsEnabled)) {
      data.enable_interaction_with_recipients = isInteractionWithRecipientsEnabled;
    }
    if (isDefined(isReviewFlowEnabled)) {
      data.enable_review_flow = isReviewFlowEnabled;
    }
    if (isDefined(isDocumentGenerationEnabled)) {
      data.enable_document_generation = isDocumentGenerationEnabled;
    }
    if (signatureConfig !== undefined) {
      data.signature_config = signatureConfig;
    }
    if (description !== undefined) {
      data.template_description = description === null ? null : JSON.stringify(description);
    }

    if (isDefined(isCompletingMessageEnabled)) {
      data.is_completing_message_enabled = isCompletingMessageEnabled;
    }

    if (completingMessageSubject !== undefined) {
      data.completing_message_subject = completingMessageSubject?.trim() || null;
    }
    if (completingMessageBody !== undefined) {
      data.completing_message_body = completingMessageBody && JSON.stringify(completingMessageBody);
    }

    if (anonymizeAfterMonths !== undefined) {
      data.anonymize_after_months = anonymizeAfterMonths;
    }

    if (anonymizePurpose !== undefined) {
      data.anonymize_purpose = anonymizePurpose;
    }

    if (defaultPath !== undefined) {
      data.default_path = defaultPath ?? "/";
    }

    if (defaultOnBehalfId !== undefined) {
      data.send_on_behalf_user_id = defaultOnBehalfId ? Number(defaultOnBehalfId) : null;
    }

    const [petition] = await ctx.petitions.updatePetition(
      args.petitionId,
      data,
      `User:${ctx.user!.id}`,
    );
    return petition;
  },
});

export const updateTemplateDocumentTheme = mutationField("updateTemplateDocumentTheme", {
  type: "PetitionBase",
  authorize: authenticateAnd(
    userHasAccessToPetitions("templateId", ["OWNER", "WRITE"]),
    petitionsAreNotPublicTemplates("templateId"),
    petitionsAreEditable("templateId"),
    petitionIsNotAnonymized("templateId"),
    userHasAccessToOrganizationTheme("orgThemeId"),
  ),
  args: {
    templateId: nonNull(globalIdArg("Petition")),
    orgThemeId: nonNull(globalIdArg("OrganizationTheme")),
  },
  resolve: async (_, args, ctx) => {
    const [template] = await ctx.petitions.updatePetition(
      args.templateId,
      { document_organization_theme_id: args.orgThemeId },
      `User:${ctx.user!.id}`,
    );
    return template;
  },
});

export const createPetitionField = mutationField("createPetitionField", {
  description: "Creates a petition field",
  type: "PetitionField",
  authorize: authenticateAnd(
    userHasAccessToPetitions("petitionId", ["OWNER", "WRITE"]),
    petitionsAreEditable("petitionId"),
    petitionsAreNotPublicTemplates("petitionId"),
    ifArgEquals("type", "ES_TAX_DOCUMENTS", userHasFeatureFlag("ES_TAX_DOCUMENTS_FIELD")),
    ifArgEquals("type", "DOW_JONES_KYC", userHasFeatureFlag("DOW_JONES_KYC")),
    petitionIsNotAnonymized("petitionId"),
    ifArgDefined(
      "parentFieldId",
      and(
        fieldsBelongsToPetition("petitionId", "parentFieldId" as never),
        fieldHasType("parentFieldId" as never, "FIELD_GROUP"),
      ),
    ),
  ),
  args: {
    petitionId: nonNull(globalIdArg("Petition")),
    type: nonNull(arg({ type: "PetitionFieldType" })),
    position: intArg(),
    parentFieldId: globalIdArg("PetitionField"),
  },
  validateArgs: inRange((args) => args.position, "position", 0),
  resolve: async (_, args, ctx) => {
    ctx.petitions.loadPetition.dataloader.clear(args.petitionId);
    const [field] = await ctx.petitions.createPetitionFieldsAtPosition(
      args.petitionId,
      {
        type: args.type,
        ...defaultFieldProperties(args.type),
      },
      args.parentFieldId ?? null,
      args.position ?? -1,
      ctx.user!,
    );

    await ctx.petitions.updatePetitionToPendingStatus(args.petitionId, `User:${ctx.user!.id}`);

    return field;
  },
});

export const clonePetitionField = mutationField("clonePetitionField", {
  description: "Clones a petition field",
  type: "PetitionField",
  authorize: authenticateAnd(
    userHasAccessToPetitions("petitionId", ["OWNER", "WRITE"]),
    fieldsBelongsToPetition("petitionId", "fieldId"),
    petitionsAreEditable("petitionId"),
    petitionsAreNotPublicTemplates("petitionId"),
    petitionIsNotAnonymized("petitionId"),
    not(fieldIsLinkedToProfileTypeField("fieldId")),
  ),
  args: {
    petitionId: nonNull(globalIdArg("Petition")),
    fieldId: nonNull(globalIdArg("PetitionField")),
  },
  resolve: async (_, { petitionId, fieldId }, ctx) => {
    const field = await ctx.petitions.clonePetitionField(petitionId, fieldId, ctx.user!);
    await ctx.petitions.updatePetitionToPendingStatus(petitionId, `User:${ctx.user!.id}`);

    return field;
  },
});

export const deletePetitionField = mutationField("deletePetitionField", {
  description: "Deletes a petition field.",
  type: "PetitionBase",
  authorize: authenticateAnd(
    userHasAccessToPetitions("petitionId", ["OWNER", "WRITE"]),
    fieldsBelongsToPetition("petitionId", "fieldId"),
    fieldIsNotFixed("fieldId"),
    petitionsAreEditable("petitionId"),
    petitionsAreNotPublicTemplates("petitionId"),
    petitionIsNotAnonymized("petitionId"),
    fieldIsNotBeingReferencedByAnotherFieldLogic("petitionId", "fieldId"),
    fieldIsNotBeingUsedInAutoSearchConfig("petitionId", "fieldId"),
  ),
  args: {
    petitionId: nonNull(globalIdArg("Petition")),
    fieldId: nonNull(globalIdArg("PetitionField")),
    force: booleanArg({ default: false }),
  },
  resolve: async (_, args, ctx) => {
    const petitionFields = await ctx.petitions.loadAllFieldsByPetitionId(args.petitionId);
    const field = petitionFields.find((f) => f.id === args.fieldId)!;
    const childrenFields =
      field.type === "FIELD_GROUP"
        ? petitionFields.filter((f) => f.parent_petition_field_id === args.fieldId)
        : [];

    const fieldIds = [field.id, ...childrenFields.map((c) => c.id)];

    if (field.parent_petition_field_id !== null && field.position === 0) {
      const secondChild = petitionFields.find(
        (f) => f.parent_petition_field_id === field.parent_petition_field_id && f.position === 1,
      );
      // when deleting first child of a FIELD_GROUP, make sure 2nd field does not have visibility conditions, as it will end up in 1st position
      if (isDefined(secondChild?.visibility)) {
        throw new ApolloError(
          "First child cannot have visibility conditions",
          "FIRST_CHILD_HAS_VISIBILITY_CONDITIONS_ERROR",
        );
      }

      // make sure 2nd field is not internal, if parent is external
      const parentField = petitionFields.find((f) => f.id === field.parent_petition_field_id)!;
      if (!parentField.is_internal && secondChild?.is_internal) {
        throw new ApolloError(
          "First child of an external field cannot be internal",
          "FIRST_CHILD_IS_INTERNAL_ERROR",
        );
      }
    }

    if (!args.force) {
      const replies = (await ctx.petitions.loadRepliesForField(fieldIds)).flat();
      // don't consider FIELD_GROUP "empty" replies
      if (replies.filter((r) => r.type !== "FIELD_GROUP").length > 0) {
        throw new ApolloError("The petition field has replies.", "FIELD_HAS_REPLIES_ERROR");
      }
    }

    await ctx.petitions.deletePetitionField(args.petitionId, args.fieldId, ctx.user!);

    return await ctx.petitions.updatePetitionLastChangeAt(args.petitionId);
  },
});

export const updatePetitionField = mutationField("updatePetitionField", {
  description: "Updates a petition field.",
  type: "PetitionField",
  authorize: authenticateAnd(
    userHasAccessToPetitions("petitionId", ["OWNER", "WRITE"]),
    fieldsBelongsToPetition("petitionId", "fieldId"),
    petitionsAreEditable("petitionId"),
    petitionsAreNotPublicTemplates("petitionId"),
    petitionIsNotAnonymized("petitionId"),
    ifArgEquals(
      (args) => args.data.requireApproval,
      true,
      not(fieldHasType("fieldId", ["HEADING", "FIELD_GROUP"])),
    ),
    ifArgEquals(
      (args) => args.data.isInternal,
      false,
      not(
        chain(
          fieldHasType("fieldId", ["FIELD_GROUP"]),
          firstChildHasType("fieldId", ["DOW_JONES_KYC", "BACKGROUND_CHECK"]),
        ),
      ),
    ),
    ifArgEquals(
      (args) => args.data.multiple,
      true,
      fieldIsNotBeingUsedInAutoSearchConfig("petitionId", "fieldId"),
    ),
    ifArgDefined(
      (args) => args.data.optional ?? args.data.isInternal,
      fieldIsNotFirstChild("fieldId"),
    ),
    ifArgDefined(
      (args) => args.data.isInternal ?? args.data.showInPdf,
      not(fieldHasType("fieldId", ["DOW_JONES_KYC", "BACKGROUND_CHECK"])),
    ),
    ifArgDefined(
      (args) => args.data.alias,
      fieldAliasIsAvailable("petitionId", (args) => args.data.alias!),
    ),
    ifArgDefined(
      (args) =>
        args.data.multiple ??
        (args.data.options?.standardList !== undefined ? true : undefined) ??
        args.data.options?.values ??
        args.data.options?.labels ??
        args.data.options?.format,
      not(fieldIsLinkedToProfileTypeField("fieldId")),
    ),
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
          t.nullable.boolean("isInternal");
          t.nullable.boolean("showInPdf");
          t.nullable.boolean("showActivityInPdf");
          t.nullable.field("visibility", { type: "JSONObject" });
          t.nullable.list.nonNull.field("math", { type: "JSONObject" });
          t.nullable.string("alias");
          t.nullable.boolean("hasCommentsEnabled");
          t.nullable.boolean("requireApproval");
        },
      }).asArg(),
    ),
    force: booleanArg({ default: false }),
  },
  validateArgs: validateAnd(
    notEmptyObject((args) => args.data, "data"),
    maxLength((args) => args.data.title, "data.title", 500),
    maxLength((args) => args.data.alias, "data.alias", 100),
    validateRegex((args) => args.data.alias, "data.alias", FIELD_REFERENCE_REGEX),
    validFieldVisibility(
      (args) => args.petitionId,
      (args) => args.fieldId,
      (args) => args.data.visibility as any,
      "data.visibility",
    ),
    validFieldMath(
      (args) => args.petitionId,
      (args) => args.fieldId,
      (args) => args.data.math as any,
      "data.math",
    ),
  ),
  resolve: async (_, args, ctx, info) => {
    const {
      title,
      description,
      optional,
      multiple,
      options,
      visibility,
      math,
      alias,
      isInternal,
      showInPdf,
      showActivityInPdf,
      hasCommentsEnabled,
      requireApproval,
    } = args.data;
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
    if (isDefined(requireApproval)) {
      data.require_approval = requireApproval;
    }

    if (isDefined(showInPdf)) {
      data.show_in_pdf = showInPdf;
    }

    if (isDefined(isInternal)) {
      data.is_internal = isInternal;
      data.require_approval = !isInternal;
      data.show_in_pdf = !isInternal;
    }

    if (isDefined(showActivityInPdf)) {
      data.show_activity_in_pdf = showActivityInPdf;
    }

    if (alias !== undefined) {
      data.alias = alias?.trim() || null;
    }

    if (isDefined(options)) {
      try {
        if ("autoSearchConfig" in options && options.autoSearchConfig !== null) {
          throw new ApolloError(
            "use updatePetitionFieldAutoSearchConfig mutation to update autoSearchConfig",
            "FORBIDDEN",
          );
        }
        const field = await ctx.petitions.validateFieldData(args.fieldId, {
          options,
        });
        data.options = { ...field.options, ...options };

        if (["SELECT", "CHECKBOX"].includes(field.type)) {
          const { values, labels } = data.options as {
            labels?: string[] | null;
            values?: string[] | null;
          };
          if (!isDefined(values) && isDefined(labels)) {
            throw new Error("Values are required when labels are defined");
          }
          // make sure every or none of the values have a label
          if (isDefined(values) && isDefined(labels) && values.length !== labels.length) {
            throw new Error("The number of values and labels should match");
          }
          if (isDefined(labels) && labels.some((l) => l.trim() === "")) {
            throw new Error("Labels cannot be empty");
          }
          if (isDefined(options.values) && !isDefined(options.labels)) {
            data.options.labels = null;
          }
        }

        if (
          field.type === "SHORT_TEXT" &&
          isDefined(data.options.format) &&
          field.options.format !== data.options.format
        ) {
          const replies = await ctx.petitions.loadRepliesForField.raw(args.fieldId);

          if (!args.force && replies.length > 0) {
            throw new ApolloError("The petition field has replies.", "FIELD_HAS_REPLIES_ERROR");
          }

          if (replies.length > 0) {
            await ctx.petitions.deletePetitionFieldReplies([{ id: args.fieldId }], ctx.user!);
          }
        }
      } catch (e: any) {
        if (e.name === "ApolloError") {
          throw e;
        } else {
          throw new ArgValidationError(info, "data.options", e.toString());
        }
      }
    }

    if (visibility !== undefined) {
      data.visibility =
        visibility === null
          ? null
          : {
              ...visibility,
              conditions: (visibility as PetitionFieldVisibility<string>).conditions.map((c) =>
                mapFieldLogicCondition(c),
              ),
            };
    }

    if (math !== undefined) {
      data.math =
        (math as PetitionFieldMath<string>[] | null)?.map((m) => ({
          ...m,
          conditions: m.conditions.map((c) => mapFieldLogicCondition(c)),
          operations: m.operations.map((op) => mapFieldMathOperation(op)),
        })) ?? null;
    }

    if (isDefined(hasCommentsEnabled)) {
      data.has_comments_enabled = hasCommentsEnabled;
    }

    try {
      if (data.require_approval === false) {
        // If the field is not required to be approved anymore, we need to update its reply statuses to PENDING
        await ctx.petitions.updatePetitionFieldReplyStatusesByPetitionFieldId(
          args.fieldId,
          "PENDING",
          `User:${ctx.user!.id}`,
        );
      }
      const [field] = await ctx.petitions.updatePetitionField(
        args.petitionId,
        args.fieldId,
        data,
        `User:${ctx.user!.id}`,
      );

      const petition = (await ctx.petitions.loadPetition(args.petitionId))!;
      if (!petition.is_template) {
        // update petition status if changing anything other than title and description
        if (Object.keys(omit(data, ["title", "description"])).length > 0) {
          await ctx.petitions.updatePetitionToPendingStatus(
            args.petitionId,
            `User:${ctx.user!.id}`,
          );
        }

        if (isDefined(data.optional) && field.type === "FIELD_GROUP") {
          if (field.optional) {
            // if updating FIELD_GROUP to optional, remove every empty field group reply
            await ctx.petitions.deleteEmptyFieldGroupReplies(field.id, `User:${ctx.user!.id}`);
          } else {
            // if updating FIELD_GROUP to required, create an empty field group reply only if there are no replies
            const replies = await ctx.petitions.loadRepliesForField(field.id);
            if (replies.length === 0) {
              await ctx.petitions.createEmptyFieldGroupReply([field.id], ctx.user!);
              ctx.petitions.loadRepliesForField.dataloader.clear(field.id);
            }
          }
        }
        ctx.petitions.loadPetition.dataloader.clear(args.petitionId);
      }

      if (isDefined(data.is_internal) && field.type === "FIELD_GROUP") {
        const fieldChildren = await ctx.petitions.loadPetitionFieldChildren(field.id);
        if (fieldChildren.length > 0) {
          if (field.is_internal) {
            // setting FIELD_GROUP as internal, set as internal all children fields
            await ctx.petitions.updatePetitionField(
              args.petitionId,
              fieldChildren.filter((f) => !f.is_internal).map((f) => f.id),
              { is_internal: true },
              `User:${ctx.user!.id}`,
            );
          } else if (fieldChildren[0].is_internal) {
            // setting FIELD_GROUP as external, set first child as external
            await ctx.petitions.updatePetitionField(
              args.petitionId,
              fieldChildren[0].id,
              { is_internal: false },
              `User:${ctx.user!.id}`,
            );
          }
          ctx.petitions.loadPetitionFieldChildren.dataloader.clear(field.id);
        }
      }

      await ctx.petitions.updatePetitionLastChangeAt(args.petitionId);

      return field;
    } catch (e) {
      if (
        e instanceof DatabaseError &&
        e.constraint === "petition_field__petition_id__alias__unique"
      ) {
        throw new ApolloError(
          "The alias for this field already exists in this petition",
          "ALIAS_ALREADY_EXISTS",
        );
      } else {
        throw e;
      }
    }
  },
});

export const updatePetitionFieldAutoSearchConfig = mutationField(
  "updatePetitionFieldAutoSearchConfig",
  {
    description: "Updates the auto search config of a BACKGROUND_CHECK petition field.",
    type: "PetitionField",
    authorize: authenticateAnd(
      userHasAccessToPetitions("petitionId", ["OWNER", "WRITE"]),
      fieldsBelongsToPetition("petitionId", "fieldId"),
      petitionsAreEditable("petitionId"),
      petitionsAreNotPublicTemplates("petitionId"),
      petitionIsNotAnonymized("petitionId"),
      fieldHasType("fieldId", "BACKGROUND_CHECK"),
      ifArgDefined("config", async (_, args, ctx) => {
        const field = await ctx.petitions.loadField(args.fieldId);
        const nameFields = await ctx.petitions.loadField(args.config!.name);
        const dateField = isDefined(args.config!.date)
          ? await ctx.petitions.loadField(args.config!.date)
          : null;
        return (
          nameFields.length > 0 &&
          nameFields.every(
            (f) =>
              isDefined(f) &&
              f.petition_id === args.petitionId && // fields must belong all to the same petition
              f.type === "SHORT_TEXT" && // must be of type SHORT_TEXT
              !f.multiple && // must be "single reply"
              (!isDefined(f.parent_petition_field_id) || // must not be a child of another field (children are multiple by default)
                f.parent_petition_field_id === field!.parent_petition_field_id), // can be a sibling of the BACKGROUND_CHECK field
          ) &&
          (!isDefined(dateField) ||
            (dateField.petition_id === args.petitionId &&
              dateField.type === "DATE" &&
              !dateField.multiple &&
              (!isDefined(dateField.parent_petition_field_id) ||
                dateField.parent_petition_field_id === field!.parent_petition_field_id)))
        );
      }),
    ),
    args: {
      petitionId: nonNull(globalIdArg("Petition")),
      fieldId: nonNull(globalIdArg("PetitionField")),
      config: inputObjectType({
        name: "UpdatePetitionFieldAutoSearchConfigInput",
        definition(t) {
          t.nullable.field("type", { type: "BackgroundCheckEntitySearchType" });
          t.nonNull.list.nonNull.globalId("name", { prefixName: "PetitionField" });
          t.nullable.globalId("date", { prefixName: "PetitionField" });
        },
      }),
    },
    resolve: async (_, args, ctx) => {
      const autoSearchConfig = args.config
        ? {
            name: args.config.name,
            date: args.config.date ?? null,
            type: args.config.type ?? null,
          }
        : null;

      const field = await ctx.petitions.validateFieldData(args.fieldId, {
        options: { autoSearchConfig },
      });

      const [updated] = await ctx.petitions.updatePetitionField(
        args.petitionId,
        args.fieldId,
        { options: { ...field.options, autoSearchConfig } },
        `User:${ctx.user!.id}`,
      );

      return updated;
    },
  },
);

export const uploadDynamicSelectFile = mutationField("uploadDynamicSelectFieldFile", {
  description:
    "Uploads the xlsx file used to parse the options of a dynamic select field, and sets the field options",
  type: "PetitionField",
  authorize: authenticateAnd(
    userHasAccessToPetitions("petitionId", ["OWNER", "WRITE"]),
    fieldsBelongsToPetition("petitionId", "fieldId"),
    fieldHasType("fieldId", ["DYNAMIC_SELECT"]),
    petitionsAreNotPublicTemplates("petitionId"),
    petitionIsNotAnonymized("petitionId"),
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
    "file",
  ),
  resolve: async (_, args, ctx) => {
    const file = await args.file;

    const [importError, importResult] = await withError(importFromExcel(file.createReadStream()));
    if (importError) {
      throw new ApolloError("Invalid file", "INVALID_FORMAT_ERROR");
    }
    const [parseError, parseResult] = await withError(() =>
      parseDynamicSelectValues(importResult!),
    );
    if (parseError) {
      throw new ApolloError(parseError.message, "INVALID_FORMAT_ERROR");
    }
    const { labels, values } = parseResult!;

    const key = random(16);
    const res = await ctx.storage.fileUploads.uploadFile(
      key,
      file.mimetype,
      file.createReadStream(),
    );

    const [fileUpload] = await ctx.files.createFileUpload(
      {
        content_type: file.mimetype,
        filename: file.filename,
        path: key,
        size: res["ContentLength"]!.toString(),
        upload_complete: true,
      },
      `User:${ctx.user!.id}`,
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
    const [field] = await ctx.petitions.updatePetitionField(
      args.petitionId,
      args.fieldId,
      { options },
      `User:${ctx.user!.id}`,
    );

    await ctx.petitions.updatePetitionToPendingStatus(args.petitionId, `User:${ctx.user!.id}`);

    return field;
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
      fieldHasType("fieldId", ["DYNAMIC_SELECT"]),
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
          url: await ctx.storage.fileUploads.getSignedDownloadEndpoint(
            file!.path,
            file!.filename,
            "attachment",
          ),
        };
      } catch {
        return { result: RESULT.FAILURE };
      }
    },
  },
);

export const approveOrRejectPetitionFieldReplies = mutationField(
  "approveOrRejectPetitionFieldReplies",
  {
    description: "Updates the status of a PENDING petition field replies to APPROVED or REJECTED",
    type: "Petition",
    authorize: authenticateAnd(userHasAccessToPetitions("petitionId", ["OWNER", "WRITE"])),
    args: {
      petitionId: nonNull(globalIdArg("Petition")),
      status: nonNull(arg({ type: "PetitionFieldReplyStatus" })),
    },
    resolve: async (_, args, ctx) => {
      await ctx.petitions.updatePendingPetitionFieldRepliesStatusByPetitionId(
        args.petitionId,
        args.status,
        ctx.user!,
      );

      return (await ctx.petitions.loadPetition(args.petitionId))!;
    },
  },
);

export const updatePetitionFieldRepliesStatus = mutationField("updatePetitionFieldRepliesStatus", {
  description: "Updates the status of a petition field reply.",
  type: "PetitionField",
  authorize: authenticateAnd(
    userHasAccessToPetitions("petitionId", ["OWNER", "WRITE"]),
    fieldsBelongsToPetition("petitionId", "petitionFieldId"),
    repliesBelongsToField("petitionFieldId", "petitionFieldReplyIds"),
    replyStatusCanBeUpdated("petitionFieldId"),
    not(fieldHasType("petitionFieldId", "FIELD_GROUP")),
  ),
  args: {
    petitionId: nonNull(globalIdArg("Petition")),
    petitionFieldId: nonNull(globalIdArg("PetitionField")),
    petitionFieldReplyIds: nonNull(list(nonNull(globalIdArg("PetitionFieldReply")))),
    status: nonNull(arg({ type: "PetitionFieldReplyStatus" })),
  },
  validateArgs: notEmptyArray((args) => args.petitionFieldReplyIds, "petitionFieldReplyIds"),
  resolve: async (_, args, ctx) => {
    await ctx.petitions.updatePetitionFieldRepliesStatus(
      args.petitionFieldReplyIds,
      args.status,
      `User:${ctx.user!.id}`,
    );

    if (args.status === "REJECTED") {
      const petition = await ctx.petitions.loadPetition.raw(args.petitionId);
      if (petition?.status === "COMPLETED") {
        await ctx.petitions.updatePetition(
          args.petitionId,
          { status: "PENDING" },
          `User:${ctx.user!.id}`,
        );
      }
    }

    await ctx.petitions.createEvent(
      args.petitionFieldReplyIds.map((replyId) => ({
        type: "REPLY_STATUS_CHANGED",
        petition_id: args.petitionId,
        data: {
          status: args.status,
          petition_field_id: args.petitionFieldId,
          petition_field_reply_id: replyId,
          user_id: ctx.user!.id,
        },
      })),
    );

    return (await ctx.petitions.loadField(args.petitionFieldId))!;
  },
});

export const fileUploadReplyDownloadLink = mutationField("fileUploadReplyDownloadLink", {
  description: "Generates a download link for a file reply.",
  type: "FileUploadDownloadLinkResult",
  authorize: authenticateAnd(
    userHasAccessToPetitions("petitionId"),
    repliesBelongsToPetition("petitionId", "replyId"),
    petitionIsNotAnonymized("petitionId"),
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

      if (isFileTypeField(reply!.type)) {
        if (!isDefined(reply?.content["file_upload_id"])) {
          throw new ApolloError("File not found", "FILE_NOT_FOUND");
        }
        const file = await ctx.files.loadFileUpload(reply!.content["file_upload_id"]);
        if (!file) {
          throw new Error(`FileUpload not found with id ${reply!.content["file_upload_id"]}`);
        }
        if (!file.upload_complete) {
          await ctx.storage.fileUploads.getFileMetadata(file!.path);
          await ctx.files.markFileUploadComplete(file.id, `User:${ctx.user!.id}`);
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
      } else if (reply!.type === "BACKGROUND_CHECK" && isDefined(reply?.content?.entity)) {
        const { binary_stream: stream, mime_type: contentType } =
          await ctx.backgroundCheck.entityProfileDetailsPdf(ctx.user!.id, reply!.content);
        const key = random(16);
        await ctx.storage.temporaryFiles.uploadFile(key, contentType, stream);
        return {
          result: RESULT.SUCCESS,
          url: await ctx.storage.temporaryFiles.getSignedDownloadEndpoint(
            key,
            `${reply!.content.entity.type}-${reply!.content.entity.id}.pdf`,
            args.preview ? "inline" : "attachment",
          ),
        };
      } else {
        throw new ApolloError(`${reply!.type} replies can not be downloaded`, "INVALID_FIELD_TYPE");
      }
    } catch (error: any) {
      if (error instanceof ApolloError) {
        throw error;
      }
      return {
        result: RESULT.FAILURE,
      };
    }
  },
});

export const createPetitionAccess = mutationField("createPetitionAccess", {
  description: "Creates a contactless petition access",
  type: "PetitionAccess",
  authorize: authenticateAnd(
    userHasAccessToPetitions("petitionId", ["OWNER", "WRITE"]),
    petitionHasRepliableFields("petitionId"),
    petitionIsNotAnonymized("petitionId"),
    petitionsHaveEnabledInteractionWithRecipients("petitionId"),
  ),
  args: {
    petitionId: nonNull(globalIdArg("Petition")),
  },
  resolve: async (_, args, ctx) => {
    try {
      const access = await ctx.petitions.createContactlessAccess(args.petitionId, ctx.user!);

      await ctx.petitions.createEvent({
        type: "ACCESS_ACTIVATED",
        petition_id: args.petitionId,
        data: {
          petition_access_id: access.id,
          user_id: ctx.user!.id,
        },
      });

      ctx.petitions.loadAccessesForPetition.dataloader.clear(args.petitionId);
      return access;
    } catch (error) {
      if (
        error instanceof DatabaseError &&
        error.constraint === "petition_access__petition_id_contactless"
      ) {
        return (await ctx.petitions.loadContactlessAccessByPetitionId(args.petitionId))!;
      }
      throw error;
    }
  },
});

export const sendPetition = mutationField("sendPetition", {
  description:
    "Sends different petitions to each of the specified contact groups, creating corresponding accesses and messages",
  type: nonNull(list(nonNull("SendPetitionResult"))),
  authorize: authenticateAnd(
    userHasAccessToPetitions("petitionId", ["OWNER", "WRITE"]),
    petitionHasRepliableFields("petitionId"),
    userHasAccessToContactGroups("contactIdGroups"),
    userCanSendAs("senderId" as never),
    petitionIsNotAnonymized("petitionId"),
    petitionsAreOfTypePetition("petitionId"),
    organizationHasEnoughPetitionSendCredits("petitionId", (args) => args.contactIdGroups.length),
    petitionsHaveEnabledInteractionWithRecipients("petitionId"),
  ),
  args: {
    petitionId: nonNull(globalIdArg("Petition")),
    contactIdGroups: nonNull(list(nonNull(list(nonNull(globalIdArg("Contact")))))),
    subject: nonNull(stringArg()),
    body: nonNull(jsonArg()),
    scheduledAt: datetimeArg(),
    remindersConfig: arg({ type: "RemindersConfigInput" }),
    senderId: globalIdArg("User"),
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
    skipEmailSend: booleanArg(),
  },
  validateArgs: validateAnd(
    notEmptyArray((args) => args.contactIdGroups, "contactIdGroups"),
    maxLength((args) => args.subject, "subject", 1000),
    notEmptyString((args) => args.subject, "subject"),
    validPetitionSubject(
      (args) => args.subject,
      (args) => args.petitionId,
      "subject",
    ),
    validRichTextContent(
      (args) => args.body,
      (args) => args.petitionId,
      "body",
    ),
    validRemindersConfig((args) => args.remindersConfig, "remindersConfig"),
    (_, { contactIdGroups }, ctx, info) => {
      // check that contactIds do not repeat inside each group
      for (const group of contactIdGroups) {
        const distinctIds = Array.from(new Set(group));
        if (distinctIds.length !== group.length) {
          throw new ArgValidationError(
            info,
            "contactIdGroups",
            "There are repeated contactIds inside a group",
          );
        }
      }
    },
  ),
  resolve: async (_, args, ctx) => {
    const [petition, owner, currentAccesses] = await Promise.all([
      ctx.petitions.loadPetition(args.petitionId),
      ctx.petitions.loadPetitionOwner(args.petitionId),
      ctx.petitions.loadAccessesForPetition(args.petitionId),
    ]);

    if (!petition) {
      throw new Error(`Petition:${args.petitionId} not found`);
    }
    if (!owner) {
      throw new Error(`Owner of Petition:${args.petitionId} not found`);
    }

    if (
      currentAccesses
        .filter((ca) => ca.status === "ACTIVE")
        .some((access) => args.contactIdGroups.flat().includes(access.contact_id!))
    ) {
      throw new ApolloError(
        "This petition was already sent to some of the contacts",
        "PETITION_ALREADY_SENT_ERROR",
      );
    }
    if (currentAccesses.length > 0 && args.contactIdGroups.length !== 1) {
      // bulk sends only if the petition has not been sent to anyone
      // we don't support this case for now, throw error to avoid possible future bugs
      throw new ApolloError("Unsupported use case", "UNSUPPORTED_USE_CASE");
    }

    try {
      await ctx.orgCredits.ensurePetitionHasConsumedCredit(petition.id, `User:${ctx.user!.id}`);
      await ctx.orgCredits.consumePetitionSendCredits(
        petition.org_id,
        args.contactIdGroups.length - 1, // 1 more credit consumed for each contact group
      );

      const clonedPetitions = await pMap(
        args.contactIdGroups.slice(1),
        async () =>
          await ctx.petitions.clonePetition(
            args.petitionId,
            owner, // set the owner of the original petition as owner of the cloned ones
            {
              credits_used: 1,
              email_subject: args.subject, // pass email subject so field placeholders are correctly replaced on the cloned petition
            },
            { cloneReplies: true }, // also clone the petition replies
            `User:${ctx.user!.id}`,
          ),
        { concurrency: 5 },
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
                    allowAdditionalSigners: true,
                  }
                : null,
          },
          `User:${ctx.user!.id}`,
        );
      }

      if (clonedPetitions.length > 0) {
        // clone the permissions of the original petition to the cloned ones
        await ctx.petitions.clonePetitionPermissions(
          args.petitionId,
          clonedPetitions.map((p) => p.id),
          `User:${ctx.user!.id}`,
        );
      }

      const sender = isDefined(args.senderId) ? await ctx.users.loadUser(args.senderId) : null;

      // we chunk petitions in chunks of less than 100 contactIds
      // this way we can schedule the PetitionMessages in batches of 100 emails per 5 minutes
      const petitionChunks = chunkWhile(
        pipe(
          [petition, ...clonedPetitions],
          zipWith((petition, contactIds) => ({ petition, contactIds }), args.contactIdGroups),
          zipWith((x, index) => ({ ...x, index }), range(0, args.contactIdGroups.length)),
        ),
        (currentChunk, item) =>
          // current chunk is empty, or
          currentChunk.length === 0 ||
          // (number of contactIds in the accumulated chunk) + (number of contactIds in the current item) <= 100
          sumBy(currentChunk, (x) => x.contactIds.length) + item.contactIds.length <= 100,
      );

      const baseDate = new Date();
      const results = await pFlatMap(petitionChunks, async (currentChunk, chunkIndex) => {
        return await pMap(currentChunk, async ({ petition, contactIds, index }) => {
          const getValues = await ctx.petitionMessageContext.fetchPlaceholderValues({
            petitionId: petition.id,
            userId: args.senderId ?? ctx.user!.id,
            contactId: contactIds[0],
          });

          const messageSubject = renderTextWithPlaceholders(
            index === 0 ? args.subject : petition.email_subject ?? args.subject,
            getValues,
          );

          const [updatedPetition] = await ctx.petitions.updatePetition(
            petition.id,
            {
              name: (petition.name ?? messageSubject)
                .slice(0, 255)
                .concat(index === 0 ? "" : ` (${index + 1})`),
              status: "PENDING",
              closed_at: null,
            },
            `User:${ctx.user!.id}`,
          );
          const accessAndMessages = await ctx.petitions.createAccessesAndMessages(
            petition,
            contactIds,
            {
              skipEmailSend: args.skipEmailSend,
              remindersConfig: args.remindersConfig,
              body: interpolatePlaceholdersInSlate(args.body, getValues),
              subject: messageSubject,
              scheduledAt:
                chunkIndex === 0
                  ? args.scheduledAt
                  : addMinutes(args.scheduledAt ?? baseDate, chunkIndex * 5),
            },
            ctx.user!,
            sender,
            false,
          );

          return { petition: updatedPetition, ...accessAndMessages };
        });
      });

      const successfulSends = results.filter((r) => r.result === "SUCCESS");

      const messagesToProcess = successfulSends.flatMap(
        (s) => s.messages?.filter((m) => m.status === "PROCESSING") ?? [],
      );

      if (messagesToProcess.length > 0) {
        await Promise.all([
          ctx.emails.sendPetitionMessageEmail(messagesToProcess.map((m) => m.id)),
          ctx.petitions.createEvent(
            messagesToProcess.map((message) => ({
              type: "MESSAGE_SENT",
              data: { petition_message_id: message.id },
              petition_id: message.petition_id,
            })),
          ),
        ]);
      }

      ctx.petitions.loadAccessesForPetition.dataloader.clear(args.petitionId);
      return results.map((r) => omit(r, ["messages"]));
    } catch (error) {
      if (error instanceof Error && error.message === "PETITION_SEND_LIMIT_REACHED") {
        throw new ApolloError(
          `Can't send the parallel due to lack of credits`,
          "PETITION_SEND_LIMIT_REACHED",
        );
      }
      throw error;
    }
  },
});

export const sendReminders = mutationField("sendReminders", {
  description: "Sends a reminder for the specified petition accesses.",
  type: nonNull(list(nonNull("PetitionReminder"))),
  authorize: authenticateAnd(
    userHasAccessToPetitions("petitionId", ["OWNER", "WRITE"]),
    accessesBelongToPetition("petitionId", "accessIds"),
    accessesHaveStatus("accessIds", "ACTIVE"),
    accessesHaveRemindersLeft("accessIds"),
    petitionIsNotAnonymized("petitionId"),
    petitionHasStatus("petitionId", ["PENDING", "COMPLETED"]),
    petitionsHaveEnabledInteractionWithRecipients("petitionId"),
  ),
  args: {
    petitionId: nonNull(globalIdArg("Petition")),
    body: jsonArg(),
    accessIds: nonNull(list(nonNull(globalIdArg("PetitionAccess")))),
  },
  validateArgs: validRichTextContent(
    (args) => args.body,
    (args) => args.petitionId,
    "body",
  ),
  resolve: async (_, args, ctx) => {
    const remindersData = await pMap(
      args.accessIds,
      async (accessId) => {
        const contact = await ctx.contacts.loadContactByAccessId(accessId);
        const getValues = await ctx.petitionMessageContext.fetchPlaceholderValues(
          {
            petitionId: args.petitionId,
            userId: ctx.user!.id,
            contactId: contact?.id,
            petitionAccessId: accessId,
          },
          { publicContext: true },
        );

        const emailBody = args.body
          ? JSON.stringify(interpolatePlaceholdersInSlate(args.body, getValues))
          : null;

        return {
          type: "MANUAL",
          status: "PROCESSING",
          petition_access_id: accessId,
          sender_id: ctx.user!.id,
          email_body: emailBody,
          created_by: `User:${ctx.user!.id}`,
        } as CreatePetitionReminder;
      },
      { concurrency: 1 },
    );

    const reminders = await ctx.petitions.createReminders(remindersData);

    await ctx.petitions.createEvent(
      reminders.map((reminder) => ({
        type: "REMINDER_SENT",
        petition_id: args.petitionId,
        data: {
          petition_reminder_id: reminder.id,
        },
      })),
    );

    await ctx.emails.sendPetitionReminderEmail(reminders.map((r) => r.id));

    return reminders;
  },
});

export const switchAutomaticReminders = mutationField("switchAutomaticReminders", {
  description: "Switches automatic reminders for the specified petition accesses.",
  type: list(nonNull("PetitionAccess")),
  authorize: authenticateAnd(
    userHasAccessToPetitions("petitionId", ["OWNER", "WRITE"]),
    accessesBelongToPetition("petitionId", "accessIds"),
    accessesHaveStatus("accessIds", "ACTIVE"),
    accessesIsNotOptedOut("accessIds"),
    petitionIsNotAnonymized("petitionId"),
    petitionHasStatus("petitionId", "PENDING"),
    ifArgEquals("start", true, accessesHaveRemindersLeft("accessIds")),
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
      validRemindersConfig((args) => args.remindersConfig, "remindersConfig"),
    ),
  ),
  resolve: async (_, args, ctx) => {
    if (args.start) {
      return await ctx.petitions.startAccessReminders(args.accessIds, args.remindersConfig!);
    } else {
      return await ctx.petitions.stopAccessReminders(args.accessIds);
    }
  },
});

export const deactivateAccesses = mutationField("deactivateAccesses", {
  description: "Deactivates the specified active petition accesses.",
  type: list(nonNull("PetitionAccess")),
  authorize: authenticateAnd(
    userHasAccessToPetitions("petitionId", ["OWNER", "WRITE"]),
    accessesBelongToPetition("petitionId", "accessIds"),
    petitionIsNotAnonymized("petitionId"),
  ),
  args: {
    petitionId: nonNull(globalIdArg("Petition")),
    accessIds: nonNull(list(nonNull(globalIdArg("PetitionAccess")))),
  },
  resolve: async (_, args, ctx) => {
    await ctx.petitions.deactivateAccesses(
      args.petitionId,
      args.accessIds,
      `User:${ctx.user!.id}`,
      ctx.user!.id,
    );
    return (await ctx.petitions.loadAccess(args.accessIds)).filter(isDefined);
  },
});

export const reactivateAccesses = mutationField("reactivateAccesses", {
  description: "Reactivates the specified inactive petition accesses.",
  type: list(nonNull("PetitionAccess")),
  authorize: authenticateAnd(
    userHasAccessToPetitions("petitionId", ["OWNER", "WRITE"]),
    accessesBelongToPetition("petitionId", "accessIds"),
    accessesBelongToValidContacts("accessIds"),
    petitionIsNotAnonymized("petitionId"),
  ),
  args: {
    petitionId: nonNull(globalIdArg("Petition")),
    accessIds: nonNull(list(nonNull(globalIdArg("PetitionAccess")))),
  },
  resolve: async (_, args, ctx) => {
    await ctx.petitions.reactivateAccesses(args.petitionId, args.accessIds, ctx.user!);
    return (await ctx.petitions.loadAccess(args.accessIds)).filter(isDefined);
  },
});

export const cancelScheduledMessage = mutationField("cancelScheduledMessage", {
  description: "Cancels a scheduled petition message.",
  type: nullable("PetitionMessage"),
  authorize: authenticateAnd(
    userHasAccessToPetitions("petitionId", ["OWNER", "WRITE"]),
    messageBelongToPetition("petitionId", "messageId"),
    petitionIsNotAnonymized("petitionId"),
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
    userHasAccessToPetitions("petitionId", ["OWNER", "WRITE"]),
    fieldsBelongsToPetition("petitionId", "fieldId"),
    petitionsAreEditable("petitionId"),
    petitionsAreNotPublicTemplates("petitionId"),
    not(fieldHasType("fieldId", "FIELD_GROUP")),
    ifArgEquals("type", "ES_TAX_DOCUMENTS", userHasFeatureFlag("ES_TAX_DOCUMENTS_FIELD")),
    ifArgEquals(
      "type",
      "DOW_JONES_KYC",
      and(
        userHasFeatureFlag("DOW_JONES_KYC"),
        or(
          fieldIsNotFirstChild("fieldId"),
          chain(fieldHasParent("fieldId"), parentFieldIsInternal("fieldId")),
        ),
      ),
    ),
    ifArgEquals(
      "type",
      "BACKGROUND_CHECK",
      and(
        userHasFeatureFlag("BACKGROUND_CHECK"),
        or(
          fieldIsNotFirstChild("fieldId"),
          chain(fieldHasParent("fieldId"), parentFieldIsInternal("fieldId")),
        ),
      ),
    ),
    ifArgEquals("type", "FIELD_GROUP", not(fieldHasParent("fieldId"))),
    petitionIsNotAnonymized("petitionId"),
    fieldIsNotBeingUsedInMathOperation("petitionId", "fieldId"),
    fieldIsNotBeingUsedInAutoSearchConfig("petitionId", "fieldId"),
    not(fieldIsLinkedToProfileTypeField("fieldId")),
  ),
  args: {
    petitionId: nonNull(globalIdArg("Petition")),
    fieldId: nonNull(globalIdArg("PetitionField")),
    type: nonNull(arg({ type: "PetitionFieldType" })),
    force: booleanArg({ default: false }),
  },
  resolve: async (_, args, ctx) => {
    if (!args.force) {
      const field = await ctx.petitions.loadField(args.fieldId);
      const replies = await ctx.petitions.loadRepliesForField.raw(args.fieldId);
      if (isDefined(field) && replies.length > 0 && !isValueCompatible(field.type, args.type)) {
        throw new ApolloError("The petition field has replies.", "FIELD_HAS_REPLIES_ERROR");
      }
    }

    try {
      const field = await ctx.petitions.changePetitionFieldType(
        args.petitionId,
        args.fieldId,
        args.type,
        ctx.user!,
      );

      await ctx.petitions.updatePetitionToPendingStatus(args.petitionId, `User:${ctx.user!.id}`);
      ctx.petitions.loadPetition.dataloader.clear(args.petitionId);

      return field;
    } catch (e) {
      if (e instanceof Error && e.message === "UPDATE_FIXED_FIELD_ERROR") {
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
  authorize: authenticateAnd(
    userHasAccessToPetitions("petitionId", ["OWNER", "WRITE"]),
    petitionIsNotAnonymized("petitionId"),
    petitionsHaveEnabledInteractionWithRecipients("petitionId"),
  ),
  validateArgs: validRichTextContent(
    (args) => args.emailBody,
    (args) => args.petitionId,
    "emailBody",
  ),
  resolve: async (_, args, ctx) => {
    const shouldSendNotification = await ctx.petitions.shouldNotifyPetitionClosed(args.petitionId);
    if (!shouldSendNotification && !args.force) {
      throw new ApolloError(
        "You already notified the contacts",
        "ALREADY_NOTIFIED_PETITION_CLOSED_ERROR",
      );
    }

    const accesses = await ctx.petitions.loadAccessesForPetition(args.petitionId);

    const activeAccesses = accesses.filter((a) => a.status === "ACTIVE" && isDefined(a.contact_id));

    const events = await ctx.petitions.createEvent(
      activeAccesses.map((access) => ({
        type: "PETITION_CLOSED_NOTIFIED",
        petition_id: args.petitionId,
        data: {
          user_id: ctx.user!.id,
          petition_access_id: access.id,
        },
      })),
    );

    await ctx.emails.sendPetitionClosedEmail(
      args.petitionId,
      ctx.user!.id,
      args.emailBody,
      args.attachPdfExport,
      args.pdfExportTitle ?? null,
      events.map((e) => e.id),
    );

    return (await ctx.petitions.loadPetition(args.petitionId))!;
  },
});

export const reopenPetition = mutationField("reopenPetition", {
  description: "Reopens the petition",
  type: "Petition",
  authorize: authenticateAnd(
    userHasAccessToPetitions("petitionId", ["OWNER", "WRITE"]),
    petitionIsNotAnonymized("petitionId"),
    petitionHasStatus("petitionId", ["COMPLETED", "CLOSED"]),
  ),
  args: {
    petitionId: nonNull(globalIdArg("Petition")),
  },
  resolve: async (_, args, ctx) => {
    await ctx.petitions.withTransaction(async (t) => {
      await Promise.all([
        ctx.petitions.reopenPetition(args.petitionId, `User:${ctx.user!.id}`, t),
        ctx.petitions.createEvent(
          {
            type: "PETITION_REOPENED",
            petition_id: args.petitionId,
            data: { user_id: ctx.user!.id },
          },
          t,
        ),
      ]);
    });
    return (await ctx.petitions.loadPetition(args.petitionId))!;
  },
});

export const updatePetitionMetadata = mutationField("updatePetitionMetadata", {
  description: "Updates the metadata of the specified petition",
  type: "Petition",
  authorize: authenticateAnd(userHasAccessToPetitions("petitionId", ["OWNER", "WRITE"])),
  args: {
    petitionId: nonNull(globalIdArg("Petition")),
    metadata: nonNull(jsonObjectArg()),
  },
  validateArgs: jsonSchema({
    type: "object",
    additionalProperties: { type: ["string", "boolean", "number"] },
  })((args) => args.metadata, "metadata"),
  resolve: async (_, args, ctx) => {
    return await ctx.petitions.updatePetitionMetadata(args.petitionId, args.metadata);
  },
});

export const updatePetitionFieldReplyMetadata = mutationField("updatePetitionFieldReplyMetadata", {
  description: "Updates the metadata of the specified petition field reply",
  type: "PetitionFieldReply",
  authorize: authenticateAnd(
    userHasAccessToPetitions("petitionId", ["OWNER", "WRITE"]),
    repliesBelongsToPetition("petitionId", "replyId"),
    petitionIsNotAnonymized("petitionId"),
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
    return await ctx.petitions.updatePetitionFieldReply(
      args.replyId,
      { metadata: args.metadata },
      `User:${ctx.user!.id}`,
    );
  },
});

export const updateTemplateDefaultPermissions = mutationField("updateTemplateDefaultPermissions", {
  description: "Updates the template default permissions",
  type: "PetitionTemplate",
  authorize: authenticateAnd(
    userHasAccessToPetitions("templateId", ["OWNER", "WRITE"]),
    petitionsAreOfTypeTemplate("templateId"),
    userHasAccessToUserAndUserGroups("permissions"),
  ),
  args: {
    templateId: nonNull(globalIdArg("Petition")),
    permissions: nonNull(list(nonNull("UserOrUserGroupPermissionInput"))),
  },
  validateArgs: (_, args, ctx, info) => {
    const ownerPermissions = args.permissions.filter((p) => p.permissionType === "OWNER");
    if (
      ownerPermissions.length > 1 || // 0 or 1 OWNER defined in the array
      (ownerPermissions.length === 1 && !isDefined(ownerPermissions[0].userId)) // if there is an owner, userId must be defined
    ) {
      throw new ArgValidationError(info, "permissions", "Invalid permissions array");
    }
  },
  resolve: async (_, args, ctx) => {
    await ctx.petitions.resetTemplateDefaultPermissions(
      args.templateId,
      args.permissions as any,
      `User:${ctx.user!.id}`,
    );
    ctx.petitions.loadTemplateDefaultPermissions.dataloader.clear(args.templateId);
    ctx.petitions.loadTemplateDefaultOwner.dataloader.clear(args.templateId);
    return (await ctx.petitions.loadPetition(args.templateId))!;
  },
});

export const createPublicPetitionLink = mutationField("createPublicPetitionLink", {
  description: "Creates a public link from a user's template",
  type: "PublicPetitionLink",
  authorize: authenticateAnd(
    userHasAccessToPetitions("templateId", ["OWNER", "WRITE"]),
    petitionsAreOfTypeTemplate("templateId"),
    templateDoesNotHavePublicPetitionLink("templateId"),
    petitionsHaveEnabledInteractionWithRecipients("templateId"),
  ),
  args: {
    templateId: nonNull(globalIdArg("Petition")),
    title: nonNull(stringArg()),
    description: nonNull(stringArg()),
    slug: nullable(stringArg()),
    prefillSecret: nullable(stringArg()),
    allowMultiplePetitions: nonNull(booleanArg()),
    petitionNamePattern: nullable(stringArg()),
  },
  validateArgs: validateAnd(
    validatePublicPetitionLinkSlug((args) => args.slug, "slug"),
    validPublicPetitionLinkPetitionNamePattern(
      (args) => args.petitionNamePattern,
      "petitionNamePattern",
    ),
  ),
  resolve: async (
    _,
    {
      templateId,
      title,
      description,
      slug,
      prefillSecret,
      allowMultiplePetitions,
      petitionNamePattern,
    },
    ctx,
  ) => {
    const link = await ctx.petitions.createPublicPetitionLink(
      {
        template_id: templateId,
        title,
        description,
        slug: slug ?? random(10),
        is_active: true,
        prefill_secret: prefillSecret || null,
        allow_multiple_petitions: allowMultiplePetitions,
        petition_name_pattern: petitionNamePattern,
      },
      `User:${ctx.user!.id}`,
    );

    await ctx.petitions.updatePetitionLastChangeAt(templateId);

    return link;
  },
});

export const updatePublicPetitionLink = mutationField("updatePublicPetitionLink", {
  description: "Updates the info and permissions of a public link",
  type: "PublicPetitionLink",
  authorize: authenticateAnd(
    userHasAccessToPublicPetitionLink("publicPetitionLinkId", ["OWNER", "WRITE"]),
  ),
  args: {
    publicPetitionLinkId: nonNull(globalIdArg("PublicPetitionLink")),
    isActive: booleanArg(),
    title: stringArg(),
    description: stringArg(),
    slug: stringArg(),
    prefillSecret: stringArg(),
    allowMultiplePetitions: booleanArg(),
    petitionNamePattern: stringArg(),
  },
  validateArgs: validateAnd(
    validatePublicPetitionLinkSlug(
      (args) => args.slug,
      "slug",
      (args) => args.publicPetitionLinkId,
    ),
    validPublicPetitionLinkPetitionNamePattern(
      (args) => args.petitionNamePattern,
      "petitionNamePattern",
    ),
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

    if (args.prefillSecret !== undefined) {
      publicPetitionLinkData.prefill_secret = args.prefillSecret;
    }

    if (isDefined(args.allowMultiplePetitions)) {
      publicPetitionLinkData.allow_multiple_petitions = args.allowMultiplePetitions;
    }

    if (args.petitionNamePattern !== undefined) {
      publicPetitionLinkData.petition_name_pattern = args.petitionNamePattern;
    }

    const publicLink = await ctx.petitions.updatePublicPetitionLink(
      args.publicPetitionLinkId,
      publicPetitionLinkData,
      `User:${ctx.user!.id}`,
    );

    await ctx.petitions.updatePetitionLastChangeAt(publicLink.template_id);

    return publicLink;
  },
});

export const modifyPetitionCustomProperty = mutationField("modifyPetitionCustomProperty", {
  description: "Adds, edits or deletes a custom property on the petition",
  type: "PetitionBase",
  authorize: authenticateAnd(
    userHasAccessToPetitions("petitionId", ["OWNER", "WRITE"]),
    petitionIsNotAnonymized("petitionId"),
    userHasFeatureFlag("CUSTOM_PROPERTIES"),
  ),
  args: {
    petitionId: nonNull(globalIdArg("Petition")),
    key: nonNull(stringArg()),
    value: stringArg(),
  },
  validateArgs: validateAnd(
    maxLength((args) => args.key, "key", 100),
    validateIfDefined(
      (args) => args.value,
      maxLength((args) => args.value!, "value", 1000),
    ),
  ),
  resolve: async (_, { petitionId, key, value }, ctx) => {
    const petition = (await ctx.petitions.loadPetition(petitionId))!;

    if (
      Object.keys(petition.custom_properties).length >= 20 &&
      !isDefined(petition.custom_properties[key])
    ) {
      throw new ApolloError("Max limit of properties reached", "CUSTOM_PROPERTIES_LIMIT_ERROR");
    }
    return await ctx.petitions.modifyPetitionCustomProperty(
      petitionId,
      key,
      value ?? null,
      `User:${ctx.user!.id}`,
    );
  },
});

export const completePetition = mutationField("completePetition", {
  description: outdent`
    Marks a petition as COMPLETED.
    If the petition has a signature configured and does not require a review, starts the signing process.`,
  type: "Petition",
  args: {
    petitionId: nonNull(globalIdArg("Petition")),
    additionalSigners: list(nonNull("PublicPetitionSignerDataInput")),
    message: nullable("String"),
  },
  authorize: authenticateAnd(
    userHasAccessToPetitions("petitionId", ["OWNER", "WRITE"]),
    petitionIsNotAnonymized("petitionId"),
  ),
  resolve: async (_, args, ctx) => {
    try {
      await ctx.orgCredits.ensurePetitionHasConsumedCredit(args.petitionId, `User:${ctx.user!.id}`);
      const response = await ctx.petitions.completePetition(args.petitionId, ctx.user!);

      let petition = response.petition;

      const backgroundCheckAutoSearchQueries = buildAutomatedBackgroundCheckFieldQueries(
        response.composedPetition,
      );

      // run an automated background search for each field that has autoSearchConfig and the "name" field replied
      // if the query is the same as the last one or the field has a stored entity detail, it will not trigger a new search
      for (const data of backgroundCheckAutoSearchQueries) {
        if (isDefined(data.petitionFieldReplyId)) {
          await ctx.petitions.updatePetitionFieldRepliesContent(
            args.petitionId,
            [
              {
                id: data.petitionFieldReplyId,
                content: {
                  query: data.query,
                  search: await ctx.backgroundCheck.entitySearch(data.query),
                  entity: null,
                },
              },
            ],
            ctx.user!,
          );
        } else {
          await ctx.petitions.createPetitionFieldReply(
            args.petitionId,
            {
              type: "BACKGROUND_CHECK",
              content: {
                query: data.query,
                search: await ctx.backgroundCheck.entitySearch(data.query),
                entity: null,
              },
              user_id: ctx.user!.id,
              petition_field_id: data.petitionFieldId,
              parent_petition_field_reply_id: data.parentPetitionFieldReplyId,
              status: "PENDING",
            },
            `User:${ctx.user!.id}`,
          );
        }
      }

      await ctx.petitions.createEvent({
        type: "PETITION_COMPLETED",
        petition_id: args.petitionId,
        data: { user_id: ctx.user!.id },
      });

      if (petition.signature_config) {
        if (petition.signature_config.review === false) {
          // start a new signature request, cancelling previous pending requests if any
          const { petition: updatedPetition } = await ctx.signature.createSignatureRequest(
            petition.id,
            {
              ...petition.signature_config,
              additionalSignersInfo: args.additionalSigners ?? [],
              message: args.message ?? undefined,
            },
            ctx.user!,
          );
          petition = updatedPetition ?? petition;
        } else {
          // signature is configured to be reviewed after start, so just cancel if there are pending requests
          await ctx.signature.cancelPendingSignatureRequests(petition.id, ctx.user!);
        }
      }
      return petition;
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "PETITION_SEND_LIMIT_REACHED") {
          throw new ApolloError(
            "Can't complete the parallel due to lack of credits",
            "PETITION_SEND_LIMIT_REACHED",
          );
        } else if (error.message === "REQUIRED_SIGNER_INFO_ERROR") {
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

export const movePetitions = mutationField("movePetitions", {
  description: "Moves a group of petitions or folders to another folder.",
  type: "Success",
  authorize: authenticateAnd(
    contextUserHasPermission("PETITIONS:CHANGE_PATH"),
    ifArgDefined(
      "ids",
      and(
        userHasAccessToPetitions("ids" as never, ["WRITE", "OWNER"]),
        petitionsAreInPath("ids" as never, "source"),
      ),
    ),
    ifArgDefined(
      "folderIds",
      and(
        userHasPermissionInFolders("folderIds" as never, "type", "WRITE"),
        foldersAreInPath("folderIds" as never, "source"),
      ),
    ),
  ),
  args: {
    ids: list(nonNull(globalIdArg("Petition", { description: "Petition to be moved." }))),
    folderIds: list(nonNull(idArg({ description: "PetitionFolder GIDs to be moved." }))),
    source: nonNull(stringArg({ description: "Base path of the entries to move." })),
    destination: nonNull(stringArg({ description: "Destination path." })),
    type: nonNull("PetitionBaseType"),
  },
  validateArgs: validateAnd(
    validFolderId((args) => args.folderIds, "folderIds"),
    validPath((args) => args.source, "source"),
    validPath((args) => args.destination, "destination"),
    (_, args, ctx, info) => {
      const folderIds = unMaybeArray(args.folderIds ?? []);
      const paths = fromGlobalIds(folderIds, "PetitionFolder", true).ids;
      if (paths.some((p) => args.destination.startsWith(p))) {
        throw new ArgValidationError(
          info,
          "destination",
          `Destination can't be within one of the target folders.`,
        );
      }
    },
  ),
  resolve: async (_, args, ctx) => {
    const paths = fromGlobalIds(args.folderIds ?? [], "PetitionFolder", true).ids;

    await ctx.petitions.updatePetitionPaths(
      args.ids ?? [],
      paths,
      args.source,
      args.destination,
      args.type === "TEMPLATE",
      ctx.user!,
    );

    return SUCCESS;
  },
});

export const renameFolder = mutationField("renameFolder", {
  description: "Renames a folder.",
  type: "Success",
  authorize: authenticateAnd(userHasPermissionInFolders("folderId" as never, "type", "WRITE")),
  args: {
    folderId: nonNull(idArg({ description: "PetitionFolder GIDs to be renamed" })),
    name: stringArg(),
    type: nonNull("PetitionBaseType"),
  },
  validateArgs: validateAnd(
    validFolderId((args) => args.folderId, "folderId"),
    validateRegex((args) => args.name, "name", /^[^/]+$/),
  ),
  resolve: async (_, args, ctx, info) => {
    const path = fromGlobalId(args.folderId, "PetitionFolder", true).id;
    const destination = path.replace(/\/[^/]+\/$/, "/" + args.name + "/");
    await ctx.petitions.updatePetitionPaths(
      [],
      [path],
      path,
      destination,
      args.type === "TEMPLATE",
      ctx.user!,
    );

    return SUCCESS;
  },
});

export const createPublicPetitionLinkPrefillData = mutationField(
  "createPublicPetitionLinkPrefillData",
  {
    description:
      "Creates prefill information to be used on public petition links. Returns the URL to be used for creation and prefill of the petition.",
    type: nonNull("String"),
    authorize: authenticateAnd(
      userHasFeatureFlag("PUBLIC_PETITION_LINK_PREFILL_DATA"),
      userHasAccessToPublicPetitionLink("publicPetitionLinkId", ["OWNER", "WRITE"]),
    ),
    args: {
      publicPetitionLinkId: nonNull(globalIdArg("PublicPetitionLink")),
      data: nonNull("JSONObject"),
      path: stringArg(),
    },
    validateArgs: validPath((args) => args.path, "path"),
    resolve: async (_, args, ctx) => {
      const publicLink = (await ctx.petitions.loadPublicPetitionLink(args.publicPetitionLinkId))!;
      const template = (await ctx.petitions.loadPetition(publicLink.template_id))!;
      const org = (await ctx.organizations.loadOrg(template.org_id))!;

      const prefillData = await ctx.petitions.createPublicPetitionLinkPrefillData(
        {
          template_id: publicLink.template_id,
          keycode: random(10),
          data: args.data,
          path: args.path ?? "/",
        },
        `User:${ctx.user!.id}`,
      );

      const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
      const prefix = org.custom_host
        ? `${protocol}://${org.custom_host}`
        : ctx.config.misc.parallelUrl;

      return `${prefix}/${template.recipient_locale}/pp/${publicLink.slug}?${new URLSearchParams({
        pk: prefillData.keycode,
      })}`;
    },
  },
);

export const linkPetitionFieldChildren = mutationField("linkPetitionFieldChildren", {
  type: "PetitionField",
  args: {
    petitionId: nonNull(globalIdArg("Petition")),
    parentFieldId: nonNull(globalIdArg("PetitionField")),
    childrenFieldIds: nonNull(list(nonNull(globalIdArg("PetitionField")))),
    force: booleanArg(),
  },
  authorize: authenticateAnd(
    userHasAccessToPetitions("petitionId", ["OWNER", "WRITE"]),
    petitionsAreEditable("petitionId"),
    petitionsAreNotPublicTemplates("petitionId"),
    petitionIsNotAnonymized("petitionId"),
    fieldsBelongsToPetition("petitionId", "parentFieldId"),
    fieldHasType("parentFieldId", "FIELD_GROUP"),
    ifNotEmptyArray(
      "childrenFieldIds",
      and(
        fieldsBelongsToPetition("petitionId", "childrenFieldIds"),
        not(fieldHasType("childrenFieldIds", ["FIELD_GROUP", "HEADING"])),
        not(fieldHasParent("childrenFieldIds")),
        fieldIsNotBeingUsedInAutoSearchConfig("petitionId", "childrenFieldIds"),
      ),
    ),
  ),
  validateArgs: notEmptyArray((args) => args.childrenFieldIds, "childrenFieldIds"),
  resolve: async (_, { petitionId, parentFieldId, childrenFieldIds, force }, ctx) => {
    if (!force) {
      const replies = (await ctx.petitions.loadRepliesForField(childrenFieldIds)).flat();
      if (replies.length > 0) {
        throw new ApolloError("The petition field has replies.", "FIELD_HAS_REPLIES_ERROR");
      }
    }
    try {
      await ctx.petitions.linkPetitionFieldChildren(
        petitionId,
        parentFieldId,
        childrenFieldIds,
        `User:${ctx.user!.id}`,
      );

      await ctx.petitions.updatePetitionToPendingStatus(petitionId, `User:${ctx.user!.id}`);

      ctx.petitions.loadPetition.dataloader.clear(petitionId);
      ctx.petitions.loadFieldsForPetition.dataloader.clear(petitionId);
      ctx.petitions.loadPetitionFieldChildren.dataloader.clear(parentFieldId);

      return (await ctx.petitions.loadField(parentFieldId))!;
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "FIRST_CHILD_HAS_VISIBILITY_CONDITIONS_ERROR") {
          throw new ApolloError(
            "First child cannot have visibility conditions",
            "FIRST_CHILD_HAS_VISIBILITY_CONDITIONS_ERROR",
          );
        } else if (error.message === "FIRST_CHILD_IS_INTERNAL_ERROR") {
          throw new ApolloError(
            "First child of an external field cannot be internal",
            "FIRST_CHILD_IS_INTERNAL_ERROR",
          );
        } else if (error.message === "INVALID_FIELD_CONDITIONS_ORDER") {
          throw new ApolloError("Invalid field conditions order", "INVALID_FIELD_CONDITIONS_ORDER");
        }
      }
      throw error;
    }
  },
});

export const unlinkPetitionFieldChildren = mutationField("unlinkPetitionFieldChildren", {
  type: "PetitionField",
  args: {
    petitionId: nonNull(globalIdArg("Petition")),
    parentFieldId: nonNull(globalIdArg("PetitionField")),
    childrenFieldIds: nonNull(list(nonNull(globalIdArg("PetitionField")))),
    force: booleanArg(),
  },
  authorize: authenticateAnd(
    userHasAccessToPetitions("petitionId", ["OWNER", "WRITE"]),
    petitionsAreEditable("petitionId"),
    petitionsAreNotPublicTemplates("petitionId"),
    petitionIsNotAnonymized("petitionId"),
    fieldsBelongsToPetition("petitionId", "parentFieldId"),
    fieldHasType("parentFieldId", "FIELD_GROUP"),
    ifNotEmptyArray(
      "childrenFieldIds",
      and(
        fieldsBelongsToPetition("petitionId", "childrenFieldIds"),
        fieldHasParent("childrenFieldIds", "parentFieldId"),
        fieldIsNotBeingReferencedByAnotherFieldLogic("petitionId", "childrenFieldIds"),
        not(fieldIsLinkedToProfileTypeField("childrenFieldIds")),
      ),
    ),
  ),
  validateArgs: notEmptyArray((args) => args.childrenFieldIds, "childrenFieldIds"),
  resolve: async (_, { petitionId, parentFieldId, childrenFieldIds, force }, ctx) => {
    if (!force) {
      const replies = (await ctx.petitions.loadRepliesForField(childrenFieldIds)).flat();
      if (replies.length > 0) {
        throw new ApolloError("The petition field has replies.", "FIELD_HAS_REPLIES_ERROR");
      }
    }

    try {
      await ctx.petitions.unlinkPetitionFieldChildren(
        petitionId,
        parentFieldId,
        childrenFieldIds,
        `User:${ctx.user!.id}`,
      );

      await ctx.petitions.updatePetitionToPendingStatus(petitionId, `User:${ctx.user!.id}`);

      ctx.petitions.loadPetition.dataloader.clear(petitionId);
      ctx.petitions.loadFieldsForPetition.dataloader.clear(petitionId);
      ctx.petitions.loadPetitionFieldChildren.dataloader.clear(parentFieldId);

      return (await ctx.petitions.loadField(parentFieldId))!;
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "FIRST_CHILD_HAS_VISIBILITY_CONDITIONS_ERROR") {
          throw new ApolloError(
            "First child cannot have visibility conditions",
            "FIRST_CHILD_HAS_VISIBILITY_CONDITIONS_ERROR",
          );
        } else if (error.message === "FIRST_CHILD_IS_INTERNAL_ERROR") {
          throw new ApolloError(
            "First child of an external field cannot be internal",
            "FIRST_CHILD_IS_INTERNAL_ERROR",
          );
        }
      }

      throw error;
    }
  },
});

export const linkFieldGroupToProfileType = mutationField("linkFieldGroupToProfileType", {
  type: "PetitionField",
  description:
    "Links a FIELD_GROUP field to a profile type, so its replies can be archived into a profile when petition is closed",
  authorize: authenticateAnd(
    userHasFeatureFlag("PROFILES"),
    userHasAccessToPetitions("petitionId", ["OWNER", "WRITE"]),
    petitionsAreEditable("petitionId"),
    petitionsAreNotPublicTemplates("petitionId"),
    petitionIsNotAnonymized("petitionId"),
    fieldHasType("petitionFieldId", ["FIELD_GROUP"]),
    fieldsBelongsToPetition("petitionId", "petitionFieldId"),
    fieldCanBeLinkedToProfileType("petitionId", "petitionFieldId"),
    ifArgDefined(
      "profileTypeId",
      and(
        userHasAccessToProfileType("profileTypeId" as never),
        not(profileTypeIsArchived("profileTypeId" as never)),
      ),
    ),
  ),
  args: {
    petitionId: nonNull(globalIdArg("Petition")),
    petitionFieldId: nonNull(globalIdArg("PetitionField")),
    profileTypeId: nullable(globalIdArg("ProfileType")),
  },
  resolve: async (_, { petitionId, petitionFieldId, profileTypeId }, ctx) => {
    const [field] = await ctx.petitions.updatePetitionField(
      petitionId,
      petitionFieldId,
      {
        profile_type_id: profileTypeId ?? null,
      },
      `User:${ctx.user!.id}`,
    );

    return field;
  },
});

export const createProfileLinkedPetitionField = mutationField("createProfileLinkedPetitionField", {
  type: "PetitionField",
  description:
    "Adds a field as child of a field group, linked to a property of the parent field profile type",
  authorize: authenticateAnd(
    userHasFeatureFlag("PROFILES"),
    userHasAccessToPetitions("petitionId", ["OWNER", "WRITE"]),
    petitionsAreEditable("petitionId"),
    petitionsAreNotPublicTemplates("petitionId"),
    petitionIsNotAnonymized("petitionId"),
    fieldHasType("parentFieldId", "FIELD_GROUP"),
    fieldsBelongsToPetition("petitionId", "parentFieldId"),
    profileTypeFieldCanBeLinkedToFieldGroup("parentFieldId", "profileTypeFieldId"),
  ),
  args: {
    petitionId: nonNull(globalIdArg("Petition")),
    parentFieldId: nonNull(globalIdArg("PetitionField")),
    profileTypeFieldId: nonNull(globalIdArg("ProfileTypeField")),
    position: intArg(),
  },
  validateArgs: inRange((args) => args.position, "position", 0),
  resolve: async (_, args, ctx) => {
    const profileTypeField = (await ctx.profiles.loadProfileTypeField(args.profileTypeFieldId))!;
    const petition = await ctx.petitions.loadPetition(args.petitionId);

    const mappedField = mapProfileTypeFieldToPetitionField(
      profileTypeField,
      petition!.recipient_locale,
    );

    const [petitionField] = await ctx.petitions.createPetitionFieldsAtPosition(
      args.petitionId,
      mappedField,
      args.parentFieldId,
      args.position ?? -1,
      ctx.user!,
    );

    await ctx.petitions.updatePetitionToPendingStatus(args.petitionId, `User:${ctx.user!.id}`);

    ctx.petitions.loadPetition.dataloader.clear(args.petitionId);
    ctx.petitions.loadPetitionFieldChildren.dataloader.clear(args.parentFieldId);
    return petitionField;
  },
});

export const archiveFieldGroupReplyIntoProfile = mutationField(
  "archiveFieldGroupReplyIntoProfile",
  {
    type: "PetitionFieldReply",
    description: "Archives the replies of a FIELD_GROUP field into a profile",
    authorize: authenticateAnd(
      userHasFeatureFlag("PROFILES"),
      userHasAccessToProfile("profileId"),
      profileHasStatus("profileId", ["OPEN"]),
      profileHasSameProfileTypeAsField("profileId", "petitionFieldId"),
      userHasAccessToPetitions("petitionId"),
      petitionsAreNotPublicTemplates("petitionId"),
      petitionIsNotAnonymized("petitionId"),
      petitionHasStatus("petitionId", ["CLOSED"]),
      fieldsBelongsToPetition("petitionId", "petitionFieldId"),
      fieldHasType("petitionFieldId", ["FIELD_GROUP"]),
      fieldIsLinkedToProfileType("petitionFieldId"),
      repliesBelongsToField("petitionFieldId", "parentReplyId"),
      profileTypeFieldBelongsToPetitionFieldProfileType(
        (args) => [
          ...args.conflictResolutions.map((c) => c.profileTypeFieldId),
          ...args.expirations.map((e) => e.profileTypeFieldId),
        ],
        "petitionFieldId",
      ),
      userHasPermissionOnProfileTypeField(
        (args) => [
          ...args.conflictResolutions.map((c) => c.profileTypeFieldId),
          ...args.expirations.map((e) => e.profileTypeFieldId),
        ],
        "WRITE",
      ),
      profileTypeFieldsAreExpirable((args) =>
        args.expirations.flatMap((e) => e.profileTypeFieldId),
      ),
    ),
    args: {
      petitionId: nonNull(globalIdArg("Petition")),
      petitionFieldId: nonNull(globalIdArg("PetitionField")),
      parentReplyId: nonNull(
        globalIdArg("PetitionFieldReply", { description: "ID of the FIELD_GROUP reply" }),
      ),
      profileId: nonNull(
        globalIdArg("Profile", {
          description: "ID of the profile to archive into.",
        }),
      ),
      conflictResolutions: nonNull(
        list(
          nonNull(
            inputObjectType({
              name: "ArchiveFieldGroupReplyIntoProfileConflictResolutionInput",
              description:
                "Action to take when the selected profile already has a value on the field. An error will be thrown if no conflictResolution is provided for a field with a value.",
              definition(t) {
                t.nonNull.globalId("profileTypeFieldId", { prefixName: "ProfileTypeField" });
                t.nonNull.field("action", {
                  type: enumType({
                    name: "ArchiveFieldGroupReplyIntoProfileConflictResolutionAction",
                    members: ["IGNORE", "OVERWRITE", "APPEND"],
                  }),
                });
              },
            }),
          ),
        ),
      ),
      expirations: nonNull(
        list(
          nonNull(
            inputObjectType({
              name: "ArchiveFieldGroupReplyIntoProfileExpirationInput",
              definition(t) {
                t.nonNull.globalId("profileTypeFieldId", { prefixName: "ProfileTypeField" });
                t.nullable.date("expiryDate");
              },
            }),
          ),
        ),
      ),
    },
    validateArgs: (root, args, ctx, info) => {
      if (!args.expirations.every((e) => e.expiryDate !== undefined)) {
        throw new ArgValidationError(info, "expirations", "expiryDate cannot be undefined");
      }
    },
    resolve: async (_, args, ctx) => {
      const [composedPetition] = await ctx.petitions.getComposedPetitionFieldsAndVariables([
        args.petitionId,
      ]);

      // only need visible fields of type FIELD_GROUP with a profile_type_id and its visible children
      const fieldGroup = applyFieldVisibility(composedPetition).find(
        (f) => f.id === args.petitionFieldId,
      );

      if (!isDefined(fieldGroup)) {
        // trying to archive a FIELD_GROUP reply that is not visible with the current field visibility
        throw new ForbiddenError("FORBIDDEN");
      }

      // get the replies from the children fields that are linked with a property on the profile
      const groupReplies =
        fieldGroup.replies
          .find((r) => r.id === args.parentReplyId)!
          .children?.filter((c) => isDefined(c.field.profile_type_field_id)) ?? [];

      // load profile and get its values and files
      const [profile, profileTypeFields, profileFieldValues, profileFieldFiles] = await Promise.all(
        [
          ctx.profiles.loadProfile(args.profileId),
          ctx.profiles.loadProfileTypeFieldsByProfileTypeId(fieldGroup.profile_type_id!),
          ctx.profiles.loadProfileFieldValuesByProfileId(args.profileId),
          ctx.profiles.loadProfileFieldFilesByProfileId(args.profileId),
        ],
      );

      const effectivePermissions = await ctx.profiles.loadProfileTypeFieldUserEffectivePermission(
        groupReplies.map((r) => ({
          profileTypeFieldId: r.field.profile_type_field_id!,
          userId: ctx.user!.id,
        })),
      );

      const [fileReplies, simpleReplies] = pipe(
        zip(groupReplies, effectivePermissions),
        filter(([, permission]) => isAtLeast(permission, "WRITE")), // don't write on fields without WRITE permission
        map(([{ field, replies }]) => ({
          field: omit(field, ["replies"]), // omit field.replies to avoid confusions (field.replies contain every reply of the field for every group)
          replies,
        })),
        partition(({ field }) => field.type === "FILE_UPLOAD"),
      );

      // extract file_upload_ids from every reply and profile value. This way we can load it all at once for later usage
      const fileUploadIds = uniq([
        ...groupReplies.flatMap((r) =>
          r.field.type === "FILE_UPLOAD"
            ? r.replies.map((r) => r.content.file_upload_id as number).filter(isDefined)
            : [],
        ),
        ...profileFieldFiles.map((pff) => pff.file_upload_id).filter(isDefined),
      ]);

      const fileUploads = await ctx.files.loadFileUpload(fileUploadIds);

      // we need to iterate replies on petition and check if there are conflicts with current values on the profile
      // if any conflict exists, push it to this arrays and throw an ApolloError with the conflicted fields, so the user can select what to do on each case
      const missingConflictResolutions: number[] = [];
      const missingExpirations: number[] = [];

      // these contain the contents of every profile type field that will be created or updated on the profile.
      // if content is null, it means the value will be removed from the profile
      // expiryDate must be defined (or null) if the field is expirable
      const updateProfileFieldValues: {
        profileTypeFieldId: number;
        type: ProfileTypeFieldType;
        content: any;
        expiryDate?: string | null;
        alias: string | null;
      }[] = [];

      for (const { field, replies } of simpleReplies) {
        const reply = replies.at(0); // get only 1st reply on non-file fields
        const profileTypeField = profileTypeFields.find(
          (f) => f.id === field.profile_type_field_id!,
        )!;
        const profileFieldValue = profileFieldValues.find(
          (v) => v.profile_type_field_id === field.profile_type_field_id!,
        );

        const resolution = args.conflictResolutions.find(
          (cr) => cr.profileTypeFieldId === field.profile_type_field_id!,
        );
        const expiration = args.expirations.find(
          (e) => e.profileTypeFieldId === field.profile_type_field_id!,
        );

        // if already exists a value on the profile, there could be a conflict with reply so we need to check
        if (isDefined(profileFieldValue)) {
          // we need to do something only if the reply value is different than current value (or no reply on the field)
          if (!isDefined(reply) || reply.content.value !== profileFieldValue.content.value) {
            // expiration is required if the field is expirable and the reply is defined (meaning profile value will be modified)
            if (
              isDefined(reply) &&
              profileTypeField.is_expirable &&
              !isDefined(expiration) &&
              (!isDefined(resolution) || resolution.action !== "IGNORE") // if resolution is IGNORE, value will not be updated so we don't want to update the expiryDate
            ) {
              missingExpirations.push(field.profile_type_field_id!);
            }
            // resolution is required
            if (!isDefined(resolution)) {
              missingConflictResolutions.push(field.profile_type_field_id!);
            } else if (resolution.action === "OVERWRITE") {
              /**
               * action could be:
               * OVERWRITE: will remove the current profile field value and create a new one if the reply is defined. Will try to update field expiryDate if required and provided.
               * IGNORE/APPEND: will keep the current profile field value and ignore the reply
               */
              updateProfileFieldValues.push({
                ...mapPetitionFieldReplyToProfileFieldValue(
                  reply ?? { type: field.type, content: null },
                ),
                profileTypeFieldId: field.profile_type_field_id!,
                expiryDate: expiration?.expiryDate,
                alias: profileTypeField.alias,
              });
            }
          }
        } else if (isDefined(reply)) {
          // profile field value is not present in profile, there will be no conflicts
          // if the field is expirable, we require it to be present on expirations array
          if (profileTypeField.is_expirable && !isDefined(expiration)) {
            // expiration is required
            missingExpirations.push(field.profile_type_field_id!);
          }

          updateProfileFieldValues.push({
            ...mapPetitionFieldReplyToProfileFieldValue(reply),
            profileTypeFieldId: field.profile_type_field_id!,
            expiryDate: expiration?.expiryDate,
            alias: profileTypeField.alias,
          });
        }
      }

      const deleteProfileFieldFileIds: number[] = [];
      const createProfileFieldFiles: {
        profileTypeFieldId: number;
        fileUploadId: number;
        expiryDate?: string | null;
      }[] = [];

      // same process than before, with FILE_UPLOADS
      for (const { field, replies } of fileReplies) {
        const profileTypeField = profileTypeFields.find(
          (f) => f.id === field.profile_type_field_id!,
        )!;
        const profileFieldFileValues = profileFieldFiles.filter(
          (v) => v.profile_type_field_id === field.profile_type_field_id!,
        );

        const resolution = args.conflictResolutions.find(
          (cr) => cr.profileTypeFieldId === field.profile_type_field_id!,
        );

        const expiration = args.expirations.find(
          (e) => e.profileTypeFieldId === field.profile_type_field_id!,
        );

        if (profileFieldFileValues.length > 0) {
          if (replies.length === 0) {
            // no replies on field, IGNORE or OVERWRITE?
            if (!isDefined(resolution)) {
              // resolution is required
              missingConflictResolutions.push(field.profile_type_field_id!);
            }

            /**
             * action could be:
             * OVERWRITE: will remove all the current files on the profile field
             * APPEND/IGNORE: will keep the current profile files
             */
            if (resolution?.action === "OVERWRITE") {
              deleteProfileFieldFileIds.push(...profileFieldFileValues.map((pff) => pff.id));
            }
          } else {
            const replyFileUploads = replies
              .filter((r) => !isDefined(r.content.error) && isDefined(r.content.file_upload_id))
              .map((r) => r.content.file_upload_id as number)
              .map((id) => fileUploads.find((fu) => fu?.id === id));

            const profileFieldFileUploads = profileFieldFileValues.map((pff) =>
              fileUploads.find((fu) => fu?.id === pff.file_upload_id),
            );

            // these are the files that are not present on the profile (compare by file_upload.path)
            // these will be attached to the existing files on the profile if resolution is APPEND or OVERWRITE
            const newFileUploads = replyFileUploads.filter(
              (r) => !profileFieldFileUploads.find((pff) => pff?.path === r?.path),
            );
            // these are files that are present on the profile but not on the reply
            // these will be removed from the profile if resolution is OVERWRITE
            const currentProfileFieldFileUploads = profileFieldFileUploads.filter(
              (pff) => !replyFileUploads.find((r) => r?.path === pff?.path),
            );

            // expiration is required if the field is expirable and the reply has files (meaning profile value will not be removed)
            if (
              (!isDefined(resolution) || resolution.action !== "IGNORE") && // don't ask for expiryDate if ignoring this reply
              profileTypeField.is_expirable &&
              !isDefined(expiration) &&
              (newFileUploads.length > 0 || currentProfileFieldFileUploads.length > 0) // if there is no difference between reply and profile value, no need to update expiryDate
            ) {
              missingExpirations.push(field.profile_type_field_id!);
            }

            if (
              !isDefined(resolution) &&
              (newFileUploads.length > 0 || currentProfileFieldFileUploads.length > 0)
            ) {
              // resolution is required only if there is any difference between files on reply and profile
              missingConflictResolutions.push(field.profile_type_field_id!);
            } else if (resolution?.action === "APPEND" || resolution?.action === "OVERWRITE") {
              createProfileFieldFiles.push(
                ...newFileUploads.filter(isDefined).map((r) => ({
                  profileTypeFieldId: field.profile_type_field_id!,
                  fileUploadId: r.id!,
                  expiryDate: expiration?.expiryDate,
                })),
              );
              if (resolution?.action === "OVERWRITE") {
                deleteProfileFieldFileIds.push(
                  ...currentProfileFieldFileUploads
                    .filter(isDefined)
                    .map((fu) => profileFieldFiles.find((pf) => pf.file_upload_id === fu?.id)!.id),
                );
              }
            }
          }
        } else if (replies.length > 0) {
          // no files on the profile. we can add the files on replies without checking for conflicts

          // if the field is expirable, we require it to be present on expirations array
          if (profileTypeField.is_expirable && !isDefined(expiration)) {
            // expiration is required
            missingExpirations.push(field.profile_type_field_id!);
          }

          createProfileFieldFiles.push(
            ...replies
              .filter((r) => !isDefined(r.content.error) && isDefined(r.content.file_upload_id))
              .map((r) => ({
                profileTypeFieldId: field.profile_type_field_id!,
                fileUploadId: r.content.file_upload_id as number,
                expiryDate: expiration?.expiryDate,
              })),
          );
        }
      }

      if (missingConflictResolutions.length > 0 || missingExpirations.length > 0) {
        throw new ApolloError(
          "There was a conflict with existing values, please provide conflictResolution and/or expirations data",
          "CONFLICT_RESOLUTION_REQUIRED_ERROR",
          {
            conflictResolutions: missingConflictResolutions.map((r) =>
              toGlobalId("ProfileTypeField", r),
            ),
            expirations: missingExpirations.map((e) => toGlobalId("ProfileTypeField", e)),
          },
        );
      }

      const { currentValues, previousValues } = await ctx.profiles.updateProfileFieldValue(
        profile!.id,
        updateProfileFieldValues,
        ctx.user!.id,
      );

      await ctx.profiles.createProfileUpdatedEvents(
        profile!.id,
        buildProfileUpdatedEventsData(
          profile!.id,
          updateProfileFieldValues,
          currentValues,
          previousValues,
          ctx.user!,
        ),
        ctx.user!,
      );

      if (deleteProfileFieldFileIds.length > 0) {
        const deletedProfileFiles = await ctx.profiles.deleteProfileFieldFiles(
          deleteProfileFieldFileIds,
          ctx.user!.id,
        );
        await ctx.profiles.createProfileUpdatedEvents(
          profile!.id,
          deletedProfileFiles.map((f) => ({
            type: "PROFILE_FIELD_FILE_REMOVED",
            profile_id: profile!.id,
            org_id: ctx.user!.org_id,
            data: {
              user_id: ctx.user!.id,
              profile_type_field_id: f.profile_type_field_id,
              profile_field_file_id: f.id,
              alias:
                profileTypeFields.find((ptf) => ptf.id === f.profile_type_field_id)!.alias ?? null,
            },
          })),
          ctx.user!,
        );
      }

      if (createProfileFieldFiles.length > 0) {
        const byProfileTypeFieldId = groupBy(createProfileFieldFiles, (p) => p.profileTypeFieldId);
        for (const [profileTypeFieldId, values] of Object.entries(byProfileTypeFieldId)) {
          const clonedFileUploads = await ctx.files.cloneFileUpload(
            values.map((f) => f.fileUploadId!),
          );
          const profileTypeField = profileTypeFields.find(
            (ptf) => ptf.id === parseInt(profileTypeFieldId),
          )!;
          const expiration = args.expirations.find(
            (e) => e.profileTypeFieldId === profileTypeField.id,
          );
          const profileFieldFiles = await ctx.profiles.createProfileFieldFiles(
            profile!.id,
            profileTypeField.id,
            clonedFileUploads.map((fu) => fu.id),
            expiration?.expiryDate,
            ctx.user!.id,
          );

          await ctx.profiles.createProfileUpdatedEvents(
            profile!.id,
            [
              ...profileFieldFiles.map(
                (pff) =>
                  ({
                    org_id: ctx.user!.org_id,
                    profile_id: pff.profile_id,
                    type: "PROFILE_FIELD_FILE_ADDED",
                    data: {
                      user_id: ctx.user!.id,
                      profile_type_field_id: pff.profile_type_field_id,
                      profile_field_file_id: pff.id,
                      alias: profileTypeField?.alias ?? null,
                    },
                  }) satisfies ProfileFieldFileAddedEvent<true>,
              ),
              ...(expiration?.expiryDate !== undefined
                ? [
                    {
                      org_id: ctx.user!.org_id,
                      profile_id: profile!.id,
                      type: "PROFILE_FIELD_EXPIRY_UPDATED",
                      data: {
                        user_id: ctx.user!.id,
                        profile_type_field_id: profileTypeField.id,
                        expiry_date: expiration?.expiryDate ?? null,
                        alias: profileTypeField?.alias ?? null,
                      },
                    } satisfies ProfileFieldExpiryUpdatedEvent<true>,
                  ]
                : []),
            ],
            ctx.user!,
          );
        }
      }

      try {
        await ctx.profiles.associateProfileToPetition(
          profile!.id,
          args.petitionId,
          `User:${ctx.user!.id}`,
        );
        await ctx.petitions.createEvent({
          type: "PROFILE_ASSOCIATED",
          petition_id: args.petitionId,
          data: {
            user_id: ctx.user!.id,
            profile_id: profile!.id,
          },
        });
        await ctx.profiles.createEvent({
          type: "PETITION_ASSOCIATED",
          org_id: ctx.user!.org_id,
          profile_id: profile!.id,
          data: {
            user_id: ctx.user!.id,
            petition_id: args.petitionId,
          },
        });
      } catch (error) {
        if (
          error instanceof DatabaseError &&
          error.constraint === "petition_profile__petition_id__profile_id"
        ) {
          // profile is already associated to petition, safe to ignore error
        } else {
          throw error;
        }
      }

      // these are the possible field relationships with petitionFieldId in any of the sides.
      // we need to look for replies with set associated_profile_id that belong to the field on the other side of the relationship
      const fieldRelationships =
        await ctx.petitions.getPetitionFieldGroupRelationshipsByPetitionFieldId(
          args.petitionId,
          args.petitionFieldId,
        );

      if (fieldRelationships.length > 0) {
        const relationshipTypes = await ctx.profiles.loadProfileRelationshipType(
          uniq(fieldRelationships.map((r) => r.profile_relationship_type_id)),
        );

        // get fieldIds in other side of the relationship
        const otherFieldIds = uniq(
          fieldRelationships.map((r) =>
            r.left_side_petition_field_id === args.petitionFieldId
              ? r.right_side_petition_field_id
              : r.left_side_petition_field_id,
          ),
        );

        const repliesWithAssociatedProfiles = (
          await ctx.petitions.loadRepliesForField(otherFieldIds)
        )
          .flat()
          .filter(
            (r) =>
              isDefined(r.associated_profile_id) &&
              r.associated_profile_id !== args.profileId &&
              r.id !== args.parentReplyId,
          );

        if (repliesWithAssociatedProfiles.length > 0) {
          const newRelationships = await ctx.profiles.createProfileRelationship(
            repliesWithAssociatedProfiles.flatMap((reply) =>
              // every reply associated with a profile may have one or more possible relationships
              fieldRelationships
                .filter(
                  (r) =>
                    (r.left_side_petition_field_id === args.petitionFieldId &&
                      r.right_side_petition_field_id === reply.petition_field_id) ||
                    (r.right_side_petition_field_id === args.petitionFieldId &&
                      r.left_side_petition_field_id === reply.petition_field_id),
                )
                .map((relationship) => {
                  const relationshipType = relationshipTypes.find(
                    (rt) => rt!.id === relationship.profile_relationship_type_id,
                  )!;

                  if (relationshipType.is_reciprocal) {
                    const [leftSideId, rightSideId] = [
                      profile!.id,
                      reply.associated_profile_id!,
                    ].sort();
                    return {
                      left_side_profile_id: leftSideId,
                      right_side_profile_id: rightSideId,
                      profile_relationship_type_id: relationship.profile_relationship_type_id,
                    };
                  }

                  if (relationship.direction === "LEFT_RIGHT") {
                    return {
                      left_side_profile_id:
                        relationship.left_side_petition_field_id === args.petitionFieldId
                          ? profile!.id
                          : reply.associated_profile_id!,
                      right_side_profile_id:
                        relationship.left_side_petition_field_id === args.petitionFieldId
                          ? reply.associated_profile_id!
                          : profile!.id,
                      profile_relationship_type_id: relationship.profile_relationship_type_id,
                    };
                  } else {
                    return {
                      left_side_profile_id:
                        relationship.left_side_petition_field_id === args.petitionFieldId
                          ? reply.associated_profile_id!
                          : profile!.id,
                      right_side_profile_id:
                        relationship.left_side_petition_field_id === args.petitionFieldId
                          ? profile!.id
                          : reply.associated_profile_id!,
                      profile_relationship_type_id: relationship.profile_relationship_type_id,
                    };
                  }
                }),
            ),
            ctx.user!,
            true,
          );

          if (newRelationships.length > 0) {
            const relationshipTypes = await ctx.profiles.loadProfileRelationshipType(
              uniq(newRelationships.map((r) => r.profile_relationship_type_id)),
            );

            await ctx.profiles.createEvent(
              newRelationships.map((r) => ({
                type: "PROFILE_RELATIONSHIP_CREATED",
                org_id: ctx.user!.org_id,
                profile_id: profile!.id,
                data: {
                  user_id: ctx.user!.id,
                  profile_relationship_id: r.id,
                  profile_relationship_type_alias: relationshipTypes.find(
                    (rt) => rt!.id === r.profile_relationship_type_id,
                  )!.alias,
                },
              })),
            );
          }
        }
      }

      return await ctx.petitions.updatePetitionFieldReply(
        args.parentReplyId,
        { associated_profile_id: profile!.id },
        `User:${ctx.user!.id}`,
      );
    },
  },
);

export const updatePetitionFieldGroupRelationships = mutationField(
  "updatePetitionFieldGroupRelationships",
  {
    type: "PetitionBase",
    authorize: authenticateAnd(
      userHasFeatureFlag("PROFILES"),
      userHasAccessToPetitions("petitionId", ["OWNER", "WRITE"]),
      petitionsAreEditable("petitionId"),
      petitionsAreNotPublicTemplates("petitionId"),
      petitionIsNotAnonymized("petitionId"),
      petitionFieldsCanBeAssociated("relationships"),
      userHasAccessToUpdatePetitionFieldGroupRelationshipsInput("petitionId", "relationships"),
    ),
    args: {
      petitionId: nonNull(globalIdArg("Petition")),
      relationships: nonNull(
        list(
          nonNull(
            inputObjectType({
              name: "UpdatePetitionFieldGroupRelationshipInput",
              definition(t) {
                t.nullable.globalId("id", { prefixName: "PetitionFieldGroupRelationship" });
                t.nonNull.globalId("leftSidePetitionFieldId", { prefixName: "PetitionField" });
                t.nonNull.globalId("rightSidePetitionFieldId", { prefixName: "PetitionField" });
                t.nonNull.globalId("profileRelationshipTypeId", {
                  prefixName: "ProfileRelationshipType",
                });
                t.nonNull.field("direction", { type: "ProfileRelationshipDirection" });
              },
            }),
          ),
        ),
      ),
    },
    resolve: async (_, args, ctx) => {
      await ctx.petitions.resetPetitionFieldGroupRelationships(
        args.petitionId,
        args.relationships,
        `User:${ctx.user!.id}`,
      );

      return (await ctx.petitions.loadPetition(args.petitionId))!;
    },
  },
);
