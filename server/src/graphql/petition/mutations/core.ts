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
  indexBy,
  intersection,
  isNonNullish,
  isNullish,
  map,
  omit,
  partition,
  pick,
  pipe,
  range,
  sumBy,
  unique,
  uniqueBy,
  zip,
  zipWith,
} from "remeda";
import { assert } from "ts-essentials";
import {
  CreatePetition,
  CreatePetitionField,
  CreatePublicPetitionLink,
  Petition,
  PetitionFieldType,
  PetitionFieldTypeValues,
  PetitionPermission,
  ProfileTypeFieldType,
  ProfileTypeFieldTypeValues,
} from "../../../db/__types";
import {
  ProfileFieldExpiryUpdatedEvent,
  ProfileFieldFileAddedEvent,
  ProfileFieldFileRemovedEvent,
} from "../../../db/events/ProfileEvent";
import { ApprovalRequestStepConfig } from "../../../db/repositories/PetitionApprovalRequestRepository";
import { PetitionFieldOptions } from "../../../services/PetitionFieldService";
import { chunkWhile } from "../../../util/arrays";
import { applyFieldVisibility, evaluateFieldLogic, mapFieldLogic } from "../../../util/fieldLogic";
import { fromGlobalId, fromGlobalIds, isGlobalId, toGlobalId } from "../../../util/globalId";
import { importFromExcel } from "../../../util/importFromExcel";
import { isFileTypeField } from "../../../util/isFileTypeField";
import { isValueCompatible } from "../../../util/isValueCompatible";
import { never } from "../../../util/never";
import { petitionIsCompleted } from "../../../util/petitionIsCompleted";
import { isAtLeast } from "../../../util/profileTypeFieldPermission";
import { pFlatMap } from "../../../util/promises/pFlatMap";
import { withError } from "../../../util/promises/withError";
import {
  interpolatePlaceholdersInSlate,
  parseTextWithPlaceholders,
  renderTextWithPlaceholders,
} from "../../../util/slate/placeholders";
import { hash, random } from "../../../util/token";
import { unMaybeArray, UnwrapArray } from "../../../util/types";
import { walkObject } from "../../../util/walkObject";
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
  ifArgNotUndefined,
  ifNotEmptyArray,
  ifSomeDefined,
  not,
  or,
} from "../../helpers/authorize";
import { globalIdArg } from "../../helpers/globalIdPlugin";
import { parseDynamicSelectValues } from "../../helpers/parseDynamicSelectValues";
import { datetimeArg } from "../../helpers/scalars/DateTime";
import { jsonArg, jsonObjectArg } from "../../helpers/scalars/JSON";
import { uploadArg } from "../../helpers/scalars/Upload";
import { validateAnd, validateOr } from "../../helpers/validateArgs";
import { inRange } from "../../helpers/validators/inRange";
import { jsonSchema } from "../../helpers/validators/jsonSchema";
import { maxLength } from "../../helpers/validators/maxLength";
import { notEmptyArray } from "../../helpers/validators/notEmptyArray";
import { notEmptyObject } from "../../helpers/validators/notEmptyObject";
import { notEmptyString } from "../../helpers/validators/notEmptyString";
import { uniqueValues } from "../../helpers/validators/uniqueValues";
import { validApprovalFlowConfigInput } from "../../helpers/validators/validApprovalFlowConfig";
import { validBooleanValue } from "../../helpers/validators/validBooleanValue";
import { validateFieldLogicInput } from "../../helpers/validators/validFieldLogic";
import { validFolderId } from "../../helpers/validators/validFolderId";
import { validIsNonNullish } from "../../helpers/validators/validIsDefined";
import { validPath } from "../../helpers/validators/validPath";
import { validRemindersConfig } from "../../helpers/validators/validRemindersConfig";
import { validRichTextContent } from "../../helpers/validators/validRichTextContent";
import {
  validPetitionSignerData,
  validSignatureConfig,
} from "../../helpers/validators/validSignatureConfig";
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
  profileIsNotAnonymized,
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
  fieldIsNotFirstChild,
  fieldIsNotFixed,
  fieldIsNotReferencedInFieldOptions,
  fieldIsNotReferencedInLogicConditions,
  fieldIsNotReferencedInUpdateProfileOnClose,
  fieldsBelongsToPetition,
  firstChildHasType,
  foldersAreInPath,
  linkedProfileTypeFieldDoesNotHaveFormat,
  messageBelongToPetition,
  parentFieldIsInternal,
  petitionDoesNotHaveStartedProcess,
  petitionFieldsCanBeAssociated,
  petitionHasRepliableFields,
  petitionHasStatus,
  petitionIsNotAnonymized,
  petitionsAreEditable,
  petitionsAreInPath,
  petitionsAreNotPublicTemplates,
  petitionsAreNotScheduledForDeletion,
  petitionsAreOfTypePetition,
  petitionsAreOfTypeTemplate,
  petitionsArePublicTemplates,
  petitionsHaveEnabledInteractionWithRecipients,
  profileTypeFieldCanBeLinkedToFieldGroup,
  repliesBelongsToField,
  repliesBelongsToPetition,
  replyIsForFieldOfType,
  replyStatusCanBeUpdated,
  templateDoesNotHavePublicPetitionLink,
  userHasAccessToCreatePetitionFromProfilePrefillInput,
  userHasAccessToPetitions,
  userHasAccessToUpdatePetitionFieldGroupRelationshipsInput,
  userHasFeatureFlag,
  userHasPermissionInFolders,
} from "../authorizers";
import { validatePublicPetitionLinkSlug } from "../validations";
import { ApolloError, ArgValidationError, ForbiddenError } from "./../../helpers/errors";
import {
  publicPetitionLinkIsNotScheduledForDeletion,
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
            petitionsAreNotScheduledForDeletion("petitionId" as never),
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
            petitionsAreNotScheduledForDeletion("petitionId" as never),
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
  validateArgs: validPath("path"),
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
    petitionsAreNotScheduledForDeletion("petitionIds"),
  ),
  args: {
    petitionIds: nonNull(list(nonNull(globalIdArg("Petition")))),
    keepTitle: booleanArg({ default: false }),
    path: stringArg(),
  },
  validateArgs: validateAnd(notEmptyArray("petitionIds"), validPath("path")),
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
    deletePermanently: booleanArg({
      default: false,
      description: "Pass true to permanently delete instead of scheduling for deletion",
    }),
    force: booleanArg({
      default: false,
      description: "Pass true to force deleting petitions shared to other users",
    }),
    dryrun: booleanArg({
      default: false,
      description:
        "If true, this will do a dry-run of the mutation to throw possible errors but it will not perform any modification in DB",
    }),
  },
  validateArgs: (_, args, ctx, info) => {
    if ((args.ids?.length ?? 0) + (args.folders?.folderIds?.length ?? 0) === 0) {
      throw new ArgValidationError(
        info,
        "ids or folders",
        `Expected ids or folders.folderIds to be defined and not empty`,
      );
    }
  },
  resolve: async (_, args, ctx) => {
    function petitionIsOwnedByUser(p: PetitionPermission[]) {
      return p.some((u) => u.type === "OWNER" && u.user_id === ctx.user!.id);
    }

    function petitionIsSharedToUser(p: PetitionPermission[]) {
      return p.some((u) => u.type !== "OWNER" && u.user_id === ctx.user!.id);
    }

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
    if (isNonNullish(args.folders)) {
      const folderIds = fromGlobalIds(args.folders.folderIds, "PetitionFolder", true).ids;
      const folderPetitions = await ctx.petitions.getUserPetitionsInsideFolders(
        folderIds,
        args.folders.type === "TEMPLATE",
        ctx.user!,
      );
      petitionIds.push(...folderPetitions.map((p) => p.id));
    }

    petitionIds = unique(petitionIds);
    if (petitionIds.length === 0) {
      // nothing to delete
      return SUCCESS;
    }

    const petitions = await ctx.petitions.loadPetition(petitionIds);
    const publicTemplates = petitions.filter((p) => p && p.is_template && p.template_public);
    if (publicTemplates.length > 0) {
      throw new ApolloError("Can't delete a public template", "DELETE_PUBLIC_TEMPLATE_ERROR", {
        petitionIds: publicTemplates.map((p) => toGlobalId("Petition", p!.id)),
      });
    }

    // user permissions grouped by permission_id
    const userPermissions = await ctx.petitions.loadUserPermissionsByPetitionId(petitionIds);

    const zippedUserPermissions = zip(petitionIds, userPermissions);

    if (userPermissions.some(userHasAccessViaGroup)) {
      throw new ApolloError(
        "Can't delete a petition shared with a group",
        "DELETE_GROUP_PETITION_ERROR",
        {
          petitionIds: zippedUserPermissions
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
          petitionIds: zippedUserPermissions
            .filter(([, permissions]) => petitionIsSharedByOwner(permissions))
            .map(([id]) => toGlobalId("Petition", id)),
        },
      );
    }

    const [petitionsOwnedByMe, petitionsNotOwnedByMe] = partition(
      zippedUserPermissions,
      ([, permissions]) => petitionIsOwnedByUser(permissions),
    );

    const [petitionsSharedToMe, petitionsWithBypass] = partition(
      petitionsNotOwnedByMe,
      ([, permissions]) => petitionIsSharedToUser(permissions),
    );

    // add bypass petitions to the list of petitions owned by me (bypass users can delete any petition in their organization)
    petitionsOwnedByMe.push(...petitionsWithBypass);

    if (args.dryrun) {
      return SUCCESS;
    }

    await ctx.petitions.withTransaction(async (t) => {
      // delete my permissions to the petitions
      const deletedPermissions = await ctx.petitions.deleteUserPermissions(
        petitionsSharedToMe.map(([petitionId]) => petitionId),
        ctx.user!.id,
        `User:${ctx.user!.id}`,
        t,
      );
      // delete my notifications to the petitions
      await ctx.petitions.deletePetitionUserNotificationsByPetitionId(
        deletedPermissions.map((p) => p.petition_id),
        [ctx.user!.id],
        t,
      );

      if (petitionsOwnedByMe.length === 0) {
        return;
      }

      // check if there are pending signature requests on this petitions and cancel those
      const pendingSignatureRequests = (
        await ctx.petitions.loadPetitionSignaturesByPetitionId.raw(
          petitionsOwnedByMe.map(([petitionId]) => petitionId),
          t,
        )
      )
        .flat()
        .filter((s) => ["ENQUEUED", "PROCESSING", "PROCESSED"].includes(s.status));

      if (pendingSignatureRequests.length > 0) {
        await ctx.signature.cancelSignatureRequest(
          pendingSignatureRequests,
          "CANCELLED_BY_USER",
          { user_id: ctx.user!.id },
          {},
          t,
        );
      }

      await ctx.approvals.cancelApprovalRequestFlowByPetitionId(
        petitionsOwnedByMe.map(([petitionId]) => petitionId),
        ctx.user!.id,
        { onlyIfPending: true },
        t,
      );

      if (args.deletePermanently) {
        // remove every permission on petitions owned by me
        await ctx.petitions.deleteAllPermissions(
          petitionsOwnedByMe.map(([petitionId]) => petitionId),
          `User:${ctx.user!.id}`,
          t,
        );
        // finally, delete petitions owned by me
        const deletedPetitions = await ctx.petitions.deletePetition(
          petitionsOwnedByMe.map(([petitionId]) => petitionId),
          ctx.user!,
          t,
        );
        // delete every user notification on the deleted petitions
        await ctx.petitions.deletePetitionUserNotificationsByPetitionId(
          petitionsOwnedByMe.map(([petitionId]) => petitionId),
          undefined,
          t,
        );

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
      } else {
        // schedule for deletion petitions owned by me
        await ctx.petitions.deactivateAllAccessesByPetitionId(
          petitionsOwnedByMe.map(([petitionId]) => petitionId),
          ctx.user!.id,
          t,
        );
        await ctx.petitions.deactivatePublicPetitionLinksByTemplateId(
          petitionsOwnedByMe.map(([petitionId]) => petitionId),
          ctx.user!.id,
          t,
        );
        const scheduledForDeletion = await ctx.petitions.schedulePetitionForDeletion(
          petitionsOwnedByMe.map(([petitionId]) => petitionId),
          `User:${ctx.user!.id}`,
          t,
        );

        await ctx.petitions.createEvent(
          scheduledForDeletion.map((petition) => ({
            type: "PETITION_SCHEDULED_FOR_DELETION",
            petition_id: petition.id,
            data: {
              user_id: ctx.user!.id,
            },
          })),
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
    userHasAccessToPetitions("petitionId", "WRITE"),
    petitionsAreNotScheduledForDeletion("petitionId"),
    petitionsAreEditable("petitionId"),
    petitionDoesNotHaveStartedProcess("petitionId"),
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
        } else if (e.message === "FIRST_CHILD_IS_REPLY_ONLY_FROM_PROFILE_ERROR") {
          throw new ApolloError(
            "First child of a field group cannot be optional",
            "FIRST_CHILD_IS_REPLY_ONLY_FROM_PROFILE_ERROR",
          );
        }
      }
      throw e;
    }
  },
});

