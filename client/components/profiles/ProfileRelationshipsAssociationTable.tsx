import { gql } from "@apollo/client";
import {
  Checkbox,
  CheckboxGroup,
  HStack,
  Stack,
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
} from "@chakra-ui/react";
import { RadioButtonSelected } from "@parallel/chakra/icons";
import { LocalizableUserTextRender } from "@parallel/components/common/LocalizableUserTextRender";
import { OverflownText } from "@parallel/components/common/OverflownText";
import { PetitionFieldReference } from "@parallel/components/common/PetitionFieldReference";
import { ScrollTableContainer } from "@parallel/components/common/ScrollTableContainer";
import { PetitionFieldTypeIndicator } from "@parallel/components/petition-common/PetitionFieldTypeIndicator";
import {
  CreatePetitionFromProfilePrefillInput,
  ProfileRelationshipsAssociationTable_PetitionBaseFragment,
  ProfileRelationshipsAssociationTable_ProfileFragment,
  ProfileRelationshipsAssociationTable_ProfileInnerFragment,
} from "@parallel/graphql/__types";
import { useFieldsWithIndices } from "@parallel/utils/fieldIndices";
import { Assert, UnwrapArray } from "@parallel/utils/types";
import { useEffect, useMemo } from "react";
import { Controller, useFieldArray, useFormContext } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";
import { isNonNullish, isNullish, uniqueBy } from "remeda";

type PetitionFieldSelection = UnwrapArray<
  Assert<ProfileRelationshipsAssociationTable_PetitionBaseFragment["fields"]>
>;

interface ProfileRelationshipsAssociationTableProps {
  name: string;
  profile: ProfileRelationshipsAssociationTable_ProfileFragment;
  petition: ProfileRelationshipsAssociationTable_PetitionBaseFragment;
  groupId: string;
  isDefaultChecked?: boolean;
}

export function ProfileRelationshipsAssociationTable({
  name,
  profile,
  petition,
  groupId,
  isDefaultChecked,
}: ProfileRelationshipsAssociationTableProps) {
  const intl = useIntl();

  const { control } = useFormContext<{
    [name: string]: CreatePetitionFromProfilePrefillInput[];
  }>();

  const compatibleFieldGroups = useMemo(
    () => calculateCompatibleFieldGroups({ profile, petition }),
    [petition, profile],
  );

  const relatedFieldGroupsWithCompatibleProfiles = useMemo(
    () =>
      calculateRelatedFieldGroupsWithCompatibleProfiles({
        petition,
        profile,
        compatibleFieldGroups,
        groupId,
      }),
    [petition, profile, groupId],
  );

  const { fields, replace } = useFieldArray({
    control,
    name,
  });

  useEffect(() => {
    replace(
      generatePrefillData(relatedFieldGroupsWithCompatibleProfiles, groupId, isDefaultChecked),
    );
  }, [groupId, profile, petition, name]);

  const fieldsWithIndices = useFieldsWithIndices(petition);

  return (
    <ScrollTableContainer maxHeight="350px">
      <Table variant="parallel">
        <Thead>
          <Tr position="sticky" top={0} zIndex={1}>
            <Th>
              <FormattedMessage
                id="component.associate-new-petition-to-profile-dialog.table-header-group"
                defaultMessage="Group"
              />
            </Th>
            <Th>
              <FormattedMessage
                id="component.associate-new-petition-to-profile-dialog.table-header-profile"
                defaultMessage="Profile"
              />
            </Th>
          </Tr>
        </Thead>
        <Tbody>
          {fields.map((item, index) => {
            const [field, profiles] = relatedFieldGroupsWithCompatibleProfiles.find(
              ([field]) => field.id === item.petitionFieldId,
            ) as [
              PetitionFieldSelection,
              ProfileRelationshipsAssociationTable_ProfileInnerFragment[],
            ];

            const isRadioButton = !field.multiple;
            const [_, fieldIndex] = fieldsWithIndices.find(([f]) => f.id === field.id)!;

            if (isNullish(field) || isNullish(profiles)) return null;

            return (
              <Tr key={item.id}>
                <Td>
                  <HStack>
                    <PetitionFieldTypeIndicator
                      as="span"
                      type={field.type}
                      fieldIndex={fieldIndex}
                    />
                    <OverflownText>
                      {field.options?.groupName || (
                        <PetitionFieldReference field={field} as="span" />
                      )}
                    </OverflownText>
                  </HStack>
                </Td>
                <Td>
                  <Controller
                    name={`${name}.${index}.profileIds` as const}
                    control={control}
                    render={({ field: { onChange, value } }) => {
                      return (
                        <CheckboxGroup
                          key={item.id}
                          colorScheme="primary"
                          value={value}
                          onChange={isRadioButton ? undefined : onChange}
                        >
                          <Stack>
                            {profiles.map((compatibleProfile) => {
                              const isDefaultChecked =
                                compatibleProfile.id === profile.id && groupId === field.id;

                              const isDisabled = isRadioButton && index === 0;

                              return (
                                <Checkbox
                                  key={compatibleProfile.id + field.id}
                                  value={compatibleProfile.id}
                                  isDisabled={isDefaultChecked || isDisabled}
                                  onChange={
                                    isRadioButton
                                      ? (e) => onChange(e.target.checked ? [e.target.value] : [])
                                      : undefined
                                  }
                                  {...(isRadioButton
                                    ? {
                                        icon:
                                          isDisabled && !isDefaultChecked ? undefined : (
                                            <RadioButtonSelected />
                                          ),
                                        variant: "radio",
                                      }
                                    : {})}
                                >
                                  <LocalizableUserTextRender
                                    default={intl.formatMessage({
                                      id: "generic.unnamed-profile",
                                      defaultMessage: "Unnamed profile",
                                    })}
                                    value={compatibleProfile.localizableName}
                                  />
                                </Checkbox>
                              );
                            })}
                          </Stack>
                        </CheckboxGroup>
                      );
                    }}
                  />
                </Td>
              </Tr>
            );
          })}
        </Tbody>
      </Table>
    </ScrollTableContainer>
  );
}

