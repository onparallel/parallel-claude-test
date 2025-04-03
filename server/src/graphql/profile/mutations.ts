import { PresignedPost } from "@aws-sdk/s3-presigned-post";
import {
  arg,
  booleanArg,
  enumType,
  idArg,
  inputObjectType,
  list,
  mutationField,
  nonNull,
  nullable,
  stringArg,
} from "nexus";
import pMap from "p-map";
import { DatabaseError } from "pg";
import {
  differenceWith,
  groupBy,
  indexBy,
  isNonNullish,
  isNullish,
  pipe,
  unique,
  uniqueBy,
  zip,
} from "remeda";
import { assert } from "ts-essentials";
import {
  CreateProfileType,
  CreateProfileTypeField,
  FileUpload,
  Profile,
  ProfileFieldFile,
  ProfileTypeField,
  ProfileTypeProcess,
} from "../../db/__types";
import {
  ProfileFieldExpiryUpdatedEvent,
  ProfileFieldFileAddedEvent,
  ProfileRelationshipRemovedEvent,
} from "../../db/events/ProfileEvent";
import {
  ProfileTypeFieldOptions,
  defaultProfileTypeFieldOptions,
  mapProfileTypeFieldOptions,
  profileTypeFieldSelectValues,
  validateProfileTypeFieldOptions,
} from "../../db/helpers/profileTypeFieldOptions";
import { ProfileRepository } from "../../db/repositories/ProfileRepository";
import { ProfileExternalSourceRequestError } from "../../integrations/profile-external-source/ProfileExternalSourceIntegration";
import { toBytes } from "../../util/fileSize";
import { fromGlobalId, toGlobalId } from "../../util/globalId";
import { isAtLeast } from "../../util/profileTypeFieldPermission";
import { parseTextWithPlaceholders } from "../../util/slate/placeholders";
import { random } from "../../util/token";
import { RESULT } from "../helpers/Result";
import { SUCCESS } from "../helpers/Success";
import { and, authenticateAnd, ifArgDefined, not } from "../helpers/authorize";
import { buildProfileUpdatedEventsData } from "../helpers/buildProfileUpdatedEventsData";
import { ApolloError, ArgValidationError, ForbiddenError } from "../helpers/errors";
import { globalIdArg } from "../helpers/globalIdPlugin";
import { dateArg } from "../helpers/scalars/DateTime";
import { validateAnd, validateOr } from "../helpers/validateArgs";
import { maxLength } from "../helpers/validators/maxLength";
import { notEmptyArray } from "../helpers/validators/notEmptyArray";
import { notEmptyObject } from "../helpers/validators/notEmptyObject";
import { uniqueValues } from "../helpers/validators/uniqueValues";
import { validFileUploadInput } from "../helpers/validators/validFileUploadInput";
import { validIsNotUndefined } from "../helpers/validators/validIsDefined";
import { validLocalizableUserText } from "../helpers/validators/validLocalizableUserText";
import { validateRegex } from "../helpers/validators/validateRegex";
import { userHasAccessToIntegrations } from "../integrations/authorizers";
import {
  petitionIsNotAnonymized,
  petitionsAreNotPublicTemplates,
  petitionsAreOfTypeTemplate,
  repliesBelongsToPetition,
  replyIsForFieldOfType,
  userHasAccessToPetitions,
  userHasFeatureFlag,
} from "../petition/authorizers";
import { userHasAccessToUserAndUserGroups } from "../petition/mutations/authorizers";
import { contextUserHasPermission } from "../users/authorizers";
import {
  contextUserCanSubscribeUsersToProfile,
  externalSourceEntityMatchesProfileTypeStandardType,
  fileUploadCanBeAttachedToProfileTypeField,
  profileFieldFileHasProfileTypeFieldId,
  profileHasProfileTypeFieldId,
  profileHasStatus,
  profileIsAssociatedToPetition,
  profileIsNotAnonymized,
  profileMatchesProfileType,
  profileTypeFieldBelongsToProfileType,
  profileTypeFieldIsNotStandard,
  profileTypeFieldIsNotUsedInMonitoringRules,
  profileTypeFieldIsOfType,
  profileTypeIsArchived,
  profileTypeIsNotStandard,
  profileTypeIsStandard,
  profileTypeProcessBelongsToProfileType,
  profilesCanBeAssociated,
  relationshipBelongsToProfile,
  userCanOverwriteProfileFields,
  userHasAccessToEditProfileTypeProcessInput,
  userHasAccessToExternalSourceEntity,
  userHasAccessToProfile,
  userHasAccessToProfileRelationshipsInput,
  userHasAccessToProfileType,
  userHasAccessToProfileTypeProcess,
  userHasPermissionOnProfileTypeField,
} from "./authorizers";
import {
  validProfileNamePattern,
  validProfileTypeFieldOptions,
  validProfileTypeFieldSubstitution,
} from "./validators";

export const createProfileType = mutationField("createProfileType", {
  type: "ProfileType",
  authorize: authenticateAnd(
    userHasFeatureFlag("PROFILES"),
    userHasFeatureFlag("CREATE_PROFILE_TYPE"),
    contextUserHasPermission("PROFILE_TYPES:CRUD_PROFILE_TYPES"),
  ),
  args: {
    name: nonNull(arg({ type: "LocalizableUserText" })),
    pluralName: nonNull(arg({ type: "LocalizableUserText" })),
  },
  validateArgs: validateAnd(
    validLocalizableUserText("name", { maxLength: 200 }),
    validLocalizableUserText("pluralName", { maxLength: 200 }),
  ),
  resolve: async (_, args, ctx) => {
    return await ctx.profilesSetup.createDefaultProfileType(
      ctx.user!.org_id,
      args.name,
      args.pluralName,
      `User:${ctx.user!.id}`,
    );
  },
});

export const updateProfileType = mutationField("updateProfileType", {
  type: nonNull("ProfileType"),
  authorize: authenticateAnd(
    userHasFeatureFlag("PROFILES"),
    userHasAccessToProfileType("profileTypeId"),
    contextUserHasPermission("PROFILE_TYPES:CRUD_PROFILE_TYPES"),
  ),
  args: {
    profileTypeId: nonNull(globalIdArg("ProfileType")),
    name: arg({ type: "LocalizableUserText" }),
    pluralName: arg({ type: "LocalizableUserText" }),
    profileNamePattern: stringArg(),
    icon: "ProfileTypeIcon",
  },
  validateArgs: validateAnd(
    validLocalizableUserText("name", { maxLength: 200 }),
    validLocalizableUserText("pluralName", { maxLength: 200 }),
    validProfileNamePattern("profileTypeId", "profileNamePattern"),
  ),
  resolve: async (_, args, ctx) => {
    const updateData: Partial<CreateProfileType> = {};

    if (isNonNullish(args.name)) {
      updateData.name = args.name;
    }
    if (isNonNullish(args.profileNamePattern)) {
      updateData.profile_name_pattern = parseTextWithPlaceholders(args.profileNamePattern).map(
        (p) => (p.type === "placeholder" ? fromGlobalId(p.value, "ProfileTypeField").id : p.text),
      );
      // clear cache for correct resolve of ProfileTypeField.isUsedInProfileName field
      ctx.profiles.loadProfileType.dataloader.clear(args.profileTypeId);
    }

    if (isNonNullish(args.icon)) {
      updateData.icon = args.icon;
    }

    if (isNonNullish(args.pluralName)) {
      updateData.name_plural = args.pluralName;
    }

    const profileType = await ctx.profiles.updateProfileType(
      args.profileTypeId,
      updateData,
      `User:${ctx.user!.id}`,
    );

    if (isNonNullish(updateData.profile_name_pattern)) {
      await ctx.tasks.createTask(
        {
          name: "PROFILE_NAME_PATTERN_UPDATED",
          input: {
            profile_type_id: args.profileTypeId,
          },
          user_id: ctx.user!.id,
        },
        `User:${ctx.user!.id}`,
      );
    }

    return profileType;
  },
});

export const cloneProfileType = mutationField("cloneProfileType", {
  type: nonNull("ProfileType"),
  authorize: authenticateAnd(
    userHasFeatureFlag("PROFILES"),
    userHasAccessToProfileType("profileTypeId"),
    contextUserHasPermission("PROFILE_TYPES:CRUD_PROFILE_TYPES"),
    not(profileTypeIsArchived("profileTypeId")),
  ),
  args: {
    profileTypeId: nonNull(globalIdArg("ProfileType")),
    name: arg({ type: "LocalizableUserText" }),
    pluralName: arg({ type: "LocalizableUserText" }),
  },
  validateArgs: validateAnd(
    validLocalizableUserText("name", { maxLength: 200 }),
    validLocalizableUserText("pluralName", { maxLength: 200 }),
  ),
  resolve: async (_, { profileTypeId, name, pluralName }, ctx) => {
    const createData: Partial<CreateProfileType> = {};

    if (isNonNullish(name)) {
      createData.name = name;
    }

    if (isNonNullish(pluralName)) {
      createData.name_plural = pluralName;
    }

    const cloned = await ctx.profiles.cloneProfileType(
      profileTypeId,
      createData,
      `User:${ctx.user!.id}`,
    );

    await ctx.views.createProfileListViewsByOrgId(ctx.user!.org_id, cloned, `User:${ctx.user!.id}`);

    return cloned;
  },
});

export const deleteProfileType = mutationField("deleteProfileType", {
  type: "Success",
  authorize: authenticateAnd(
    userHasFeatureFlag("PROFILES"),
    userHasAccessToProfileType("profileTypeIds"),
    profileTypeIsArchived("profileTypeIds"),
    contextUserHasPermission("PROFILE_TYPES:CRUD_PROFILE_TYPES"),
    profileTypeIsNotStandard("profileTypeIds"),
  ),
  args: {
    profileTypeIds: nonNull(list(nonNull(globalIdArg("ProfileType")))),
  },
  resolve: async (_, { profileTypeIds }, ctx) => {
    await ctx.profiles.withTransaction(async (t) => {
      await ctx.profiles.deletePinnedProfileTypes(profileTypeIds, t);
      await ctx.profiles.deleteProfilesByProfileTypeId(profileTypeIds, `User:${ctx.user!.id}`, t);
      await ctx.profiles.deleteProfileTypeFieldsByProfileTypeId(
        profileTypeIds,
        `User:${ctx.user!.id}`,
        t,
      );
      await ctx.views.deleteProfileListViewsByProfileTypeId(
        profileTypeIds,
        `User:${ctx.user!.id}`,
        t,
      );
      await ctx.profiles.deleteProfileTypes(profileTypeIds, `User:${ctx.user!.id}`, t);
    });
    return SUCCESS;
  },
});

export const archiveProfileType = mutationField("archiveProfileType", {
  type: list("ProfileType"),
  authorize: authenticateAnd(
    userHasFeatureFlag("PROFILES"),
    userHasAccessToProfileType("profileTypeIds"),
    contextUserHasPermission("PROFILE_TYPES:CRUD_PROFILE_TYPES"),
    profileTypeIsNotStandard("profileTypeIds"),
  ),
  args: {
    profileTypeIds: nonNull(list(nonNull(globalIdArg("ProfileType")))),
  },
  resolve: async (_, { profileTypeIds }, ctx) => {
    return await ctx.profiles.archiveProfileTypes(profileTypeIds, ctx.user!.id);
  },
});

export const unarchiveProfileType = mutationField("unarchiveProfileType", {
  type: list("ProfileType"),
  authorize: authenticateAnd(
    userHasFeatureFlag("PROFILES"),
    userHasAccessToProfileType("profileTypeIds"),
    contextUserHasPermission("PROFILE_TYPES:CRUD_PROFILE_TYPES"),
    profileTypeIsNotStandard("profileTypeIds"),
  ),
  args: {
    profileTypeIds: nonNull(list(nonNull(globalIdArg("ProfileType")))),
  },
  resolve: async (_, { profileTypeIds }, ctx) => {
    return await ctx.profiles.unarchiveProfileTypes(profileTypeIds);
  },
});

