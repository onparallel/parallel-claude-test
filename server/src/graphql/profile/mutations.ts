import { format, zonedTimeToUtc } from "date-fns-tz";
import { arg, inputObjectType, list, mutationField, nonNull, stringArg } from "nexus";
import pMap from "p-map";
import { DatabaseError } from "pg";
import { indexBy, isDefined, zip } from "remeda";
import {
  defaultProfileTypeFieldOptions,
  validateProfileTypeFieldOptions,
} from "../../db/helpers/profileTypeFieldOptions";
import {
  CreateProfileType,
  CreateProfileTypeField,
  ProfileFieldFile,
  ProfileTypeField,
} from "../../db/__types";
import { toBytes } from "../../util/fileSize";
import { fromGlobalId } from "../../util/globalId";
import { parseTextWithPlaceholders } from "../../util/textWithPlaceholders";
import { random } from "../../util/token";
import { authenticateAnd } from "../helpers/authorize";
import { ApolloError, ArgValidationError, ForbiddenError } from "../helpers/errors";
import { globalIdArg } from "../helpers/globalIdPlugin";
import { datetimeArg } from "../helpers/scalars/DateTime";
import { SUCCESS } from "../helpers/Success";
import { validateAnd } from "../helpers/validateArgs";
import { maxLength } from "../helpers/validators/maxLength";
import { notEmptyArray } from "../helpers/validators/notEmptyArray";
import { notEmptyObject } from "../helpers/validators/notEmptyObject";
import { validateRegex } from "../helpers/validators/validateRegex";
import { validFileUploadInput } from "../helpers/validators/validFileUploadInput";
import { validLocalizableUserText } from "../helpers/validators/validLocalizableUserText";
import { userHasFeatureFlag } from "../petition/authorizers";
import { contextUserHasRole } from "../users/authorizers";
import {
  profileHasProfileTypeFieldId,
  profileTypeFieldBelongsToProfileType,
  profileTypeFieldIsOfType,
  userHasAccessToProfile,
  userHasAccessToProfileType,
} from "./authorizers";
import { validateProfileFieldValue, validProfileNamePattern } from "./validators";

export const createProfileType = mutationField("createProfileType", {
  type: "ProfileType",
  authorize: authenticateAnd(userHasFeatureFlag("PROFILES"), contextUserHasRole("ADMIN")),
  args: {
    name: nonNull(arg({ type: "LocalizableUserText" })),
  },
  resolve: async (_, args, ctx) => {
    return await ctx.profilesSetup.createDefaultProfileType(
      ctx.user!.org_id,
      ctx.user!.id,
      args.name
    );
  },
});

export const updateProfileType = mutationField("updateProfileType", {
  type: nonNull("ProfileType"),
  authorize: authenticateAnd(
    userHasFeatureFlag("PROFILES"),
    userHasAccessToProfileType("profileTypeId"),
    contextUserHasRole("ADMIN")
  ),
  args: {
    profileTypeId: nonNull(globalIdArg("ProfileType")),
    name: arg({ type: "LocalizableUserText" }),
    profileNamePattern: stringArg(),
  },
  validateArgs: validateAnd(
    validLocalizableUserText((args) => args.name, "data.name", { maxLength: 200 }),
    validProfileNamePattern("profileTypeId", "profileNamePattern")
  ),
  resolve: async (_, { profileTypeId, name, profileNamePattern }, ctx) => {
    const updateData: Partial<CreateProfileType> = {};

    if (isDefined(name)) {
      updateData.name = name;
    }
    await ctx.profiles.updateProfileType(profileTypeId, updateData, `User:${ctx.user!.id}`);
    if (isDefined(profileNamePattern)) {
      const pattern = parseTextWithPlaceholders(profileNamePattern).map((p) =>
        p.type === "placeholder" ? fromGlobalId(p.value, "ProfileTypeField").id : p.text
      );
      await ctx.profiles.updateProfileTypeProfileNamePattern(
        profileTypeId,
        pattern,
        `User:${ctx.user!.id}`
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
    contextUserHasRole("ADMIN")
  ),
  args: {
    profileTypeId: nonNull(globalIdArg("ProfileType")),
    name: arg({ type: "LocalizableUserText" }),
  },
  validateArgs: validateAnd(
    validLocalizableUserText((args) => args.name, "data.name", { maxLength: 200 })
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
    contextUserHasRole("ADMIN")
  ),
  args: {
    profileTypeIds: nonNull(list(nonNull(globalIdArg("ProfileType")))),
  },
  resolve: async (_, { profileTypeIds }, ctx) => {
    await ctx.profiles.deleteProfileTypes(profileTypeIds, `User:${ctx.user!.id}`);
    await ctx.profiles.deleteProfileTypeFieldsByProfileTypeId(
      profileTypeIds,
      `User:${ctx.user!.id}`
    );
    return SUCCESS;
  },
});

export const createProfileTypeField = mutationField("createProfileTypeField", {
  type: "ProfileTypeField",
  authorize: authenticateAnd(
    userHasFeatureFlag("PROFILES"),
    userHasAccessToProfileType("profileTypeId"),
    contextUserHasRole("ADMIN")
  ),
  validateArgs: validateAnd(
    notEmptyObject((args) => args.data, "data"),
    validLocalizableUserText((args) => args.data.name, "data.name", { maxLength: 200 }),
    maxLength((args) => args.data.alias, "data.alias", 100),
    validateRegex((args) => args.data.alias, "data.alias", /^[A-Za-z0-9_]+$/)
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
          t.nullable.string("alias");
          t.nullable.boolean("isExpirable");
        },
      })
    ),
  },
  resolve: async (_, args, ctx) => {
    return await ctx.profiles.createProfileTypeField(
      args.profileTypeId,
      {
        name: args.data.name,
        type: args.data.type,
        alias: args.data.alias || null,
        is_expirable: args.data.isExpirable ?? false,
        options: defaultProfileTypeFieldOptions(args.data.type),
      },
      `User:${ctx.user!.id}`
    );
  },
});

