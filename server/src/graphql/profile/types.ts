import { addDays } from "date-fns";
import { fromZonedTime } from "date-fns-tz";
import { enumType, inputObjectType, interfaceType, list, nonNull, objectType } from "nexus";
import { isNonNullish, isNullish, sortBy, unique } from "remeda";
import { assert } from "ts-essentials";
import {
  ProfileRelationshipTypeDirectionValues,
  ProfileStatusValues,
  ProfileTypeFieldPermissionTypeValues,
  ProfileTypeFieldTypeValues,
  ProfileTypeStandardTypeValues,
} from "../../db/__types";
import { toGlobalId } from "../../util/globalId";
import {
  ProfileQueryFilterGroupLogicalOperatorValues,
  ProfileQueryFilterOperatorValues,
  ProfileQueryFilterPropertyValues,
} from "../../util/ProfileQueryFilter";
import { authenticateAnd } from "../helpers/authorize";
import { ApolloError } from "../helpers/errors";
import { globalIdArg } from "../helpers/globalIdPlugin";
import { userHasAccessToProfile } from "./authorizers";

export const ProfileUpdateSource = [
  "MANUAL",
  "EXTERNAL",
  "EXCEL_IMPORT",
  "PARALLEL_API",
  "PARALLEL_MONITORING",
  "PETITION_FIELD_REPLY",
] as const;

type ProfileUpdateSource = (typeof ProfileUpdateSource)[number];

export const ProfileFieldPropertyValueSource = enumType({
  name: "ProfileFieldPropertyValueSource",
  members: ProfileUpdateSource,
});

export const ProfileTypeStandardType = enumType({
  name: "ProfileTypeStandardType",
  members: ProfileTypeStandardTypeValues,
});

export const ProfileTypeIcon = enumType({
  name: "ProfileTypeIcon",
  members: [
    "DATABASE",
    "PERSON",
    "BUILDING",
    "DOCUMENT",
    "VERIFIED_PERSON",
    "PEOPLE",
    "STORE",
    "SHOPPING_CART",
    "CLIPBOARD",
    "SETTINGS",
    "BRIEFCASE",
    "PUBLICATION",
    "HOUSE",
    "CAR",
    "CERTIFICATE",
    "CUBE",
  ],
});