ProfileRelationshipsAssociationTable.fragments = {
  get PetitionBase() {
    return gql`
      fragment ProfileRelationshipsAssociationTable_PetitionBase on PetitionBase {
        id
        name
        fields {
          id
          type
          multiple
          isLinkedToProfileType
          options
          profileType {
            id
          }
          ...PetitionFieldReference_PetitionField
        }
        fieldRelationships {
          id
          leftSidePetitionField {
            id
            profileType {
              id
            }
          }
          rightSidePetitionField {
            id
            profileType {
              id
            }
          }
          relationshipTypeWithDirection {
            direction
            profileRelationshipType {
              id
              isReciprocal
            }
          }
        }
        ...useFieldsWithIndices_PetitionBase
      }
      ${PetitionFieldReference.fragments.PetitionField}
      ${useFieldsWithIndices.fragments.PetitionBase}
    `;
  },
  get ProfileInner() {
    return gql`
      fragment ProfileRelationshipsAssociationTable_ProfileInner on Profile {
        id
        status
        localizableName
        profileType {
          id
        }
      }
    `;
  },
  get Profile() {
    return gql`
      fragment ProfileRelationshipsAssociationTable_Profile on Profile {
        ...ProfileRelationshipsAssociationTable_ProfileInner
        profileType {
          id
          name
        }
        relationships {
          ...ProfileRelationshipsAssociationTable_ProfileRelationship
        }
      }
      ${this.ProfileInner}
      ${this.ProfileRelationship}
    `;
  },
  get ProfileRelationship() {
    return gql`
      fragment ProfileRelationshipsAssociationTable_ProfileRelationship on ProfileRelationship {
        id
        leftSideProfile {
          ...ProfileRelationshipsAssociationTable_ProfileInner
        }
        rightSideProfile {
          ...ProfileRelationshipsAssociationTable_ProfileInner
        }
        relationshipType {
          id
          isReciprocal
        }
      }
      ${this.ProfileInner}
    `;
  },
};

export const calculateCompatibleFieldGroups = ({
  profile,
  petition,
}: {
  profile: ProfileRelationshipsAssociationTable_ProfileFragment;
  petition?: ProfileRelationshipsAssociationTable_PetitionBaseFragment | null;
}) => {
  if (!petition) return [];

  const allFieldGroups =
    petition.fields.filter(
      (f) => isNonNullish(f) && f.type === "FIELD_GROUP" && f.isLinkedToProfileType,
    ) ?? [];

  return allFieldGroups.filter((f) => f.profileType?.id === profile.profileType.id);
};

export const calculateRelatedFieldGroupsWithCompatibleProfiles = ({
  profile,
  petition,
  compatibleFieldGroups,
  groupId,
}: {
  profile: ProfileRelationshipsAssociationTable_ProfileFragment;
  petition?: ProfileRelationshipsAssociationTable_PetitionBaseFragment | null;
  compatibleFieldGroups: PetitionFieldSelection[];
  groupId?: string;
}): [PetitionFieldSelection, ProfileRelationshipsAssociationTable_ProfileInnerFragment[]][] => {
  if (!petition || !compatibleFieldGroups.length) return [];

  const allFieldGroups =
    petition.fields.filter(
      (f) => isNonNullish(f) && f.type === "FIELD_GROUP" && f.isLinkedToProfileType,
    ) ?? [];

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
            PetitionFieldSelection,
            ProfileRelationshipsAssociationTable_ProfileInnerFragment[],
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
          PetitionFieldSelection,
          ProfileRelationshipsAssociationTable_ProfileInnerFragment[],
        ][]);

  return relatedFieldGroupsWithCompatibleProfiles;
};

export const generatePrefillData = (
  relatedGroups: [
    PetitionFieldSelection,
    ProfileRelationshipsAssociationTable_ProfileInnerFragment[],
  ][],
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
  field: PetitionFieldSelection,
  profiles: ProfileRelationshipsAssociationTable_ProfileInnerFragment[],
  isDefaultChecked?: boolean,
): string[] => {
  if (!field.multiple) {
    return profiles[0]?.id ? [profiles[0].id] : [];
  }
  return isDefaultChecked ? profiles.map((p) => p.id) : profiles[0]?.id ? [profiles[0].id] : [];
};
