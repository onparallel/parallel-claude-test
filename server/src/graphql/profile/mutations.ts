import { PresignedPost } from "@aws-sdk/s3-presigned-post";
import {
  arg,
  booleanArg,
  inputObjectType,
  list,
  mutationField,
  nonNull,
  nullable,
  stringArg,
} from "nexus";
import pMap from "p-map";
import { DatabaseError } from "pg";
import { indexBy, isDefined, zip } from "remeda";
import {
  CreateProfileType,
  CreateProfileTypeField,
  FileUpload,
  Profile,
  ProfileFieldFile,
  ProfileTypeField,
} from "../../db/__types";
import {
  defaultProfileTypeFieldOptions,
  validateProfileTypeFieldOptions,
} from "../../db/helpers/profileTypeFieldOptions";
import { toBytes } from "../../util/fileSize";
import { fromGlobalId } from "../../util/globalId";
import { parseTextWithPlaceholders } from "../../util/slate/placeholders";
import { random } from "../../util/token";
import { RESULT } from "../helpers/Result";
import { SUCCESS } from "../helpers/Success";
import { authenticateAnd, ifArgDefined, not } from "../helpers/authorize";
import { ApolloError, ArgValidationError, ForbiddenError } from "../helpers/errors";
import { globalIdArg } from "../helpers/globalIdPlugin";
import { dateArg } from "../helpers/scalars/DateTime";
import { validateAnd, validateOr } from "../helpers/validateArgs";
import { maxLength } from "../helpers/validators/maxLength";
import { notEmptyArray } from "../helpers/validators/notEmptyArray";
import { notEmptyObject } from "../helpers/validators/notEmptyObject";
import { validFileUploadInput } from "../helpers/validators/validFileUploadInput";
import { validIsNotUndefined } from "../helpers/validators/validIsDefined";
import { validLocalizableUserText } from "../helpers/validators/validLocalizableUserText";
import { validateRegex } from "../helpers/validators/validateRegex";
import {
  petitionIsNotAnonymized,
  petitionsAreNotPublicTemplates,
  repliesBelongsToPetition,
  replyIsForFieldOfType,
  userHasAccessToPetitions,
  userHasFeatureFlag,
} from "../petition/authorizers";
import { userHasAccessToUserAndUserGroups } from "../petition/mutations/authorizers";
import { contextUserHasPermission } from "../users/authorizers";
import {
  contextUserCanSubscribeUsersToProfile,
  fileUploadCanBeAttachedToProfileTypeField,
  profileFieldFileHasProfileTypeFieldId,
  profileHasProfileTypeFieldId,
  profileHasStatus,
  profileIsAssociatedToPetition,
  profileIsNotAnonymized,
  profileTypeFieldBelongsToProfileType,
  profileTypeFieldIsOfType,
  profileTypeIsArchived,
  userHasAccessToProfile,
  userHasAccessToProfileType,
  userHasPermissionOnProfileTypeField,
} from "./authorizers";
import {
  validProfileNamePattern,
  validProfileTypeFieldOptions,
  validateProfileFieldValue,
} from "./validators";

