import { arg, inputObjectType, list, mutationField, nonNull } from "nexus";
import { DatabaseError } from "pg";
import { isDefined } from "remeda";
import {
  defaultProfileTypeFieldOptions,
  validateProfileTypeFieldOptions,
} from "../../db/helpers/profileTypeFieldOptions";
import { CreateProfileType, CreateProfileTypeField } from "../../db/__types";
import { authenticateAnd } from "../helpers/authorize";
import { ApolloError, ArgValidationError } from "../helpers/errors";
import { globalIdArg } from "../helpers/globalIdPlugin";
import { SUCCESS } from "../helpers/Success";
import { validateAnd } from "../helpers/validateArgs";
import { maxLength } from "../helpers/validators/maxLength";
import { notEmptyObject } from "../helpers/validators/notEmptyObject";
import { validateRegex } from "../helpers/validators/validateRegex";
import { validLocalizableUserText } from "../helpers/validators/validLocalizableUserText";
import { userHasFeatureFlag } from "../petition/authorizers";
import { contextUserHasRole } from "../users/authorizers";
import {
  profileTypeFieldBelongsToProfileType,
  userHasAccessToProfile,
  userHasAccessToProfileType,
} from "./authorizers";

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
    userHasAccessToProfileType("id"),
    contextUserHasRole("ADMIN")
  ),
  args: {
    id: nonNull(globalIdArg("ProfileType")),
    data: nonNull(
      inputObjectType({
        name: "UpdateProfileTypeInput",
        definition(t) {
          t.nullable.localizableUserText("name");
        },
      }).asArg()
    ),
  },
  validateArgs: validateAnd(
    notEmptyObject((args) => args.data, "data"),
    validLocalizableUserText((args) => args.data.name, "data.name", { maxLength: 200 })
  ),
  resolve: async (_, { id, data }, ctx) => {
    const updateData: Partial<CreateProfileType> = {};

    if (isDefined(data.name)) {
      updateData.name = data.name;
    }

    return await ctx.profiles.updateProfileType(id, updateData, `User:${ctx.user!.id}`);
  },
});

export const deleteProfileType = mutationField("deleteProfileType", {
  type: "Success",
  authorize: authenticateAnd(
    userHasFeatureFlag("PROFILES"),
    userHasAccessToProfileType("ids"),
    contextUserHasRole("ADMIN")
  ),
  args: {
    ids: nonNull(list(nonNull(globalIdArg("ProfileType")))),
  },
  resolve: async (_, { ids }, ctx) => {
    await ctx.profiles.deleteProfileTypes(ids, `User:${ctx.user!.id}`);
    await ctx.profiles.deleteProfileTypeFieldsByProfileTypeId(ids, `User:${ctx.user!.id}`);
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
      console.log(e, e instanceof DatabaseError);
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
    await ctx.profiles.deleteProfileTypeFields(
      profileTypeId,
      profileTypeFieldIds,
      `User:${ctx.user!.id}`
    );
    return (await ctx.profiles.loadProfileType(profileTypeId))!;
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
    data: nonNull(
      inputObjectType({
        name: "CreateProfileInput",
        definition(t) {
          t.nonNull.string("name");
        },
      }).asArg()
    ),
  },
  resolve: async (_, args, ctx) => {
    return await ctx.profiles.createProfile(
      { name: args.data.name, org_id: ctx.user!.org_id, profile_type_id: args.profileTypeId },
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
