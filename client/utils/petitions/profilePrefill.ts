import { gql } from "@apollo/client";
import {
  calculateCompatibleFieldGroups_PetitionBaseFragment,
  calculateCompatibleFieldGroups_ProfileFragment,
  calculateRelatedFieldGroupsWithCompatibleProfiles_PetitionBaseFragment,
  calculateRelatedFieldGroupsWithCompatibleProfiles_PetitionFieldFragment,
  calculateRelatedFieldGroupsWithCompatibleProfiles_ProfileFragment,
  calculateRelatedFieldGroupsWithCompatibleProfiles_ProfileInnerFragment,
  CreatePetitionFromProfilePrefillInput,
} from "@parallel/graphql/__types";
import { isNonNullish, uniqueBy } from "remeda";
import { groupFieldsWithProfileTypes } from "../groupFieldsWithProfileTypes";

// Use the GraphQL fragment field as the base type for better type safety
type CompatibleFieldBase = calculateCompatibleFieldGroups_PetitionBaseFragment["fields"][0];

export const calculateCompatibleFieldGroups = <
  TField extends CompatibleFieldBase = CompatibleFieldBase,
>({
  profile,
  petition,
}: {
  profile: calculateCompatibleFieldGroups_ProfileFragment;
  petition?: { fields: TField[] } | null;
}): TField[] => {
  if (!petition) return [];

  return (
    petition.fields.filter(
      (f) =>
        isNonNullish(f) &&
        f.type === "FIELD_GROUP" &&
        f.isLinkedToProfileType &&
        f.profileType?.id === profile.profileType.id,
    ) ?? []
  );
};

calculateCompatibleFieldGroups.fragments = {
  get PetitionBase() {
    return gql`
      fragment calculateCompatibleFieldGroups_PetitionBase on PetitionBase {
        id
        fields {
          id
          type
          isLinkedToProfileType
          profileType {
            id
          }
          multiple
        }
      }
    `;
  },
  get Profile() {
    return gql`
      fragment calculateCompatibleFieldGroups_Profile on Profile {
        id
        profileType {
          id
        }
      }
    `;
  },
};

export const calculateRelatedFieldGroupsWithCompatibleProfiles = ({
  profile,
  petition,
  compatibleFieldGroups,
  groupId,
}: {
  profile: calculateRelatedFieldGroupsWithCompatibleProfiles_ProfileFragment;
  petition?: calculateRelatedFieldGroupsWithCompatibleProfiles_PetitionBaseFragment | null;
  compatibleFieldGroups: calculateRelatedFieldGroupsWithCompatibleProfiles_PetitionFieldFragment[];
  groupId?: string;
}): [
  calculateRelatedFieldGroupsWithCompatibleProfiles_PetitionFieldFragment,
  calculateRelatedFieldGroupsWithCompatibleProfiles_ProfileInnerFragment[],
][] => {
  if (!petition || !compatibleFieldGroups.length) return [];

  const groupedFields = groupFieldsWithProfileTypes(petition.fields);

  const allFieldGroups = groupedFields.map(([f]) => f);

  const selectedGroup = groupId
    ? compatibleFieldGroups.find((f) => f.id === groupId)
    : compatibleFieldGroups[0];
  const selectedGroupId = selectedGroup?.id;

  // Filter the compatible relationships that the petition has configured with the selected group, by default the first one.
  const petitionRelationships = petition.fieldRelationships.filter(
    (r) =>
      selectedGroupId === r.rightSidePetitionField.id ||
      selectedGroupId === r.leftSidePetitionField.id,
  );

  const relatedFieldGroupsWithCompatibleProfiles =
    profile.relationships.length === 0
      ? isNonNullish(selectedGroup)
        ? ([[selectedGroup, [profile]]] as [
            calculateRelatedFieldGroupsWithCompatibleProfiles_PetitionFieldFragment,
            calculateRelatedFieldGroupsWithCompatibleProfiles_ProfileInnerFragment[],
          ][])
        : []
      : (allFieldGroups
          .map((f) => {
            const profiles = uniqueBy(
              [
                ...(selectedGroupId === f.id ? [profile] : []),
                // filter the available relationships in the profile to suggest the "prefill" in step 3
                ...profile.relationships
                  .filter((pr) =>
                    petitionRelationships
                      .filter(
                        // relationships of the same type
                        (tr) =>
                          tr.relationshipTypeWithDirection.profileRelationshipType.id ===
                          pr.relationshipType.id,
                      )
                      .some((tr) => {
                        let [leftId, rightId] = [
                          tr.leftSidePetitionField.id,
                          tr.rightSidePetitionField.id,
                        ];
                        if (tr.relationshipTypeWithDirection.profileRelationshipType.isReciprocal) {
                          return (
                            (leftId === selectedGroupId && rightId === f.id) ||
                            (leftId === f.id && rightId === selectedGroupId)
                          );
                        }
                        if (pr.rightSideProfile.id === profile.id) {
                          [leftId, rightId] = [rightId, leftId];
                        }
                        if (tr.relationshipTypeWithDirection.direction === "RIGHT_LEFT") {
                          [leftId, rightId] = [rightId, leftId];
                        }
                        return leftId === selectedGroupId && rightId === f.id;
                      }),
                  )
                  .map((r) =>
                    r.leftSideProfile.id === profile.id ? r.rightSideProfile : r.leftSideProfile,
                  ),
              ],
              (p) => p.id,
            ).filter((p) => ["OPEN", "CLOSED"].includes(p.status));

            const filteredProfiles = profiles.filter((p) => p.profileType.id === f.profileType?.id);

            return filteredProfiles.length > 0 ? [f, filteredProfiles] : null;
          })
          .filter(isNonNullish) as [
          calculateRelatedFieldGroupsWithCompatibleProfiles_PetitionFieldFragment,
          calculateRelatedFieldGroupsWithCompatibleProfiles_ProfileInnerFragment[],
        ][]);

  return relatedFieldGroupsWithCompatibleProfiles;
};

