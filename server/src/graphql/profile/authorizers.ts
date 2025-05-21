import { FieldAuthorizeResolver } from "nexus/dist/plugins/fieldAuthorizePlugin";
import { groupBy, indexBy, isNonNullish, isNullish, pick, unique, zip } from "remeda";
import {
  Profile,
  ProfileStatus,
  ProfileType,
  ProfileTypeField,
  ProfileTypeFieldPermissionType,
  ProfileTypeFieldType,
} from "../../db/__types";
import { ProfileTypeFieldOptions } from "../../services/ProfileTypeFieldService";
import { toGlobalId } from "../../util/globalId";
import { isAtLeast } from "../../util/profileTypeFieldPermission";
import { MaybeArray, unMaybeArray } from "../../util/types";
import { NexusGenInputs } from "../__types";
import { Arg, ArgAuthorizer, getArg } from "../helpers/authorize";
import { ApolloError, ForbiddenError } from "../helpers/errors";

function createProfileTypeAuthorizer<TRest extends any[] = []>(
  predicate: (profileType: ProfileType, ...rest: TRest) => boolean,
) {
  return ((argName, ...rest: TRest) => {
    return async (_, args, ctx) => {
      const profileTypeIds = unMaybeArray(getArg(args, argName));
      if (profileTypeIds.length === 0) {
        return true;
      }
      const profileTypes = await ctx.profiles.loadProfileType(profileTypeIds);
      return profileTypes.every(
        (profileType) => isNonNullish(profileType) && predicate(profileType, ...rest),
      );
    };
  }) as ArgAuthorizer<MaybeArray<number>, TRest>;
}

function createProfileAuthorizer<TRest extends any[] = []>(
  predicate: (profile: Profile, ...rest: TRest) => boolean,
) {
  return ((argName, ...rest: TRest) => {
    return async (_, args, ctx) => {
      const profileIds = unMaybeArray(getArg(args, argName));
      if (profileIds.length === 0) {
        return true;
      }
      const profiles = await ctx.profiles.loadProfile(profileIds);
      return profiles.every((profile) => isNonNullish(profile) && predicate(profile, ...rest));
    };
  }) as ArgAuthorizer<MaybeArray<number>, TRest>;
}

function createProfileTypeFieldAuthorizer<TRest extends any[] = []>(
  predicate: (profileTypeField: ProfileTypeField, ...rest: TRest) => boolean,
) {
  return ((argName, ...rest: TRest) => {
    return async (_, args, ctx) => {
      const profileTypeFieldIds = unMaybeArray(getArg(args, argName));
      if (profileTypeFieldIds.length === 0) {
        return true;
      }
      const profileTypeFields = await ctx.profiles.loadProfileTypeField(profileTypeFieldIds);
      return profileTypeFields.every(
        (profileTypeField) =>
          isNonNullish(profileTypeField) && predicate(profileTypeField, ...rest),
      );
    };
  }) as ArgAuthorizer<MaybeArray<number>, TRest>;
}

export const profileTypeIsArchived = createProfileTypeAuthorizer((p) =>
  isNonNullish(p.archived_at),
);

export const profileIsNotAnonymized = createProfileAuthorizer((p) => isNullish(p.anonymized_at));

export const profileTypeIsNotStandard = createProfileTypeAuthorizer(
  (p) => p.standard_type === null,
);

export const profileTypeIsStandard = createProfileTypeAuthorizer((p) =>
  isNonNullish(p.standard_type),
);

export const profileTypeFieldIsNotStandard = createProfileTypeFieldAuthorizer(
  (p) => !p.alias?.startsWith("p_"),
);

export function profileIsAssociatedToPetition<
  TypeName extends string,
  FieldName extends string,
  TProfileId extends Arg<TypeName, FieldName, MaybeArray<number>>,
  TPetitionId extends Arg<TypeName, FieldName, MaybeArray<number>>,
>(
  profileIdArg: TProfileId,
  petitionIdArg: TPetitionId,
): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    const profileIds = unique(unMaybeArray(getArg(args, profileIdArg)));
    const petitionIds = unique(unMaybeArray(getArg(args, petitionIdArg)));

    const count = await ctx.profiles.countProfilesAssociatedToPetitions(profileIds, petitionIds);

    if (count !== profileIds.length * petitionIds.length) {
      throw new ApolloError("Profile not associated to petition", "PROFILE_ASSOCIATION_ERROR");
    }

    return true;
  };
}