export const createProfileTypeField = mutationField("createProfileTypeField", {
  type: "ProfileTypeField",
  authorize: authenticateAnd(
    userHasFeatureFlag("PROFILES"),
    userHasAccessToProfileType("profileTypeId"),
    contextUserHasPermission("PROFILE_TYPES:CRUD_PROFILE_TYPES"),
  ),
  validateArgs: validateAnd(
    notEmptyObject("data"),
    validLocalizableUserText("data.name", { maxLength: 200 }),
    maxLength("data.alias", 100),
    validateRegex("data.alias", /^(?!p_)[A-Za-z0-9_]+$/),
    validProfileTypeFieldOptions("profileTypeId", "data"),
  ),
  args: {
    profileTypeId: nonNull(globalIdArg("ProfileType")),
    data: nonNull(
      inputObjectType({
        name: "CreateProfileTypeFieldInput",
        definition(t) {
          t.nonNull.field("name", { type: "LocalizableUserText" });
          t.nonNull.field("type", {
            type: "ProfileTypeFieldType",
          });
          t.nullable.jsonObject("options");
          t.nullable.string("alias");
          t.nullable.boolean("isExpirable");
          t.nullable.duration("expiryAlertAheadTime");
        },
      }),
    ),
  },
  resolve: async (_, args, ctx) => {
    try {
      const options = await mapProfileTypeFieldOptions(
        args.data.type,
        args.data.options ?? defaultProfileTypeFieldOptions(args.data.type),
        (type, id) => fromGlobalId(id, type).id,
      );

      // mapper fills SELECT and CHECKBOX field values when passing a standardList, but we don't want to store every value in DB
      if (isNonNullish(options.standardList)) {
        options.values = [];
      }

      const [profileTypeField] = await ctx.profiles.createProfileTypeField(
        args.profileTypeId,
        {
          name: args.data.name,
          type: args.data.type,
          alias: args.data.alias || null,
          is_expirable: args.data.isExpirable ?? false,
          expiry_alert_ahead_time: args.data.isExpirable ? args.data.expiryAlertAheadTime : null,
          options,
        },
        `User:${ctx.user!.id}`,
      );
      return profileTypeField;
    } catch (e) {
      if (
        e instanceof DatabaseError &&
        e.constraint === "profile_type_field__profile_type_id__alias__unique"
      ) {
        throw new ApolloError(
          "The alias for this field already exists in this profile type",
          "ALIAS_ALREADY_EXISTS",
        );
      } else {
        throw e;
      }
    }
  },
});

export const updateProfileTypeField = mutationField("updateProfileTypeField", {
  type: "ProfileTypeField",
  authorize: authenticateAnd(
    userHasFeatureFlag("PROFILES"),
    contextUserHasPermission("PROFILE_TYPES:CRUD_PROFILE_TYPES"),
    userHasAccessToProfileType("profileTypeId"),
    profileTypeFieldBelongsToProfileType("profileTypeFieldId", "profileTypeId"),
    profileTypeFieldIsNotUsedInMonitoringRules("profileTypeId", "profileTypeFieldId"),
    ifArgDefined(
      (args) => args.data.name || args.data.alias,
      profileTypeFieldIsNotStandard("profileTypeFieldId"),
    ),
  ),
  args: {
    profileTypeId: nonNull(globalIdArg("ProfileType")),
    profileTypeFieldId: nonNull(globalIdArg("ProfileTypeField")),
    data: nonNull(
      inputObjectType({
        name: "UpdateProfileTypeFieldInput",
        definition(t) {
          t.nullable.field("name", { type: "LocalizableUserText" });
          t.nullable.string("alias");
          t.nullable.boolean("isExpirable");
          t.nullable.duration("expiryAlertAheadTime");
          t.nullable.jsonObject("options");
          t.nullable.list.nonNull.field("substitutions", {
            type: inputObjectType({
              name: "UpdateProfileTypeFieldSelectOptionsSubstitution",
              definition(t) {
                t.nonNull.string("old");
                t.nullable.string("new");
              },
            }),
          });
        },
      }).asArg(),
    ),
    force: nullable(
      booleanArg({
        description:
          "Pass force=true to remove expirations from values and files when setting isExpirable to false",
      }),
    ),
  },
  validateArgs: validateAnd(
    notEmptyObject("data"),
    maxLength("data.name.en", 500),
    maxLength("data.name.es", 500),
    maxLength("data.alias", 100),
    validateRegex("data.alias", /^(?!p_)[A-Za-z0-9_]+$/),
    validProfileTypeFieldSubstitution("data"),
  ),
  resolve: async (_, args, ctx, info) => {
    const updateData: Partial<CreateProfileTypeField> = {};
    const profileTypeField = (await ctx.profiles.loadProfileTypeField(args.profileTypeFieldId))!;
    if (isNonNullish(args.data.name)) {
      updateData.name = { ...profileTypeField.name, ...args.data.name };
    }

    if (args.data.alias !== undefined) {
      updateData.alias = args.data.alias || null; // empty string should nullify the alias
    }
    if (isNonNullish(args.data.isExpirable)) {
      updateData.is_expirable = args.data.isExpirable;
      updateData.expiry_alert_ahead_time = args.data.isExpirable
        ? args.data.expiryAlertAheadTime
        : null;
    }

    if (isNonNullish(args.data.options)) {
      if (profileTypeField.type === "SHORT_TEXT" && args.data.options.format !== undefined) {
        throw new ArgValidationError(
          info,
          "data.options.format",
          "Cannot change the format of a SHORT_TEXT field.",
        );
      }

      const options = await mapProfileTypeFieldOptions(
        profileTypeField.type,
        { ...profileTypeField.options, ...args.data.options },
        (type, id) => fromGlobalId(id, type).id,
      );

      try {
        await validateProfileTypeFieldOptions(profileTypeField.type, options, {
          profileTypeId: args.profileTypeId,
          loadProfileTypeField: ctx.profiles.loadProfileTypeField,
        });
      } catch (error) {
        if (error instanceof Error) {
          throw new ArgValidationError(info, "data.options", error.message);
        }
        throw error;
      }

      if (profileTypeField.type === "SELECT" || profileTypeField.type === "CHECKBOX") {
        const fieldOptions = profileTypeField.options as ProfileTypeFieldOptions[
          | "SELECT"
          | "CHECKBOX"];

        const removedOptions = pipe(
          fieldOptions.values,
          differenceWith(
            args.data.options.values as { value: string }[],
            (a, b) => a.value === b.value,
          ),
        );

        // make sure we are not removing standard options
        if (removedOptions.some((o) => o.isStandard)) {
          throw new ArgValidationError(
            info,
            "data.options",
            "Can't remove standard options from a SELECT field.",
            { code: "REMOVE_STANDARD_OPTIONS_ERROR" },
          );
        }

        // append the isStandard flag to the new options
        for (const value of (options as ProfileTypeFieldOptions["SELECT" | "CHECKBOX"]).values) {
          if (fieldOptions.values.some((v) => v.value === value.value && v.isStandard)) {
            value.isStandard = true;
          }
        }

        /* 
            when removing options from a SELECT or CHECKBOX field, we need to make sure that
            every profile_field_value using those options are updated to use the substitution.

            If the removed option is being used and does not have any substitution, throw an error
            so the user can choose a substitution for the option and try again.
          */

        const currentValues = await profileTypeFieldSelectValues(profileTypeField.options);
        const newValues = await profileTypeFieldSelectValues(
          args.data.options as ProfileTypeFieldOptions["SELECT" | "CHECKBOX"],
        );
        const removedOptionsWithoutSubstitutions = pipe(
          currentValues,
          differenceWith(newValues, (a, b) => a.value === b.value),
          differenceWith(args.data.substitutions ?? [], (a, b) => a.value === b.old),
        );

        if (removedOptionsWithoutSubstitutions.length > 0) {
          const usedProfileFieldValues = await ctx.profiles.getProfileFieldValueCountWithContent(
            profileTypeField.id,
            profileTypeField.type,
            removedOptionsWithoutSubstitutions.map((o) => o.value),
          );

          if (Object.keys(usedProfileFieldValues).length > 0) {
            const removedOptions = currentValues
              .filter((value) => usedProfileFieldValues[value.value])
              .map((value) => ({ ...value, count: usedProfileFieldValues[value.value] }));

            throw new ApolloError(
              "Cannot remove options that have values associated with them.",
              "REMOVE_PROFILE_TYPE_FIELD_SELECT_OPTIONS_ERROR",
              {
                removedOptions,
                currentOptions: newValues,
              },
            );
          }
        }
        if (isNonNullish(args.data.substitutions) && args.data.substitutions.length > 0) {
          const { currentValues, previousValues } =
            await ctx.profiles.updateProfileFieldValueContentByProfileTypeFieldId(
              profileTypeField.id,
              profileTypeField.type,
              args.data.substitutions,
              ctx.user!.id,
            );

          const previousByProfileId = groupBy(previousValues, (v) => v.profile_id);
          for (const [_profileId, previous] of Object.entries(previousByProfileId)) {
            const profileId = parseInt(_profileId);
            await ctx.profiles.createProfileUpdatedEvents(
              profileId,
              previous.map((f) => {
                const current = currentValues.find(
                  (v) =>
                    v.profile_id === profileId &&
                    v.profile_type_field_id === f.profile_type_field_id,
                );
                const previous = previousValues.find(
                  (v) =>
                    v.profile_id === profileId &&
                    v.profile_type_field_id === f.profile_type_field_id,
                );

                return {
                  org_id: ctx.user!.org_id,
                  profile_id: f.profile_id,
                  type: "PROFILE_FIELD_VALUE_UPDATED",
                  data: {
                    user_id: ctx.user!.id,
                    profile_type_field_id: f.profile_type_field_id,
                    current_profile_field_value_id: current?.id ?? null,
                    previous_profile_field_value_id: previous?.id ?? null,
                    alias:
                      updateData.alias !== undefined
                        ? updateData.alias
                        : (profileTypeField.alias ?? null),
                  },
                };
              }),
              ctx.user!.org_id,
              ctx.user!.id,
            );
          }
        }
      }

      if (profileTypeField.type === "BACKGROUND_CHECK" && options.monitoring === null) {
        // check if there is any profile with active monitoring rules for this field, to warn the user that it will stop monitoring
        const profileIds = await ctx.profiles.getProfileIdsWithActiveMonitoringByProfileTypeFieldId(
          profileTypeField.id,
        );

        if (profileIds.length > 0 && !args.force) {
          throw new ApolloError(
            `Cannot remove monitoring from field because some profiles have active monitoring rules for this field.`,
            "REMOVE_PROFILE_TYPE_FIELD_MONITORING_ERROR",
            { profileIds: profileIds.map((id) => toGlobalId("Profile", id)) },
          );
        }
      }

      updateData.options = options;
      if (isNonNullish(updateData.options.standardList)) {
        // if setting a standard list, clear the values
        updateData.options.values = [];
      }
    }

    try {
      const { updatedProfileTypeField, isProfileNamePatternUpdated } =
        await ctx.profiles.withTransaction(async (t) => {
          if (updateData.is_expirable === false) {
            const repliesHaveExpirySet = await ctx.profiles.profileFieldRepliesHaveExpiryDateSet(
              args.profileTypeFieldId,
              profileTypeField.type,
              t,
            );
            if (repliesHaveExpirySet && !args.force) {
              throw new ApolloError(
                `Cannot remove expiry date from field because some profiles have expiry dates set for this field.`,
                "REMOVE_PROFILE_TYPE_FIELD_IS_EXPIRABLE_ERROR",
              );
            }
            // if removing caducity, remove expiry dates from all profile replies
            const pfvs = await ctx.profiles.removeProfileFieldValuesExpiryDateByProfileTypeFieldId(
              args.profileTypeFieldId,
              t,
            );
            const pffs = await ctx.profiles.removeProfileFieldFilesExpiryDateByProfileTypeFieldId(
              args.profileTypeFieldId,
              t,
            );

            const byProfileId = groupBy([...pfvs, ...pffs], (v) => v.profile_id);
            for (const [profileId, values] of Object.entries(byProfileId)) {
              await ctx.profiles.createProfileUpdatedEvents(
                parseInt(profileId),
                values.map((v) => ({
                  type: "PROFILE_FIELD_EXPIRY_UPDATED",
                  profile_id: v.profile_id,
                  org_id: ctx.user!.org_id,
                  data: {
                    alias: profileTypeField.alias,
                    expiry_date: null,
                    profile_type_field_id: profileTypeField.id,
                    user_id: ctx.user!.id,
                  },
                })),
                ctx.user!.org_id,
                ctx.user!.id,
                t,
              );
            }
          }
          const [updatedProfileTypeField] = await ctx.profiles.updateProfileTypeField(
            args.profileTypeFieldId,
            updateData,
            `User:${ctx.user!.id}`,
            t,
          );

          // if the profile type field is a SELECT, it is included in profileType name pattern and its options were updated, update all profile names
          const profileType = await ctx.profiles.loadProfileType.raw(args.profileTypeId, t);
          const isProfileNamePatternUpdated =
            profileTypeField.type === "SELECT" &&
            isNonNullish(updateData.options) &&
            profileType?.profile_name_pattern.includes(profileTypeField.id);

          return { updatedProfileTypeField, isProfileNamePatternUpdated };
        });

      if (isProfileNamePatternUpdated) {
        await ctx.tasks.createTask(
          {
            name: "PROFILE_NAME_PATTERN_UPDATED",
            input: {
              profile_type_id: args.profileTypeId,
            },
            user_id: ctx.user!.id,
          },
          `User:${ctx.user!.id}`,
        );
      }

      return updatedProfileTypeField;
    } catch (e) {
      if (
        e instanceof DatabaseError &&
        e.constraint === "profile_type_field__profile_type_id__alias__unique"
      ) {
        throw new ApolloError(
          "The alias for this field already exists in this profile type",
          "ALIAS_ALREADY_EXISTS",
        );
      } else {
        throw e;
      }
    }
  },
});