export const createProfileType = mutationField("createProfileType", {
  type: "ProfileType",
  authorize: authenticateAnd(
    userHasFeatureFlag("PROFILES"),
    contextUserHasPermission("PROFILE_TYPES:CRUD_PROFILE_TYPES"),
  ),
  args: {
    name: nonNull(arg({ type: "LocalizableUserText" })),
  },
  resolve: async (_, args, ctx) => {
    return await ctx.profilesSetup.createDefaultProfileType(
      ctx.user!.org_id,
      args.name,
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
    profileNamePattern: stringArg(),
  },
  validateArgs: validateAnd(
    validLocalizableUserText((args) => args.name, "data.name", { maxLength: 200 }),
    validProfileNamePattern("profileTypeId", "profileNamePattern"),
  ),
  resolve: async (_, { profileTypeId, name, profileNamePattern }, ctx) => {
    const updateData: Partial<CreateProfileType> = {};

    if (isDefined(name)) {
      updateData.name = name;
    }
    await ctx.profiles.updateProfileType(profileTypeId, updateData, `User:${ctx.user!.id}`);
    if (isDefined(profileNamePattern)) {
      const pattern = parseTextWithPlaceholders(profileNamePattern).map((p) =>
        p.type === "placeholder" ? fromGlobalId(p.value, "ProfileTypeField").id : p.text,
      );
      await ctx.profiles.updateProfileTypeProfileNamePattern(
        profileTypeId,
        pattern,
        `User:${ctx.user!.id}`,
      );
    }
    return (await ctx.profiles.loadProfileType(profileTypeId, { refresh: true }))!;
  },
});

export const cloneProfileType = mutationField("cloneProfileType", {
  type: nonNull("ProfileType"),
  authorize: authenticateAnd(
    userHasFeatureFlag("PROFILES"),
    userHasAccessToProfileType("profileTypeId"),
    contextUserHasPermission("PROFILE_TYPES:CRUD_PROFILE_TYPES"),
  ),
  args: {
    profileTypeId: nonNull(globalIdArg("ProfileType")),
    name: arg({ type: "LocalizableUserText" }),
  },
  validateArgs: validateAnd(
    validLocalizableUserText((args) => args.name, "data.name", { maxLength: 200 }),
  ),
  resolve: async (_, { profileTypeId, name }, ctx) => {
    const createData: Partial<CreateProfileType> = {};

    if (isDefined(name)) {
      createData.name = name;
    }
    return await ctx.profiles.cloneProfileType(profileTypeId, createData, `User:${ctx.user!.id}`);
  },
});

export const deleteProfileType = mutationField("deleteProfileType", {
  type: "Success",
  authorize: authenticateAnd(
    userHasFeatureFlag("PROFILES"),
    userHasAccessToProfileType("profileTypeIds"),
    profileTypeIsArchived("profileTypeIds"),
    contextUserHasPermission("PROFILE_TYPES:CRUD_PROFILE_TYPES"),
  ),
  args: {
    profileTypeIds: nonNull(list(nonNull(globalIdArg("ProfileType")))),
  },
  resolve: async (_, { profileTypeIds }, ctx) => {
    await ctx.profiles.withTransaction(async (t) => {
      await ctx.profiles.deleteProfilesByProfileTypeId(profileTypeIds, `User:${ctx.user!.id}`, t);
      await ctx.profiles.deleteProfileTypeFieldsByProfileTypeId(
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
    notEmptyObject((args) => args.data, "data"),
    validLocalizableUserText((args) => args.data.name, "data.name", { maxLength: 200 }),
    maxLength((args) => args.data.alias, "data.alias", 100),
    validateRegex((args) => args.data.alias, "data.alias", /^[A-Za-z0-9_]+$/),
    validProfileTypeFieldOptions("data", "data"),
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
      const [profileTypeField] = await ctx.profiles.createProfileTypeField(
        args.profileTypeId,
        {
          name: args.data.name,
          type: args.data.type,
          alias: args.data.alias || null,
          is_expirable: args.data.isExpirable ?? false,
          expiry_alert_ahead_time: args.data.isExpirable ? args.data.expiryAlertAheadTime : null,
          options: args.data.options ?? defaultProfileTypeFieldOptions(args.data.type),
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
    notEmptyObject((args) => args.data, "data"),
    maxLength((args) => args.data.name?.en, "data.name.en", 500),
    maxLength((args) => args.data.name?.es, "data.name.es", 500),
    maxLength((args) => args.data.alias, "data.alias", 100),
    validateRegex((args) => args.data.alias, "data.alias", /^[A-Za-z0-9_]+$/),
  ),
  resolve: async (_, args, ctx, info) => {
    const updateData: Partial<CreateProfileTypeField> = {};
    const profileTypeField = (await ctx.profiles.loadProfileTypeField(args.profileTypeFieldId))!;
    if (isDefined(args.data.name)) {
      updateData.name = { ...profileTypeField.name, ...args.data.name };
    }

    if (args.data.alias !== undefined) {
      updateData.alias = args.data.alias;
    }
    if (isDefined(args.data.isExpirable)) {
      updateData.is_expirable = args.data.isExpirable;
      updateData.expiry_alert_ahead_time = args.data.isExpirable
        ? args.data.expiryAlertAheadTime
        : null;
    }

    if (isDefined(args.data.options)) {
      try {
        const options = { ...profileTypeField.options, ...args.data.options };
        validateProfileTypeFieldOptions(profileTypeField.type, options);
        updateData.options = options;
      } catch (e) {
        if (e instanceof Error) {
          throw new ArgValidationError(info, "data.options", e.message);
        }
        throw e;
      }
    }

    try {
      return await ctx.profiles.withTransaction(async (t) => {
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
          await ctx.profiles.updateProfileFieldValuesByProfileTypeFieldId(
            args.profileTypeFieldId,
            { expiry_date: null },
            t,
          );
          await ctx.profiles.updateProfileFieldFilesByProfileTypeFieldId(
            args.profileTypeFieldId,
            { expiry_date: null },
            t,
          );
        }
        return await ctx.profiles.updateProfileTypeField(
          args.profileTypeFieldId,
          updateData,
          `User:${ctx.user!.id}`,
          t,
        );
      });
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

export const updateProfileTypeFieldPermission = mutationField("updateProfileTypeFieldPermission", {
  description:
    "Updates the default permission for a profile type field for a set of users and/or user groups.",
  type: "ProfileTypeField",
  authorize: authenticateAnd(
    userHasFeatureFlag("PROFILES"),
    contextUserHasPermission("PROFILE_TYPES:CRUD_PROFILE_TYPES"),
    userHasAccessToProfileType("profileTypeId"),
    profileTypeFieldBelongsToProfileType("profileTypeFieldId", "profileTypeId"),
    userHasAccessToUserAndUserGroups("data"),
  ),
  args: {
    profileTypeId: nonNull(globalIdArg("ProfileType")),
    profileTypeFieldId: nonNull(globalIdArg("ProfileTypeField")),
    defaultPermission: "ProfileTypeFieldPermissionType",
    data: nonNull(
      list(
        nonNull(
          inputObjectType({
            name: "UpdateProfileTypeFieldPermissionInput",
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
    if (args.defaultPermission === "HIDDEN") {
      const profileType = await ctx.profiles.loadProfileType(args.profileTypeId);
      if (profileType!.profile_name_pattern.includes(args.profileTypeFieldId)) {
        throw new ApolloError(
          "Cannot set this field to HIDDEN because it is being used as part of the profile name",
          "PROFILE_TYPE_FIELD_IS_PART_OF_PROFILE_NAME",
        );
      }
    }
    if (isDefined(args.defaultPermission)) {
      await ctx.profiles.updateProfileTypeField(
        args.profileTypeFieldId,
        { permission: args.defaultPermission },
        `User:${ctx.user!.id}`,
      );
    }

    await ctx.profiles.resetProfileTypeFieldPermission(
      args.profileTypeFieldId,
      args.data as any,
      `User:${ctx.user!.id}`,
    );

    return (await ctx.profiles.loadProfileTypeField(args.profileTypeFieldId, { refresh: true }))!;
  },
});

export const deleteProfileTypeField = mutationField("deleteProfileTypeField", {
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
  ),
  args: {
    profileTypeId: nonNull(globalIdArg("ProfileType")),
    subscribe: booleanArg({ description: "Subscribe the context user to profile notifications" }),
  },
  resolve: async (_, args, ctx) => {
    const profile = await ctx.profiles.createProfile(
      { name: "", org_id: ctx.user!.org_id, profile_type_id: args.profileTypeId },
      ctx.user!.id,
    );

    if (args.subscribe) {
      await ctx.profiles.subscribeUsersToProfiles(
        [profile.id],
        [ctx.user!.id],
        `User:${ctx.user!.id}}`,
      );
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
    return SUCCESS;
  },
});

export const updateProfileFieldValue = mutationField("updateProfileFieldValue", {
  type: "Profile",
  authorize: authenticateAnd(
    userHasFeatureFlag("PROFILES"),
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
      !isDefined(profile) ||
      profileTypeFields.some(
        (p) => !isDefined(p) || p.profile_type_id !== profile!.profile_type_id || p.type === "FILE",
      )
    ) {
      throw new ForbiddenError("Not authorized");
    }
    const profileTypeFieldsById = indexBy(profileTypeFields as ProfileTypeField[], (ptf) => ptf.id);
    // validate contents and expiryDate
    const values = await ctx.profiles.loadProfileFieldValuesByProfileId(profileId);
    const valuesByPtfId = indexBy(values, (v) => v.profile_type_field_id);

    const fieldsWithZonedExpires = fields.map((field) => {
      const profileTypeField = profileTypeFieldsById[field.profileTypeFieldId];

      if (isDefined(field.content)) {
        try {
          validateProfileFieldValue(profileTypeField, field.content);
        } catch (e) {
          if (e instanceof Error) {
            throw new ApolloError(
              `Invalid profile field value: ${e.message}`,
              "INVALID_PROFILE_FIELD_VALUE",
            );
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
        throw new ApolloError(`Can't set expiry when removing a field`, "EXPIRY_ON_REMOVED_FIELD");
      }
      if (
        field.expiryDate !== undefined &&
        field.content === undefined &&
        !isDefined(valuesByPtfId[field.profileTypeFieldId])
      ) {
        throw new ApolloError(
          `Can't set expiry on a field with no value`,
          "EXPIRY_ON_NONEXISTING_VALUE",
        );
      }

      return {
        ...field,
        type: profileTypeField.type,
        expiryDate: field.expiryDate
          ? // priorize expiryDate argument if set
            field.expiryDate
          : // else, check option useReplyAsExpiryDate for DATE replies
            profileTypeField.type === "DATE" &&
              profileTypeField.options.useReplyAsExpiryDate &&
              isDefined(field.content?.value)
            ? (field.content!.value as string)
            : null,
      };
    });

    return (await ctx.profiles.updateProfileFieldValue(
      profileId,
      fieldsWithZonedExpires,
      ctx.user!.id,
    ))!;
  },
});

export const createProfileFieldFileUploadLink = mutationField("createProfileFieldFileUploadLink", {
  type: "ProfileFieldPropertyAndFileWithUploadData",
  authorize: authenticateAnd(
    userHasFeatureFlag("PROFILES"),
    userHasAccessToProfile("profileId"),
    profileHasStatus("profileId", "OPEN"),
    profileIsNotAnonymized("profileId"),
    profileHasProfileTypeFieldId("profileId", "profileTypeFieldId"),
    userHasPermissionOnProfileTypeField((args) => [args.profileTypeFieldId], "WRITE"),
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
    validFileUploadInput((args) => args.data, { maxSizeBytes: toBytes(100, "MB") }, "data"),
    validateOr(
      notEmptyArray((args) => args.data, "data"),
      validIsNotUndefined((args) => args.expiryDate, "expiryDate"),
    ),
  ),
  resolve: async (_, { profileId, profileTypeFieldId, data, expiryDate }, ctx) => {
    let fileUploads: FileUpload[] = [];
    let presignedPostDatas: PresignedPost[] = [];
    let files: ProfileFieldFile[] = [];

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
    } else {
      // no new files, update expiryDate on all uploaded files
      await ctx.profiles.updateProfileFieldFilesExpiryDate(
        profileId,
        profileTypeFieldId,
        expiryDate ?? null,
      );

      await ctx.profiles.createEvent({
        type: "PROFILE_FIELD_EXPIRY_UPDATED",
        org_id: ctx.user!.org_id,
        profile_id: profileId,
        data: {
          user_id: ctx.user!.id,
          expiry_date: expiryDate ?? null,
          profile_type_field_id: profileTypeFieldId,
        },
      });
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
    userHasAccessToProfile("profileId"),
    profileHasStatus("profileId", "OPEN"),
    profileIsNotAnonymized("profileId"),
    profileHasProfileTypeFieldId("profileId", "profileTypeFieldId"),
    userHasPermissionOnProfileTypeField((args) => [args.profileTypeFieldId], "WRITE"),
    profileTypeFieldIsOfType("profileTypeFieldId", ["FILE"]),
  ),
  args: {
    profileId: nonNull(globalIdArg("Profile")),
    profileTypeFieldId: nonNull(globalIdArg("ProfileTypeField")),
    profileFieldFileIds: nonNull(list(nonNull(globalIdArg("ProfileFieldFile")))),
  },
  validateArgs: notEmptyArray((args) => args.profileFieldFileIds, "profileFieldFileIds"),
  resolve: async (_, { profileId, profileTypeFieldId, profileFieldFileIds }, ctx) => {
    const profileFieldFiles = await ctx.profiles.loadProfileFieldFileById(profileFieldFileIds);
    if (
      profileFieldFiles.some(
        (pff) =>
          !isDefined(pff) ||
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
    userHasAccessToProfile("profileId"),
    profileHasStatus("profileId", "OPEN"),
    profileIsNotAnonymized("profileId"),
    profileHasProfileTypeFieldId("profileId", "profileTypeFieldId"),
    ifArgDefined(
      "profileFieldFileIds",
      profileFieldFileHasProfileTypeFieldId("profileFieldFileIds" as never, "profileTypeFieldId"),
    ),
    profileTypeFieldIsOfType("profileTypeFieldId", ["FILE"]),
    userHasPermissionOnProfileTypeField((args) => [args.profileTypeFieldId], "WRITE"),
  ),
  args: {
    profileId: nonNull(globalIdArg("Profile")),
    profileTypeFieldId: nonNull(globalIdArg("ProfileTypeField")),
    profileFieldFileIds: list(nonNull(globalIdArg("ProfileFieldFile"))),
  },
  resolve: async (_, { profileId, profileFieldFileIds, profileTypeFieldId }, ctx) => {
    try {
      let deletedProfileFieldFiles: ProfileFieldFile[] = [];
      if (isDefined(profileFieldFileIds)) {
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

      await ctx.profiles.createEvent(
        deletedProfileFieldFiles.map((f) => ({
          type: "PROFILE_FIELD_FILE_REMOVED",
          profile_id: profileId,
          org_id: ctx.user!.org_id,
          data: {
            user_id: ctx.user!.id,
            profile_type_field_id: profileTypeFieldId,
            profile_field_file_id: f.id,
          },
        })),
      );

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
    userHasAccessToProfile("profileId"),
    profileHasStatus("profileId", "OPEN"),
    profileIsNotAnonymized("profileId"),
    profileHasProfileTypeFieldId("profileId", "profileTypeFieldId"),
    userHasAccessToPetitions("petitionId"),
    petitionIsNotAnonymized("petitionId"),
    repliesBelongsToPetition("petitionId", "fileReplyIds"),
    replyIsForFieldOfType("fileReplyIds", ["FILE_UPLOAD", "ES_TAX_DOCUMENTS", "DOW_JONES_KYC"]),
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
        ? (await ctx.petitions.loadFieldReply(fileReplyIds)).filter(isDefined)
        : [];

    const fileUploadIds = fileReplies
      .filter((r) => !isDefined(r.content.error) && isDefined(r.content.file_upload_id))
      .map((r) => r.content.file_upload_id as number);

    const clonedFiles = await ctx.files.cloneFileUpload(fileUploadIds);

    return await ctx.profiles.createProfileFieldFiles(
      profileId,
      profileTypeFieldId,
      clonedFiles.map((f) => f.id),
      expiryDate,
      ctx.user!.id,
    );
  },
});

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
    userHasPermissionOnProfileTypeField((args) => [args.profileTypeFieldId], "READ"),
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
  validateArgs: validateAnd(
    notEmptyArray((args) => args.userIds, "userIds"),
    notEmptyArray((args) => args.profileIds, "profileIds"),
  ),
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
  validateArgs: validateAnd(
    notEmptyArray((args) => args.userIds, "userIds"),
    notEmptyArray((args) => args.profileIds, "profileIds"),
  ),
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
    try {
      const petitionProfile = await ctx.profiles.associateProfileToPetition(
        profileId,
        petitionId,
        `User:${ctx.user!.id}`,
      );

      await ctx.petitions.createEvent({
        type: "PROFILE_ASSOCIATED",
        petition_id: petitionId,
        data: {
          user_id: ctx.user!.id,
          profile_id: profileId,
        },
      });
      await ctx.profiles.createEvent({
        type: "PETITION_ASSOCIATED",
        org_id: ctx.user!.org_id,
        profile_id: profileId,
        data: {
          user_id: ctx.user!.id,
          petition_id: petitionId,
        },
      });

      return petitionProfile;
    } catch (e) {
      if (
        e instanceof DatabaseError &&
        e.constraint === "petition_profile__petition_id__profile_id"
      ) {
        throw new ApolloError(
          "Profile already associated to petition",
          "PROFILE_ALREADY_ASSOCIATED_TO_PETITION",
        );
      }

      throw e;
    }
  },
});

export const disassociateProfileFromPetition = mutationField("disassociateProfileFromPetition", {
  description: "Disassociates a profile from a petition",
  type: "Success",
  authorize: authenticateAnd(
    userHasFeatureFlag("PROFILES"),
    userHasAccessToPetitions("petitionId", ["OWNER", "WRITE"]),
    userHasAccessToProfile("profileIds"),
    profileIsNotAnonymized("profileIds"),
    petitionIsNotAnonymized("petitionId"),
    profileIsAssociatedToPetition("profileIds", "petitionId"),
    profileHasStatus("profileIds", ["OPEN", "CLOSED"]),
  ),
  args: {
    petitionId: nonNull(globalIdArg("Petition")),
    profileIds: nonNull(list(nonNull(globalIdArg("Profile")))),
  },
  resolve: async (_, { petitionId, profileIds }, ctx) => {
    await ctx.profiles.disassociateProfileFromPetition([petitionId], profileIds);

    await ctx.petitions.createEvent(
      profileIds.map((profileId) => ({
        type: "PROFILE_DISASSOCIATED",
        petition_id: petitionId,
        data: {
          user_id: ctx.user!.id,
          profile_id: profileId,
        },
      })),
    );

    await ctx.profiles.createEvent(
      profileIds.map((profileId) => ({
        type: "PETITION_DISASSOCIATED",
        org_id: ctx.user!.org_id,
        profile_id: profileId,
        data: {
          user_id: ctx.user!.id,
          petition_id: petitionId,
        },
      })),
    );

    return RESULT.SUCCESS;
  },
});

export const disassociatePetitionFromProfile = mutationField("disassociatePetitionFromProfile", {
  description: "Disassociates a petition from a profile",
  type: "Success",
  authorize: authenticateAnd(
    userHasFeatureFlag("PROFILES"),
    userHasAccessToPetitions("petitionIds", ["OWNER", "WRITE"]),
    userHasAccessToProfile("profileId"),
    profileIsNotAnonymized("profileId"),
    petitionIsNotAnonymized("petitionIds"),
    profileIsAssociatedToPetition("profileId", "petitionIds"),
    profileHasStatus("profileId", ["OPEN", "CLOSED"]),
  ),
  args: {
    profileId: nonNull(globalIdArg("Profile")),
    petitionIds: nonNull(list(nonNull(globalIdArg("Petition")))),
  },
  resolve: async (_, { profileId, petitionIds }, ctx) => {
    await ctx.profiles.disassociateProfileFromPetition(petitionIds, [profileId]);

    await ctx.petitions.createEvent(
      petitionIds.map((petitionId) => ({
        type: "PROFILE_DISASSOCIATED",
        petition_id: petitionId,
        data: {
          user_id: ctx.user!.id,
          profile_id: profileId,
        },
      })),
    );

    await ctx.profiles.createEvent(
      petitionIds.map((petitionId) => ({
        type: "PETITION_DISASSOCIATED",
        org_id: ctx.user!.org_id,
        profile_id: profileId,
        data: {
          user_id: ctx.user!.id,
          petition_id: petitionId,
        },
      })),
    );

    return RESULT.SUCCESS;
  },
});

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
