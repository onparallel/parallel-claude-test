import { enumType, nonNull, objectType } from "nexus";
import { indexBy, map, pipe, sortBy } from "remeda";
import { ProfileTypeFieldTypeValues } from "../../db/__types";

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
    t.implements("Timestamps");
  },
});

export const ProfileTypeFieldPermission = enumType({
  name: "ProfileTypeFieldPermission",
  members: ["WRITE"],
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
    t.list.field("fields", {
      type: "ProfileFieldAndValue",
      resolve: async (root, _, ctx) => {
        const [fields, values] = await Promise.all([
          ctx.profiles.loadProfileTypeFieldsByProfileTypeId(root.profile_type_id),
          ctx.profiles.loadProfileFieldValuesByProfileId(root.profile_type_id),
        ]);
        const valuesByFieldId = indexBy(values, (v) => v.profile_type_field_id);
        return pipe(
          fields,
          sortBy((f) => f.position),
          map((f) => [f, valuesByFieldId[f.id] ?? null])
        );
      },
    });
    t.implements("Timestamps");
  },
});

export const ProfileFieldAndValue = objectType({
  name: "ProfileFieldAndValue",
  definition(t) {
    t.field("field", { type: "ProfileTypeField", resolve: ([ptf]) => ptf });
    t.nullable.field("value", { type: "ProfileFieldValue", resolve: ([_, value]) => value });
  },
  sourceType: `[db.ProfileTypeField, db.ProfileFieldValue | null]`,
});

export const ProfileFieldValue = objectType({
  name: "ProfileFieldValue",
  definition(t) {
    t.globalId("id");
    t.nullable.field("createdBy", {
      type: "User",
      resolve: async (root, _, ctx) => await ctx.users.loadUser(root.user_id),
    });
    t.implements("CreatedAt");
  },
});