export const updateProfileTypeFieldPermissions = mutationField(
  "updateProfileTypeFieldPermissions",
  {
    description:
      "Updates the default permission for a list of profile type fields and a set of users and/or user groups.",
    type: "ProfileType",
    authorize: authenticateAnd(
      userHasFeatureFlag("PROFILES"),
      contextUserHasPermission("PROFILE_TYPES:CRUD_PROFILE_TYPES"),
      userHasAccessToProfileType("profileTypeId"),
      profileTypeFieldBelongsToProfileType("profileTypeFieldIds", "profileTypeId"),
      userHasAccessToUserAndUserGroups("data"),
    ),
    args: {
      profileTypeId: nonNull(globalIdArg("ProfileType")),
      profileTypeFieldIds: nonNull(list(nonNull(globalIdArg("ProfileTypeField")))),
      defaultPermission: "ProfileTypeFieldPermissionType",
      data: nonNull(
        list(
          nonNull(
            inputObjectType({
              name: "UpdateProfileTypeFieldPermissionsInput",
              definition(t) {
                t.globalId("userId", { prefixName: "User" });
                t.globalId("userGroupId", { prefixName: "UserGroup" });
                t.nonNull.field("permission", { type: "ProfileTypeFieldPermissionType" });
              },
            }),
          ),
        ),
      ),
    },
    resolve: async (_, args, ctx) => {
      const profileType = await ctx.profiles.loadProfileType(args.profileTypeId);
      assert(profileType, "Profile type not found");
      if (args.defaultPermission === "HIDDEN") {
        const patternFieldIds = (profileType.profile_name_pattern as (string | number)[]).filter(
          (v) => typeof v === "number",
        );
        if (patternFieldIds.some((id) => args.profileTypeFieldIds.includes(id))) {
          throw new ApolloError(
            "Cannot set this field to HIDDEN because it is being used as part of the profile name",
            "PROFILE_TYPE_FIELD_IS_PART_OF_PROFILE_NAME",
          );
        }
      }
      if (isNonNullish(args.defaultPermission)) {
        await ctx.profiles.updateProfileTypeField(
          args.profileTypeFieldIds,
          { permission: args.defaultPermission },
          `User:${ctx.user!.id}`,
        );
      }

      await ctx.profiles.resetProfileTypeFieldPermission(
        args.profileTypeFieldIds,
        args.data as any,
        `User:${ctx.user!.id}`,
      );

      return profileType;
    },
  },
);

export const deleteProfileTypeField = mutationField("deleteProfileTypeField", {
  type: "ProfileType",
  authorize: authenticateAnd(
    userHasFeatureFlag("PROFILES"),
    contextUserHasPermission("PROFILE_TYPES:CRUD_PROFILE_TYPES"),
    userHasAccessToProfileType("profileTypeId"),
    profileTypeFieldIsNotStandard("profileTypeFieldIds"),
    profileTypeFieldIsNotUsedInMonitoringRules("profileTypeId", "profileTypeFieldIds"),
    profileTypeFieldBelongsToProfileType("profileTypeFieldIds", "profileTypeId"),
  ),
  args: {
    profileTypeId: nonNull(globalIdArg("ProfileType")),
    profileTypeFieldIds: nonNull(list(nonNull(globalIdArg("ProfileTypeField")))),
    force: nullable(
      booleanArg({
        description:
          "Pass force=true delete the field even if it has values or files associated with it.",
      }),
    ),
  },
  resolve: async (_, { profileTypeId, profileTypeFieldIds, force }, ctx) => {
    const profileType = (await ctx.profiles.loadProfileType(profileTypeId))!;
    if (
      profileTypeFieldIds.some((id) =>
        (profileType!.profile_name_pattern as (string | number)[]).includes(id),
      )
    ) {
      throw new ApolloError(
        "At least one of the provided profile type field ids is being used in the profile name pattern.",
        "FIELD_USED_IN_PATTERN",
      );
    }
    const profileCount =
      await ctx.profiles.countProfilesWithValuesOrFilesByProfileTypeFieldId(profileTypeFieldIds);

    if (Number(profileCount) > 0 && !force) {
      throw new ApolloError(
        "At least one of the provided profile type field ids has value or files.",
        "FIELD_HAS_VALUE_OR_FILES",
        {
          profileCount,
        },
      );
    }

    await ctx.profiles.deleteProfileTypeFields(
      profileTypeId,
      profileTypeFieldIds,
      `User:${ctx.user!.id}`,
    );
    return profileType;
  },
});

export const updateProfileTypeFieldPositions = mutationField("updateProfileTypeFieldPositions", {
  type: "ProfileType",
  authorize: authenticateAnd(
    userHasFeatureFlag("PROFILES"),
    contextUserHasPermission("PROFILE_TYPES:CRUD_PROFILE_TYPES"),
    userHasAccessToProfileType("profileTypeId"),
    profileTypeFieldBelongsToProfileType("profileTypeFieldIds", "profileTypeId"),
  ),
  args: {
    profileTypeId: nonNull(globalIdArg("ProfileType")),
    profileTypeFieldIds: nonNull(list(nonNull(globalIdArg("ProfileTypeField")))),
  },
  resolve: async (_, { profileTypeId, profileTypeFieldIds }, ctx) => {
    try {
      await ctx.profiles.updateProfileTypeFieldPositions(
        profileTypeId,
        profileTypeFieldIds,
        `User:${ctx.user!.id}`,
      );
      return (await ctx.profiles.loadProfileType(profileTypeId))!;
    } catch (e) {
      if (e instanceof Error && e.message === "INVALID_PROFILE_FIELD_IDS") {
        throw new ApolloError("Invalid profile field ids", "INVALID_PROFILE_FIELD_IDS");
      } else {
        throw e;
      }
    }
  },
});

export const createProfile = mutationField("createProfile", {
  type: "Profile",
  authorize: authenticateAnd(
    userHasFeatureFlag("PROFILES"),
    contextUserHasPermission("PROFILES:CREATE_PROFILES"),
    userHasAccessToProfileType("profileTypeId"),
    not(profileTypeIsArchived("profileTypeId")),
    ifArgDefined(
      "fields",
      and(
        userHasPermissionOnProfileTypeField(
          (args) => args.fields!.map((f) => f.profileTypeFieldId),
          "WRITE",
        ),
        profileTypeFieldBelongsToProfileType(
          (args) => args.fields!.map((f) => f.profileTypeFieldId),
          "profileTypeId",
        ),
      ),
    ),
  ),
  args: {
    profileTypeId: nonNull(globalIdArg("ProfileType")),
    subscribe: booleanArg({ description: "Subscribe the context user to profile notifications" }),
    fields: list(nonNull("UpdateProfileFieldValueInput")),
  },
  resolve: async (_, args, ctx) => {
    const profileTypeFields =
      isNonNullish(args.fields) && args.fields.length > 0
        ? await ctx.profiles.loadProfileTypeField(args.fields.map((f) => f.profileTypeFieldId))
        : [];

    const aggregatedErrors: {
      profileTypeFieldId: string;
      code: string;
      message: string;
      alias: string | null;
    }[] = [];
    const fields = await pMap(
      args.fields ?? [],
      async (field) => {
        const profileTypeField = profileTypeFields.find(
          (ptf) => ptf!.id === field.profileTypeFieldId,
        )!;

        if (profileTypeField.type === "FILE" || profileTypeField.type === "BACKGROUND_CHECK") {
          throw new ApolloError(
            `Cannot create a profile with a field of type ${profileTypeField.type}`,
          );
        }

        if (field.expiryDate !== undefined && !profileTypeField.is_expirable) {
          throw new ApolloError(
            `Can't set expiry on a non expirable field`,
            "EXPIRY_ON_NON_EXPIRABLE_FIELD",
          );
        }
        if (field.expiryDate !== undefined && isNullish(field.content)) {
          throw new ApolloError(
            `Can't set expiry on a field with no value`,
            "EXPIRY_ON_NONEXISTING_VALUE",
          );
        }

        if (isNonNullish(field.content)) {
          try {
            // validate fields content before creating the profile.
            // this way we can avoid creating the profile if the content is invalid
            await ctx.profileValidation.validateProfileFieldValueContent(
              profileTypeField,
              field.content,
            );
          } catch (e) {
            if (e instanceof Error) {
              aggregatedErrors.push({
                code: "INVALID_PROFILE_FIELD_VALUE",
                profileTypeFieldId: toGlobalId("ProfileTypeField", field.profileTypeFieldId),
                alias: profileTypeField.alias,
                message: e.message,
              });
            }
          }
        }

        return {
          ...field,
          type: profileTypeField.type,
          alias: profileTypeField.alias,
          expiryDate: field.expiryDate
            ? // priorize expiryDate argument if set
              field.expiryDate
            : // else, check option useReplyAsExpiryDate for DATE replies
              profileTypeField.type === "DATE" &&
                profileTypeField.options.useReplyAsExpiryDate &&
                isNonNullish(field.content?.value)
              ? (field.content!.value as string)
              : null,
        };
      },
      { concurrency: 1 },
    );

    if (aggregatedErrors.length > 0) {
      throw new ApolloError("Invalid profile field value", "INVALID_PROFILE_FIELD_VALUE", {
        aggregatedErrors,
      });
    }

    const profile = await ctx.profiles.createProfile(
      {
        localizable_name: { en: "", es: "" },
        org_id: ctx.user!.org_id,
        profile_type_id: args.profileTypeId,
      },
      ctx.user!.id,
    );

    if (args.subscribe) {
      await ctx.profiles.subscribeUsersToProfiles(
        [profile.id],
        [ctx.user!.id],
        `User:${ctx.user!.id}`,
      );
    }

    if (fields.length > 0) {
      const { currentValues, profile: updatedProfile } = await ctx.profiles.updateProfileFieldValue(
        profile.id,
        fields,
        ctx.user!.id,
      );

      await ctx.profiles.createProfileUpdatedEvents(
        profile.id,
        buildProfileUpdatedEventsData(profile.id, fields, currentValues, [], ctx.user!),
        ctx.user!.org_id,
        ctx.user!.id,
      );

      return updatedProfile!;
    }

    return profile;
  },
});