export function userHasAccessToProfileType<
  TypeName extends string,
  FieldName extends string,
  TProfileTypeId extends Arg<TypeName, FieldName, MaybeArray<number>>,
>(profileTypeIdArg: TProfileTypeId): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    try {
      const ids = unMaybeArray(getArg(args, profileTypeIdArg));

      const profileTypes = await ctx.profiles.loadProfileType(ids);
      return profileTypes.every((p) => isNonNullish(p) && p.org_id === ctx.user!.org_id);
    } catch {}
    return false;
  };
}

export function profileTypeFieldBelongsToProfileType<
  TypeName extends string,
  FieldName extends string,
  TProfileTypeFieldId extends Arg<TypeName, FieldName, MaybeArray<number>>,
  TProfileTypeId extends Arg<TypeName, FieldName, number>,
>(
  profileTypeFieldIdArg: TProfileTypeFieldId,
  profileTypeIdArg: TProfileTypeId,
): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    try {
      const profileTypeFieldIds = unique(unMaybeArray(getArg(args, profileTypeFieldIdArg)));
      const profileTypeId = getArg(args, profileTypeIdArg);

      const profileTypeFields = await ctx.profiles.loadProfileTypeField(profileTypeFieldIds);
      return profileTypeFields.every((p) => isNonNullish(p) && p.profile_type_id === profileTypeId);
    } catch {
      return false;
    }
  };
}

export function profileHasProfileTypeFieldId<
  TypeName extends string,
  FieldName extends string,
  TProfileId extends Arg<TypeName, FieldName, number>,
  TProfileTypeFieldId extends Arg<TypeName, FieldName, MaybeArray<number>>,
>(
  profileIdArg: TProfileId,
  profileTypeFieldIdArg: TProfileTypeFieldId,
): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    try {
      const profileId = getArg(args, profileIdArg);
      const profileTypeFieldIds = unMaybeArray(getArg(args, profileTypeFieldIdArg));
      const [profileTypeFields, profile] = await Promise.all([
        ctx.profiles.loadProfileTypeField(profileTypeFieldIds),
        ctx.profiles.loadProfile(profileId),
      ]);
      return (
        isNonNullish(profile) &&
        profileTypeFields.every(
          (p) => isNonNullish(p) && p.profile_type_id === profile.profile_type_id,
        )
      );
    } catch {
      return false;
    }
  };
}

export function profileFieldFileHasProfileTypeFieldId<
  TypeName extends string,
  FieldName extends string,
  TProfileFieldFileId extends Arg<TypeName, FieldName, MaybeArray<number>>,
  TProfileTypeFieldId extends Arg<TypeName, FieldName, number>,
>(
  profileFieldFileIdArg: TProfileFieldFileId,
  profileTypeFieldIdArg: TProfileTypeFieldId,
): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    try {
      const profileFieldFileIds = unMaybeArray(getArg(args, profileFieldFileIdArg));
      const profileTypeFieldId = getArg(args, profileTypeFieldIdArg);
      const profileFieldFiles = await ctx.profiles.loadProfileFieldFileById(profileFieldFileIds);

      return profileFieldFiles.every((pff) => pff?.profile_type_field_id === profileTypeFieldId);
    } catch {
      return false;
    }
  };
}

export function profileTypeFieldIsOfType<
  TypeName extends string,
  FieldName extends string,
  TProfileTypeFieldId extends Arg<TypeName, FieldName, MaybeArray<number>>,
>(
  profileTypeFieldIdArg: TProfileTypeFieldId,
  types: ProfileTypeFieldType[],
): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    try {
      const profileTypeFieldIds = unMaybeArray(getArg(args, profileTypeFieldIdArg));
      const profileTypeFields = await ctx.profiles.loadProfileTypeField(profileTypeFieldIds);

      return profileTypeFields.every((p) => isNonNullish(p) && types.includes(p.type));
    } catch {
      return false;
    }
  };
}

export function userHasAccessToProfile<
  TypeName extends string,
  FieldName extends string,
  TProfileId extends Arg<TypeName, FieldName, MaybeArray<number>>,
>(profileIdArg: TProfileId): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    try {
      const ids = unMaybeArray(getArg(args, profileIdArg));
      const profiles = await ctx.profiles.loadProfile(ids);
      return profiles.every((p) => isNonNullish(p) && p.org_id === ctx.user!.org_id);
    } catch {
      return false;
    }
  };
}

