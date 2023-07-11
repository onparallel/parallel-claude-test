import { zonedTimeToUtc } from "date-fns-tz";
import { enumType, interfaceType, nonNull, objectType } from "nexus";
import { sortBy } from "remeda";
import { ProfileTypeFieldPermissionValues, ProfileTypeFieldTypeValues } from "../../db/__types";
import { toGlobalId } from "../../util/globalId";

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
              : `{{ ${toGlobalId("ProfileTypeField", p)} }}`,
          )
          .join(""),
    });
    t.implements("Timestamps");
    t.nullable.datetime("archivedAt", {
      description: "Time when the response was created.",
      resolve: (o) => o.archived_at,
    });
    t.nullable.field("archivedBy", {
      type: "User",
      resolve: async (o, _, ctx) =>
        o.archived_by_user_id ? await ctx.users.loadUser(o.archived_by_user_id) : null,
    });
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
    t.field("myPermission", { type: "ProfileTypeFieldPermission", resolve: (o) => o.permission });
    t.jsonObject("options", { resolve: (o) => o.options });
    t.nullable.string("alias");
    t.boolean("isExpirable", { resolve: (o) => o.is_expirable });
    t.nullable.duration("expiryAlertAheadTime", { resolve: (o) => o.expiry_alert_ahead_time });
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
        const fields = await ctx.profiles.loadProfileTypeFieldsByProfileTypeId(
          root.profile_type_id,
        );
        return sortBy(fields, (f) => f.position).map((field) => ({
          profile_id: root.id,
          profile_type_field_id: field.id,
        }));
      },
    });
    t.paginationField("events", {
      type: "ProfileEvent",
      description: "The events for the profile.",
      resolve: (root, { offset, limit }, ctx) => {
        return ctx.profiles.getPaginatedEventsForProfile(root.id, {
          offset,
          limit,
        });
      },
    });
    t.nonNull.list.nonNull.field("subscribers", {
      type: "ProfileSubscription",
      resolve: async (root, _, ctx) => {
        return await ctx.profiles.loadProfileSubscribers(root.id);
      },
    });
    t.paginationField("petitions", {
      type: "Petition",
      resolve: (o, { offset, limit }, ctx) => {
        return ctx.petitions.getPaginatedPetitionsForUser(ctx.user!.org_id, ctx.user!.id, {
          offset,
          limit,
          filters: {
            type: "PETITION",
            path: null,
            profileIds: [o.id],
          },
          sortBy: [{ field: "createdAt", order: "desc" }],
        }) as any;
      },
    });
    t.implements("Timestamps");
  },
});

export const ProfileSubscription = objectType({
  name: "ProfileSubscription",
  definition(t) {
    t.globalId("id", { prefixName: "ProfileSubscription" });
    t.nonNull.field("user", {
      type: "User",
      resolve: async (root, _, ctx) => {
        return (await ctx.users.loadUser(root.user_id))!;
      },
    });
  },
  sourceType: "db.ProfileSubscription",
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
      description: "Expiration datetime of the value, considering organization's timezone.",
      resolve: async (o, _, ctx) => {
        const org = (await ctx.organizations.loadOrg(ctx.user!.org_id))!;
        return o.expiry_date ? zonedTimeToUtc(new Date(o.expiry_date), org.default_timezone) : null;
      },
    });
    t.nullable.string("expiryDate", {
      resolve: (o) => o.expiry_date,
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
    t.field("profile", {
      type: "Profile",
      resolve: async (o, _, ctx) => {
        return (await ctx.profiles.loadProfile(o.profile_id))!;
      },
    });
    t.field("field", {
      type: "ProfileTypeField",
      resolve: async (o, _, ctx) => {
        return (await ctx.profiles.loadProfileTypeField(o.profile_type_field_id))!;
      },
    });
    t.nullable.field("value", {
      type: "ProfileFieldValue",
      resolve: async (o, _, ctx) => {
        return await ctx.profiles.loadProfileFieldValue({
          profileId: o.profile_id,
          profileTypeFieldId: o.profile_type_field_id,
        });
      },
    });
    t.nullable.list.field("files", {
      type: "ProfileFieldFile",
      resolve: async (o, _, ctx) => {
        const field = await ctx.profiles.loadProfileTypeField(o.profile_type_field_id);
        if (field?.type === "FILE") {
          return await ctx.profiles.loadProfileFieldFiles({
            profileId: o.profile_id,
            profileTypeFieldId: o.profile_type_field_id,
          });
        } else {
          return null;
        }
      },
    });
  },
  sourceType: `{
    profile_id: number;
    profile_type_field_id: number;
  }`,
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
    t.nullable.field("file", {
      type: "FileUpload",
      resolve: async (o, _, ctx) => await ctx.files.loadFileUpload(o.file_upload_id),
    });
  },
});

export const ProfileFieldPropertyAndFileWithUploadData = objectType({
  name: "ProfileFieldPropertyAndFileWithUploadData",
  definition(t) {
    t.field("property", { type: "ProfileFieldProperty" });
    t.list.field("uploads", {
      type: objectType({
        name: "ProfileFieldFileWithUploadData",
        definition(t) {
          t.field("file", { type: "ProfileFieldFile" });
          t.field("presignedPostData", { type: "AWSPresignedPostData" });
        },
      }),
    });
  },
});

export const PetitionProfile = objectType({
  name: "PetitionProfile",
  definition(t) {
    t.nonNull.field("petition", {
      type: "Petition",
      resolve: async (o, _, ctx) => {
        return (await ctx.petitions.loadPetition(o.petition_id))!;
      },
    });
    t.nonNull.field("profile", {
      type: "Profile",
      resolve: async (o, _, ctx) => {
        return (await ctx.profiles.loadProfile(o.profile_id))!;
      },
    });
  },
});