export const deleteProfile = mutationField("deleteProfile", {
  description: "Permanently deletes the profile",
  type: "Success",
  authorize: authenticateAnd(
    userHasFeatureFlag("PROFILES"),
    contextUserHasPermission("PROFILES:DELETE_PERMANENTLY_PROFILES"),
    userHasAccessToProfile("profileIds"),
    profileHasStatus("profileIds", ["CLOSED", "DELETION_SCHEDULED"]),
    profileIsNotAnonymized("profileIds"),
  ),
  args: {
    profileIds: nonNull(list(nonNull(globalIdArg("Profile")))),
    force: booleanArg({ description: "pass force=true to delete profiles with replies" }),
  },
  resolve: async (_, { profileIds, force }, ctx) => {
    const values = (await ctx.profiles.loadProfileFieldValuesByProfileId(profileIds)).flat();
    const files = (await ctx.profiles.loadProfileFieldFilesByProfileId(profileIds)).flat();

    if (values.length + files.length > 0 && !force) {
      throw new ApolloError(`Profile has replies`, "PROFILE_HAS_REPLIES_ERROR", {
        count: values.length + files.length,
      });
    }

    await ctx.profiles.deleteProfile(profileIds, `User:${ctx.user!.id}`);

    const removedRelationships = await ctx.profiles.removeProfileRelationshipsByProfileId(
      profileIds,
      ctx.user!,
    );

    if (removedRelationships.length > 0) {
      const relationshipTypes = await ctx.profiles.loadProfileRelationshipType(
        removedRelationships.map((r) => r.profile_relationship_type_id),
      );

      // create events only on profiles that were not deleted
      const eventsData = removedRelationships
        .flatMap((r) => [
          profileIds.includes(r.left_side_profile_id)
            ? null
            : {
                profileId: r.left_side_profile_id,
                profileRelationshipId: r.id,
                profileRelationshipTypeId: r.profile_relationship_type_id,
              },
          profileIds.includes(r.right_side_profile_id)
            ? null
            : {
                profileId: r.right_side_profile_id,
                profileRelationshipId: r.id,
                profileRelationshipTypeId: r.profile_relationship_type_id,
              },
        ])
        .filter(isNonNullish);

      await ctx.profiles.createEvent(
        eventsData.map((d) => ({
          type: "PROFILE_RELATIONSHIP_REMOVED",
          org_id: ctx.user!.org_id,
          profile_id: d.profileId,
          data: {
            user_id: ctx.user!.id,
            profile_relationship_id: d.profileRelationshipId,
            reason: "PROFILE_DELETED",
            profile_relationship_type_alias: relationshipTypes.find(
              (rt) => rt!.id === d.profileRelationshipTypeId,
            )!.alias,
          },
        })),
      );
    }

    return SUCCESS;
  },
});

export const updateProfileFieldValue = mutationField("updateProfileFieldValue", {
  type: "Profile",
  authorize: authenticateAnd(
    userHasFeatureFlag("PROFILES"),
    contextUserHasPermission("PROFILES:CREATE_PROFILES"),
    userHasAccessToProfile("profileId"),
    profileIsNotAnonymized("profileId"),
    profileHasStatus("profileId", "OPEN"),
    userHasPermissionOnProfileTypeField(
      (args) => args.fields.map((f) => f.profileTypeFieldId),
      "WRITE",
    ),
  ),
  args: {
    profileId: nonNull(globalIdArg("Profile")),
    fields: nonNull(
      list(
        nonNull(
          arg({
            type: inputObjectType({
              name: "UpdateProfileFieldValueInput",
              definition(t) {
                t.nonNull.globalId("profileTypeFieldId", { prefixName: "ProfileTypeField" });
                t.nullable.jsonObject("content");
                t.nullable.date("expiryDate");
              },
            }),
          }),
        ),
      ),
    ),
  },
  resolve: async (_, { profileId, fields }, ctx) => {
    const [profileTypeFields, profile] = await Promise.all([
      ctx.profiles.loadProfileTypeField(fields.map((f) => f.profileTypeFieldId)),
      ctx.profiles.loadProfile(profileId),
    ]);
    // check profileTypeFieldIds match the profileId
    if (
      isNullish(profile) ||
      profileTypeFields.some((p) => isNullish(p) || p.profile_type_id !== profile!.profile_type_id)
    ) {
      throw new ForbiddenError("invalid properties in fields arg");
    }

    assert(profileTypeFields.every(isNonNullish), "ProfileTypeField not found");

    if (
      fields.some((field) => {
        const property = profileTypeFields.find((ptf) => ptf.id === field.profileTypeFieldId)!;
        return (
          (property.type === "BACKGROUND_CHECK" || property.type === "FILE") &&
          isNonNullish(field.content)
        );
      })
    ) {
      throw new ForbiddenError(
        "Cannot update BACKGROUND_CHECK and FILE contents with this mutation",
      );
    }

    const profileTypeFieldsById = indexBy(profileTypeFields, (ptf) => ptf.id);
    // validate contents and expiryDate
    const values = await ctx.profiles.loadProfileFieldValuesByProfileId(profileId);
    const valuesByPtfId = indexBy(values, (v) => v.profile_type_field_id);

    const aggregatedErrors: {
      profileTypeFieldId: string;
      code: string;
      message: string;
      alias: string | null;
    }[] = [];

    const fieldsWithZonedExpires = await pMap(
      fields,
      async (field) => {
        const profileTypeField = profileTypeFieldsById[field.profileTypeFieldId];

        if (
          isNonNullish(field.content) &&
          field.content.value !== null &&
          field.content.value !== ""
        ) {
          try {
            await ctx.profileValidation.validateProfileFieldValueContent(
              profileTypeField,
              field.content,
            );
          } catch (e) {
            if (e instanceof Error) {
              aggregatedErrors.push({
                code: "INVALID_PROFILE_FIELD_VALUE",
                profileTypeFieldId: toGlobalId("ProfileTypeField", field.profileTypeFieldId),
                alias: profileTypeField.alias,
                message: `Invalid profile field value: ${e.message}`,
              });
            }
          }
        }
        if (field.expiryDate !== undefined && !profileTypeField.is_expirable) {
          throw new ApolloError(
            `Can't set expiry on a non expirable field`,
            "EXPIRY_ON_NON_EXPIRABLE_FIELD",
          );
        }
        if (field.expiryDate !== undefined && field.content === null) {
          throw new ApolloError(
            `Can't set expiry when removing a field`,
            "EXPIRY_ON_REMOVED_FIELD",
          );
        }
        if (
          field.expiryDate !== undefined &&
          field.content === undefined &&
          isNullish(valuesByPtfId[field.profileTypeFieldId])
        ) {
          throw new ApolloError(
            `Can't set expiry on a field with no value`,
            "EXPIRY_ON_NONEXISTING_VALUE",
          );
        }

        return {
          ...field,
          type: profileTypeField.type,
          alias: profileTypeField.alias,
          expiryDate: field.expiryDate
            ? // priorize expiryDate argument if set
              field.expiryDate
            : // else, check option useReplyAsExpiryDate for DATE replies
              profileTypeField.type === "DATE" &&
                profileTypeField.options.useReplyAsExpiryDate &&
                isNonNullish(field.content?.value)
              ? (field.content!.value as string)
              : null,
        };
      },
      { concurrency: 1 },
    );

    if (aggregatedErrors.length > 0) {
      throw new ApolloError("Invalid profile field value", "INVALID_PROFILE_FIELD_VALUE", {
        aggregatedErrors,
      });
    }

    const {
      profile: updatedProfile,
      currentValues,
      previousValues,
    } = await ctx.profiles.updateProfileFieldValue(profileId, fieldsWithZonedExpires, ctx.user!.id);

    await ctx.profiles.createProfileUpdatedEvents(
      profileId,
      buildProfileUpdatedEventsData(
        profile.id,
        fieldsWithZonedExpires,
        currentValues,
        previousValues,
        ctx.user!,
      ),
      ctx.user!.org_id,
      ctx.user!.id,
    );

    return updatedProfile!;
  },
});

export const createProfileFieldFileUploadLink = mutationField("createProfileFieldFileUploadLink", {
  type: "ProfileFieldPropertyAndFileWithUploadData",
  authorize: authenticateAnd(
    userHasFeatureFlag("PROFILES"),
    contextUserHasPermission("PROFILES:CREATE_PROFILES"),
    userHasAccessToProfile("profileId"),
    profileHasStatus("profileId", "OPEN"),
    profileIsNotAnonymized("profileId"),
    profileHasProfileTypeFieldId("profileId", "profileTypeFieldId"),
    userHasPermissionOnProfileTypeField("profileTypeFieldId", "WRITE"),
    profileTypeFieldIsOfType("profileTypeFieldId", ["FILE"]),
    fileUploadCanBeAttachedToProfileTypeField("profileId", "profileTypeFieldId", "data"),
  ),
  args: {
    profileId: nonNull(globalIdArg("Profile")),
    profileTypeFieldId: nonNull(globalIdArg("ProfileTypeField")),
    data: nonNull(list(nonNull("FileUploadInput"))),
    expiryDate: dateArg(),
  },
  validateArgs: validateAnd(
    validFileUploadInput("data", { maxSizeBytes: toBytes(100, "MB") }),
    validateOr(notEmptyArray("data"), validIsNotUndefined("expiryDate")),
  ),
  resolve: async (_, { profileId, profileTypeFieldId, data, expiryDate }, ctx) => {
    let fileUploads: FileUpload[] = [];
    let presignedPostDatas: PresignedPost[] = [];
    let files: ProfileFieldFile[] = [];

    const profileTypeField = await ctx.profiles.loadProfileTypeField(profileTypeFieldId);

    if (expiryDate !== undefined && !profileTypeField!.is_expirable) {
      throw new ApolloError(
        `Can't set expiry on a non expirable field`,
        "EXPIRY_ON_NON_EXPIRABLE_FIELD",
      );
    }

    if (data.length > 0) {
      fileUploads = await ctx.files.createFileUpload(
        data.map((data) => ({
          path: random(16),
          filename: data.filename,
          size: data.size.toString(),
          content_type: data.contentType,
          upload_complete: false,
        })),
        `User:${ctx.user!.id}`,
      );

      presignedPostDatas = await Promise.all(
        fileUploads.map((file) =>
          ctx.storage.fileUploads.getSignedUploadEndpoint(
            file.path,
            file.content_type,
            parseInt(file.size),
          ),
        ),
      );

      files = await ctx.profiles.createProfileFieldFiles(
        profileId,
        profileTypeFieldId,
        fileUploads.map((f) => f.id),
        expiryDate,
        ctx.user!.id,
      );

      await ctx.profiles.createProfileUpdatedEvents(
        profileId,
        [
          ...files.map(
            (pff) =>
              ({
                org_id: ctx.user!.org_id,
                profile_id: pff.profile_id,
                type: "PROFILE_FIELD_FILE_ADDED",
                data: {
                  user_id: ctx.user!.id,
                  profile_type_field_id: profileTypeFieldId,
                  profile_field_file_id: pff.id,
                  alias: profileTypeField?.alias ?? null,
                },
              }) satisfies ProfileFieldFileAddedEvent<true>,
          ),
          ...(expiryDate !== undefined
            ? [
                {
                  org_id: ctx.user!.org_id,
                  profile_id: profileId,
                  type: "PROFILE_FIELD_EXPIRY_UPDATED",
                  data: {
                    user_id: ctx.user!.id,
                    profile_type_field_id: profileTypeFieldId,
                    expiry_date: expiryDate ?? null,
                    alias: profileTypeField?.alias ?? null,
                  },
                } satisfies ProfileFieldExpiryUpdatedEvent<true>,
              ]
            : []),
        ],
        ctx.user!.org_id,
        ctx.user!.id,
      );
    } else {
      // no new files, update expiryDate on all uploaded files
      await ctx.profiles.updateProfileFieldFilesExpiryDate(
        profileId,
        profileTypeFieldId,
        expiryDate ?? null,
      );

      await ctx.profiles.createProfileUpdatedEvents(
        profileId,
        {
          type: "PROFILE_FIELD_EXPIRY_UPDATED",
          org_id: ctx.user!.org_id,
          profile_id: profileId,
          data: {
            user_id: ctx.user!.id,
            expiry_date: expiryDate ?? null,
            profile_type_field_id: profileTypeFieldId,
            alias: profileTypeField?.alias ?? null,
          },
        },
        ctx.user!.org_id,
        ctx.user!.id,
      );
    }

    ctx.profiles.loadProfileFieldFiles.dataloader.clear({ profileId, profileTypeFieldId });

    return {
      property: { profile_id: profileId, profile_type_field_id: profileTypeFieldId },
      uploads: zip(presignedPostDatas, files).map(([presignedPostData, file]) => ({
        file,
        presignedPostData,
      })),
    };
  },
});