export function fileUploadCanBeAttachedToProfileTypeField<
  TypeName extends string,
  FieldName extends string,
  TProfileId extends Arg<TypeName, FieldName, number>,
  TProfileTypeFieldId extends Arg<TypeName, FieldName, number>,
  TData extends Arg<TypeName, FieldName, NexusGenInputs["FileUploadInput"][]>,
>(
  profileIdArg: TProfileId,
  profileTypeFieldIdArg: TProfileTypeFieldId,
  dataArg: TData,
): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    const profileId = getArg(args, profileIdArg);
    const profileTypeFieldId = getArg(args, profileTypeFieldIdArg);
    const data = getArg(args, dataArg);
    const files = await ctx.profiles.loadProfileFieldFiles({ profileId, profileTypeFieldId });

    if ((files ?? []).length + data.length > 10) {
      throw new ApolloError(
        "You cannot upload more than 10 files on the same profile field",
        "MAX_FILES_EXCEEDED",
      );
    }
    return true;
  };
}

export function contextUserCanSubscribeUsersToProfile<
  TypeName extends string,
  FieldName extends string,
  TUserIdsArg extends Arg<TypeName, FieldName, number[]>,
>(userIdsArg: TUserIdsArg): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    const userIds = unique(getArg(args, userIdsArg));

    const users = await ctx.users.loadUser(userIds);

    // every user has to belong to same organization as context user
    if (users.some((u) => isNullish(u) || u.org_id !== ctx.user!.org_id)) {
      return false;
    }

    // collaborators can only subscribe/unsubscribe themselves
    if (userIds.some((id) => id !== ctx.user!.id)) {
      const userPermissions = await ctx.users.loadUserPermissions(ctx.user!.id);
      return userPermissions.includes("PROFILES:SUBSCRIBE_PROFILES");
    }
    return true;
  };
}

export function userHasPermissionOnProfileTypeField<
  TypeName extends string,
  FieldName extends string,
>(
  argName: Arg<TypeName, FieldName, MaybeArray<number>>,
  permission: ProfileTypeFieldPermissionType,
): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    const ids = unMaybeArray(getArg(args, argName));
    const myPermissions = await ctx.profiles.loadProfileTypeFieldUserEffectivePermission(
      ids.map((id) => ({ profileTypeFieldId: id, userId: ctx.user!.id })),
    );
    return myPermissions.every((p) => isAtLeast(p, permission));
  };
}

export function profileHasStatus<
  TypeName extends string,
  FieldName extends string,
  TArg extends Arg<TypeName, FieldName, MaybeArray<number>>,
>(
  profileIdArg: TArg,
  status: MaybeArray<ProfileStatus>,
): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    const profileIds = unMaybeArray(getArg(args, profileIdArg));
    const validStatuses = unMaybeArray(status);

    const profiles = await ctx.profiles.loadProfile(profileIds);
    return profiles.every((p) => isNonNullish(p) && validStatuses.includes(p.status));
  };
}

export function profileTypeFieldIsNotUsedInMonitoringRules<
  TypeName extends string,
  FieldName extends string,
  TProfileTypeId extends Arg<TypeName, FieldName, number>,
  TProfileTypeFieldId extends Arg<TypeName, FieldName, MaybeArray<number>>,
>(
  profileTypeIdArg: TProfileTypeId,
  profileTypeFieldIdArg: TProfileTypeFieldId,
): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    const profileTypeId = getArg(args, profileTypeIdArg);
    const profileTypeFieldIds = unMaybeArray(getArg(args, profileTypeFieldIdArg));
    const usedInProfileTypeFields = (
      await ctx.profiles.loadProfileTypeFieldsByProfileTypeId(profileTypeId)
    ).filter((ptf) => {
      // check if the profile type has other properties of this types that are referencing profileTypeFieldIds in monitoring options
      if (ptf.type === "BACKGROUND_CHECK" || ptf.type === "ADVERSE_MEDIA_SEARCH") {
        const options = ptf.options as ProfileTypeFieldOptions[
          | "BACKGROUND_CHECK"
          | "ADVERSE_MEDIA_SEARCH"];

        if (
          (isNonNullish(options.monitoring?.activationCondition?.profileTypeFieldId) &&
            profileTypeFieldIds.includes(
              options.monitoring.activationCondition.profileTypeFieldId,
            )) ||
          (options.monitoring?.searchFrequency.type === "VARIABLE" &&
            profileTypeFieldIds.includes(options.monitoring.searchFrequency.profileTypeFieldId))
        ) {
          return true;
        }
      }

      return false;
    });

    if (usedInProfileTypeFields.length > 0) {
      throw new ApolloError(
        "This field is being used in a monitoring rule.",
        "FIELD_USED_IN_MONITORING_RULE",
        {
          profileTypeFieldIds: usedInProfileTypeFields.map((ptf) =>
            toGlobalId("ProfileTypeField", ptf.id),
          ),
        },
      );
    }

    return true;
  };
}