export const updateProfileTypeField = mutationField("updateProfileTypeField", {
  type: "ProfileTypeField",
  authorize: authenticateAnd(
    userHasFeatureFlag("PROFILES"),
    contextUserHasRole("ADMIN"),
    userHasAccessToProfileType("profileTypeId"),
    profileTypeFieldBelongsToProfileType("profileTypeFieldId", "profileTypeId")
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
          t.nullable.jsonObject("options");
        },
      }).asArg()
    ),
  },
  validateArgs: validateAnd(
    notEmptyObject((args) => args.data, "data"),
    maxLength((args) => args.data.name?.en, "data.name.en", 500),
    maxLength((args) => args.data.name?.es, "data.name.es", 500),
    maxLength((args) => args.data.alias, "data.alias", 100),
    validateRegex((args) => args.data.alias, "data.alias", /^[A-Za-z0-9_]+$/)
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
      return await ctx.profiles.updateProfileTypeField(
        args.profileTypeFieldId,
        updateData,
        `User:${ctx.user!.id}`
      );
    } catch (e) {
      if (
        e instanceof DatabaseError &&
        e.constraint === "profile_type_field__profile_type_id__alias__unique"
      ) {
        throw new ApolloError(
          "The alias for this field already exists in this profile type",
          "ALIAS_ALREADY_EXISTS"
        );
      } else {
        throw e;
      }
    }
  },
});

export const deleteProfileTypeField = mutationField("deleteProfileTypeField", {
  type: "ProfileType",
  authorize: authenticateAnd(
    userHasFeatureFlag("PROFILES"),
    contextUserHasRole("ADMIN"),
    userHasAccessToProfileType("profileTypeId"),
    profileTypeFieldBelongsToProfileType("profileTypeFieldIds", "profileTypeId")
  ),
  args: {
    profileTypeId: nonNull(globalIdArg("ProfileType")),
    profileTypeFieldIds: nonNull(list(nonNull(globalIdArg("ProfileTypeField")))),
  },
  resolve: async (_, { profileTypeId, profileTypeFieldIds }, ctx) => {
    const profileType = (await ctx.profiles.loadProfileType(profileTypeId))!;
    if (
      profileTypeFieldIds.some((id) =>
        (profileType!.profile_name_pattern as (string | number)[]).includes(id)
      )
    ) {
      throw new ApolloError(
        "At least one of the provided profile type field ids is being used in the profile name pattern.",
        "FIELD_USED_IN_PATTERN"
      );
    }
    await ctx.profiles.deleteProfileTypeFields(
      profileTypeId,
      profileTypeFieldIds,
      `User:${ctx.user!.id}`
    );
    return profileType;
  },
});

export const updateProfileTypeFieldPositions = mutationField("updateProfileTypeFieldPositions", {
  type: "ProfileType",
  authorize: authenticateAnd(
    userHasFeatureFlag("PROFILES"),
    contextUserHasRole("ADMIN"),
    userHasAccessToProfileType("profileTypeId"),
    profileTypeFieldBelongsToProfileType("profileTypeFieldIds", "profileTypeId")
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
        `User:${ctx.user!.id}`
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
    userHasAccessToProfileType("profileTypeId")
  ),
  args: {
    profileTypeId: nonNull(globalIdArg("ProfileType")),
  },
  resolve: async (_, args, ctx) => {
    return await ctx.profiles.createProfile(
      { name: "", org_id: ctx.user!.org_id, profile_type_id: args.profileTypeId },
      `User:${ctx.user!.id}`
    );
  },
});

export const deleteProfile = mutationField("deleteProfile", {
  type: "Success",
  authorize: authenticateAnd(
    userHasFeatureFlag("PROFILES"),
    contextUserHasRole("ADMIN"),
    userHasAccessToProfile("profileIds")
  ),
  args: {
    profileIds: nonNull(list(nonNull(globalIdArg("Profile")))),
  },
  resolve: async (_, { profileIds }, ctx) => {
    await ctx.profiles.deleteProfile(profileIds, `User:${ctx.user!.id}`);
    return SUCCESS;
  },
});