export const profileFieldFileUploadComplete = mutationField("profileFieldFileUploadComplete", {
  type: list("ProfileFieldFile"),
  authorize: authenticateAnd(
    userHasFeatureFlag("PROFILES"),
    contextUserHasPermission("PROFILES:CREATE_PROFILES"),
    userHasAccessToProfile("profileId"),
    profileHasStatus("profileId", "OPEN"),
    profileIsNotAnonymized("profileId"),
    profileHasProfileTypeFieldId("profileId", "profileTypeFieldId"),
    userHasPermissionOnProfileTypeField("profileTypeFieldId", "WRITE"),
    profileTypeFieldIsOfType("profileTypeFieldId", ["FILE"]),
  ),
  args: {
    profileId: nonNull(globalIdArg("Profile")),
    profileTypeFieldId: nonNull(globalIdArg("ProfileTypeField")),
    profileFieldFileIds: nonNull(list(nonNull(globalIdArg("ProfileFieldFile")))),
  },
  validateArgs: notEmptyArray("profileFieldFileIds"),
  resolve: async (_, { profileId, profileTypeFieldId, profileFieldFileIds }, ctx) => {
    const profileFieldFiles = await ctx.profiles.loadProfileFieldFileById(profileFieldFileIds);
    if (
      profileFieldFiles.some(
        (pff) =>
          isNullish(pff) ||
          pff.profile_id !== profileId ||
          pff.profile_type_field_id !== profileTypeFieldId,
      )
    ) {
      throw new ForbiddenError("Not authorized");
    }
    const fileUploads = await ctx.files.loadFileUpload(
      (profileFieldFiles as ProfileFieldFile[]).map((pff) => pff.file_upload_id!),
    );

    await pMap(fileUploads, async (fu) => {
      await ctx.storage.fileUploads.getFileMetadata(fu!.path);
    });
    await ctx.files.markFileUploadComplete(
      fileUploads.map((fu) => fu!.id),
      `User:${ctx.user!.id}`,
    );
    for (const fu of fileUploads) {
      ctx.files.loadFileUpload.dataloader.clear(fu!.id);
    }
    return profileFieldFiles as ProfileFieldFile[];
  },
});

export const deleteProfileFieldFile = mutationField("deleteProfileFieldFile", {
  type: "Result",
  authorize: authenticateAnd(
    userHasFeatureFlag("PROFILES"),
    contextUserHasPermission("PROFILES:CREATE_PROFILES"),
    userHasAccessToProfile("profileId"),
    profileHasStatus("profileId", "OPEN"),
    profileIsNotAnonymized("profileId"),
    profileHasProfileTypeFieldId("profileId", "profileTypeFieldId"),
    ifArgDefined(
      "profileFieldFileIds",
      profileFieldFileHasProfileTypeFieldId("profileFieldFileIds" as never, "profileTypeFieldId"),
    ),
    profileTypeFieldIsOfType("profileTypeFieldId", ["FILE"]),
    userHasPermissionOnProfileTypeField("profileTypeFieldId", "WRITE"),
  ),
  args: {
    profileId: nonNull(globalIdArg("Profile")),
    profileTypeFieldId: nonNull(globalIdArg("ProfileTypeField")),
    profileFieldFileIds: list(nonNull(globalIdArg("ProfileFieldFile"))),
  },
  resolve: async (_, { profileId, profileFieldFileIds, profileTypeFieldId }, ctx) => {
    try {
      let deletedProfileFieldFiles: ProfileFieldFile[] = [];
      if (isNonNullish(profileFieldFileIds)) {
        deletedProfileFieldFiles = await ctx.profiles.deleteProfileFieldFiles(
          profileFieldFileIds,
          ctx.user!.id,
        );
      } else {
        deletedProfileFieldFiles = await ctx.profiles.deleteProfileFieldFilesByProfileTypeFieldId(
          profileTypeFieldId,
          ctx.user!.id,
        );
      }
      const profileTypeField = await ctx.profiles.loadProfileTypeField(profileTypeFieldId);

      if (deletedProfileFieldFiles.length > 0) {
        await ctx.profiles.createProfileUpdatedEvents(
          profileId,
          deletedProfileFieldFiles.map((f) => ({
            type: "PROFILE_FIELD_FILE_REMOVED",
            profile_id: profileId,
            org_id: ctx.user!.org_id,
            data: {
              user_id: ctx.user!.id,
              profile_type_field_id: profileTypeFieldId,
              profile_field_file_id: f.id,
              alias: profileTypeField?.alias ?? null,
            },
          })),
          ctx.user!.org_id,
          ctx.user!.id,
        );
      }

      return RESULT.SUCCESS;
    } catch {
      return RESULT.FAILURE;
    }
  },
});

export const copyFileReplyToProfileFieldFile = mutationField("copyFileReplyToProfileFieldFile", {
  type: list("ProfileFieldFile"),
  authorize: authenticateAnd(
    userHasFeatureFlag("PROFILES"),
    contextUserHasPermission("PROFILES:CREATE_PROFILES"),
    userHasAccessToProfile("profileId"),
    profileHasStatus("profileId", "OPEN"),
    profileIsNotAnonymized("profileId"),
    profileHasProfileTypeFieldId("profileId", "profileTypeFieldId"),
    userHasPermissionOnProfileTypeField("profileTypeFieldId", "WRITE"),
    profileTypeFieldIsOfType("profileTypeFieldId", ["FILE"]),
    userHasAccessToPetitions("petitionId"),
    petitionIsNotAnonymized("petitionId"),
    repliesBelongsToPetition("petitionId", "fileReplyIds"),
    replyIsForFieldOfType("fileReplyIds", [
      "FILE_UPLOAD",
      "ES_TAX_DOCUMENTS",
      "DOW_JONES_KYC",
      "ID_VERIFICATION",
    ]),
  ),
  args: {
    profileId: nonNull(globalIdArg("Profile")),
    profileTypeFieldId: nonNull(globalIdArg("ProfileTypeField")),
    petitionId: nonNull(globalIdArg("Petition")),
    fileReplyIds: nonNull(list(nonNull(globalIdArg("PetitionFieldReply")))),
    expiryDate: dateArg(),
  },
  resolve: async (_, { profileId, profileTypeFieldId, fileReplyIds, expiryDate }, ctx) => {
    const fileReplies =
      fileReplyIds.length > 0
        ? (await ctx.petitions.loadFieldReply(fileReplyIds)).filter(isNonNullish)
        : [];

    const fileUploadIds = fileReplies
      .filter((r) => isNullish(r.content.error) && isNonNullish(r.content.file_upload_id))
      .map((r) => r.content.file_upload_id as number);

    const clonedFiles = await ctx.files.cloneFileUpload(fileUploadIds);

    const files = await ctx.profiles.createProfileFieldFiles(
      profileId,
      profileTypeFieldId,
      clonedFiles.map((f) => f.id),
      expiryDate,
      ctx.user!.id,
    );

    const profileTypeField = await ctx.profiles.loadProfileTypeField(profileTypeFieldId);

    await ctx.profiles.createProfileUpdatedEvents(
      profileId,
      [
        ...files.map(
          (pff) =>
            ({
              org_id: ctx.user!.org_id,
              profile_id: pff.profile_id,
              type: "PROFILE_FIELD_FILE_ADDED",
              data: {
                user_id: ctx.user!.id,
                profile_type_field_id: profileTypeFieldId,
                profile_field_file_id: pff.id,
                alias: profileTypeField?.alias ?? null,
              },
            }) satisfies ProfileFieldFileAddedEvent<true>,
        ),
        ...(expiryDate !== undefined
          ? [
              {
                org_id: ctx.user!.org_id,
                profile_id: profileId,
                type: "PROFILE_FIELD_EXPIRY_UPDATED",
                data: {
                  user_id: ctx.user!.id,
                  profile_type_field_id: profileTypeFieldId,
                  expiry_date: expiryDate ?? null,
                  alias: profileTypeField?.alias ?? null,
                },
              } satisfies ProfileFieldExpiryUpdatedEvent<true>,
            ]
          : []),
      ],
      ctx.user!.org_id,
      ctx.user!.id,
    );

    return files;
  },
});

export const copyBackgroundCheckReplyToProfileFieldValue = mutationField(
  "copyBackgroundCheckReplyToProfileFieldValue",
  {
    type: "ProfileFieldValue",
    authorize: authenticateAnd(
      userHasFeatureFlag("PROFILES"),
      contextUserHasPermission("PROFILES:CREATE_PROFILES"),
      userHasAccessToProfile("profileId"),
      profileHasStatus("profileId", "OPEN"),
      profileIsNotAnonymized("profileId"),
      profileHasProfileTypeFieldId("profileId", "profileTypeFieldId"),
      userHasPermissionOnProfileTypeField("profileTypeFieldId", "WRITE"),
      userHasAccessToPetitions("petitionId"),
      petitionIsNotAnonymized("petitionId"),
      repliesBelongsToPetition("petitionId", "replyId"),
      replyIsForFieldOfType("replyId", ["BACKGROUND_CHECK"]),
    ),
    args: {
      profileId: nonNull(globalIdArg("Profile")),
      profileTypeFieldId: nonNull(globalIdArg("ProfileTypeField")),
      petitionId: nonNull(globalIdArg("Petition")),
      replyId: nonNull(globalIdArg("PetitionFieldReply")),
      expiryDate: dateArg(),
    },
    resolve: async (_, { profileId, profileTypeFieldId, expiryDate, replyId }, ctx) => {
      const reply = await ctx.petitions.loadFieldReply(replyId);

      const {
        currentValues: [currentValue],
        previousValues: [previousValue],
      } = await ctx.profiles.updateProfileFieldValue(
        profileId,
        [
          {
            profileTypeFieldId,
            type: "BACKGROUND_CHECK",
            content: reply!.content,
            expiryDate,
          },
        ],
        ctx.user!.id,
      );

      const profileTypeField = await ctx.profiles.loadProfileTypeField(profileTypeFieldId);
      await ctx.profiles.createProfileUpdatedEvents(
        profileId,
        [
          {
            org_id: ctx.user!.org_id,
            profile_id: profileId,
            type: "PROFILE_FIELD_VALUE_UPDATED",
            data: {
              user_id: ctx.user!.id,
              current_profile_field_value_id: currentValue?.id ?? null,
              previous_profile_field_value_id: previousValue?.id ?? null,
              profile_type_field_id: profileTypeFieldId,
              alias: profileTypeField?.alias ?? null,
            },
          },
        ],
        ctx.user!.org_id,
        ctx.user!.id,
      );

      return (await ctx.profiles.loadProfileFieldValue({ profileId, profileTypeFieldId }))!;
    },
  },
);