export function userHasAccessToProfileRelationshipsInput<
  TypeName extends string,
  FieldName extends string,
  TProfileRelationshipTypeId extends Arg<
    TypeName,
    FieldName,
    MaybeArray<NexusGenInputs["CreateProfileRelationshipInput"]>
  >,
>(
  profileRelationshipsArg: TProfileRelationshipTypeId,
): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    const relationships = unMaybeArray(getArg(args, profileRelationshipsArg));

    const relationshipTypes = await ctx.profiles.loadProfileRelationshipType(
      relationships.map((r) => r.profileRelationshipTypeId),
    );

    const profiles = await ctx.profiles.loadProfile(relationships.map((r) => r.profileId));

    return (
      relationshipTypes.every((prt) => prt?.org_id === ctx.user!.org_id) &&
      profiles.every(
        (p) =>
          p?.org_id === ctx.user!.org_id &&
          !p.anonymized_at &&
          ["OPEN", "CLOSED"].includes(p.status),
      )
    );
  };
}

export function profilesCanBeAssociated<
  TypeName extends string,
  FieldName extends string,
  TProfileIdArg extends Arg<TypeName, FieldName, number>,
  TRelationshipsArg extends Arg<
    TypeName,
    FieldName,
    MaybeArray<NexusGenInputs["CreateProfileRelationshipInput"]>
  >,
>(
  profileIdArg: TProfileIdArg,
  relationshipsArg: TRelationshipsArg,
): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    const profileId = getArg(args, profileIdArg);
    const relationshipsData = unMaybeArray(getArg(args, relationshipsArg));

    if (relationshipsData.some((r) => r.profileId === profileId)) {
      // A profile cannot be associated with itself
      return false;
    }

    const currentRelationships =
      await ctx.profiles.loadProfileRelationshipsByProfileId.raw(profileId);

    const allRelationships = [
      ...currentRelationships.map(
        pick(["profile_relationship_type_id", "left_side_profile_id", "right_side_profile_id"]),
      ),
      ...relationshipsData.map((r) => ({
        profile_relationship_type_id: r.profileRelationshipTypeId,
        left_side_profile_id: r.direction === "LEFT_RIGHT" ? profileId : r.profileId,
        right_side_profile_id: r.direction === "LEFT_RIGHT" ? r.profileId : profileId,
      })),
    ];

    if (allRelationships.length > 100) {
      throw new ForbiddenError("A profile can't have more than 100 relationships");
    }

    if (
      Object.values(
        groupBy(
          allRelationships,
          (r) =>
            `${r.profile_relationship_type_id}-${r.left_side_profile_id}-${r.right_side_profile_id}`,
        ),
      ).some((group) => group.length > 1)
    ) {
      throw new ApolloError(
        "The provided profiles are already associated",
        "PROFILES_ALREADY_ASSOCIATED_ERROR",
      );
    }

    const profiles = await ctx.profiles.loadProfile(
      unique([profileId, ...relationshipsData.map((r) => r.profileId)]),
    );

    if (!profiles.every(isNonNullish)) {
      return false;
    }

    const profilesById = indexBy(profiles, (p) => p.id);

    const invalidRelationships = await ctx.profiles.getInvalidRelationships(
      ctx.user!.org_id,
      relationshipsData.map((r) => ({
        leftSideProfileTypeId:
          r.direction === "RIGHT_LEFT"
            ? profilesById[r.profileId].profile_type_id
            : profilesById[profileId].profile_type_id,
        rightSideProfileTypeId:
          r.direction === "LEFT_RIGHT"
            ? profilesById[r.profileId].profile_type_id
            : profilesById[profileId].profile_type_id,
        profileRelationshipTypeId: r.profileRelationshipTypeId,
      })),
    );

    if (invalidRelationships.length > 0) {
      throw new ApolloError(
        "The provided profiles cannot be associated",
        "INVALID_PROFILE_RELATIONSHIP_TYPE_ERROR",
      );
    }

    return true;
  };
}

export function relationshipBelongsToProfile<
  TypeName extends string,
  FieldName extends string,
  TProfileIdArg extends Arg<TypeName, FieldName, number>,
  TProfileRelationshipIdArg extends Arg<TypeName, FieldName, MaybeArray<number>>,