export const ProfileType = objectType({
  name: "ProfileType",
  definition(t) {
    t.globalId("id");
    t.localizableUserText("name", { resolve: (o) => o.name });
    t.localizableUserText("pluralName", {
      resolve: (o) => o.name_plural,
    });
    t.field("icon", { type: "ProfileTypeIcon" });
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
    t.nonNull.list.nonNull.globalId("profileNamePatternFields", {
      prefixName: "ProfileTypeField",
      resolve: (o) => {
        return (o.profile_name_pattern as (string | number)[]).filter(
          (v) => typeof v === "number",
        ) as number[];
      },
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
    t.nonNull.boolean("isStandard", {
      resolve: (o) => o.standard_type !== null,
    });
    t.nullable.field("standardType", {
      type: "ProfileTypeStandardType",
      resolve: (o) => o.standard_type,
    });
    t.nonNull.boolean("isPinned", {
      resolve: async (o, _, ctx) => {
        if (isNullish(ctx.user)) {
          return false;
        }
        const pinnedProfileTypes = await ctx.profiles.loadUserProfileTypePinnedByUserId(
          ctx.user.id,
        );

        return pinnedProfileTypes.some((p) => p.profile_type_id === o.id);
      },
    });
    t.nonNull.list.nonNull.field("keyProcesses", {
      type: "ProfileTypeProcess",
      resolve: async (o, _, ctx) => {
        return await ctx.profiles.loadProfileTypeProcessesByProfileTypeId(o.id);
      },
    });
    t.nonNull.boolean("canCreate", {
      resolve: async (o, _, ctx) => {
        const fieldsIds = (o.profile_name_pattern as (string | number)[]).filter(
          (v) => typeof v === "number",
        ) as number[];
        const permissions = await ctx.profiles.loadProfileTypeFieldUserEffectivePermission(
          fieldsIds.map((fieldId) => ({
            profileTypeFieldId: fieldId,
            userId: ctx.user!.id,
          })),
        );
        return permissions.every((p) => p === "WRITE");
      },
    });
  },
});

export const ProfileTypeFieldPermissionType = enumType({
  name: "ProfileTypeFieldPermissionType",
  members: ProfileTypeFieldPermissionTypeValues,
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
    t.field("myPermission", {
      type: "ProfileTypeFieldPermissionType",
      resolve: async (o, _, ctx) =>
        await ctx.profiles.loadProfileTypeFieldUserEffectivePermission({
          profileTypeFieldId: o.id,
          userId: ctx.user!.id,
        }),
    });
    t.nonNull.field("defaultPermission", {
      type: "ProfileTypeFieldPermissionType",
      resolve: (o) => o.permission,
    });
    t.nonNull.list.nonNull.field("permissions", {
      type: "ProfileTypeFieldPermission",
      resolve: async (o, _, ctx) => {
        return await ctx.profiles.loadProfileTypeFieldPermissionsByProfileTypeFieldId(o.id);
      },
    });
    t.jsonObject("options", {
      resolve: async (o, _, ctx) =>
        await ctx.profileTypeFields.mapProfileTypeFieldOptions(o.type, o.options, (type, id) =>
          toGlobalId(type, id),
        ),
    });
    t.nullable.string("alias");
    t.boolean("isExpirable", { resolve: (o) => o.is_expirable });
    t.nullable.duration("expiryAlertAheadTime", { resolve: (o) => o.expiry_alert_ahead_time });
    t.boolean("isUnique", { resolve: (o) => o.is_unique });
    t.nonNull.boolean("isStandard", {
      resolve: (o) => o.alias?.startsWith("p_") ?? false,
    });
  },
});

export const ProfileTypeFieldPermission = objectType({
  name: "ProfileTypeFieldPermission",
  definition(t) {
    t.globalId("id");
    t.field("target", {
      type: "UserOrUserGroup",
      resolve: async (o, _, ctx) => {
        if (o.user_id) {
          const user = await ctx.users.loadUser(o.user_id);
          return { __type: "User", ...user! };
        } else {
          const userGroup = await ctx.userGroups.loadUserGroup(o.user_group_id!);
          return { __type: "UserGroup", ...userGroup! };
        }
      },
    });
    t.field("permission", {
      type: "ProfileTypeFieldPermissionType",
      resolve: (o) => o.permission,
    });
  },
});

export const Profile = objectType({
  name: "Profile",
  definition(t) {
    t.globalId("id");
    t.string("name", {
      resolve: (o) => o.localizable_name.en ?? "",
    });
    t.localizableUserText("localizableName", { resolve: (o) => o.localizable_name });
    t.field("profileType", {
      type: "ProfileType",
      resolve: async (o, _, ctx) => {
        return (await ctx.profiles.loadProfileType(o.profile_type_id))!;
      },
    });
    t.list.field("properties", {
      type: "ProfileFieldProperty",
      args: {
        filter: list(
          nonNull(
            inputObjectType({
              name: "ProfileFieldPropertyFilter",
              definition(t) {
                t.nullable.string("alias");
                t.nullable.globalId("profileTypeFieldId", { prefixName: "ProfileTypeField" });
              },
            }),
          ),
        ),
      },
      resolve: async (root, args, ctx) => {
        try {
          assert(
            isNullish(args.filter) ||
              args.filter.every((f) => isNonNullish(f.alias) || isNonNullish(f.profileTypeFieldId)),
          );
        } catch {
          throw new ApolloError("Invalid properties filter", "INVALID_PROPERTIES_FILTER");
        }
        const fields = isNullish(args.filter)
          ? await ctx.profiles.loadProfileTypeFieldsByProfileTypeId(root.profile_type_id)
          : args.filter.length === 0
            ? []
            : await ctx.profiles.loadProfileTypeFieldsByProfileTypeIdFiltered({
                profileTypeId: root.profile_type_id,
                filter: args.filter,
              });

        return sortBy(fields, (f) => f.position).map((field) => ({
          profile: root,
          profile_type_field: field,
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
    t.paginationField("associatedPetitions", {
      type: "Petition",
      extendArgs: {
        filters: inputObjectType({
          name: "ProfileAssociatedPetitionFilter",
          definition(t) {
            t.nullable.list.nonNull.globalId("fromTemplateId", { prefixName: "Petition" });
          },
        }).asArg(),
      },
      resolve: (o, { offset, limit, filters }, ctx) => {
        return ctx.petitions.getPaginatedPetitionsByProfileId(ctx.user!.org_id, o.id, {
          offset,
          limit,
          filters,
        });
      },
    });
    t.field("status", {
      type: enumType({
        name: "ProfileStatus",
        members: ProfileStatusValues,
      }),
    });
    t.nullable.datetime("permanentDeletionAt", {
      resolve: (o, _, ctx) =>
        o.deletion_scheduled_at
          ? addDays(
              o.deletion_scheduled_at,
              ctx.config.cronWorkers.anonymizer.deleteScheduledProfilesAfterDays,
            )
          : null,
    });
    t.nonNull.list.nonNull.field("relationships", {
      type: "ProfileRelationship",
      args: {
        filter: list(
          nonNull(
            inputObjectType({
              name: "ProfileRelationshipFilter",
              definition(t) {
                t.nonNull.globalId("relationshipTypeId", { prefixName: "ProfileRelationshipType" });
                t.nullable.field("fromSide", {
                  type: enumType({
                    name: "ProfileRelationshipSide",
                    members: ["LEFT", "RIGHT"],
                  }),
                });
              },
            }),
          ),
        ),
      },
      resolve: async (o, args, ctx) => {
        if (isNonNullish(args.filter) && args.filter.length > 0) {
          return await ctx.profiles.loadProfileRelationshipsByProfileIdFiltered({
            profileId: o.id,
            filter: args.filter,
          });
        } else {
          return await ctx.profiles.loadProfileRelationshipsByProfileId(o.id);
        }
      },
    });
    t.implements("Timestamps");
    t.nullable.datetime("closedAt", { resolve: (o) => o.closed_at });
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
      resolve: async (root, _, ctx) => {
        if (isNullish(root.created_by_user_id)) {
          return null;
        }
        return await ctx.users.loadUser(root.created_by_user_id);
      },
    });
    t.nullable.datetime("expiresAt", {
      description: "Expiration datetime of the value, considering organization's timezone.",
      resolve: async (o, _, ctx) => {
        const org = (await ctx.organizations.loadOrg(ctx.user!.org_id))!;
        return o.expiry_date ? fromZonedTime(new Date(o.expiry_date), org.default_timezone) : null;
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
    t.nullable.field("source", {
      description: "Source of the response.",
      type: "ProfileFieldPropertyValueSource",
      resolve: (o) => o.source as ProfileUpdateSource | null,
    });
    t.nullable.string("externalSourceName", {
      resolve: async (o, _, ctx) => {
        if (
          !("external_source_integration_id" in o) ||
          isNullish(o.external_source_integration_id)
        ) {
          return null;
        }

        const integration = await ctx.integrations.loadIntegration(
          o.external_source_integration_id,
        );
        if (!integration || integration.type !== "PROFILE_EXTERNAL_SOURCE") {
          return null;
        }

        return integration.name;
      },
    });
    t.nullable.field("petitionFieldReply", {
      type: "PetitionFieldReply",
      resolve: async (o, _, ctx) => {
        if (!o.petition_field_reply_id) {
          return null;
        }

        return await ctx.petitions.loadFieldReply(o.petition_field_reply_id);
      },
    });
  },
});

export const ProfileFieldProperty = objectType({
  name: "ProfileFieldProperty",
  definition(t) {
    t.field("profile", {
      type: "Profile",
      resolve: async (o, _, ctx) => {
        return "profile" in o ? o.profile : (await ctx.profiles.loadProfile(o.profile_id))!;
      },
    });
    t.field("field", {
      type: "ProfileTypeField",
      resolve: async (o, _, ctx) => {
        return "profile_type_field" in o
          ? o.profile_type_field
          : (await ctx.profiles.loadProfileTypeField(o.profile_type_field_id))!;
      },
    });
    t.nullable.field("value", {
      type: "ProfileFieldValue",
      resolve: async (o, _, ctx) => {
        const profileId = "profile" in o ? o.profile.id : o.profile_id;
        const profileTypeFieldId =
          "profile_type_field" in o ? o.profile_type_field.id : o.profile_type_field_id;
        const myPermission = await ctx.profiles.loadProfileTypeFieldUserEffectivePermission({
          profileTypeFieldId,
          userId: ctx.user!.id,
        });
        if (myPermission === "HIDDEN") {
          return null;
        }

        const { value, draftValue } = await ctx.profiles.loadProfileFieldValueWithDraft({
          profileId,
          profileTypeFieldId,
        });

        const currentValue = draftValue ?? value;
        if (!currentValue) {
          return null;
        }

        return {
          ...currentValue,
          has_stored_value: isNonNullish(value),
        };
      },
    });
    t.nullable.list.field("files", {
      type: "ProfileFieldFile",
      resolve: async (o, _, ctx) => {
        const profileId = "profile" in o ? o.profile.id : o.profile_id;
        const profileTypeFieldId =
          "profile_type_field" in o ? o.profile_type_field.id : o.profile_type_field_id;
        const myPermission = await ctx.profiles.loadProfileTypeFieldUserEffectivePermission({
          profileTypeFieldId,
          userId: ctx.user!.id,
        });
        if (myPermission === "HIDDEN") {
          return null;
        }
        const field =
          "profile_type_field" in o
            ? o.profile_type_field
            : await ctx.profiles.loadProfileTypeField(profileTypeFieldId);
        if (field?.type === "FILE") {
          return await ctx.profiles.loadProfileFieldFiles({ profileId, profileTypeFieldId });
        } else {
          return null;
        }
      },
    });
  },
  sourceType: /* ts */ `
    ({ profile_id: number } | { profile: db.Profile })
    & ({ profile_type_field_id: number } | { profile_type_field: db.ProfileTypeField })
  `,
});

export const ProfileFieldValue = objectType({
  name: "ProfileFieldValue",
  definition(t) {
    t.globalId("id");
    t.implements("ProfileFieldResponse");
    t.nullable.jsonObject("content", {
      resolve: async (root, _, ctx) => await ctx.profilesHelper.mapValueContentFromDatabase(root),
    });
    t.nonNull.boolean("isDraft", {
      resolve: (o) => o.is_draft,
    });
    t.nonNull.boolean("hasActiveMonitoring", {
      resolve: (o) => o.active_monitoring,
    });
    t.nonNull.boolean("hasPendingReview", {
      resolve: (o) => o.pending_review,
    });
    t.nonNull.boolean("hasStoredValue", {
      resolve: (o) => o.has_stored_value,
    });
  },
  sourceType: /* ts */ `
    db.ProfileFieldValue & { has_stored_value: boolean }
  `,
});

export const ProfileFieldFile = objectType({
  name: "ProfileFieldFile",
  definition(t) {
    t.globalId("id");
    t.implements("ProfileFieldResponse");
    t.nullable.field("file", {
      type: "FileUpload",
      resolve: async (o, _, ctx) =>
        o.file_upload_id ? await ctx.files.loadFileUpload(o.file_upload_id) : null,
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
    t.nonNull.globalId("id");
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

export const ProfileRelationshipType = objectType({
  name: "ProfileRelationshipType",
  definition(t) {
    t.nonNull.globalId("id");
    t.nonNull.localizableUserText("leftRightName", { resolve: (o) => o.left_right_name });
    t.nonNull.localizableUserText("rightLeftName", {
      resolve: (o) => (o.is_reciprocal ? o.left_right_name : o.right_left_name),
    });
    t.nullable.string("alias");
    t.nonNull.boolean("isReciprocal", { resolve: (o) => o.is_reciprocal });
    t.nonNull.list.nonNull.globalId("allowedLeftRightProfileTypeIds", {
      prefixName: "ProfileType",
      resolve: async (o, _, ctx) => {
        const allowedProfileTypes =
          await ctx.profiles.loadProfileRelationshipTypeAllowedProfileTypesByProfileRelationshipTypeId(
            { profileRelationshipTypeId: o.id, direction: "LEFT_RIGHT", orgId: ctx.user!.org_id },
          );
        return unique(allowedProfileTypes.map((p) => p.allowed_profile_type_id));
      },
    });
    t.nonNull.list.nonNull.globalId("allowedRightLeftProfileTypeIds", {
      prefixName: "ProfileType",
      resolve: async (o, _, ctx) => {
        const allowedProfileTypes =
          await ctx.profiles.loadProfileRelationshipTypeAllowedProfileTypesByProfileRelationshipTypeId(
            { profileRelationshipTypeId: o.id, direction: "RIGHT_LEFT", orgId: ctx.user!.org_id },
          );
        return unique(allowedProfileTypes.map((p) => p.allowed_profile_type_id));
      },
    });
  },
});

export const ProfileRelationshipDirection = enumType({
  name: "ProfileRelationshipDirection",
  members: ProfileRelationshipTypeDirectionValues,
});

export const ProfileRelationshipTypeWithDirection = objectType({
  name: "ProfileRelationshipTypeWithDirection",
  sourceType: /*ts */ `{
    profile_relationship_type_id: number,
    direction: db.ProfileRelationshipTypeDirection,
  }`,
  definition(t) {
    t.nonNull.field("profileRelationshipType", {
      type: "ProfileRelationshipType",
      resolve: async (o, _, ctx) => {
        return (await ctx.profiles.loadProfileRelationshipType(o.profile_relationship_type_id))!;
      },
    });
    t.nonNull.field("direction", {
      type: "ProfileRelationshipDirection",
    });
  },
});

export const ProfileRelationship = objectType({
  name: "ProfileRelationship",
  definition(t) {
    t.nonNull.globalId("id");
    t.nonNull.field("leftSideProfile", {
      type: "Profile",
      resolve: async (o, _, ctx) => {
        return (await ctx.profiles.loadProfile(o.left_side_profile_id))!;
      },
    });
    t.nonNull.field("rightSideProfile", {
      type: "Profile",
      resolve: async (o, _, ctx) => {
        return (await ctx.profiles.loadProfile(o.right_side_profile_id))!;
      },
    });
    t.nonNull.field("relationshipType", {
      type: "ProfileRelationshipType",
      resolve: async (o, _, ctx) => {
        return (await ctx.profiles.loadProfileRelationshipType(o.profile_relationship_type_id))!;
      },
    });
  },
});

export const ProfileTypeProcess = objectType({
  name: "ProfileTypeProcess",
  definition(t) {
    t.nonNull.globalId("id");
    t.nonNull.localizableUserText("name", { resolve: (o) => o.process_name });
    t.nonNull.int("position");
    t.nonNull.list.nonNull.field("templates", {
      type: "PetitionTemplate",
      resolve: async (o, _, ctx) => await ctx.profiles.loadTemplatesByProfileTypeProcessId(o.id),
    });
    t.nullable.field("latestPetition", {
      type: "PetitionBaseMini",
      authorize: authenticateAnd(userHasAccessToProfile("profileId")),
      args: { profileId: nonNull(globalIdArg("Profile")) },
      resolve: async (root, args, ctx) => {
        return await ctx.profiles.loadLatestPetitionByProfileIdProcessId({
          processId: root.id,
          profileId: args.profileId,
        });
      },
    });
  },
});

export const ProfileQueryFilterProperty = enumType({
  name: "ProfileQueryFilterProperty",
  members: ProfileQueryFilterPropertyValues,
});

export const ProfileQueryFilterOperator = enumType({
  name: "ProfileQueryFilterOperator",
  members: ProfileQueryFilterOperatorValues,
});

export const ProfileQueryFilterGroupLogicalOperator = enumType({
  name: "ProfileQueryFilterGroupLogicalOperator",
  members: ProfileQueryFilterGroupLogicalOperatorValues,
});

export const ProfileQueryFilterInput = inputObjectType({
  name: "ProfileQueryFilterInput",
  definition(t) {
    t.nullable.globalId("profileTypeFieldId", { prefixName: "ProfileTypeField" });
    t.nullable.field("property", { type: "ProfileQueryFilterProperty" });
    t.nullable.field("operator", { type: "ProfileQueryFilterOperator" });
    t.nullable.json("value");
    t.nullable.field("logicalOperator", { type: "ProfileQueryFilterGroupLogicalOperator" });
    t.nullable.list.nonNull.field("conditions", { type: "ProfileQueryFilterInput" });
  },
});

export const ProfileQueryFilter = objectType({
  name: "ProfileQueryFilter",
  definition(t) {
    t.nullable.globalId("profileTypeFieldId", { prefixName: "ProfileTypeField" });
    t.nullable.field("property", { type: "ProfileQueryFilterProperty" });
    t.nullable.field("operator", { type: "ProfileQueryFilterOperator" });
    t.nullable.json("value");
    t.nullable.field("logicalOperator", { type: "ProfileQueryFilterGroupLogicalOperator" });
    t.nullable.list.nonNull.field("conditions", { type: "ProfileQueryFilter" });
  },
});