export const profileFieldFileDownloadLink = mutationField("profileFieldFileDownloadLink", {
  type: "FileUploadDownloadLinkResult",
  description: "Generates a download link for a profile field file",
  authorize: authenticateAnd(
    userHasFeatureFlag("PROFILES"),
    userHasAccessToProfile("profileId"),
    profileIsNotAnonymized("profileId"),
    profileHasProfileTypeFieldId("profileId", "profileTypeFieldId"),
    profileFieldFileHasProfileTypeFieldId("profileFieldFileId", "profileTypeFieldId"),
    profileTypeFieldIsOfType("profileTypeFieldId", ["FILE"]),
    userHasPermissionOnProfileTypeField("profileTypeFieldId", "READ"),
  ),
  args: {
    profileId: nonNull(globalIdArg("Profile")),
    profileTypeFieldId: nonNull(globalIdArg("ProfileTypeField")),
    profileFieldFileId: nonNull(globalIdArg("ProfileFieldFile")),
    preview: booleanArg({
      description: "If true will use content-disposition inline instead of attachment",
    }),
  },
  resolve: async (_, args, ctx) => {
    try {
      const profileFieldFile = (await ctx.profiles.loadProfileFieldFileById(
        args.profileFieldFileId,
      ))!;

      const file = await ctx.files.loadFileUpload(profileFieldFile.file_upload_id!);
      if (!file) {
        throw new Error(`FileUpload:${profileFieldFile.file_upload_id} not found`);
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
    } catch {
      return {
        result: RESULT.FAILURE,
      };
    }
  },
});

export const subscribeToProfile = mutationField("subscribeToProfile", {
  type: list("Profile"),
  authorize: authenticateAnd(
    userHasFeatureFlag("PROFILES"),
    userHasAccessToProfile("profileIds"),
    profileIsNotAnonymized("profileIds"),
    contextUserCanSubscribeUsersToProfile("userIds"),
    profileHasStatus("profileIds", ["OPEN", "CLOSED"]),
  ),
  args: {
    profileIds: nonNull(list(nonNull(globalIdArg("Profile")))),
    userIds: nonNull(list(nonNull(globalIdArg("User")))),
  },
  validateArgs: validateAnd(notEmptyArray("userIds"), notEmptyArray("profileIds")),
  resolve: async (_, { profileIds, userIds }, ctx) => {
    await ctx.profiles.subscribeUsersToProfiles(profileIds, userIds, `User:${ctx.user!.id}`);
    return (await ctx.profiles.loadProfile(profileIds)) as Profile[];
  },
});

export const unsubscribeFromProfile = mutationField("unsubscribeFromProfile", {
  type: list("Profile"),
  authorize: authenticateAnd(
    userHasFeatureFlag("PROFILES"),
    userHasAccessToProfile("profileIds"),
    profileIsNotAnonymized("profileIds"),
    contextUserCanSubscribeUsersToProfile("userIds"),
    profileHasStatus("profileIds", ["OPEN", "CLOSED"]),
  ),
  args: {
    profileIds: nonNull(list(nonNull(globalIdArg("Profile")))),
    userIds: nonNull(list(nonNull(globalIdArg("User")))),
  },
  validateArgs: validateAnd(notEmptyArray("userIds"), notEmptyArray("profileIds")),
  resolve: async (_, { profileIds, userIds }, ctx) => {
    await ctx.profiles.unsubscribeUsersFromProfiles(profileIds, userIds, `User:${ctx.user!.id}`);
    return (await ctx.profiles.loadProfile(profileIds)) as Profile[];
  },
});

export const associateProfileToPetition = mutationField("associateProfileToPetition", {
  description: "Associates a profile to a petition",
  type: "PetitionProfile",
  authorize: authenticateAnd(
    userHasFeatureFlag("PROFILES"),
    userHasAccessToPetitions("petitionId", ["OWNER", "WRITE"]),
    userHasAccessToProfile("profileId"),
    profileIsNotAnonymized("profileId"),
    petitionsAreNotPublicTemplates("petitionId"),
    petitionIsNotAnonymized("petitionId"),
    profileHasStatus("profileId", ["OPEN", "CLOSED"]),
  ),
  args: {
    petitionId: nonNull(globalIdArg("Petition")),
    profileId: nonNull(globalIdArg("Profile")),
  },
  resolve: async (_, { petitionId, profileId }, ctx) => {
    await ctx.profiles.associateProfilesToPetition(
      [{ profile_id: profileId, petition_id: petitionId }],
      ctx.user!,
    );

    const pp = await ctx.profiles.getPetitionProfile(petitionId, profileId);
    assert(pp, "Profile not associated to petition");
    return pp;
  },
});

export const disassociateProfilesFromPetitions = mutationField(
  "disassociateProfilesFromPetitions",
  {
    description: "Disassociates a petition from a profile",
    type: "Success",
    authorize: authenticateAnd(
      userHasFeatureFlag("PROFILES"),
      userHasAccessToProfile("profileIds"),
      profileIsNotAnonymized("profileIds"),
      petitionIsNotAnonymized("petitionIds"),
      profileIsAssociatedToPetition("profileIds", "petitionIds"),
      profileHasStatus("profileIds", ["OPEN", "CLOSED"]),
    ),
    args: {
      profileIds: nonNull(list(nonNull(globalIdArg("Profile")))),
      petitionIds: nonNull(list(nonNull(globalIdArg("Petition")))),
    },
    validateArgs: validateAnd(
      notEmptyArray("profileIds"),
      notEmptyArray("petitionIds"),
      uniqueValues("profileIds"),
      uniqueValues("petitionIds"),
    ),
    resolve: async (_, { profileIds, petitionIds }, ctx) => {
      const disassociated = await ctx.profiles.disassociateProfileFromPetition(
        petitionIds,
        profileIds,
      );

      await ctx.petitions.createEvent(
        disassociated.map((d) => ({
          type: "PROFILE_DISASSOCIATED",
          petition_id: d.petition_id,
          data: {
            user_id: ctx.user!.id,
            profile_id: d.profile_id,
          },
        })),
      );

      await ctx.profiles.createEvent(
        disassociated.map((d) => ({
          type: "PETITION_DISASSOCIATED",
          org_id: ctx.user!.org_id,
          profile_id: d.profile_id,
          data: {
            user_id: ctx.user!.id,
            petition_id: d.petition_id,
          },
        })),
      );

      return RESULT.SUCCESS;
    },
  },
);

export const reopenProfile = mutationField("reopenProfile", {
  type: list("Profile"),
  description: "Reopens a profile that is in CLOSED or DELETION_SCHEDULED status",
  authorize: authenticateAnd(
    userHasFeatureFlag("PROFILES"),
    userHasAccessToProfile("profileIds"),
    profileIsNotAnonymized("profileIds"),
    contextUserHasPermission("PROFILES:CLOSE_PROFILES"),
    profileHasStatus("profileIds", ["CLOSED", "DELETION_SCHEDULED"]),
  ),
  args: {
    profileIds: nonNull(list(nonNull(globalIdArg("Profile")))),
  },
  resolve: async (_, { profileIds }, ctx) => {
    const profiles = await ctx.profiles.updateProfileStatus(
      profileIds,
      "OPEN",
      `User:${ctx.user!.id}`,
    );

    await ctx.profiles.createEvent(
      profiles.map((p) => ({
        type: "PROFILE_REOPENED",
        profile_id: p.id,
        org_id: ctx.user!.org_id,
        data: {
          user_id: ctx.user!.id,
        },
      })),
    );

    return profiles;
  },
});

export const closeProfile = mutationField("closeProfile", {
  type: list("Profile"),
  description: "Closes a profile that is in OPEN or DELETION_SCHEDULED status",
  authorize: authenticateAnd(
    userHasFeatureFlag("PROFILES"),
    userHasAccessToProfile("profileIds"),
    profileIsNotAnonymized("profileIds"),
    contextUserHasPermission("PROFILES:CLOSE_PROFILES"),
    profileHasStatus("profileIds", ["OPEN", "DELETION_SCHEDULED"]),
  ),
  args: {
    profileIds: nonNull(list(nonNull(globalIdArg("Profile")))),
  },
  resolve: async (_, { profileIds }, ctx) => {
    const profiles = await ctx.profiles.updateProfileStatus(
      profileIds,
      "CLOSED",
      `User:${ctx.user!.id}`,
    );

    await ctx.profiles.createEvent(
      profiles.map((p) => ({
        type: "PROFILE_CLOSED",
        profile_id: p.id,
        org_id: ctx.user!.org_id,
        data: {
          user_id: ctx.user!.id,
        },
      })),
    );

    return profiles;
  },
});

export const scheduleProfileForDeletion = mutationField("scheduleProfileForDeletion", {
  type: list("Profile"),
  description: "Moves a profile to DELETION_SCHEDULED status",
  authorize: authenticateAnd(
    userHasFeatureFlag("PROFILES"),
    userHasAccessToProfile("profileIds"),
    profileIsNotAnonymized("profileIds"),
    contextUserHasPermission("PROFILES:DELETE_PROFILES"),
    profileHasStatus("profileIds", ["OPEN", "CLOSED"]),
  ),
  args: {
    profileIds: nonNull(list(nonNull(globalIdArg("Profile")))),
  },
  resolve: async (_, { profileIds }, ctx) => {
    const profiles = await ctx.profiles.updateProfileStatus(
      profileIds,
      "DELETION_SCHEDULED",
      `User:${ctx.user!.id}`,
    );

    await ctx.profiles.createEvent(
      profiles.map((p) => ({
        type: "PROFILE_SCHEDULED_FOR_DELETION",
        profile_id: p.id,
        org_id: ctx.user!.org_id,
        data: {
          user_id: ctx.user!.id,
        },
      })),
    );

    return profiles;
  },
});

export const createProfileRelationship = mutationField("createProfileRelationship", {
  description: "Associates a profile with one or more relationships.",
  type: "Profile",
  authorize: authenticateAnd(
    userHasFeatureFlag("PROFILES"),
    userHasAccessToProfile("profileId"),
    profileIsNotAnonymized("profileId"),
    profileHasStatus("profileId", ["OPEN", "CLOSED"]),
    profilesCanBeAssociated("profileId", "relationships"),
    userHasAccessToProfileRelationshipsInput("relationships"),
  ),
  validateArgs: notEmptyArray("relationships"),
  args: {
    profileId: nonNull(globalIdArg("Profile")),
    relationships: nonNull(
      list(
        nonNull(
          inputObjectType({
            name: "CreateProfileRelationshipInput",
            definition(t) {
              t.nonNull.globalId("profileRelationshipTypeId", {
                prefixName: "ProfileRelationshipType",
              });
              t.nonNull.field("direction", { type: "ProfileRelationshipDirection" });
              t.nonNull.globalId("profileId", { prefixName: "Profile" });
            },
          }),
        ),
      ),
    ),
  },
  resolve: async (_, args, ctx) => {
    const relationshipTypes = await ctx.profiles.loadProfileRelationshipType(
      unique(args.relationships.map((r) => r.profileRelationshipTypeId)),
    );

    await ctx.profiles.createProfileRelationship(
      args.relationships.map((r) => {
        const relationshipType = relationshipTypes.find(
          (rt) => rt!.id === r.profileRelationshipTypeId,
        )!;
        const [leftId, rightId] = relationshipType?.is_reciprocal
          ? // if relationship is reciprocal, always insert lower profile_id on left and higher on right
            // this way we can avoid duplicating reciprocal relationships with different directions
            [args.profileId, r.profileId].sort()
          : r.direction === "LEFT_RIGHT"
            ? [args.profileId, r.profileId]
            : [r.profileId, args.profileId];
        return {
          profile_relationship_type_id: r.profileRelationshipTypeId,
          left_side_profile_id: leftId,
          right_side_profile_id: rightId,
        };
      }),
      ctx.user!,
    );

    return (await ctx.profiles.loadProfile(args.profileId))!;
  },
});

export const removeProfileRelationship = mutationField("removeProfileRelationship", {
  description: "Disassociates two profiles with a relationship.",
  type: "Success",
  authorize: authenticateAnd(
    userHasFeatureFlag("PROFILES"),
    userHasAccessToProfile("profileId"),
    relationshipBelongsToProfile("profileId", "profileRelationshipIds"),
  ),
  args: {
    profileId: nonNull(globalIdArg("Profile")),
    profileRelationshipIds: nonNull(list(nonNull(globalIdArg("ProfileRelationship")))),
  },
  validateArgs: notEmptyArray("profileRelationshipIds"),
  resolve: async (_, args, ctx) => {
    const relationships = await ctx.profiles.removeProfileRelationships(
      args.profileRelationshipIds,
      ctx.user!,
    );

    const relationshipTypes = await ctx.profiles.loadProfileRelationshipType(
      relationships.map((r) => r.profile_relationship_type_id),
    );

    await ctx.profiles.createEvent(
      relationships.flatMap(
        (r) =>
          [
            {
              org_id: ctx.user!.org_id,
              profile_id: r.left_side_profile_id,
              type: "PROFILE_RELATIONSHIP_REMOVED",
              data: {
                user_id: ctx.user!.id,
                profile_relationship_id: r.id,
                profile_relationship_type_alias: relationshipTypes.find(
                  (rt) => rt!.id === r.profile_relationship_type_id,
                )!.alias,
                reason: "REMOVED_BY_USER",
              },
            },
            {
              org_id: ctx.user!.org_id,
              profile_id: r.right_side_profile_id,
              type: "PROFILE_RELATIONSHIP_REMOVED",
              data: {
                user_id: ctx.user!.id,
                profile_relationship_id: r.id,
                profile_relationship_type_alias: relationshipTypes.find(
                  (rt) => rt!.id === r.profile_relationship_type_id,
                )!.alias,
                reason: "REMOVED_BY_USER",
              },
            },
          ] satisfies ProfileRelationshipRemovedEvent<true>[],
      ),
    );

    return RESULT.SUCCESS;
  },
});

async function mapSingleResultData(
  profileTypeId: number,
  userId: number,
  parsedData: any,
  profiles: ProfileRepository,
) {
  const profileTypeFields = await profiles.loadProfileTypeFieldsByProfileTypeId(profileTypeId);
  const effectivePermissions = await profiles.loadProfileTypeFieldUserEffectivePermission(
    profileTypeFields.map((ptf) => ({ profileTypeFieldId: ptf.id, userId })),
  );
  const profileFieldsAndPermissions = zip(profileTypeFields, effectivePermissions);

  return uniqueBy(
    Object.entries(parsedData).map(([idOrAlias, content]) => {
      const [profileTypeField, permission] = profileFieldsAndPermissions.find(([ptf]) =>
        idOrAlias.startsWith("_.")
          ? ptf.id === parseInt(idOrAlias.slice(2), 10)
          : ptf.alias === idOrAlias,
      )!;
      return {
        profileTypeFieldId: profileTypeField.id,
        content: isAtLeast(permission, "READ") ? content : null,
      };
    }),
    // make sure to not return duplicated profileTypeFieldIds
    // (parsedData may contain the same property with alias and id index)
    (p) => p.profileTypeFieldId,
  ).sort((a, b) => {
    const ptfA = profileTypeFields.find((ptf) => ptf.id === a.profileTypeFieldId)!;
    const ptfB = profileTypeFields.find((ptf) => ptf.id === b.profileTypeFieldId)!;
    return ptfA.position - ptfB.position;
  });
}

export const profileExternalSourceSearch = mutationField("profileExternalSourceSearch", {
  type: nonNull("ProfileExternalSourceSearchResults"),
  authorize: authenticateAnd(
    userHasFeatureFlag("PROFILES"),
    userHasAccessToIntegrations("integrationId", ["PROFILE_EXTERNAL_SOURCE"], true),
    userHasAccessToProfileType("profileTypeId"),
    not(profileTypeIsArchived("profileTypeId")),
    profileTypeIsStandard("profileTypeId"),
    ifArgDefined(
      "profileId",
      and(
        userHasAccessToProfile("profileId" as never),
        profileHasStatus("profileId" as never, "OPEN"),
        profileIsNotAnonymized("profileId" as never),
        profileMatchesProfileType("profileId" as never, "profileTypeId"),
      ),
    ),
  ),
  args: {
    integrationId: nonNull(globalIdArg("OrgIntegration")),
    locale: nonNull("UserLocale"),
    search: nonNull("JSONObject"),
    profileTypeId: nonNull(globalIdArg("ProfileType")),
    profileId: nullable(globalIdArg("Profile")),
  },
  resolve: async (_, args, ctx) => {
    try {
      const data = await ctx.profileExternalSources.entitySearch(
        args.integrationId,
        args.profileTypeId,
        args.locale,
        args.search,
        ctx.user!,
      );

      if (data.type === "FOUND") {
        return {
          type: "FOUND",
          id: data.entity.id,
          profileId: args.profileId ?? null,
          data: await mapSingleResultData(
            args.profileTypeId,
            ctx.user!.id,
            data.entity.parsed_data,
            ctx.profiles,
          ),
        };
      } else {
        return {
          type: "MULTIPLE_RESULTS",
          totalCount: data.totalCount,
          results: data.results,
        };
      }
    } catch (error) {
      if (error instanceof ProfileExternalSourceRequestError) {
        if (error.status === 400) {
          throw new ApolloError(error.message, "BAD_REQUEST");
        }
        if (error.status === 401) {
          throw new ApolloError(error.message, "UNAUTHORIZED");
        }
        if (error.status === 402) {
          // Payment required: trying to search entity by id on a FREE eInforma plan
          throw new ApolloError(error.message, "PAYMENT_REQUIRED");
        }
        if (error.status === 404) {
          return {
            type: "MULTIPLE_RESULTS",
            totalCount: 0,
            results: { key: "id", columns: [], rows: [] },
          };
        }
      }
      throw error;
    }
  },
});

export const profileExternalSourceDetails = mutationField("profileExternalSourceDetails", {
  type: nonNull("ProfileExternalSourceSearchSingleResult"),
  authorize: authenticateAnd(
    userHasFeatureFlag("PROFILES"),
    userHasAccessToIntegrations("integrationId", ["PROFILE_EXTERNAL_SOURCE"], true),
    userHasAccessToProfileType("profileTypeId"),
    not(profileTypeIsArchived("profileTypeId")),
    profileTypeIsStandard("profileTypeId"),
    ifArgDefined(
      "profileId",
      and(
        userHasAccessToProfile("profileId" as never),
        profileHasStatus("profileId" as never, "OPEN"),
        profileIsNotAnonymized("profileId" as never),
        profileMatchesProfileType("profileId" as never, "profileTypeId"),
      ),
    ),
  ),
  args: {
    externalId: nonNull(idArg()),
    integrationId: nonNull(globalIdArg("OrgIntegration")),
    profileTypeId: nonNull(globalIdArg("ProfileType")),
    profileId: nullable(globalIdArg("Profile")),
  },
  resolve: async (_, args, ctx) => {
    try {
      const data = await ctx.profileExternalSources.entityDetails(
        args.integrationId,
        args.profileTypeId,
        args.externalId,
        ctx.user!,
      );

      return {
        type: "FOUND",
        id: data.entity.id,
        profileId: args.profileId ?? null,
        data: await mapSingleResultData(
          args.profileTypeId,
          ctx.user!.id,
          data.entity.parsed_data,
          ctx.profiles,
        ),
      };
    } catch (error) {
      if (error instanceof ProfileExternalSourceRequestError) {
        if (error.status === 400) {
          throw new ApolloError(error.message, "BAD_REQUEST");
        }
        if (error.status === 401) {
          throw new ApolloError(error.message, "UNAUTHORIZED");
        }
        if (error.status === 402) {
          // Payment required: trying to search entity by id on a FREE eInforma plan
          throw new ApolloError(error.message, "PAYMENT_REQUIRED");
        }
        if (error.status === 404) {
          throw new ApolloError(error.message, "ENTITY_NOT_FOUND");
        }
      }
      throw error;
    }
  },
});

export const completeProfileFromExternalSource = mutationField(
  "completeProfileFromExternalSource",
  {
    type: nonNull("Profile"),
    authorize: authenticateAnd(
      userHasFeatureFlag("PROFILES"),
      contextUserHasPermission("PROFILES:CREATE_PROFILES"),
      ifArgDefined(
        "profileId",
        and(
          userHasAccessToProfile("profileId" as never),
          profileHasStatus("profileId" as never, "OPEN"),
          profileIsNotAnonymized("profileId" as never),
          profileMatchesProfileType("profileId" as never, "profileTypeId"),
        ),
      ),
      userHasAccessToProfileType("profileTypeId"),
      not(profileTypeIsArchived("profileTypeId")),
      profileTypeIsStandard("profileTypeId"),
      userHasAccessToExternalSourceEntity("profileExternalSourceEntityId"),
      externalSourceEntityMatchesProfileTypeStandardType(
        "profileExternalSourceEntityId",
        "profileTypeId",
      ),
      userCanOverwriteProfileFields("profileTypeId", "conflictResolutions"),
    ),
    args: {
      profileExternalSourceEntityId: nonNull(globalIdArg("ProfileExternalSourceEntity")),
      profileTypeId: nonNull(globalIdArg("ProfileType")),
      profileId: nullable(globalIdArg("Profile")),
      conflictResolutions: nonNull(
        list(
          nonNull(
            inputObjectType({
              name: "ProfileExternalSourceConflictResolution",
              definition: (t) => {
                t.nonNull.globalId("profileTypeFieldId", { prefixName: "ProfileTypeField" });
                t.nonNull.field("action", {
                  type: enumType({
                    name: "ProfileExternalSourceConflictResolutionAction",
                    members: ["IGNORE", "OVERWRITE"],
                  }),
                });
              },
            }),
          ),
        ),
      ),
    },
    resolve: async (_, args, ctx) => {
      const entity = await ctx.profiles.loadProfileExternalSourceEntity(
        args.profileExternalSourceEntityId,
      );
      assert(entity, "ProfileExternalSourceEntity not found");

      const profileTypeFields = await ctx.profiles.loadProfileTypeFieldsByProfileTypeId(
        args.profileTypeId,
      );

      const missingResolutions: number[] = [];
      const fields: { content: any; profileTypeField: ProfileTypeField }[] = Object.entries(
        entity.parsed_data,
      )
        .map(([idOrAlias, content]) => {
          const profileTypeField = profileTypeFields.find((ptf) =>
            idOrAlias.startsWith("_.")
              ? ptf.id === parseInt(idOrAlias.slice(2), 10)
              : ptf.alias === idOrAlias,
          );
          assert(profileTypeField, `ProfileTypeField with alias ${idOrAlias} not found`);

          // check conflict resolution (no matter if the current value is the same as the external source)
          // in this flow there is no need to check if current value exists or is different from incoming
          // every field defined in entity.parsed_data will need a conflict resolution
          const resolution = args.conflictResolutions.find(
            (r) => r.profileTypeFieldId === profileTypeField.id,
          );
          if (!resolution) {
            missingResolutions.push(profileTypeField.id);
          } else if (resolution.action === "OVERWRITE") {
            return { content, profileTypeField };
          }

          // resolution.action === "IGNORE"
          // keep current value
          return null;
        })
        .filter(isNonNullish)
        .sort((a, b) => {
          const ptfA = profileTypeFields.find((ptf) => ptf.id === a.profileTypeField.id)!;
          const ptfB = profileTypeFields.find((ptf) => ptf.id === b.profileTypeField.id)!;
          return ptfA.position - ptfB.position;
        });

      if (missingResolutions.length > 0) {
        throw new ApolloError(
          "Missing conflict resolutions for profileTypeFieldIds",
          "MISSING_CONFLICT_RESOLUTIONS",
          {
            missingResolutions: missingResolutions.map((id) => toGlobalId("ProfileTypeField", id)),
          },
        );
      }

      const aggregatedErrors: { profileTypeFieldId: string; error: string; content: any }[] = [];
      for (const field of fields) {
        try {
          // fields should already be validated as entity.parsed_data is validated before storing it on DB
          // just in case, validate again
          await ctx.profileValidation.validateProfileFieldValueContent(
            field.profileTypeField,
            field.content,
          );
        } catch (error) {
          aggregatedErrors.push({
            profileTypeFieldId: toGlobalId("ProfileTypeField", field.profileTypeField.id),
            error: error instanceof Error ? error.message : "UNKNOWN",
            content: field.content,
          });
        }
      }
      if (aggregatedErrors.length > 0) {
        throw new ApolloError("Validation errors on profile field values", "VALIDATION_ERRORS", {
          errors: aggregatedErrors,
        });
      }

      const profile = args.profileId
        ? await ctx.profiles.loadProfile(args.profileId)
        : await ctx.profiles.createProfile(
            {
              localizable_name: { en: "", es: "" },
              org_id: ctx.user!.org_id,
              profile_type_id: args.profileTypeId,
            },
            ctx.user!.id,
          );
      assert(profile, "Profile not found");

      if (fields.length > 0) {
        const _fields = fields.map((f) => ({
          profileTypeFieldId: f.profileTypeField.id,
          type: f.profileTypeField.type,
          content: f.content,
          alias: f.profileTypeField.alias,
        }));

        const {
          currentValues,
          previousValues,
          profile: updatedProfile,
        } = await ctx.profiles.updateProfileFieldValue(
          profile.id,
          _fields,
          ctx.user!.id,
          entity.integration_id,
        );

        await ctx.profiles.createProfileUpdatedEvents(
          profile.id,
          buildProfileUpdatedEventsData(
            profile.id,
            _fields,
            currentValues,
            previousValues,
            ctx.user!,
            entity.integration_id,
          ),
          ctx.user!.org_id,
          ctx.user!.id,
        );

        return updatedProfile!;
      }

      return profile;
    },
  },
);

export const pinProfileType = mutationField("pinProfileType", {
  description: "Pins a profile type to the user's navigation manu",
  type: "ProfileType",
  authorize: authenticateAnd(
    userHasFeatureFlag("PROFILES"),
    userHasAccessToProfileType("profileTypeId"),
  ),
  args: {
    profileTypeId: nonNull(globalIdArg("ProfileType")),
  },
  resolve: async (_, { profileTypeId }, ctx) => {
    await ctx.profiles.pinProfileType(profileTypeId, ctx.user!.id);
    const profileType = await ctx.profiles.loadProfileType(profileTypeId);
    assert(profileType, "ProfileType not found");

    return profileType;
  },
});

export const unpinProfileType = mutationField("unpinProfileType", {
  description: "Unpins a profile type to the user's navigation manu",
  type: "ProfileType",
  authorize: authenticateAnd(
    userHasFeatureFlag("PROFILES"),
    userHasAccessToProfileType("profileTypeId"),
  ),
  args: {
    profileTypeId: nonNull(globalIdArg("ProfileType")),
  },
  resolve: async (_, { profileTypeId }, ctx) => {
    await ctx.profiles.unpinProfileType(profileTypeId, ctx.user!.id);
    const profileType = await ctx.profiles.loadProfileType(profileTypeId);
    assert(profileType, "ProfileType not found");

    return profileType;
  },
});

export const createProfileTypeProcess = mutationField("createProfileTypeProcess", {
  description: "Creates and associates a key process on a profile type",
  type: nonNull("ProfileTypeProcess"),
  args: {
    profileTypeId: nonNull(globalIdArg("ProfileType")),
    processName: nonNull("LocalizableUserText"),
    templateIds: nonNull(list(nonNull(globalIdArg("Petition")))),
  },
  authorize: authenticateAnd(
    userHasFeatureFlag("PROFILES"),
    contextUserHasPermission("PROFILE_TYPES:CRUD_PROFILE_TYPES"),
    userHasAccessToProfileType("profileTypeId"),
    userHasAccessToPetitions("templateIds"),
    petitionsAreOfTypeTemplate("templateIds"),
    petitionsAreNotPublicTemplates("templateIds"),
  ),
  validateArgs: validateAnd(notEmptyArray("templateIds"), uniqueValues("templateIds")),
  resolve: async (_, args, ctx) => {
    try {
      const profileTypeProcess = await ctx.profiles.createProfileTypeProcess(
        { process_name: args.processName, profile_type_id: args.profileTypeId },
        `User:${ctx.user!.id}`,
      );

      await ctx.profiles.assignTemplatesToProfileTypeProcess(
        profileTypeProcess.id,
        args.templateIds,
        `User:${ctx.user!.id}`,
      );

      return profileTypeProcess;
    } catch (error) {
      if (error instanceof Error && error.message === "MAX_PROCESS_LIMIT_REACHED") {
        throw new ForbiddenError("You can't create more than 3 key processes on a profile type");
      }

      throw error;
    }
  },
});

export const editProfileTypeProcess = mutationField("editProfileTypeProcess", {
  type: nonNull("ProfileTypeProcess"),
  authorize: authenticateAnd(
    userHasFeatureFlag("PROFILES"),
    contextUserHasPermission("PROFILE_TYPES:CRUD_PROFILE_TYPES"),
    userHasAccessToProfileTypeProcess("profileTypeProcessId"),
    userHasAccessToEditProfileTypeProcessInput("data"),
  ),
  args: {
    profileTypeProcessId: nonNull(globalIdArg("ProfileTypeProcess")),
    data: nonNull(
      inputObjectType({
        name: "EditProfileTypeProcessInput",
        definition(t) {
          t.nullable.localizableUserText("processName");
          t.nullable.list.nonNull.globalId("templateIds", { prefixName: "Petition" });
        },
      }),
    ),
  },
  validateArgs: validateAnd(
    notEmptyObject("data"),
    notEmptyArray("data.templateIds"),
    uniqueValues("data.templateIds"),
  ),
  resolve: async (_, args, ctx) => {
    const data: Partial<ProfileTypeProcess> = {};

    if (isNonNullish(args.data.processName)) {
      data.process_name = args.data.processName;
    }

    if (isNonNullish(args.data.templateIds)) {
      await ctx.profiles.deleteProfileTypeProcessTemplates(args.profileTypeProcessId);
      await ctx.profiles.assignTemplatesToProfileTypeProcess(
        args.profileTypeProcessId,
        args.data.templateIds,
        `User:${ctx.user!.id}`,
      );
    }

    return await ctx.profiles.editProfileTypeProcess(
      args.profileTypeProcessId,
      data,
      `User:${ctx.user!.id}`,
    );
  },
});

export const removeProfileTypeProcess = mutationField("removeProfileTypeProcess", {
  type: "ProfileType",
  authorize: authenticateAnd(
    userHasFeatureFlag("PROFILES"),
    contextUserHasPermission("PROFILE_TYPES:CRUD_PROFILE_TYPES"),
    userHasAccessToProfileTypeProcess("profileTypeProcessId"),
  ),
  args: {
    profileTypeProcessId: nonNull(globalIdArg("ProfileTypeProcess")),
  },
  resolve: async (_, { profileTypeProcessId }, ctx) => {
    const process = await ctx.profiles.removeProfileTypeProcess(
      profileTypeProcessId,
      `User:${ctx.user!.id}`,
    );

    return (await ctx.profiles.loadProfileType(process.profile_type_id))!;
  },
});

export const updateProfileTypeProcessPositions = mutationField(
  "updateProfileTypeProcessPositions",
  {
    type: "ProfileType",
    authorize: authenticateAnd(
      userHasFeatureFlag("PROFILES"),
      contextUserHasPermission("PROFILE_TYPES:CRUD_PROFILE_TYPES"),
      userHasAccessToProfileType("profileTypeId"),
      profileTypeProcessBelongsToProfileType("profileTypeProcessIds", "profileTypeId"),
    ),
    args: {
      profileTypeId: nonNull(globalIdArg("ProfileType")),
      profileTypeProcessIds: nonNull(list(nonNull(globalIdArg("ProfileTypeProcess")))),
    },
    resolve: async (_, args, ctx) => {
      const processes = await ctx.profiles.loadProfileTypeProcessesByProfileTypeId(
        args.profileTypeId,
      );

      const currentOrder = processes.map((p) => p.id);

      if (
        currentOrder.length !== unique(args.profileTypeProcessIds).length ||
        currentOrder.some((p) => !args.profileTypeProcessIds.includes(p))
      ) {
        throw new ForbiddenError("Invalid profileTypeProcessIds");
      }

      await ctx.profiles.updateProfileTypeProcessPositions(
        args.profileTypeId,
        args.profileTypeProcessIds,
        `User:${ctx.user!.id}`,
      );

      ctx.profiles.loadProfileTypeProcessesByProfileTypeId.dataloader.clear(args.profileTypeId);

      return (await ctx.profiles.loadProfileType(args.profileTypeId))!;
    },
  },
);

export const profileImportExcelModelDownloadLink = mutationField(
  "profileImportExcelModelDownloadLink",
  {
    description: "Generates a download link for an excel model for profile import",
    type: "String",
    authorize: authenticateAnd(userHasAccessToProfileType("profileTypeId")),
    args: {
      profileTypeId: nonNull(globalIdArg("ProfileType")),
      locale: nonNull("UserLocale"),
    },
    resolve: async (_, { profileTypeId, locale }, ctx) => {
      const { stream, filename, contentType } =
        await ctx.profileImport.generateProfileImportExcelModel(profileTypeId, locale, ctx.user!);

      const path = random(16);
      await ctx.storage.temporaryFiles.uploadFile(path, contentType, stream);
      return await ctx.storage.temporaryFiles.getSignedDownloadEndpoint(
        path,
        filename,
        "attachment",
      );
    },
  },
);