>(
  profileIdArg: TProfileIdArg,
  profileRelationshipIdArg: TProfileRelationshipIdArg,
): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    const profileId = getArg(args, profileIdArg);
    const profileRelationshipIds = unMaybeArray(getArg(args, profileRelationshipIdArg));

    const relationships = await ctx.profiles.loadProfileRelationship(profileRelationshipIds);
    return relationships.every(
      (r) =>
        isNonNullish(r) &&
        r.org_id === ctx.user!.org_id &&
        (r.left_side_profile_id === profileId || r.right_side_profile_id === profileId),
    );
  };
}

export function profileHasSameProfileTypeAsField<
  TypeName extends string,
  FieldName extends string,
  TProfileIdsArg extends Arg<TypeName, FieldName, MaybeArray<number>>,
  TPetitionFieldIdArg extends Arg<TypeName, FieldName, number>,
>(
  profileIdsArg: TProfileIdsArg,
  petitionFieldIdArg: TPetitionFieldIdArg,
): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    const profileIds = unMaybeArray(getArg(args, profileIdsArg));
    const petitionFieldId = getArg(args, petitionFieldIdArg);

    const [profiles, petitionField] = await Promise.all([
      ctx.profiles.loadProfile(profileIds),
      ctx.petitions.loadField(petitionFieldId),
    ]);

    return profiles.every(
      (profile) =>
        isNonNullish(profile) &&
        isNonNullish(petitionField) &&
        profile.profile_type_id === petitionField.profile_type_id,
    );
  };
}

export function profileTypeFieldBelongsToPetitionFieldProfileType<
  TypeName extends string,
  FieldName extends string,
  TProfileTypeFieldIdsArg extends Arg<TypeName, FieldName, number[]>,
  TPetitionFieldIdArg extends Arg<TypeName, FieldName, number>,
>(
  profileTypeFieldIdsArg: TProfileTypeFieldIdsArg,
  petitionFieldIdArg: TPetitionFieldIdArg,
): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    const profileTypeFieldIds = getArg(args, profileTypeFieldIdsArg);
    const petitionFieldId = getArg(args, petitionFieldIdArg);

    const [profileTypeFields, petitionField] = await Promise.all([
      ctx.profiles.loadProfileTypeField(profileTypeFieldIds),
      ctx.petitions.loadField(petitionFieldId),
    ]);

    return (
      isNonNullish(petitionField) &&
      profileTypeFields.every(
        (ptf) => isNonNullish(ptf) && ptf.profile_type_id === petitionField.profile_type_id,
      )
    );
  };
}

export function profileTypeFieldsAreExpirable<
  TypeName extends string,
  FieldName extends string,
  TProfileTypeFieldIdsArg extends Arg<TypeName, FieldName, number[]>,
>(profileTypeFieldIdsArg: TProfileTypeFieldIdsArg): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    const profileTypeFieldIds = getArg(args, profileTypeFieldIdsArg);

    const profileTypeFields = await ctx.profiles.loadProfileTypeField(profileTypeFieldIds);
    return profileTypeFields.every((ptf) => isNonNullish(ptf) && ptf.is_expirable);
  };
}

export function userHasAccessToExternalSourceEntity<
  TypeName extends string,
  FieldName extends string,
  TEntityIdArg extends Arg<TypeName, FieldName, number>,
>(entityIdArg: TEntityIdArg): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    const entityId = getArg(args, entityIdArg);

    const entity = await ctx.profiles.loadProfileExternalSourceEntity(entityId);
    return isNonNullish(entity) && entity.created_by_user_id === ctx.user!.id;
  };
}

export function externalSourceEntityMatchesProfileTypeStandardType<
  TypeName extends string,
  FieldName extends string,
  TEntityIdArg extends Arg<TypeName, FieldName, number>,
  TProfileTypeIdArg extends Arg<TypeName, FieldName, number>,
>(
  entityIdArg: TEntityIdArg,
  profileTypeIdArg: TProfileTypeIdArg,
): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    const entityId = getArg(args, entityIdArg);
    const profileTypeId = getArg(args, profileTypeIdArg);

    const entity = await ctx.profiles.loadProfileExternalSourceEntity(entityId);
    const profileType = await ctx.profiles.loadProfileType(profileTypeId);

    const matches =
      isNonNullish(entity) &&
      isNonNullish(profileType) &&
      entity.standard_type === profileType.standard_type;

    if (!matches) {
      throw new ForbiddenError("Entity does not match profile type standard type");
    }

    return true;
  };
}