export const updateProfileFieldValue = mutationField("updateProfileFieldValue", {
  type: "Profile",
  authorize: authenticateAnd(userHasFeatureFlag("PROFILES"), userHasAccessToProfile("profileId")),
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
                t.nullable.date("expiresAt");
              },
            }),
          })
        )
      )
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
        (p) => !isDefined(p) || p.profile_type_id !== profile!.profile_type_id || p.type === "FILE"
      )
    ) {
      throw new ForbiddenError("Not authorized");
    }
    const profileTypeFieldsById = indexBy(profileTypeFields as ProfileTypeField[], (ptf) => ptf.id);
    // validate contents and expiresAt
    for (const { profileTypeFieldId, content, expiresAt } of fields) {
      const profileTypeField = profileTypeFieldsById[profileTypeFieldId];
      if (isDefined(content)) {
        try {
          validateProfileFieldValue(profileTypeField, content);
        } catch (e) {
          if (e instanceof Error) {
            throw new ApolloError(
              `Invalid profile field value: ${e.message}`,
              "INVALID_PROFILE_FIELD_VALUE"
            );
          }
        }
      }
      if (expiresAt !== undefined && !profileTypeField.is_expirable) {
        throw new ApolloError(`Can't set expiry on a non expirable field`, "INVALID_EXPIRY");
      }
      if (expiresAt !== undefined && !isDefined(content)) {
        throw new ApolloError(`Can't set expiry on a non replied field`, "INVALID_EXPIRY");
      }
    }
    const fieldsWithZonedExpires = fields.map((field) => ({
      ...field,
      expiresAt:
        field.expiresAt &&
        zonedTimeToUtc(format(field.expiresAt, "yyyy-MM-dd"), ctx.organization!.default_timezone),
    }));
    return (await ctx.profiles.createProfileFieldValue(
      profileId,
      fieldsWithZonedExpires,
      ctx.user!.id
    ))!;
  },
});

export const createProfileFieldFileUploadLink = mutationField("createProfileFieldFileUploadLink", {
  type: "ProfileFieldPropertyAndFileWithUploadData",
  authorize: authenticateAnd(
    userHasFeatureFlag("PROFILES"),
    userHasAccessToProfile("profileId"),
    profileHasProfileTypeFieldId("profileId", "profileTypeFieldId"),
    profileTypeFieldIsOfType("profileTypeFieldId", ["FILE"])
  ),
  args: {
    profileId: nonNull(globalIdArg("Profile")),
    profileTypeFieldId: nonNull(globalIdArg("ProfileTypeField")),
    data: nonNull(list(nonNull("FileUploadInput"))),
    expiresAt: datetimeArg(),
  },
  validateArgs: validateAnd(
    validFileUploadInput((args) => args.data, { maxSizeBytes: toBytes(100, "MB") }, "data"),
    notEmptyArray((args) => args.data, "data")
  ),
  resolve: async (_, { profileId, profileTypeFieldId, data, expiresAt }, ctx) => {
    const fileUploads = await ctx.files.createFileUpload(
      data.map((data) => ({
        path: random(16),
        filename: data.filename,
        size: data.size.toString(),
        content_type: data.contentType,
        upload_complete: false,
      })),
      `User:${ctx.user!.id}`
    );
    const presignedPostDatas = await Promise.all(
      fileUploads.map((file) =>
        ctx.storage.fileUploads.getSignedUploadEndpoint(
          file.path,
          file.content_type,
          parseInt(file.size)
        )
      )
    );
    const files = await ctx.profiles.createProfileFieldFile(
      profileId,
      profileTypeFieldId,
      fileUploads.map((f) => f.id),
      expiresAt &&
        zonedTimeToUtc(format(expiresAt, "yyyy-MM-dd"), ctx.organization!.default_timezone),
      ctx.user!.id
    );
    const [field, allFiles] = await Promise.all([
      ctx.profiles.loadProfileTypeField(profileTypeFieldId),
      ctx.profiles.loadProfileFieldFilesByProfileTypeFieldId(profileTypeFieldId),
    ]);
    return {
      property: [field!, null, allFiles],
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
    profileHasProfileTypeFieldId("profileId", "profileTypeFieldId"),
    profileTypeFieldIsOfType("profileTypeFieldId", ["FILE"])
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
          pff.profile_type_field_id !== profileTypeFieldId
      )
    ) {
      throw new ForbiddenError("Not authorized");
    }
    const fileUploads = await ctx.files.loadFileUpload(
      (profileFieldFiles as ProfileFieldFile[]).map((pff) => pff.file_upload_id)
    );

    await pMap(fileUploads, async (fu) => {
      await ctx.storage.fileUploads.getFileMetadata(fu!.path);
    });
    await ctx.files.markFileUploadComplete(
      fileUploads.map((fu) => fu!.id),
      `User:${ctx.user!.id}`
    );
    for (const fu of fileUploads) {
      ctx.files.loadFileUpload.dataloader.clear(fu!.id);
    }
    return profileFieldFiles as ProfileFieldFile[];
  },
});