export const AutomaticNumberingConfigInput = inputObjectType({
  name: "AutomaticNumberingConfigInput",
  description: "The automatic numbering settings of a petition",
  definition(t) {
    t.nonNull.field("numberingType", {
      type: "AutomaticNumberingType",
    });
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
    t.nonNull.boolean("isEnabled", {
      description: "Whether to enable the signature process with this configuration.",
    });
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
          t.nullable.string("email");
          t.nullable.boolean("isPreset");
          t.nullable.boolean("signWithDigitalCertificate");
          t.nullable.field("signWithEmbeddedImage", {
            type: "Upload",
          });
          t.nullable.string("signWithEmbeddedImageFileUploadId", {
            description: "ID of the previously uploaded image if you don't want to update current.",
          });
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
    t.nullable.boolean("reviewAfterApproval", {
      description:
        "Whether to review the replies after completing the approval steps. If true, review must be true",
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
    t.nullable.boolean("useCustomDocument", {
      description: "if true, use custom document for signature instead of petition binder",
    });
  },
});

export const updatePetitionRestriction = mutationField("updatePetitionRestriction", {
  description: "Updates the restriction preferences",
  type: "PetitionBase",
  authorize: authenticateAnd(
    userHasAccessToPetitions("petitionId", "WRITE"),
    petitionsAreNotScheduledForDeletion("petitionId"),
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
      isNonNullish(passwordHash) &&
      (isNullish(password) || passwordHash !== (await hash(password, passwordSalt!)))
    ) {
      throw new ApolloError(
        "The petition is restricted with a password.",
        "INVALID_PETITION_RESTRICTION_PASSWORD",
      );
    }

    let data: Partial<CreatePetition>;
    if (isRestricted) {
      const salt = isNonNullish(password) ? random(10) : null;
      data = {
        restricted_by_user_id: ctx.user!.id,
        restricted_at: new Date(),
        restricted_password_hash: isNonNullish(password) ? await hash(password, salt!) : null,
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
    userHasAccessToPetitions("petitionId", "WRITE"),
    petitionsAreNotScheduledForDeletion("petitionId"),
    petitionsAreNotPublicTemplates("petitionId"),
    petitionIsNotAnonymized("petitionId"),
    async (_, args, ctx) => {
      const signature = await ctx.petitions.loadLatestPetitionSignatureByPetitionId(
        args.petitionId,
      );
      // all signature requests must be finished before the petition is closed
      if (signature && ["ENQUEUED", "PROCESSED", "PROCESSING"].includes(signature.status)) {
        throw new ApolloError(
          "Can't close the parallel with an ongoing signature process.",
          "ONGOING_PROCESS_ERROR",
          { processType: "SIGNATURE" },
        );
      }

      const approvalSteps =
        await ctx.approvalRequests.loadCurrentPetitionApprovalRequestStepsByPetitionId(
          args.petitionId,
        );

      if (approvalSteps.some((s) => s.status === "PENDING")) {
        throw new ApolloError(
          "Can't close the parallel with a pending approval process.",
          "ONGOING_PROCESS_ERROR",
          { processType: "APPROVAL" },
        );
      }

      return true;
    },
  ),
  args: {
    petitionId: nonNull(globalIdArg("Petition")),
  },
  resolve: async (_, args, ctx) => {
    return await ctx.petitions.withTransaction(async (t) => {
      const [petition] = await ctx.petitions.closePetitions(
        args.petitionId,
        `User:${ctx.user!.id}`,
        t,
      );

      await ctx.petitions.updateRemindersForPetitions(args.petitionId, null, t);
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
    userHasAccessToPetitions("petitionId", "WRITE"),
    petitionsAreNotPublicTemplates("petitionId"),
    petitionsAreNotScheduledForDeletion("petitionId"),
    ifSomeDefined(
      [
        "data.description",
        "data.closingEmailBody",
        "data.isCompletingMessageEnabled",
        "data.completingMessageSubject",
        "data.completingMessageBody",
        "data.skipForwardSecurity",
        "data.isRecipientViewContentsHidden",
        "data.isDelegateAccessEnabled",
        "data.anonymizeAfterMonths",
        "data.anonymizePurpose",
        "data.defaultPath",
        "data.defaultOnBehalfId",
        "data.automaticNumberingConfig",
        "data.approvalFlowConfig",
      ],
      and(petitionsAreEditable("petitionId"), petitionDoesNotHaveStartedProcess("petitionId")),
    ),
    ifSomeDefined(["data.locale"], petitionsAreEditable("petitionId")),
    ifSomeDefined(
      ["data.emailBody", "data.emailSubject"],
      or(petitionsAreEditable("petitionId"), petitionsAreOfTypePetition("petitionId")),
    ),
    // only allow to update petition name if anonymized
    ifSomeDefined(
      [
        "data.closingEmailBody",
        "data.deadline",
        "data.description",
        "data.emailBody",
        "data.emailSubject",
        "data.isRecipientViewContentsHidden",
        "data.isDelegateAccessEnabled",
        "data.locale",
        "data.remindersConfig",
        "data.signatureConfig",
        "data.skipForwardSecurity",
        "data.anonymizeAfterMonths",
        "data.anonymizePurpose",
        "data.defaultPath",
        "data.defaultOnBehalfId",
        "data.automaticNumberingConfig",
        "data.approvalFlowConfig",
      ],
      petitionIsNotAnonymized("petitionId"),
    ),
    // only petition owners can edit compliance props
    ifSomeDefined(
      ["data.anonymizeAfterMonths", "data.anonymizePurpose"],
      and(userHasFeatureFlag("AUTO_ANONYMIZE"), userHasAccessToPetitions("petitionId", "OWNER")),
    ),
    ifSomeDefined(
      ["data.defaultOnBehalfId"],
      defaultOnBehalfUserBelongsToContextOrganization("data"),
    ),
    ifSomeDefined(
      [
        "data.isReviewFlowEnabled",
        "data.isDocumentGenerationEnabled",
        "data.isInteractionWithRecipientsEnabled",
        "data.approvalFlowConfig",
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
          t.nullable.field("automaticNumberingConfig", {
            type: "AutomaticNumberingConfigInput",
          });
          t.nullable.list.nonNull.field("approvalFlowConfig", { type: "ApprovalFlowConfigInput" });
        },
      }).asArg(),
    ),
  },
  validateArgs: validateAnd(
    notEmptyObject("data"),
    maxLength("data.name", 255),
    maxLength("data.emailSubject", 1000),
    maxLength("data.completingMessageSubject", 255),
    maxLength("data.description", 1000),
    validPetitionSubject("data.emailSubject", "petitionId"),
    validRichTextContent("data.emailBody", "petitionId"),
    validRichTextContent("data.closingEmailBody", "petitionId"),
    validRichTextContent("data.description"),
    validRichTextContent("data.completingMessageBody", "petitionId"),
    validRemindersConfig("data.remindersConfig"),
    validSignatureConfig("petitionId", "data.signatureConfig", "data.approvalFlowConfig"),
    validApprovalFlowConfigInput("data.approvalFlowConfig", "petitionId"),
    inRange("data.anonymizeAfterMonths", 1),
    validPath("data.defaultPath"),
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
      automaticNumberingConfig,
      approvalFlowConfig,
    } = args.data;
    const data: Partial<CreatePetition> = {};
    if (name !== undefined) {
      data.name = name?.trim() || null;
    }
    if (isNonNullish(locale)) {
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
    if (isNonNullish(skipForwardSecurity)) {
      data.skip_forward_security = skipForwardSecurity;
    }
    if (isNonNullish(isRecipientViewContentsHidden)) {
      data.hide_recipient_view_contents = isRecipientViewContentsHidden;
    }
    if (isNonNullish(isDelegateAccessEnabled)) {
      data.enable_delegate_access = isDelegateAccessEnabled;
    }
    if (isNonNullish(isInteractionWithRecipientsEnabled)) {
      data.enable_interaction_with_recipients = isInteractionWithRecipientsEnabled;
    }
    if (isNonNullish(isReviewFlowEnabled)) {
      data.enable_review_flow = isReviewFlowEnabled;
    }
    if (isNonNullish(isDocumentGenerationEnabled)) {
      data.enable_document_generation = isDocumentGenerationEnabled;
    }
    if (signatureConfig !== undefined) {
      try {
        data.signature_config =
          signatureConfig === null
            ? null
            : {
                ...signatureConfig,
                signersInfo: await pMap(
                  signatureConfig.signersInfo,
                  async (signer) => {
                    if (isNonNullish(signer.signWithEmbeddedImage)) {
                      // if provided with an image, upload it to bucket on S3 so it is available when generating the document
                      const { createReadStream, mimetype } = await signer.signWithEmbeddedImage;
                      const filename = random(16);
                      const path = `uploads/${filename}`;
                      const res = await ctx.storage.publicFiles.uploadFile(
                        path,
                        mimetype,
                        createReadStream(),
                      );
                      const file = await ctx.files.createPublicFile(
                        {
                          path,
                          filename,
                          content_type: mimetype,
                          size: res["ContentLength"]!.toString(),
                        },
                        `User:${ctx.user!.id}`,
                      );

                      return {
                        ...omit(signer, ["signWithEmbeddedImage"]),
                        signWithEmbeddedImageFileUploadId: file.id,
                      };
                    }

                    if (signer.signWithEmbeddedImageFileUploadId) {
                      // if provided with an ID, verify it (its a signed JWT)
                      const payload = await ctx.jwt.verify<{
                        signWithEmbeddedImageFileUploadId: string;
                      }>(signer.signWithEmbeddedImageFileUploadId);

                      return {
                        ...omit(signer, [
                          "signWithEmbeddedImage",
                          "signWithEmbeddedImageFileUploadId",
                        ]),
                        signWithEmbeddedImageFileUploadId: fromGlobalId(
                          payload.signWithEmbeddedImageFileUploadId,
                          "PublicFileUpload",
                        ).id,
                      };
                    }

                    return {
                      ...omit(signer, ["signWithEmbeddedImage"]),
                      signWithEmbeddedImageFileUploadId: null,
                    };
                  },
                  {
                    concurrency: 10,
                  },
                ),
              };
      } catch (e) {
        throw new ForbiddenError("Invalid signatureConfig");
      }
    }
    if (description !== undefined) {
      data.template_description = description === null ? null : JSON.stringify(description);
    }

    if (isNonNullish(isCompletingMessageEnabled)) {
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

    if (automaticNumberingConfig !== undefined) {
      data.automatic_numbering_config =
        automaticNumberingConfig !== null
          ? {
              numbering_type: automaticNumberingConfig.numberingType,
            }
          : null;
      if (automaticNumberingConfig === null) {
        await ctx.petitions.setAutomaticNumberingOnPetitionFields(
          args.petitionId,
          false,
          `User:${ctx.user!.id}`,
        );
      }
    }

    if (approvalFlowConfig !== undefined) {
      let signatureConfig = data.signature_config;
      if (!signatureConfig) {
        // if new signature configuration is not provided on update mutation, look for the one stored in petition
        const petition = await ctx.petitions.loadPetition(args.petitionId);
        assert(petition, "Petition not found");
        signatureConfig = petition.signature_config;
      }

      if (approvalFlowConfig === null) {
        data.approval_flow_config = null;

        // when nulling approvalFlowConfig, we need to also null reviewAfterApproval in signature_config
        if (signatureConfig) {
          data.signature_config = JSON.stringify({
            ...signatureConfig,
            reviewAfterApproval: null,
          });
        }
      } else {
        const referencedLists: string[] = [];
        data.approval_flow_config = JSON.stringify(
          approvalFlowConfig.map((config) => {
            const fieldLogic = config.visibility
              ? mapFieldLogic<string>({ visibility: config.visibility } as any, (fieldId) => {
                  assert(typeof fieldId === "string", "Expected fieldId to be a string");
                  return fromGlobalId(fieldId, "PetitionField").id;
                })
              : null;

            if (fieldLogic?.referencedLists) {
              referencedLists.push(...fieldLogic.referencedLists);
            }

            return {
              name: config.name,
              type: config.type,
              values: config.values.map((id) => {
                assert(
                  isGlobalId(id, "User") ||
                    isGlobalId(id, "UserGroup") ||
                    isGlobalId(id, "PetitionField"),
                  "Expected globalId to be a User, UserGroup or PetitionField",
                );
                return fromGlobalId(id);
              }),
              manual_start: config.manualStart ?? false,
              visibility: fieldLogic?.field.visibility ?? null,
            } satisfies ApprovalRequestStepConfig;
          }),
        );

        if (referencedLists.length > 0) {
          await ctx.petitions.updateStandardListDefinitionOverride(
            args.petitionId,
            unique(referencedLists),
          );
        }
      }
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
    userHasAccessToPetitions("templateId", "WRITE"),
    petitionsAreNotScheduledForDeletion("templateId"),
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
    userHasAccessToPetitions("petitionId", "WRITE"),
    petitionsAreNotScheduledForDeletion("petitionId"),
    petitionsAreEditable("petitionId"),
    petitionDoesNotHaveStartedProcess("petitionId"),
    petitionsAreNotPublicTemplates("petitionId"),
    ifArgEquals("type", "ES_TAX_DOCUMENTS", userHasFeatureFlag("ES_TAX_DOCUMENTS_FIELD")),
    ifArgEquals("type", "DOW_JONES_KYC", userHasFeatureFlag("DOW_JONES_KYC")),
    ifArgEquals("type", "PROFILE_SEARCH", userHasFeatureFlag("PROFILE_SEARCH_FIELD")),
    petitionIsNotAnonymized("petitionId"),
    ifArgDefined(
      "parentFieldId",
      and(
        fieldsBelongsToPetition("petitionId", "parentFieldId" as never),
        fieldHasType("parentFieldId" as never, "FIELD_GROUP"),
      ),
    ),
    ifArgDefined(
      "profileTypeId",
      and(
        (_, { type, parentFieldId }) => type === "FIELD_GROUP" && isNullish(parentFieldId),
        userHasAccessToProfileType("profileTypeId" as never),
        not(profileTypeIsArchived("profileTypeId" as never)),
      ),
    ),
  ),
  args: {
    petitionId: nonNull(globalIdArg("Petition")),
    type: nonNull(arg({ type: "PetitionFieldType" })),
    position: intArg(),
    parentFieldId: globalIdArg("PetitionField"),
    data: nullable(
      inputObjectType({
        name: "CreatePetitionFieldInput",
        definition(t) {
          t.nullable.field("options", { type: "JSONObject" });
          t.nullable.boolean("multiple");
          t.nullable.boolean("isInternal");
        },
      }).asArg(),
    ),
    profileTypeId: nullable(
      globalIdArg("ProfileType", {
        description: "If type is FIELD_GROUP, optionally link the field to a profile type",
      }),
    ),
  },
  validateArgs: inRange("position", 0),
  resolve: async (_, args, ctx) => {
    const petition = await ctx.petitions.loadPetition(args.petitionId);
    assert(petition, "Petition not found");
    ctx.petitions.loadPetition.dataloader.clear(args.petitionId);

    async function defaultProperties(type: PetitionFieldType, petition: Petition) {
      const props = ctx.petitionFields.defaultFieldProperties(type, undefined, petition);
      if (type === "PROFILE_SEARCH") {
        props.options = await ctx.petitions.buildDefaultProfileSearchOptions(ctx.user!.org_id);
      }

      return props;
    }

    const fieldProperties = {
      type: args.type,
      profile_type_id: args.profileTypeId ?? null,
      ...(await defaultProperties(args.type, petition)),
    };
    if (isNonNullish(args.data?.multiple)) {
      fieldProperties.multiple = args.data.multiple;
    }
    if (isNonNullish(args.data?.isInternal)) {
      fieldProperties.is_internal = args.data.isInternal;
    }
    if (args.type === "FIELD_GROUP" && isNonNullish(args.data?.options?.groupName)) {
      fieldProperties.options.groupName = args.data!.options!.groupName;
    }
    const [field] = await ctx.petitions.createPetitionFieldsAtPosition(
      args.petitionId,
      fieldProperties,
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
    userHasAccessToPetitions("petitionId", "WRITE"),
    petitionsAreNotScheduledForDeletion("petitionId"),
    fieldsBelongsToPetition("petitionId", "fieldId"),
    petitionsAreEditable("petitionId"),
    petitionDoesNotHaveStartedProcess("petitionId"),
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
    userHasAccessToPetitions("petitionId", "WRITE"),
    petitionsAreNotScheduledForDeletion("petitionId"),
    fieldsBelongsToPetition("petitionId", "fieldId"),
    fieldIsNotFixed("fieldId"),
    petitionsAreEditable("petitionId"),
    petitionDoesNotHaveStartedProcess("petitionId"),
    petitionsAreNotPublicTemplates("petitionId"),
    petitionIsNotAnonymized("petitionId"),
    fieldIsNotReferencedInLogicConditions("petitionId", "fieldId"),
    fieldIsNotReferencedInFieldOptions("petitionId", "fieldId"),
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
      if (isNonNullish(secondChild?.visibility)) {
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
      if (
        secondChild?.profile_type_field_id &&
        secondChild?.options.replyOnlyFromProfile &&
        secondChild?.optional
      ) {
        throw new ApolloError(
          "First child of a field group cannot be optional",
          "FIRST_CHILD_IS_REPLY_ONLY_FROM_PROFILE_ERROR",
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
    userHasAccessToPetitions("petitionId", "WRITE"),
    petitionsAreNotScheduledForDeletion("petitionId"),
    fieldsBelongsToPetition("petitionId", "fieldId"),
    petitionsAreEditable("petitionId"),
    petitionDoesNotHaveStartedProcess("petitionId"),
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
          firstChildHasType("petitionId", "fieldId", [
            "DOW_JONES_KYC",
            "BACKGROUND_CHECK",
            "PROFILE_SEARCH",
            "ADVERSE_MEDIA_SEARCH",
          ]),
        ),
      ),
    ),
    ifArgEquals(
      (args) => args.data.multiple,
      true,
      fieldIsNotReferencedInFieldOptions("petitionId", "fieldId"),
    ),
    ifArgDefined(
      (args) => args.data.optional ?? args.data.isInternal,
      fieldIsNotFirstChild("fieldId"),
    ),
    ifArgDefined(
      (args) => args.data.isInternal ?? args.data.showInPdf,
      not(
        fieldHasType("fieldId", [
          "DOW_JONES_KYC",
          "BACKGROUND_CHECK",
          "PROFILE_SEARCH",
          "ADVERSE_MEDIA_SEARCH",
          "USER_ASSIGNMENT",
        ]),
      ),
    ),
    ifArgDefined(
      (args) => args.data.alias,
      fieldAliasIsAvailable("petitionId", "data.alias" as never),
    ),
    ifArgDefined(
      (args) =>
        args.data.multiple ??
        (args.data.options?.standardList !== undefined ? true : undefined) ??
        args.data.options?.values ??
        args.data.options?.labels,
      not(fieldIsLinkedToProfileTypeField("fieldId")),
    ),
    ifArgEquals(
      (args) => args.data.options?.replyOnlyFromProfile,
      true,
      and(
        fieldHasType(
          "fieldId",
          // support only field types that can be linked to a profile type field
          intersection.multiset(ProfileTypeFieldTypeValues, PetitionFieldTypeValues),
        ),
        fieldIsLinkedToProfileTypeField("fieldId"),
        fieldIsNotFirstChild("fieldId"),
      ),
    ),
    ifArgNotUndefined(
      (args) => args.data.options?.format,
      and(
        linkedProfileTypeFieldDoesNotHaveFormat("fieldId"),
        fieldIsNotReferencedInUpdateProfileOnClose("petitionId", "fieldId"),
      ),
    ),
    ifArgDefined(
      (args) => args.data.multiple,
      not(
        fieldHasType("fieldId", [
          "ES_TAX_DOCUMENTS",
          "ID_VERIFICATION",
          "PROFILE_SEARCH",
          "ADVERSE_MEDIA_SEARCH",
        ]),
      ),
    ),
    ifArgDefined(
      (args) =>
        (args.data.options?.accepts !== undefined ? true : undefined) ??
        (args.data.options?.maxFileSize !== undefined ? true : undefined),
      async (_, args, ctx) => {
        const field = await ctx.petitions.loadField(args.fieldId);
        if (
          (isNonNullish(field?.options.documentProcessing) &&
            args.data.options?.documentProcessing !== null) ||
          (field?.options.processDocument && args.data.options?.processDocument !== null)
        ) {
          throw new ForbiddenError(
            "Can't set accepts or maxFileSize on a document processing field",
          );
        }
        return true;
      },
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
    notEmptyObject("data"),
    maxLength("data.title", 500),
    maxLength("data.alias", 100),
    validateRegex("data.alias", FIELD_REFERENCE_REGEX),
    validateFieldLogicInput(
      (args) => args.petitionId,
      (args) => args.fieldId,
      "data",
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
    if (isNonNullish(optional)) {
      data.optional = optional;
    }
    if (isNonNullish(multiple)) {
      data.multiple = multiple;
    }
    if (isNonNullish(requireApproval)) {
      data.require_approval = requireApproval;
    }

    if (isNonNullish(showInPdf)) {
      data.show_in_pdf = showInPdf;
    }

    if (isNonNullish(isInternal)) {
      data.is_internal = isInternal;
      data.require_approval = !isInternal;
      data.show_in_pdf = !isInternal;
    }

    if (isNonNullish(showActivityInPdf)) {
      data.show_activity_in_pdf = showActivityInPdf;
    }

    if (alias !== undefined) {
      data.alias = alias?.trim() || null;
    }

    if (isNonNullish(options)) {
      try {
        // validate global ids in options before mapping to numeric.
        // this way we can throw error if user provided a numeric id instead of a global id.
        ctx.petitionValidation.validatePetitionFieldOptionsGlobalIds(options);

        // convert every globalId defined in options to numeric
        const dbOptions = structuredClone(options);
        walkObject(dbOptions, (key, value, node) => {
          if (Array.isArray(value) && value.every((v) => typeof v === "string" && isGlobalId(v))) {
            node[key] = value.map((v) => fromGlobalId(v).id);
          }
          if (isGlobalId(value)) {
            node[key] = fromGlobalId(value).id;
          }
        });

        const allFields = await ctx.petitions.loadAllFieldsByPetitionId(args.petitionId);
        const { profile_type_id: profileTypeId } = allFields.find((f) => f.id === args.fieldId)!;

        const profileTypeFields = isNonNullish(profileTypeId)
          ? await ctx.profiles.loadProfileTypeFieldsByProfileTypeId(profileTypeId)
          : [];

        const petition = await ctx.petitions.loadPetition(args.petitionId);
        const field = ctx.petitionValidation.validatePetitionFieldOptions(
          args.fieldId,
          {
            options: dbOptions,
          },
          indexBy(allFields, (f) => f.id),
          indexBy(profileTypeFields, (f) => f.id),
          indexBy(petition!.variables ?? [], (v) => v.name),
        );

        data.options = field.options;

        if (
          field.type === "SHORT_TEXT" &&
          isNonNullish(data.options.format) &&
          field.options.format !== data.options.format
        ) {
          const replies = await ctx.petitions.loadRepliesForField.raw(args.fieldId);

          if (!args.force && replies.length > 0) {
            throw new ApolloError("The petition field has replies.", "FIELD_HAS_REPLIES_ERROR");
          }

          if (replies.length > 0) {
            await ctx.petitions.deletePetitionFieldReplies(
              [{ id: args.fieldId }],
              `User:${ctx.user!.id}`,
            );
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

    if (visibility !== undefined || math !== undefined) {
      // convert GIDs to numeric for storing in DB
      const fieldLogic = mapFieldLogic<string>({ visibility, math } as any, (fieldId) => {
        assert(typeof fieldId === "string", "Expected fieldId to be a string");
        return fromGlobalId(fieldId, "PetitionField").id;
      });

      await ctx.petitions.updateStandardListDefinitionOverride(
        args.petitionId,
        fieldLogic.referencedLists,
      );

      if (visibility !== undefined) {
        data.visibility = fieldLogic.field.visibility;
      }

      if (math !== undefined) {
        data.math = fieldLogic.field.math;
      }
    }

    if (isNonNullish(hasCommentsEnabled)) {
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

        if (isNonNullish(data.optional) && field.type === "FIELD_GROUP") {
          if (field.optional) {
            // if updating FIELD_GROUP to optional, remove every empty field group reply
            await ctx.petitions.deleteEmptyFieldGroupReplies(field.id, `User:${ctx.user!.id}`);
          } else {
            // if updating FIELD_GROUP to required, create an empty field group reply only if there are no replies
            const replies = await ctx.petitions.loadRepliesForField(field.id);
            if (replies.length === 0) {
              await ctx.petitions.createEmptyFieldGroupReply([field.id], {}, ctx.user!);
              ctx.petitions.loadRepliesForField.dataloader.clear(field.id);
            }
          }
        }
        ctx.petitions.loadPetition.dataloader.clear(args.petitionId);
      }

      if (isNonNullish(data.is_internal) && field.type === "FIELD_GROUP") {
        const fieldChildren = await ctx.petitions.loadPetitionFieldChildren({
          petitionId: field.petition_id,
          parentFieldId: field.id,
        });
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
          ctx.petitions.loadPetitionFieldChildren.dataloader.clear({
            parentFieldId: field.id,
            petitionId: field.petition_id,
          });
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

export const uploadDynamicSelectFile = mutationField("uploadDynamicSelectFieldFile", {
  description:
    "Uploads the xlsx file used to parse the options of a dynamic select field, and sets the field options",
  type: "PetitionField",
  authorize: authenticateAnd(
    userHasAccessToPetitions("petitionId", "WRITE"),
    petitionsAreNotScheduledForDeletion("petitionId"),
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
  validateArgs: validateFile("file", {
    contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    maxSize: 1024 * 1024 * 10,
  }),
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

    ctx.petitionValidation.validatePetitionFieldOptions(
      args.fieldId,
      { options },
      // for validating DYNAMIC_SELECT options, we only need to load the field itself, not all fields
      { [args.fieldId]: (await ctx.petitions.loadField(args.fieldId))! },
    );
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
    authorize: authenticateAnd(
      userHasAccessToPetitions("petitionId", "WRITE"),
      petitionsAreNotScheduledForDeletion("petitionId"),
      not(petitionHasStatus("petitionId", "CLOSED")),
    ),
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
    userHasAccessToPetitions("petitionId", "WRITE"),
    petitionsAreNotScheduledForDeletion("petitionId"),
    fieldsBelongsToPetition("petitionId", "petitionFieldId"),
    repliesBelongsToField("petitionFieldId", "petitionFieldReplyIds"),
    replyStatusCanBeUpdated("petitionFieldId"),
    not(fieldHasType("petitionFieldId", "FIELD_GROUP")),
    not(petitionHasStatus("petitionId", "CLOSED")),
  ),
  args: {
    petitionId: nonNull(globalIdArg("Petition")),
    petitionFieldId: nonNull(globalIdArg("PetitionField")),
    petitionFieldReplyIds: nonNull(list(nonNull(globalIdArg("PetitionFieldReply")))),
    status: nonNull(arg({ type: "PetitionFieldReplyStatus" })),
  },
  validateArgs: notEmptyArray("petitionFieldReplyIds"),
  resolve: async (_, args, ctx) => {
    await ctx.petitions.updatePetitionFieldRepliesStatus(
      args.petitionFieldReplyIds,
      args.status,
      `User:${ctx.user!.id}`,
    );

    if (args.status === "REJECTED") {
      const petition = await ctx.petitions.loadPetition(args.petitionId);
      const ongoingProcesses = await ctx.petitions.getPetitionStartedProcesses(args.petitionId);
      if (petition?.status === "COMPLETED" && ongoingProcesses.length === 0) {
        await ctx.petitions.updatePetition(
          args.petitionId,
          { status: "PENDING" },
          `User:${ctx.user!.id}`,
        );
        ctx.petitions.loadPetition.dataloader.clear(args.petitionId);
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
        if (isNullish(reply?.content["file_upload_id"])) {
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
      } else if (reply!.type === "BACKGROUND_CHECK" && isNonNullish(reply?.content?.entity)) {
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

export const createContactlessPetitionAccess = mutationField("createContactlessPetitionAccess", {
  description: "Creates a contactless petition access",
  type: "PetitionAccess",
  authorize: authenticateAnd(
    userHasAccessToPetitions("petitionId", "WRITE"),
    petitionsAreNotScheduledForDeletion("petitionId"),
    petitionHasRepliableFields("petitionId"),
    petitionIsNotAnonymized("petitionId"),
    petitionsHaveEnabledInteractionWithRecipients("petitionId"),
  ),
  args: {
    petitionId: nonNull(globalIdArg("Petition")),
    remindersConfig: nullable("RemindersConfigInput"),
  },
  resolve: async (_, args, ctx) => {
    try {
      const access = await ctx.petitions.createContactlessAccess(
        args.petitionId,
        args.remindersConfig ?? null,
        ctx.user!,
      );

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
    userHasAccessToPetitions("petitionId", "WRITE"),
    petitionsAreNotScheduledForDeletion("petitionId"),
    petitionHasRepliableFields("petitionId"),
    userHasAccessToContactGroups("contactIdGroups"),
    userCanSendAs("senderId" as never),
    petitionIsNotAnonymized("petitionId"),
    petitionsAreOfTypePetition("petitionId"),
    organizationHasEnoughPetitionSendCredits("petitionId", "contactIdGroups"),
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
    notEmptyArray("contactIdGroups"),
    maxLength("subject", 1000),
    notEmptyString("subject"),
    validPetitionSubject("subject", "petitionId"),
    validRichTextContent("body", "petitionId"),
    validRemindersConfig("remindersConfig"),
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
            { cloneReplies: true, createEmptyFieldGroups: false }, // also clone the petition replies
            `User:${ctx.user!.id}`,
          ),
        { concurrency: 5 },
      );

      if (
        isNonNullish(args.bulkSendSigningMode) &&
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

      const sender = isNonNullish(args.senderId) ? await ctx.users.loadUser(args.senderId) : null;

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
            index === 0 ? args.subject : (petition.email_subject ?? args.subject),
            getValues,
          );

          const [updatedPetition] = await ctx.petitions.updatePetition(
            petition.id,
            {
              name: (petition.name ?? messageSubject)
                .slice(0, 255)
                .concat(index === 0 ? "" : ` (${index + 1})`),
              status: petition.status === "DRAFT" ? "PENDING" : petition.status,
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
    userHasAccessToPetitions("petitionId", "WRITE"),
    petitionsAreNotScheduledForDeletion("petitionId"),
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
  validateArgs: validRichTextContent("body", "petitionId"),
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
          petition_access_id: accessId,
          sender_id: ctx.user!.id,
          email_body: emailBody,
          created_by: `User:${ctx.user!.id}`,
        };
      },
      { concurrency: 1 },
    );

    const reminders = await ctx.petitions.createReminders("MANUAL", remindersData);

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
    userHasAccessToPetitions("petitionId", "WRITE"),
    petitionsAreNotScheduledForDeletion("petitionId"),
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
    validBooleanValue("start", false),
    validateAnd(validIsNonNullish("remindersConfig"), validRemindersConfig("remindersConfig")),
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
    userHasAccessToPetitions("petitionId", "WRITE"),
    petitionsAreNotScheduledForDeletion("petitionId"),
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
    return (await ctx.petitions.loadAccess(args.accessIds)).filter(isNonNullish);
  },
});

export const reactivateAccesses = mutationField("reactivateAccesses", {
  description: "Reactivates the specified inactive petition accesses.",
  type: list(nonNull("PetitionAccess")),
  authorize: authenticateAnd(
    userHasAccessToPetitions("petitionId", "WRITE"),
    petitionsAreNotScheduledForDeletion("petitionId"),
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
    return (await ctx.petitions.loadAccess(args.accessIds)).filter(isNonNullish);
  },
});

export const cancelScheduledMessage = mutationField("cancelScheduledMessage", {
  description: "Cancels a scheduled petition message.",
  type: nullable("PetitionMessage"),
  authorize: authenticateAnd(
    userHasAccessToPetitions("petitionId", "WRITE"),
    petitionsAreNotScheduledForDeletion("petitionId"),
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
    userHasAccessToPetitions("petitionId", "WRITE"),
    petitionsAreNotScheduledForDeletion("petitionId"),
    fieldsBelongsToPetition("petitionId", "fieldId"),
    petitionsAreEditable("petitionId"),
    petitionDoesNotHaveStartedProcess("petitionId"),
    petitionsAreNotPublicTemplates("petitionId"),
    not(fieldHasType("fieldId", "FIELD_GROUP")),
    ifArgEquals("type", "ES_TAX_DOCUMENTS", userHasFeatureFlag("ES_TAX_DOCUMENTS_FIELD")),
    ifArgEquals("type", "PROFILE_SEARCH", userHasFeatureFlag("PROFILE_SEARCH_FIELD")),
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
    fieldIsNotReferencedInLogicConditions("petitionId", "fieldId"),
    fieldIsNotReferencedInFieldOptions("petitionId", "fieldId"),
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
      if (isNonNullish(field) && replies.length > 0 && !isValueCompatible(field.type, args.type)) {
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
    userHasAccessToPetitions("petitionId", "WRITE"),
    petitionsAreNotScheduledForDeletion("petitionId"),
    petitionIsNotAnonymized("petitionId"),
    petitionsHaveEnabledInteractionWithRecipients("petitionId"),
  ),
  validateArgs: validRichTextContent("emailBody", "petitionId"),
  resolve: async (_, args, ctx) => {
    const shouldSendNotification = await ctx.petitions.shouldNotifyPetitionClosed(args.petitionId);
    if (!shouldSendNotification && !args.force) {
      throw new ApolloError(
        "You already notified the contacts",
        "ALREADY_NOTIFIED_PETITION_CLOSED_ERROR",
      );
    }

    const accesses = await ctx.petitions.loadAccessesForPetition(args.petitionId);

    const activeAccesses = accesses.filter(
      (a) => a.status === "ACTIVE" && isNonNullish(a.contact_id),
    );

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
    userHasAccessToPetitions("petitionId", "WRITE"),
    petitionsAreNotScheduledForDeletion("petitionId"),
    petitionIsNotAnonymized("petitionId"),
    petitionHasStatus("petitionId", ["COMPLETED", "CLOSED"]),
  ),
  args: {
    petitionId: nonNull(globalIdArg("Petition")),
  },
  resolve: async (_, args, ctx) => {
    await ctx.petitions.reopenPetition(args.petitionId, `User:${ctx.user!.id}`);

    await ctx.approvalRequests.updatePetitionApprovalRequestStepsAsDeprecated(args.petitionId);

    await ctx.petitions.createEvent({
      type: "PETITION_REOPENED",
      petition_id: args.petitionId,
      data: { user_id: ctx.user!.id },
    });

    return (await ctx.petitions.loadPetition(args.petitionId))!;
  },
});

export const updatePetitionMetadata = mutationField("updatePetitionMetadata", {
  description: "Updates the metadata of the specified petition",
  type: "Petition",
  authorize: authenticateAnd(
    userHasAccessToPetitions("petitionId", "WRITE"),
    petitionsAreNotScheduledForDeletion("petitionId"),
  ),
  args: {
    petitionId: nonNull(globalIdArg("Petition")),
    metadata: nonNull(jsonObjectArg()),
  },
  validateArgs: jsonSchema({
    type: "object",
    additionalProperties: { type: ["string", "boolean", "number"] },
  })("metadata"),
  resolve: async (_, args, ctx) => {
    return await ctx.petitions.updatePetitionMetadata(args.petitionId, args.metadata);
  },
});

export const updatePetitionFieldReplyMetadata = mutationField("updatePetitionFieldReplyMetadata", {
  description: "Updates the metadata of the specified petition field reply",
  type: "PetitionFieldReply",
  authorize: authenticateAnd(
    userHasAccessToPetitions("petitionId", "WRITE"),
    petitionsAreNotScheduledForDeletion("petitionId"),
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
  })("metadata"),
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
    userHasAccessToPetitions("templateId", "WRITE"),
    petitionsAreNotScheduledForDeletion("templateId"),
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
      (ownerPermissions.length === 1 && isNullish(ownerPermissions[0].userId)) // if there is an owner, userId must be defined
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
    userHasAccessToPetitions("templateId", "WRITE"),
    petitionsAreNotScheduledForDeletion("templateId"),
    petitionsAreOfTypeTemplate("templateId"),
    templateDoesNotHavePublicPetitionLink("templateId"),
    petitionsHaveEnabledInteractionWithRecipients("templateId"),
  ),
  args: {
    templateId: nonNull(globalIdArg("Petition")),
    title: nonNull(stringArg()),
    description: nonNull(stringArg()),
    slug: nullable(stringArg()),
    allowMultiplePetitions: nonNull(booleanArg()),
    petitionNamePattern: nullable(stringArg()),
  },
  validateArgs: validateAnd(
    validatePublicPetitionLinkSlug("slug"),
    validPublicPetitionLinkPetitionNamePattern("petitionNamePattern"),
  ),
  resolve: async (
    _,
    { templateId, title, description, slug, allowMultiplePetitions, petitionNamePattern },
    ctx,
  ) => {
    const link = await ctx.petitions.createPublicPetitionLink(
      {
        template_id: templateId,
        title,
        description,
        slug: slug ?? random(10),
        is_active: true,
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
    userHasAccessToPublicPetitionLink("publicPetitionLinkId", "WRITE"),
    publicPetitionLinkIsNotScheduledForDeletion("publicPetitionLinkId"),
  ),
  args: {
    publicPetitionLinkId: nonNull(globalIdArg("PublicPetitionLink")),
    isActive: booleanArg(),
    title: stringArg(),
    description: stringArg(),
    slug: stringArg(),
    allowMultiplePetitions: booleanArg(),
    petitionNamePattern: stringArg(),
  },
  validateArgs: validateAnd(
    validatePublicPetitionLinkSlug("slug", "publicPetitionLinkId"),
    validPublicPetitionLinkPetitionNamePattern("petitionNamePattern"),
  ),
  resolve: async (_, args, ctx) => {
    const publicPetitionLinkData: Partial<CreatePublicPetitionLink> = {};
    if (isNonNullish(args.title)) {
      publicPetitionLinkData.title = args.title;
    }
    if (isNonNullish(args.description)) {
      publicPetitionLinkData.description = args.description;
    }
    if (isNonNullish(args.isActive)) {
      publicPetitionLinkData.is_active = args.isActive;
    }
    if (isNonNullish(args.slug)) {
      publicPetitionLinkData.slug = args.slug;
    }

    if (isNonNullish(args.allowMultiplePetitions)) {
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

export const completePetition = mutationField("completePetition", {
  description: outdent`
    Marks a petition as COMPLETED.
    If the petition has a signature configured and does not require a review, starts the signing process.
    It the petition has a configured approval flow, calculates and creates every`,
  type: "Petition",
  args: {
    petitionId: nonNull(globalIdArg("Petition")),
    additionalSigners: list(nonNull("PublicPetitionSignerDataInput")),
    message: nullable("String"),
  },
  authorize: authenticateAnd(
    userHasAccessToPetitions("petitionId", "WRITE"),
    petitionsAreNotScheduledForDeletion("petitionId"),
    petitionDoesNotHaveStartedProcess("petitionId"),
    petitionIsNotAnonymized("petitionId"),
  ),
  validateArgs: validPetitionSignerData("additionalSigners"),
  resolve: async (_, args, ctx) => {
    try {
      const [composedPetition] = await ctx.petitions.getComposedPetitionFieldsAndVariables([
        args.petitionId,
      ]);
      const canComplete = petitionIsCompleted(composedPetition);
      if (!canComplete) {
        throw new Error("CANT_COMPLETE_PETITION_ERROR");
      }

      await ctx.orgCredits.ensurePetitionHasConsumedCredit(args.petitionId, `User:${ctx.user!.id}`);

      let [petition] = await ctx.petitions.updatePetition(
        args.petitionId,
        { status: "COMPLETED" },
        `User:${ctx.user!.id}`,
      );

      await ctx.petitions.updateRemindersForPetitions(args.petitionId, null);

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
            ctx.user!,
          );
          petition = updatedPetition ?? petition;
        }
      }

      await ctx.approvalRequests.deleteNotStartedPetitionApprovalRequestStepsAndApproversByPetitionId(
        args.petitionId,
      );

      await ctx.petitions.createEvent({
        type: "PETITION_COMPLETED",
        petition_id: args.petitionId,
        data: { user_id: ctx.user!.id },
      });

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
        userHasAccessToPetitions("ids" as never, "WRITE"),
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
    validFolderId("folderIds"),
    validPath("source"),
    validPath("destination"),
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
  validateArgs: validateAnd(validFolderId("folderId"), validateRegex("name", /^[^/]+$/)),
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

export const linkPetitionFieldChildren = mutationField("linkPetitionFieldChildren", {
  type: "PetitionField",
  args: {
    petitionId: nonNull(globalIdArg("Petition")),
    parentFieldId: nonNull(globalIdArg("PetitionField")),
    childrenFieldIds: nonNull(list(nonNull(globalIdArg("PetitionField")))),
    force: booleanArg(),
  },
  authorize: authenticateAnd(
    userHasAccessToPetitions("petitionId", "WRITE"),
    petitionsAreNotScheduledForDeletion("petitionId"),
    petitionsAreEditable("petitionId"),
    petitionDoesNotHaveStartedProcess("petitionId"),
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
        fieldIsNotReferencedInFieldOptions("petitionId", "childrenFieldIds"),
      ),
    ),
  ),
  validateArgs: notEmptyArray("childrenFieldIds"),
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
      ctx.petitions.loadPetitionFieldChildren.dataloader.clear({ petitionId, parentFieldId });

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
    userHasAccessToPetitions("petitionId", "WRITE"),
    petitionsAreNotScheduledForDeletion("petitionId"),
    petitionsAreEditable("petitionId"),
    petitionDoesNotHaveStartedProcess("petitionId"),
    petitionsAreNotPublicTemplates("petitionId"),
    petitionIsNotAnonymized("petitionId"),
    fieldsBelongsToPetition("petitionId", "parentFieldId"),
    fieldHasType("parentFieldId", "FIELD_GROUP"),
    ifNotEmptyArray(
      "childrenFieldIds",
      and(
        fieldsBelongsToPetition("petitionId", "childrenFieldIds"),
        fieldHasParent("childrenFieldIds", "parentFieldId"),
        fieldIsNotReferencedInLogicConditions("petitionId", "childrenFieldIds"),
        fieldIsNotReferencedInFieldOptions("petitionId", "childrenFieldIds"),
        not(fieldIsLinkedToProfileTypeField("childrenFieldIds")),
      ),
    ),
  ),
  validateArgs: notEmptyArray("childrenFieldIds"),
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
      ctx.petitions.loadPetitionFieldChildren.dataloader.clear({ petitionId, parentFieldId });

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
        } else if (error.message === "FIRST_CHILD_IS_REPLY_ONLY_FROM_PROFILE_ERROR") {
          throw new ApolloError(
            "First child of a field group cannot be optional",
            "FIRST_CHILD_IS_REPLY_ONLY_FROM_PROFILE_ERROR",
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
    userHasAccessToPetitions("petitionId", "WRITE"),
    petitionsAreNotScheduledForDeletion("petitionId"),
    petitionsAreEditable("petitionId"),
    petitionDoesNotHaveStartedProcess("petitionId"),
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
    userHasAccessToPetitions("petitionId", "WRITE"),
    petitionsAreNotScheduledForDeletion("petitionId"),
    petitionsAreEditable("petitionId"),
    petitionDoesNotHaveStartedProcess("petitionId"),
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
  validateArgs: inRange("position", 0),
  resolve: async (_, args, ctx) => {
    const profileTypeField = (await ctx.profiles.loadProfileTypeField(args.profileTypeFieldId))!;
    const petition = await ctx.petitions.loadPetition(args.petitionId);

    const mappedField = ctx.profileTypeFields.mapToPetitionField(
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
    ctx.petitions.loadPetitionFieldChildren.dataloader.clear({
      petitionId: args.petitionId,
      parentFieldId: args.parentFieldId,
    });
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
      contextUserHasPermission("PROFILES:CREATE_PROFILES"),
      userHasAccessToProfile("profileId"),
      profileHasStatus("profileId", ["OPEN"]),
      profileIsNotAnonymized("profileId"),
      profileHasSameProfileTypeAsField("profileId", "petitionFieldId"),
      userHasAccessToPetitions("petitionId"),
      petitionsAreNotScheduledForDeletion("petitionId"),
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

      const logic = evaluateFieldLogic(composedPetition);
      // only need visible fields of type FIELD_GROUP with a profile_type_id and its visible children
      const visibleRootFields = applyFieldVisibility(composedPetition, logic);
      const fieldGroup = visibleRootFields.find((f) => f.id === args.petitionFieldId);
      if (isNullish(fieldGroup)) {
        // trying to archive a FIELD_GROUP reply that is not visible with the current field visibility
        throw new ForbiddenError(
          "provided field is not visible due to current visibility conditions",
        );
      }

      // load profile and get its values and files
      const [profile, profileTypeFields, profileFieldValuesAndDrafts, profileFieldFiles] =
        await Promise.all([
          ctx.profiles.loadProfile(args.profileId),
          ctx.profiles.loadProfileTypeFieldsByProfileTypeId(fieldGroup.profile_type_id!),
          ctx.profiles.loadProfileFieldValuesAndDraftsByProfileId(args.profileId),
          ctx.profiles.loadProfileFieldFilesByProfileId(args.profileId),
        ]);

      assert(profile, "Profile not found");

      // get not only the field referenced in arguments, but also all the fields with the same groupName and profile_type_id
      const otherRelevantGroups =
        isNonNullish(fieldGroup.options.groupName) && fieldGroup.options.groupName !== ""
          ? visibleRootFields.filter(
              (f) =>
                f.id !== fieldGroup.id &&
                f.type === "FIELD_GROUP" &&
                f.profile_type_id === fieldGroup.profile_type_id &&
                f.options.groupName === fieldGroup.options.groupName &&
                f.replies.length === 1 &&
                f.multiple === false,
            )
          : [];

      const updateOnCloseConfig = (
        (fieldGroup.options
          .updateProfileOnClose as PetitionFieldOptions["FIELD_GROUP"]["updateProfileOnClose"]) ??
        []
      ).concat(otherRelevantGroups.flatMap((g) => g.options.updateProfileOnClose ?? []));

      type CollectedReplySource =
        | {
            type: "PETITION_METADATA";
            metadata: {
              name: string;
              type: "DATE";
            };
          }
        | {
            type: "VARIABLE";
            variable: {
              name: string;
              type: "ENUM" | "NUMBER";
            };
          }
        | {
            type: "FIELD";
            field: {
              id: number;
              type: PetitionFieldType;
            };
          };

      let petitionReplies: {
        profileTypeFieldId: number;
        source: CollectedReplySource & { replies: { id?: number; content: any }[] };
      }[] = [
        // get values from petition metadata
        ...updateOnCloseConfig
          .filter((s) => s.source.type === "PETITION_METADATA")
          .map((s) => {
            assert(s.source.type === "PETITION_METADATA");
            return {
              profileTypeFieldId: s.profileTypeFieldId,
              source: {
                type: "PETITION_METADATA" as const,
                metadata:
                  s.source.name === "CLOSED_AT"
                    ? { name: s.source.name, type: "DATE" as const }
                    : never("Invalid metadata name"),
                replies: composedPetition.closedAt
                  ? [{ content: { value: composedPetition.closedAt.toISOString().split("T")[0] } }]
                  : [],
              },
            };
          }),
        // get values from variables on the petition
        ...updateOnCloseConfig
          .filter((s) => s.source.type === "VARIABLE")
          .map((s) => {
            assert(s.source.type === "VARIABLE");
            const variableName = s.source.name;
            const variable = composedPetition.variables.find((v) => v.name === variableName);
            const variableValue = logic[0].finalVariables[variableName];
            assert(isNonNullish(variable), "Variable not found");
            const finalValue =
              variable.type === "NUMBER" ? variableValue : s.source.map?.[variableValue];
            assert(
              isNonNullish(finalValue),
              `Could not determine value for variable ${variableName}`,
            );

            if (finalValue === "-KEEP" || finalValue === "-DELETE") {
              // if the value is -KEEP or -DELETE, we need to ignore or overwrite the current value on the profile
              // this is like providing a conflict resolution for the variable
              args.conflictResolutions.push({
                action: finalValue === "-KEEP" ? "IGNORE" : "OVERWRITE",
                profileTypeFieldId: s.profileTypeFieldId,
              });
              return {
                profileTypeFieldId: s.profileTypeFieldId,
                source: {
                  type: "VARIABLE" as const,
                  variable: {
                    name: s.source.name,
                    type: variable.type,
                  },
                  replies: [],
                },
              };
            }

            return {
              profileTypeFieldId: s.profileTypeFieldId,
              source: {
                type: "VARIABLE" as const,
                variable: {
                  name: s.source.name,
                  type: variable.type,
                },
                replies: [{ content: { value: finalValue } }],
              },
            };
          }),
        // get values from other fields on the petition
        ...updateOnCloseConfig
          .filter((s) => s.source.type === "FIELD")
          .map((s) => {
            assert(s.source.type === "FIELD");
            const fieldId = s.source.fieldId;

            const field = [
              ...composedPetition.fields,
              ...composedPetition.fields.flatMap((f) => f.children ?? []),
            ].find((f) => f.id === fieldId);

            assert(isNonNullish(field), "Field not found");
            const map = s.source.map;
            return {
              profileTypeFieldId: s.profileTypeFieldId,
              source: {
                type: "FIELD" as const,
                field: {
                  id: field.id,
                  type: field.type,
                },
                replies: field.replies
                  .map((r) => {
                    const finalValue =
                      field.type === "SELECT" && isNullish(field.options.standardList)
                        ? (map?.[r.content.value] ??
                          field.options.values?.find((v: any) => v.value === r.content.value)
                            ?.label ??
                          r.content.value)
                        : r.content.value;

                    assert(
                      isNonNullish(finalValue),
                      `Could not determine value for field ${fieldId}`,
                    );

                    if (finalValue === "-KEEP" || finalValue === "-DELETE") {
                      // if the value is -KEEP or -DELETE, we need to ignore or overwrite the current value on the profile
                      // this is like providing a conflict resolution for the field
                      args.conflictResolutions.push({
                        action: finalValue === "-KEEP" ? "IGNORE" : "OVERWRITE",
                        profileTypeFieldId: s.profileTypeFieldId,
                      });
                      return null;
                    }
                    return {
                      id: r.id,
                      content: { value: finalValue },
                    };
                  })
                  .filter(isNonNullish),
              },
            };
          }),
        // get the replies from the children fields that are linked with a property on the profile
        ...[
          ...(fieldGroup.replies
            .find((r) => r.id === args.parentReplyId)!
            .children?.filter((c) => isNonNullish(c.field.profile_type_field_id)) ?? []),
          ...otherRelevantGroups.flatMap(
            (g) =>
              g.replies[0].children?.filter((c) => isNonNullish(c.field.profile_type_field_id)) ??
              [],
          ),
        ].map(({ field, replies }) => ({
          profileTypeFieldId: field.profile_type_field_id!,
          source: {
            type: "FIELD" as const,
            field: {
              id: field.id,
              type: field.type,
            },
            replies: replies.map(pick(["id", "content"])),
          },
        })),
      ];

      const effectivePermissions = await ctx.profiles.loadProfileTypeFieldUserEffectivePermission(
        petitionReplies.map((r) => ({
          profileTypeFieldId: r.profileTypeFieldId,
          userId: ctx.user!.id,
        })),
      );

      petitionReplies = pipe(
        zip(petitionReplies, effectivePermissions),
        filter(([, permission]) => isAtLeast(permission, "WRITE")), // don't write on fields without WRITE permission
        map(([{ profileTypeFieldId, source }]) => ({
          profileTypeFieldId,
          source: source as any,
        })),
      );

      // extract file_upload_ids from every reply and profile value. This way we can load it all at once for later usage
      const fileUploadIds = unique([
        ...petitionReplies
          .filter((r) => r.source.type === "FIELD" && r.source.field.type === "FILE_UPLOAD")
          .flatMap((r) => {
            assert(r.source.type === "FIELD");
            return r.source.replies
              .map((reply) => reply.content.file_upload_id as number)
              .filter(isNonNullish);
          }),
        ...profileFieldFiles.map((pff) => pff.file_upload_id).filter(isNonNullish),
      ]);

      const fileUploads = await ctx.files.loadFileUpload(fileUploadIds);

      // we need to iterate replies on petition and check if there are conflicts with current values on the profile
      // if any conflict exists, push it to this arrays and throw an ApolloError with the conflicted fields, so the user can select what to do on each case
      // conflicts can have distinct sources:
      // - FIELD: the conflict is related to a field on the petition (child of the main field group)
      // - VARIABLE: the conflict is related to a variable on the petition
      // - PETITION_METADATA: the conflict is related to a petition metadata
      const missingConflictResolutions: typeof petitionReplies = [];
      const missingExpirations: typeof petitionReplies = [];

      // these contain the contents of every profile type field that will be created or updated on the profile.
      // if content is null, it means the value will be removed from the profile
      // expiryDate must be defined (or null) if the field is expirable
      const updateProfileFieldValues: {
        profileId: number;
        profileTypeFieldId: number;
        type: ProfileTypeFieldType;
        content: any;
        expiryDate?: string | null;
        petitionFieldReplyId: number | null;
      }[] = [];

      const [fileReplies, simpleReplies] = partition(
        petitionReplies,
        (r) => r.source.type === "FIELD" && r.source.field.type === "FILE_UPLOAD",
      );

      // on simple replies, if there is more than 1 reply on the same profile_type_field_id (2 or more different groups being merged)
      // we just take the first reply and ignore the others, as text values on profile are always single-response
      for (const { profileTypeFieldId, source } of uniqueBy(
        simpleReplies,
        (r) => r.profileTypeFieldId,
      )) {
        const reply = source.replies.at(0); // get only 1st reply on non-file fields

        const fieldType =
          source.type === "FIELD"
            ? source.field.type
            : source.type === "PETITION_METADATA"
              ? source.metadata.type
              : source.type === "VARIABLE"
                ? source.variable.type === "NUMBER"
                  ? "NUMBER"
                  : "SELECT"
                : never();

        const profileTypeField = profileTypeFields.find((f) => f.id === profileTypeFieldId);

        if (!profileTypeField) {
          continue;
        }

        const pfvs = profileFieldValuesAndDrafts.filter(
          (v) => v.profile_type_field_id === profileTypeFieldId,
        );

        // always prioritize drafts
        const profileFieldValue = pfvs.find((v) => v.is_draft) || pfvs.find((v) => !v.is_draft);

        const resolution = args.conflictResolutions.find(
          (cr) => cr.profileTypeFieldId === profileTypeFieldId,
        );
        const expiration = args.expirations.find(
          (e) => e.profileTypeFieldId === profileTypeFieldId,
        );

        // if already exists a value on the profile, there could be a conflict with reply so we need to check
        if (isNonNullish(profileFieldValue)) {
          if (
            isNonNullish(reply) &&
            // if petition reply is a draft, or profile contains a draft, we don't need to check for conflicts
            (ctx.profilesHelper.isDraftContent(fieldType, reply.content) ||
              ctx.profilesHelper.isDraftContent(profileFieldValue.type, profileFieldValue.content))
          ) {
            updateProfileFieldValues.push({
              profileId: profile.id,
              ...ctx.petitionsHelper.mapPetitionFieldReplyToProfileFieldValue({
                ...reply,
                type: fieldType,
              }),
              profileTypeFieldId: profileTypeFieldId,
              expiryDate:
                reply && profileTypeField.options.useReplyAsExpiryDate
                  ? reply.content.value
                  : expiration?.expiryDate,
            });
          } else if (
            isNullish(reply) ||
            !ctx.petitionsHelper.contentsAreEqual({ ...reply, type: fieldType }, profileFieldValue)
          ) {
            // expiration is required if the field is expirable and the reply is defined (meaning profile value will be modified)
            if (
              isNonNullish(reply) &&
              profileTypeField.is_expirable &&
              !profileTypeField.options.useReplyAsExpiryDate &&
              isNullish(expiration) &&
              (isNullish(resolution) || resolution.action !== "IGNORE") // if resolution is IGNORE, value will not be updated so we don't want to update the expiryDate
            ) {
              missingExpirations.push({ profileTypeFieldId, source });
            }
            // resolution is required
            if (isNullish(resolution)) {
              missingConflictResolutions.push({ profileTypeFieldId, source });
            } else if (resolution.action === "OVERWRITE") {
              /**
               * action could be:
               * OVERWRITE: will remove the current profile field value and create a new one if the reply is defined. Will try to update field expiryDate if required and provided.
               * IGNORE/APPEND: will keep the current profile field value and ignore the reply
               */
              updateProfileFieldValues.push({
                profileId: profile.id,
                ...ctx.petitionsHelper.mapPetitionFieldReplyToProfileFieldValue(
                  reply ? { ...reply, type: fieldType } : { type: fieldType, content: null },
                ),
                profileTypeFieldId: profileTypeFieldId,
                expiryDate:
                  reply && profileTypeField.options.useReplyAsExpiryDate
                    ? reply.content.value
                    : expiration?.expiryDate,
              });
            }
          }
        } else if (isNonNullish(reply)) {
          // profile field value is not present in profile, there will be no conflicts
          // if the field is expirable, we require it to be present on expirations array
          if (
            profileTypeField.is_expirable &&
            !profileTypeField.options.useReplyAsExpiryDate &&
            isNullish(expiration)
          ) {
            // expiration is required
            missingExpirations.push({ profileTypeFieldId, source });
          }

          updateProfileFieldValues.push({
            profileId: profile.id,
            ...ctx.petitionsHelper.mapPetitionFieldReplyToProfileFieldValue({
              ...reply,
              type: fieldType,
            }),
            profileTypeFieldId: profileTypeFieldId,
            expiryDate:
              reply && profileTypeField.options.useReplyAsExpiryDate
                ? reply.content.value
                : expiration?.expiryDate,
          });
        }
      }

      // check value uniqueness on unique fields
      const possibleConflictingFields = updateProfileFieldValues
        .filter((v) => profileTypeFields.find((f) => f.id === v.profileTypeFieldId)?.is_unique)
        .map((v) => ({
          profileTypeFieldId: v.profileTypeFieldId,
          content: v.content,
        }));
      const conflicts = await ctx.profilesHelper.getProfileFieldValueUniqueConflicts(
        possibleConflictingFields,
        indexBy(profileTypeFields, (f) => f.id),
        profile.profile_type_id,
        ctx.user!.org_id,
      );
      if (conflicts.length > 0) {
        throw new ApolloError(
          "Duplicate profile field value",
          "PROFILE_FIELD_VALUE_UNIQUE_CONSTRAINT",
          {
            conflicts: conflicts.map((c) => ({
              profileTypeFieldId: toGlobalId("ProfileTypeField", c.profileTypeFieldId),
              profileTypeFieldName: c.profileTypeFieldName,
              profileId: toGlobalId("Profile", c.profileId),
              profileName: c.profileName,
              profileStatus: c.profileStatus,
            })),
          },
        );
      }

      const deleteProfileFieldFileIds: number[] = [];
      const createProfileFieldFiles: {
        profileTypeFieldId: number;
        fileUploadId: number;
        expiryDate?: string | null;
        petitionFieldReplyId?: number | null;
      }[] = [];

      // same process than before, with FILE_UPLOADS
      for (const { profileTypeFieldId, source } of uniqueBy(
        fileReplies,
        (r) => r.profileTypeFieldId,
      )) {
        assert(source.type === "FIELD" && source.field.type === "FILE_UPLOAD");
        const { replies } = source;
        const profileTypeField = profileTypeFields.find((f) => f.id === profileTypeFieldId);

        if (!profileTypeField) {
          continue;
        }

        const profileFieldFileValues = profileFieldFiles.filter(
          (v) => v.profile_type_field_id === profileTypeFieldId,
        );

        const resolution = args.conflictResolutions.find(
          (cr) => cr.profileTypeFieldId === profileTypeFieldId,
        );

        const expiration = args.expirations.find(
          (e) => e.profileTypeFieldId === profileTypeFieldId,
        );

        if (profileFieldFileValues.length > 0) {
          if (replies.length === 0) {
            // no replies on field, IGNORE or OVERWRITE?
            if (isNullish(resolution)) {
              // resolution is required
              missingConflictResolutions.push({ profileTypeFieldId, source });
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
              .filter((r) => isNullish(r.content.error) && isNonNullish(r.content.file_upload_id))
              .map((r) => ({
                replyId: r.id,
                fileUpload: fileUploads.find(
                  (fu) => fu?.id === (r.content.file_upload_id as number),
                ),
              }));

            const profileFieldFileUploads = profileFieldFileValues.map((pff) =>
              fileUploads.find((fu) => fu?.id === pff.file_upload_id),
            );

            // these are the files that are not present on the profile (compare by file_upload.path)
            // these will be attached to the existing files on the profile if resolution is APPEND or OVERWRITE
            const newFileUploads = replyFileUploads.filter(
              (r) => !profileFieldFileUploads.find((pff) => pff?.path === r?.fileUpload?.path),
            );
            // these are files that are present on the profile but not on the reply
            // these will be removed from the profile if resolution is OVERWRITE
            const currentProfileFieldFileUploads = profileFieldFileUploads.filter(
              (pff) => !replyFileUploads.find((r) => r?.fileUpload?.path === pff?.path),
            );

            // expiration is required if the field is expirable and the reply has files (meaning profile value will not be removed)
            if (
              (isNullish(resolution) || resolution.action !== "IGNORE") && // don't ask for expiryDate if ignoring this reply
              profileTypeField.is_expirable &&
              isNullish(expiration) &&
              (newFileUploads.length > 0 || currentProfileFieldFileUploads.length > 0) // if there is no difference between reply and profile value, no need to update expiryDate
            ) {
              missingExpirations.push({ profileTypeFieldId, source });
            }

            if (
              isNullish(resolution) &&
              (newFileUploads.length > 0 || currentProfileFieldFileUploads.length > 0)
            ) {
              // resolution is required only if there is any difference between files on reply and profile
              missingConflictResolutions.push({ profileTypeFieldId, source });
            } else if (resolution?.action === "APPEND" || resolution?.action === "OVERWRITE") {
              createProfileFieldFiles.push(
                ...newFileUploads
                  .filter((r) => isNonNullish(r.fileUpload))
                  .map((r) => ({
                    profileTypeFieldId: profileTypeFieldId,
                    fileUploadId: r.fileUpload!.id,
                    expiryDate: expiration?.expiryDate,
                    petitionFieldReplyId: r.replyId,
                  })),
              );
              if (resolution?.action === "OVERWRITE") {
                deleteProfileFieldFileIds.push(
                  ...currentProfileFieldFileUploads
                    .filter(isNonNullish)
                    .map((fu) => profileFieldFiles.find((pf) => pf.file_upload_id === fu?.id)!.id),
                );
              }
            }
          }
        } else if (replies.length > 0) {
          // no files on the profile. we can add the files on replies without checking for conflicts

          // if the field is expirable, we require it to be present on expirations array
          if (profileTypeField.is_expirable && isNullish(expiration)) {
            // expiration is required
            missingExpirations.push({ profileTypeFieldId, source });
          }

          createProfileFieldFiles.push(
            ...replies
              .filter((r) => isNullish(r.content.error) && isNonNullish(r.content.file_upload_id))
              .map((r) => ({
                profileTypeFieldId: profileTypeFieldId,
                fileUploadId: r.content.file_upload_id as number,
                expiryDate: expiration?.expiryDate,
                petitionFieldReplyId: r.id,
              })),
          );
        }
      }

      if (missingConflictResolutions.length > 0 || missingExpirations.length > 0) {
        function mapConflict(c: UnwrapArray<typeof petitionReplies>) {
          return {
            profileTypeFieldId: toGlobalId("ProfileTypeField", c.profileTypeFieldId),
            source: {
              ...(c.source.type === "FIELD"
                ? {
                    type: "FIELD" as const,
                    fieldId: toGlobalId("PetitionField", c.source.field.id),
                  }
                : c.source.type === "VARIABLE"
                  ? { type: "VARIABLE" as const, name: c.source.variable.name }
                  : c.source.type === "PETITION_METADATA"
                    ? { type: "PETITION_METADATA" as const, name: c.source.metadata.name }
                    : never()),
            },
          };
        }

        throw new ApolloError(
          "There was a conflict with existing values, please provide conflictResolution and/or expirations data",
          "CONFLICT_RESOLUTION_REQUIRED_ERROR",
          {
            conflictResolutions: missingConflictResolutions.map(mapConflict),
            expirations: missingExpirations.map(mapConflict),
          },
        );
      }

      const profileFileEvents: (
        | ProfileFieldFileAddedEvent<true>
        | ProfileFieldFileRemovedEvent<true>
        | ProfileFieldExpiryUpdatedEvent<true>
      )[] = [];

      if (deleteProfileFieldFileIds.length > 0) {
        const deletedProfileFiles = await ctx.profiles.deleteProfileFieldFiles(
          deleteProfileFieldFileIds,
          ctx.user!.id,
        );

        profileFileEvents.push(
          ...deletedProfileFiles.map(
            (f) =>
              ({
                type: "PROFILE_FIELD_FILE_REMOVED",
                profile_id: profile.id,
                org_id: ctx.user!.org_id,
                data: {
                  user_id: ctx.user!.id,
                  profile_type_field_id: f.profile_type_field_id,
                  profile_field_file_id: f.id,
                  alias:
                    profileTypeFields.find((ptf) => ptf.id === f.profile_type_field_id)!.alias ??
                    null,
                },
              }) satisfies ProfileFieldFileRemovedEvent<true>,
          ),
        );
      }

      if (createProfileFieldFiles.length > 0) {
        const byProfileTypeFieldId = groupBy(createProfileFieldFiles, (p) => p.profileTypeFieldId);
        for (const [profileTypeFieldId, values] of Object.entries(byProfileTypeFieldId)) {
          const clonedFileUploads = zip(
            values,
            await ctx.files.cloneFileUpload(values.map((f) => f.fileUploadId!)),
          );
          const profileTypeField = profileTypeFields.find(
            (ptf) => ptf.id === parseInt(profileTypeFieldId),
          );

          if (!profileTypeField) {
            continue;
          }

          const expiration = args.expirations.find(
            (e) => e.profileTypeFieldId === profileTypeField.id,
          );
          const profileFieldFiles = await ctx.profiles.createProfileFieldFiles(
            profile.id,
            profileTypeField.id,
            clonedFileUploads.map(([{ petitionFieldReplyId }, fileUpload]) => ({
              petitionFieldReplyId,
              fileUploadId: fileUpload.id,
            })),
            expiration?.expiryDate,
            ctx.user!.id,
            "PETITION_FIELD_REPLY",
          );

          profileFileEvents.push(
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
                    profile_id: profile.id,
                    type: "PROFILE_FIELD_EXPIRY_UPDATED",
                    data: {
                      user_id: ctx.user!.id,
                      profile_type_field_id: profileTypeField.id,
                      expiry_date: expiration?.expiryDate ?? null,
                      alias: profileTypeField?.alias ?? null,
                      org_integration_id: null,
                    },
                  } satisfies ProfileFieldExpiryUpdatedEvent<true>,
                ]
              : []),
          );
        }
      }

      await ctx.profiles.associateProfilesToPetition(
        [{ petition_id: args.petitionId, profile_id: args.profileId }],
        ctx.user!,
      );

      // these are the possible field relationships with petitionFieldId in any of the sides.
      // we need to look for replies with set associated_profile_id that belong to the field on the other side of the relationship
      const fieldRelationships =
        await ctx.petitions.getPetitionFieldGroupRelationshipsByPetitionFieldId(
          args.petitionId,
          args.petitionFieldId,
        );

      if (fieldRelationships.length > 0) {
        const relationshipTypes = await ctx.profiles.loadProfileRelationshipType(
          unique(fieldRelationships.map((r) => r.profile_relationship_type_id)),
        );

        // get fieldIds in other side of the relationship
        const otherFieldIds = unique(
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
              isNonNullish(r.associated_profile_id) &&
              r.associated_profile_id !== args.profileId &&
              r.id !== args.parentReplyId,
          );

        if (repliesWithAssociatedProfiles.length > 0) {
          await ctx.profiles.createProfileRelationship(
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
                      profile.id,
                      reply.associated_profile_id!,
                    ].sort();
                    return {
                      created_by_user_id: ctx.user!.id,
                      org_id: ctx.user!.org_id,
                      left_side_profile_id: leftSideId,
                      right_side_profile_id: rightSideId,
                      profile_relationship_type_id: relationship.profile_relationship_type_id,
                    };
                  }

                  if (relationship.direction === "LEFT_RIGHT") {
                    return {
                      created_by_user_id: ctx.user!.id,
                      org_id: ctx.user!.org_id,
                      left_side_profile_id:
                        relationship.left_side_petition_field_id === args.petitionFieldId
                          ? profile.id
                          : reply.associated_profile_id!,
                      right_side_profile_id:
                        relationship.left_side_petition_field_id === args.petitionFieldId
                          ? reply.associated_profile_id!
                          : profile.id,
                      profile_relationship_type_id: relationship.profile_relationship_type_id,
                    };
                  } else {
                    return {
                      created_by_user_id: ctx.user!.id,
                      org_id: ctx.user!.org_id,
                      left_side_profile_id:
                        relationship.left_side_petition_field_id === args.petitionFieldId
                          ? reply.associated_profile_id!
                          : profile.id,
                      right_side_profile_id:
                        relationship.left_side_petition_field_id === args.petitionFieldId
                          ? profile.id
                          : reply.associated_profile_id!,
                      profile_relationship_type_id: relationship.profile_relationship_type_id,
                    };
                  }
                }),
            ),
            "PETITION_FIELD_REPLY",
          );
        }
      }

      const [draftUpdates, valueUpdates] = partition(updateProfileFieldValues, (p) =>
        ctx.profilesHelper.isDraftContent(p.type, p.content),
      );

      const profileValueEvents = await ctx.profiles.updateProfileFieldValues(
        valueUpdates,
        ctx.user!.org_id,
        {
          userId: ctx.user!.id,
          source: "PETITION_FIELD_REPLY",
        },
      );

      await ctx.profiles.upsertDraftProfileFieldValues(
        draftUpdates,
        ctx.user!.id,
        "PETITION_FIELD_REPLY",
      );

      await ctx.profiles.createProfileUpdatedEvents(
        [...profileFileEvents, ...profileValueEvents],
        ctx.user!.org_id,
        { userId: ctx.user!.id, source: "PETITION_FIELD_REPLY" },
      );

      // clear cache so profile.localizable_name is correctly resolved after values update
      ctx.profiles.loadProfile.dataloader.clear(profile.id);

      return await ctx.petitions.updatePetitionFieldReply(
        args.parentReplyId,
        { associated_profile_id: profile.id },
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
      userHasAccessToPetitions("petitionId", "WRITE"),
      petitionsAreNotScheduledForDeletion("petitionId"),
      petitionsAreEditable("petitionId"),
      petitionDoesNotHaveStartedProcess("petitionId"),
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

export const createPetitionFromProfile = mutationField("createPetitionFromProfile", {
  type: "Petition",
  description:
    "Creates a petition from a profile and a base template, prefilling the field groups linked to profile types with the provided profile and all its current relationships",
  authorize: authenticateAnd(
    userHasFeatureFlag("PROFILES"),
    contextUserHasPermission("PETITIONS:CREATE_PETITIONS"),
    userHasAccessToPetitions("templateId"),
    petitionsAreNotScheduledForDeletion("templateId"),
    petitionsAreOfTypeTemplate("templateId"),
    petitionsAreNotPublicTemplates("templateId"),
    petitionIsNotAnonymized("templateId"),
    userHasAccessToProfile("profileId"),
    profileHasStatus("profileId", ["OPEN", "CLOSED"]),
    profileIsNotAnonymized("profileId"),
    ifArgDefined(
      "petitionFieldId",
      and(
        fieldsBelongsToPetition("templateId", "petitionFieldId" as never),
        fieldHasType("petitionFieldId" as never, ["FIELD_GROUP"]),
        profileHasSameProfileTypeAsField("profileId", "petitionFieldId" as never),
      ),
    ),
    userHasAccessToCreatePetitionFromProfilePrefillInput(
      "templateId",
      "prefill",
      "profileId",
      "petitionFieldId",
    ),
  ),
  args: {
    profileId: nonNull(
      globalIdArg("Profile", {
        description: "Main profile to obtain the information from",
      }),
    ),
    petitionFieldId: nullable(
      globalIdArg("PetitionField", {
        description:
          "If providing prefill, this will be the ID of the petition field that will be associated with the main profile",
      }),
    ),
    templateId: nonNull(
      globalIdArg("Petition", { description: "Template that will be used to create the petition" }),
    ),
    prefill: nonNull(
      list(
        nonNull(
          inputObjectType({
            name: "CreatePetitionFromProfilePrefillInput",
            description:
              "Fields to prefill into the petition. petitionFieldId must correspond to a FIELD_GROUP in the template, linked to the same profile type as the provided profileIds.",
            definition(t) {
              t.nonNull.globalId("petitionFieldId", {
                prefixName: "PetitionField",
                description: "ID of the FIELD_GROUP field to prefill into",
              });
              t.nonNull.list.nonNull.globalId("profileIds", {
                prefixName: "Profile",
                description:
                  "ID of the profile to prefill into the field. IDs must all belong to the same profile type as the FIELD_GROUP, and can be the main profile or any of its associated profiles",
              });
            },
          }),
        ),
      ),
    ),
    skipFormatErrors: nullable(
      booleanArg({ description: "Pass true to skip prefilling fields with incompatible format" }),
    ),
  },
  resolve: async (_, args, ctx) => {
    const petition = await ctx.petitions.createPetitionFromId(
      args.templateId,
      { isTemplate: false },
      ctx.user!,
    );

    await ctx.profiles.associateProfilesToPetition(
      uniqueBy(
        [
          {
            profile_id: args.profileId,
            petition_id: petition.id,
          },
          ...args.prefill.flatMap((p) =>
            p.profileIds.map((profileId) => ({
              profile_id: profileId,
              petition_id: petition.id,
            })),
          ),
        ],
        (p) => p.profile_id,
      ),
      ctx.user!,
    );

    if (args.prefill.length === 0) {
      // nothing to prefill, early return
      return petition;
    }

    // as this prefill array comes from template fields, we need to map the template field Ids to the new petition field Ids
    const petitionFieldGroups = (await ctx.petitions.loadFieldsForPetition(petition.id)).filter(
      (f) => f!.type === "FIELD_GROUP" && isNonNullish(f.profile_type_id),
    );
    const prefill = args.prefill.flatMap((input) => {
      const mainGroup = petitionFieldGroups.find(
        (pf) => pf.from_petition_field_id === input.petitionFieldId,
      )!;
      const allRelevantGroups = [
        mainGroup,
        ...petitionFieldGroups.filter(
          (pf) =>
            pf.id !== mainGroup.id &&
            isNonNullish(mainGroup.options.groupName) &&
            mainGroup.options.groupName !== "" &&
            pf.profile_type_id === mainGroup.profile_type_id &&
            pf.options.groupName === mainGroup.options.groupName &&
            pf.multiple === false,
        ),
      ];
      return allRelevantGroups.map((g) => ({
        ...input,
        petitionFieldId: g.id,
      }));
    });

    const { replies, propertiesWithInvalidFormat } =
      await ctx.petitionsHelper.buildFieldGroupRepliesFromProfiles(
        petition.id,
        prefill,
        ctx.user!.id,
      );

    if (propertiesWithInvalidFormat.length > 0 && !args.skipFormatErrors) {
      throw new ApolloError(
        "Some of the fields cannot be imported due to an invalid format",
        "INVALID_FORMAT_ERROR",
        {
          profileTypeFieldIds: propertiesWithInvalidFormat.map((id) =>
            toGlobalId("ProfileTypeField", id),
          ),
        },
      );
    }

    if (replies.length > 0) {
      await ctx.orgCredits.ensurePetitionHasConsumedCredit(petition.id, `User:${ctx.user!.id}`);
      await ctx.petitionsHelper.createPetitionFieldRepliesFromPrefillData(
        petition.id,
        replies,
        ctx.user!,
      );
    }

    return petition;
  },
});

export const prefillPetitionFromProfiles = mutationField("prefillPetitionFromProfiles", {
  type: "Petition",
  description: "Prefills petition field groups with information from provided profiles",
  authorize: authenticateAnd(
    userHasFeatureFlag("PROFILES"),
    userHasAccessToPetitions("petitionId"),
    petitionsAreNotScheduledForDeletion("petitionId"),
    petitionsAreOfTypePetition("petitionId"),
    petitionIsNotAnonymized("petitionId"),
    userHasAccessToCreatePetitionFromProfilePrefillInput("petitionId", "prefill"),
    ifArgDefined(
      "parentReplyId",
      and(
        repliesBelongsToPetition("petitionId", "parentReplyId" as never),
        replyIsForFieldOfType("parentReplyId" as never, "FIELD_GROUP"),
      ),
    ),
  ),
  args: {
    petitionId: nonNull(globalIdArg("Petition")),
    prefill: nonNull(list(nonNull("CreatePetitionFromProfilePrefillInput"))),
    parentReplyId: nullable(
      globalIdArg("PetitionFieldReply", {
        description:
          "Reply ID to insert the first profile into. If not provided, new parent replies will be created for each profile",
      }),
    ),
    force: booleanArg({
      description:
        "Pass force=true to associate the profile to an empty field reply even if there is nothing to import from the profile",
    }),
    skipFormatErrors: nullable(
      booleanArg({ description: "Pass true to skip prefilling fields with incompatible format" }),
    ),
  },
  validateArgs: notEmptyArray("prefill"),
  resolve: async (_, args, ctx) => {
    const { replies, propertiesWithInvalidFormat } =
      await ctx.petitionsHelper.buildFieldGroupRepliesFromProfiles(
        args.petitionId,
        args.prefill.map((p, index) => ({
          ...p,
          parentReplyId: index === 0 ? (args.parentReplyId ?? null) : null,
        })),
        ctx.user!.id,
      );

    const emptyProfileIds = replies
      .filter((d) => d.childReplies.length === 0)
      .map((d) => d.associatedProfileId);

    if (emptyProfileIds.length > 0 && !args.force) {
      throw new ApolloError(
        "Some of the provided profiles are empty. Pass force=true to associate the profiles to empty field replies",
        "NOTHING_TO_IMPORT_ERROR",
        { profileIds: emptyProfileIds.map((id) => toGlobalId("Profile", id)) },
      );
    }

    if (propertiesWithInvalidFormat.length > 0 && !args.skipFormatErrors) {
      throw new ApolloError(
        "Some of the fields cannot be imported due to an invalid format",
        "INVALID_FORMAT_ERROR",
        {
          profileTypeFieldIds: propertiesWithInvalidFormat.map((id) =>
            toGlobalId("ProfileTypeField", id),
          ),
        },
      );
    }

    if (replies.length > 0) {
      await ctx.orgCredits.ensurePetitionHasConsumedCredit(args.petitionId, `User:${ctx.user!.id}`);

      // insert data in DB only after the two error checks have passed (NOTHING_TO_IMPORT_ERROR and PETITION_SEND_LIMIT_REACHED).
      // this will ensure nothing will be modified in DB if an error is thrown
      await ctx.petitionsHelper.createPetitionFieldRepliesFromPrefillData(
        args.petitionId,
        replies,
        ctx.user!,
      );
    }

    const profileIds = unique(args.prefill.flatMap((p) => p.profileIds));

    await ctx.profiles.associateProfilesToPetition(
      profileIds.map((profileId) => ({
        profile_id: profileId,
        petition_id: args.petitionId,
      })),
      ctx.user!,
    );

    return (await ctx.petitions.loadPetition(args.petitionId))!;
  },
});

export const createFieldGroupRepliesFromProfiles = mutationField(
  "createFieldGroupRepliesFromProfiles",
  {
    description: "Creates replies on a FIELD_GROUP field with the provided profiles",
    type: "PetitionField",
    authorize: authenticateAnd(
      userHasFeatureFlag("PROFILES"),
      petitionIsNotAnonymized("petitionId"),
      petitionsAreOfTypePetition("petitionId"),
      userHasAccessToPetitions("petitionId"),
      petitionsAreNotScheduledForDeletion("petitionId"),
      fieldsBelongsToPetition("petitionId", "petitionFieldId"),
      fieldHasType("petitionFieldId", ["FIELD_GROUP"]),
      fieldIsLinkedToProfileType("petitionFieldId"),
      ifArgDefined(
        "parentReplyId",
        repliesBelongsToField("petitionFieldId", "parentReplyId" as never),
      ),
      userHasAccessToProfile("profileIds"),
      profileHasStatus("profileIds", ["OPEN", "CLOSED"]),
      profileIsNotAnonymized("profileIds"),
      profileHasSameProfileTypeAsField("profileIds", "petitionFieldId"),
    ),
    args: {
      petitionId: nonNull(globalIdArg("Petition")),
      petitionFieldId: nonNull(
        globalIdArg("PetitionField", { description: "ID of the FIELD_GROUP" }),
      ),
      parentReplyId: nullable(
        globalIdArg("PetitionFieldReply", {
          description:
            "Reply ID to insert the first profile into. If not provided, new parent replies will be created for each profile",
        }),
      ),
      profileIds: nonNull(list(nonNull(globalIdArg("Profile")))),
      force: booleanArg({
        description:
          "Pass force=true to associate the profile to an empty field reply even if there is nothing to import from the profile",
      }),
      skipFormatErrors: booleanArg({
        description: "Pass true to skip prefilling fields with incompatible format",
      }),
    },
    validateArgs: validateAnd(notEmptyArray("profileIds"), uniqueValues("profileIds")),
    resolve: async (_, args, ctx) => {
      const { replies, propertiesWithInvalidFormat } =
        await ctx.petitionsHelper.buildFieldGroupRepliesFromProfiles(
          args.petitionId,
          [
            {
              petitionFieldId: args.petitionFieldId,
              parentReplyId: args.parentReplyId ?? null,
              profileIds: args.profileIds,
            },
          ],
          ctx.user!.id,
        );

      const emptyProfileIds = replies
        .filter((d) => d.childReplies.length === 0)
        .map((d) => d.associatedProfileId);

      if (emptyProfileIds.length > 0 && !args.force) {
        throw new ApolloError(
          "Some of the provided profiles are empty. Pass force=true to associate the profiles to empty field replies",
          "NOTHING_TO_IMPORT_ERROR",
          { profileIds: emptyProfileIds.map((id) => toGlobalId("Profile", id)) },
        );
      }

      if (propertiesWithInvalidFormat.length > 0 && !args.skipFormatErrors) {
        throw new ApolloError(
          "Some of the fields cannot be imported due to an invalid format",
          "INVALID_FORMAT_ERROR",
          {
            profileTypeFieldIds: propertiesWithInvalidFormat.map((id) =>
              toGlobalId("ProfileTypeField", id),
            ),
          },
        );
      }

      if (replies.length > 0) {
        await ctx.orgCredits.ensurePetitionHasConsumedCredit(
          args.petitionId,
          `User:${ctx.user!.id}`,
        );
        // insert data in DB only after the two error checks have passed (NOTHING_TO_IMPORT_ERROR and PETITION_SEND_LIMIT_REACHED).
        // this will ensure nothing will be modified in DB if an error is thrown
        await ctx.petitionsHelper.createPetitionFieldRepliesFromPrefillData(
          args.petitionId,
          replies,
          ctx.user!,
        );
      }

      await ctx.profiles.associateProfilesToPetition(
        args.profileIds.map((profileId) => ({
          profile_id: profileId,
          petition_id: args.petitionId,
        })),
        ctx.user!,
      );

      return (await ctx.petitions.loadField(args.petitionFieldId))!;
    },
  },
);

export const enableAutomaticNumberingOnPetitionFields = mutationField(
  "enableAutomaticNumberingOnPetitionFields",
  {
    description: "sets automatic numbering on all petition HEADINGs",
    type: "PetitionBase",
    authorize: authenticateAnd(
      userHasAccessToPetitions("petitionId", "WRITE"),
      petitionsAreNotScheduledForDeletion("petitionId"),
      petitionIsNotAnonymized("petitionId"),
      petitionsAreEditable("petitionId"),
      petitionDoesNotHaveStartedProcess("petitionId"),
      petitionsAreNotPublicTemplates("petitionId"),
    ),
    args: {
      petitionId: nonNull(globalIdArg("Petition")),
    },
    resolve: async (_, { petitionId }, ctx) => {
      await ctx.petitions.setAutomaticNumberingOnPetitionFields(
        petitionId,
        true,
        `User:${ctx.user!.id}`,
      );

      return (await ctx.petitions.loadPetition(petitionId))!;
    },
  },
);

export const recoverPetitionsFromDeletion = mutationField("recoverPetitionsFromDeletion", {
  description: "Recover a list of petitions from the recycle bin",
  type: "Success",
  authorize: authenticateAnd(ifArgDefined("ids", userHasAccessToPetitions("ids" as never))),
  args: {
    ids: list(nonNull(globalIdArg("Petition"))),
    folders: "FoldersInput",
  },
  validateArgs: (_, args, ctx, info) => {
    if ((args.ids?.length ?? 0) + (args.folders?.folderIds?.length ?? 0) === 0) {
      throw new ArgValidationError(
        info,
        "ids or folders",
        `Expected ids or folders.folderIds to be defined and not empty`,
      );
    }
  },
  resolve: async (_, { ids, folders }, ctx) => {
    let petitionIds = ids ?? [];
    if (isNonNullish(folders)) {
      const folderIds = fromGlobalIds(folders.folderIds, "PetitionFolder", true).ids;
      const folderPetitions = await ctx.petitions.getUserPetitionsInsideFolders(
        folderIds,
        folders.type === "TEMPLATE",
        ctx.user!,
      );
      petitionIds.push(...folderPetitions.map((p) => p.id));
    }

    petitionIds = unique(petitionIds);
    if (petitionIds.length === 0) {
      // nothing to recover
      return SUCCESS;
    }

    const bypassUser = await ctx.petitions.loadUserBypassPetitionPermission(ctx.user!.id);
    const userPermissions = await ctx.petitions.loadUserPermissionsByPetitionId(petitionIds);

    if (
      !bypassUser &&
      !userPermissions.every((p) => p.some((u) => u.type === "OWNER" && u.user_id === ctx.user!.id))
    ) {
      throw new ForbiddenError("You don't have permission to recover these petitions");
    }

    const recovered = await ctx.petitions.updatePetition(
      petitionIds,
      { deletion_scheduled_at: null },
      `User:${ctx.user!.id}`,
    );

    await ctx.petitions.createEvent(
      recovered.map((p) => ({
        type: "PETITION_RECOVERED_FROM_DELETION",
        data: { user_id: ctx.user!.id },
        petition_id: p.id,
      })),
    );

    return SUCCESS;
  },
});