calculateRelatedFieldGroupsWithCompatibleProfiles.fragments = {
  get PetitionField() {
    return gql`
      fragment calculateRelatedFieldGroupsWithCompatibleProfiles_PetitionField on PetitionField {
        id
        type
        isLinkedToProfileType
        profileType {
          id
        }
        multiple
        ...groupFieldsWithProfileTypes_PetitionField
      }
      ${groupFieldsWithProfileTypes.fragments.PetitionField}
    `;
  },
  get PetitionBase() {
    return gql`
      fragment calculateRelatedFieldGroupsWithCompatibleProfiles_PetitionBase on PetitionBase {
        id
        fieldRelationships {
          id
          relationshipTypeWithDirection {
            direction
            profileRelationshipType {
              id
              isReciprocal
            }
          }
          leftSidePetitionField {
            id
          }
          rightSidePetitionField {
            id
          }
        }
        fields {
          id
          ...calculateRelatedFieldGroupsWithCompatibleProfiles_PetitionField
        }
      }
      ${this.PetitionField}
    `;
  },
  get ProfileInner() {
    return gql`
      fragment calculateRelatedFieldGroupsWithCompatibleProfiles_ProfileInner on Profile {
        id
        status
        localizableName
        profileType {
          id
        }
      }
    `;
  },
  get ProfileRelationship() {
    return gql`
      fragment calculateRelatedFieldGroupsWithCompatibleProfiles_ProfileRelationship on ProfileRelationship {
        id
        leftSideProfile {
          ...calculateRelatedFieldGroupsWithCompatibleProfiles_ProfileInner
        }
        rightSideProfile {
          ...calculateRelatedFieldGroupsWithCompatibleProfiles_ProfileInner
        }
        relationshipType {
          id
          isReciprocal
        }
      }
      ${this.ProfileInner}
    `;
  },
  get Profile() {
    return gql`
      fragment calculateRelatedFieldGroupsWithCompatibleProfiles_Profile on Profile {
        ...calculateRelatedFieldGroupsWithCompatibleProfiles_ProfileInner
        profileType {
          id
          name
        }
        relationships {
          ...calculateRelatedFieldGroupsWithCompatibleProfiles_ProfileRelationship
        }
      }
      ${this.ProfileInner}
      ${this.ProfileRelationship}
    `;
  },
};

export const generatePrefillData = (
  relatedGroups: [{ id: string; multiple: boolean }, { id: string }[]][],
  selectedGroupId: string,
  isDefaultChecked?: boolean,
): CreatePetitionFromProfilePrefillInput[] => {
  return relatedGroups
    .map(([field, profiles]) => {
      const shouldIncludeIds = selectedGroupId === field.id || isDefaultChecked;
      const profileIds = shouldIncludeIds ? getProfileIds(field, profiles, isDefaultChecked) : [];

      return {
        petitionFieldId: field.id,
        profileIds,
      };
    })
    .sort((a, b) => (a.petitionFieldId === selectedGroupId ? -1 : 1));
};

const getProfileIds = (
  field: { multiple: boolean },
  profiles: { id: string }[],
  isDefaultChecked?: boolean,
): string[] => {
  if (!field.multiple) {
    return profiles[0]?.id ? [profiles[0].id] : [];
  }
  return isDefaultChecked ? profiles.map((p) => p.id) : profiles[0]?.id ? [profiles[0].id] : [];
};
