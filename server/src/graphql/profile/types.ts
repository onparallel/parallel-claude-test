import { enumType, interfaceType, nonNull, objectType } from "nexus";
import { groupBy, indexBy, map, pipe, sortBy } from "remeda";
import { ProfileTypeFieldPermissionValues, ProfileTypeFieldTypeValues } from "../../db/__types";
import { toGlobalId } from "../../util/globalId";
import { NexusGenObjects } from "../__types";

export const ProfileType = objectType({
  name: "ProfileType",
  definition(t) {
    t.globalId("id");
    t.localizableUserText("name", { resolve: (o) => o.name });
    t.list.field("fields", {
      type: "ProfileTypeField",
      resolve: async (o, _, ctx) => {
        return await ctx.profiles.loadProfileTypeFieldsByProfileTypeId(o.id);
      },
    });
    t.string("profileNamePattern", {
      resolve: (o) =>
        (o.profile_name_pattern as (string | number)[])
          .map((p) =>
            typeof p === "string"
              ? p.replaceAll("{", "\\{")
              : `{{${toGlobalId("ProfileTypeField", p)}}}`
          )
          .join(""),
    });
    t.implements("Timestamps");
  },
});

export const ProfileTypeFieldPermission = enumType({
  name: "ProfileTypeFieldPermission",
  members: ProfileTypeFieldPermissionValues,
});

export const ProfileTypeField = objectType({
  name: "ProfileTypeField",
  definition(t) {
    t.globalId("id");
    t.localizableUserText("name", { resolve: (o) => o.name });
    t.int("position");
    t.field("profileType", {
      type: nonNull("ProfileType"),
      resolve: async (o, _, ctx) => {
        return (await ctx.profiles.loadProfileType(o.profile_type_id))!;
      },
    });
    t.field("type", {
      type: enumType({ name: "ProfileTypeFieldType", members: ProfileTypeFieldTypeValues }),
    });
    t.boolean("isUsedInProfileName", {
      resolve: async (root, _, ctx) => {
        const profileType = (await ctx.profiles.loadProfileType(root.profile_type_id))!;
        return profileType.profile_name_pattern.includes(root.id);
      },
    });
    t.field("myPermission", { type: "ProfileTypeFieldPermission", resolve: (o) => "WRITE" });
    t.jsonObject("options", { resolve: (o) => o.options });
    t.nullable.string("alias");
    t.boolean("isExpirable", { resolve: (o) => o.is_expirable });
  },
});

export const Profile = objectType({
  name: "Profile",
  definition(t) {
    t.globalId("id");
    t.string("name");
    t.field("profileType", {
      type: "ProfileType",
      resolve: async (o, _, ctx) => {
        return (await ctx.profiles.loadProfileType(o.profile_type_id))!;
      },
    });
    t.list.field("properties", {
      type: "ProfileFieldProperty",
      resolve: async (root, _, ctx) => {
        const [fields, values, files] = await Promise.all([
          ctx.profiles.loadProfileTypeFieldsByProfileTypeId(root.profile_type_id),
          ctx.profiles.loadProfileFieldValuesByProfileId(root.id),
          ctx.profiles.loadProfileFieldFilesByProfileId(root.id),
        ]);
        const valuesByFieldId = indexBy(values, (v) => v.profile_type_field_id);
        const filesByFieldId = groupBy(files, (v) => v.profile_type_field_id);
        return pipe(
          fields,
          sortBy((f) => f.position),
          map(
            (f) =>
              [
                f,
                valuesByFieldId[f.id] ?? null,
                filesByFieldId[f.id] ?? null,
              ] as NexusGenObjects["ProfileFieldProperty"]
          )
        );
      },
    });
    t.implements("Timestamps");
  },
});

export const ProfileFieldResponse = interfaceType({
  name: "ProfileFieldResponse",
  sourceType: "db.ProfileFieldValue | db.ProfileFieldFile",
  resolveType: () => null,
  definition(t) {
    t.field("field", {
      type: "ProfileTypeField",
      resolve: async (root, _, ctx) =>
        (await ctx.profiles.loadProfileTypeField(root.profile_type_field_id))!,
    });
    t.field("profile", {
      type: "Profile",
      resolve: async (root, _, ctx) => (await ctx.profiles.loadProfile(root.profile_id))!,
    });
    t.nullable.field("createdBy", {
      type: "User",
      resolve: async (root, _, ctx) => await ctx.users.loadUser(root.created_by_user_id),
    });
    t.nullable.datetime("expiresAt", {
      description: "Time when the response was created.",
      resolve: (o) => o.expires_at,
    });
    t.datetime("createdAt", {
      description: "Time when the response was created.",
      resolve: (o) => o.created_at,
    });
    t.nullable.field("removedBy", {
      type: "User",
      resolve: async (root, _, ctx) =>
        root.removed_by_user_id ? await ctx.users.loadUser(root.removed_by_user_id) : null,
    });
    t.nullable.datetime("removedAt", {
      description: "Time when the response was removed.",
      resolve: (o) => o.removed_at,
    });
    t.nullable.datetime("anonymizedAt", {
      description: "Time when the response was anonymized.",
      resolve: (o) => o.anonymized_at,
    });
  },
});

export const ProfileFieldProperty = objectType({
  name: "ProfileFieldProperty",
  definition(t) {
    t.field("field", { type: "ProfileTypeField", resolve: ([ptf]) => ptf });
    t.nullable.field("value", { type: "ProfileFieldValue", resolve: ([, value]) => value });
    t.nullable.list.field("files", { type: "ProfileFieldFile", resolve: ([, , files]) => files });
  },
  sourceType: `[db.ProfileTypeField, db.ProfileFieldValue | null, db.ProfileFieldFile[] | null]`,
});

export const ProfileFieldValue = objectType({
  name: "ProfileFieldValue",
  definition(t) {
    t.globalId("id");
    t.implements("ProfileFieldResponse");
    t.nullable.jsonObject("content", {
      resolve: (root, _, ctx) => {
        return root.content;
      },
    });
  },
});

export const ProfileFieldFile = objectType({
  name: "ProfileFieldFile",
  definition(t) {
    t.globalId("id");
    t.implements("ProfileFieldResponse");
    t.nullable.field("file", { type: "FileUpload" });
  },
});