export function profileMatchesProfileType<
  TypeName extends string,
  FieldName extends string,
  TProfileIdArg extends Arg<TypeName, FieldName, number>,
  TProfileTypeIdArg extends Arg<TypeName, FieldName, number>,
>(
  profileIdArg: TProfileIdArg,
  profileTypeIdArg: TProfileTypeIdArg,
): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    const profileId = getArg(args, profileIdArg);
    const profileTypeId = getArg(args, profileTypeIdArg);

    const profile = await ctx.profiles.loadProfile(profileId);

    const matches = isNonNullish(profile) && profile.profile_type_id === profileTypeId;

    if (!matches) {
      throw new ForbiddenError("Profile does not match profile type");
    }

    return true;
  };
}

export function userCanOverwriteProfileFields<
  TypeName extends string,
  FieldName extends string,
  TProfileTypeIdArg extends Arg<TypeName, FieldName, number>,
  TConflictResolutionsArg extends Arg<
    TypeName,
    FieldName,
    NexusGenInputs["ProfileExternalSourceConflictResolution"][]
  >,
>(
  profileTypeIdArg: TProfileTypeIdArg,
  conflictResolutionsArg: TConflictResolutionsArg,
): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    const profileTypeId = getArg(args, profileTypeIdArg);
    const conflictResolutions = getArg(args, conflictResolutionsArg);

    const profileTypeFields =
      await ctx.profiles.loadProfileTypeFieldsByProfileTypeId(profileTypeId);
    const effectivePermissions = await ctx.profiles.loadProfileTypeFieldUserEffectivePermission(
      profileTypeFields.map((ptf) => ({
        profileTypeFieldId: ptf.id,
        userId: ctx.user!.id,
      })),
    );

    const zipped = zip(profileTypeFields, effectivePermissions);

    // check that for every OVERWRITE on the resolutions, user has WRITE permission on the property
    for (const resolution of conflictResolutions) {
      if (resolution.action === "OVERWRITE") {
        const found = zipped.find(([ptf]) => ptf.id === resolution.profileTypeFieldId);
        if (!found || !isAtLeast(found[1], "WRITE")) {
          throw new ForbiddenError("User does not have permission to overwrite profile field");
        }
      }
    }

    return true;
  };
}

export function userHasAccessToProfileTypeProcess<
  TypeName extends string,
  FieldName extends string,
  TProcessIdArg extends Arg<TypeName, FieldName, MaybeArray<number>>,
>(processIdArg: TProcessIdArg): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    const processIds = unMaybeArray(getArg(args, processIdArg));
    const hasAccess = await ctx.profiles.orgHasAccessToProfileTypeProcesses(
      processIds,
      ctx.user!.org_id,
    );

    if (!hasAccess) {
      throw new ForbiddenError("User does not have access to profile type process");
    }

    return true;
  };
}

export function userHasAccessToEditProfileTypeProcessInput<
  TypeName extends string,
  FieldName extends string,
  TInputArg extends Arg<TypeName, FieldName, NexusGenInputs["EditProfileTypeProcessInput"]>,
>(dataArg: TInputArg): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    const data = getArg(args, dataArg);
    const templateIds = data.templateIds;

    if (templateIds) {
      // no need to have a READ permission on the templates
      const petitions = await ctx.petitions.loadPetition(templateIds);
      if (
        petitions.some(
          (p) =>
            isNullish(p) || !p.is_template || p.template_public || p.org_id !== ctx.user!.org_id,
        )
      ) {
        throw new ForbiddenError("User does not have access to the provided templates");
      }
    }

    return true;
  };
}

export function profileTypeProcessBelongsToProfileType<
  TypeName extends string,
  FieldName extends string,
  TProcessIdArg extends Arg<TypeName, FieldName, MaybeArray<number>>,
  TProfileTypeIdArg extends Arg<TypeName, FieldName, number>,
>(
  processIdArg: TProcessIdArg,
  profileTypeIdArg: TProfileTypeIdArg,
): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    const processIds = unMaybeArray(getArg(args, processIdArg));
    const profileTypeId = getArg(args, profileTypeIdArg);

    const processes = await ctx.profiles.loadProfileTypeProcess(processIds);
    const processesBelongToProfileType = processes.every(
      (p) => isNonNullish(p) && p.profile_type_id === profileTypeId,
    );
    if (!processesBelongToProfileType) {
      throw new ForbiddenError("Profile type process does not belong to profile type");
    }

    return true;
  };
}
