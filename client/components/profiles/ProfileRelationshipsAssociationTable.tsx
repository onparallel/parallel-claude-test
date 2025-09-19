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
import {
  calculateCompatibleFieldGroups,
  calculateRelatedFieldGroupsWithCompatibleProfiles,
  generatePrefillData,
} from "@parallel/utils/petitions/profilePrefill";
import { Assert, UnwrapArray } from "@parallel/utils/types";
import { useEffect, useMemo } from "react";
import { Controller, useFieldArray, useFormContext } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";
import { isNullish } from "remeda";

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
        fields {
          id
          type
          multiple
          options
          ...PetitionFieldReference_PetitionField
        }
        ...useFieldsWithIndices_PetitionBase
        ...calculateCompatibleFieldGroups_PetitionBase
        ...calculateRelatedFieldGroupsWithCompatibleProfiles_PetitionBase
      }
      ${PetitionFieldReference.fragments.PetitionField}
      ${useFieldsWithIndices.fragments.PetitionBase}
      ${calculateCompatibleFieldGroups.fragments.PetitionBase}
      ${calculateRelatedFieldGroupsWithCompatibleProfiles.fragments.PetitionBase}
    `;
  },
  get ProfileInner() {
    return gql`
      fragment ProfileRelationshipsAssociationTable_ProfileInner on Profile {
        id
        localizableName
        ...calculateCompatibleFieldGroups_Profile
        ...calculateRelatedFieldGroupsWithCompatibleProfiles_Profile
      }
      ${calculateCompatibleFieldGroups.fragments.Profile}
      ${calculateRelatedFieldGroupsWithCompatibleProfiles.fragments.Profile}
    `;
  },
  get Profile() {
    return gql`
      fragment ProfileRelationshipsAssociationTable_Profile on Profile {
        ...ProfileRelationshipsAssociationTable_ProfileInner
        ...calculateRelatedFieldGroupsWithCompatibleProfiles_Profile
        relationships {
          ...ProfileRelationshipsAssociationTable_ProfileRelationship
          ...calculateRelatedFieldGroupsWithCompatibleProfiles_ProfileRelationship
        }
      }
      ${this.ProfileInner}
      ${this.ProfileRelationship}
      ${calculateRelatedFieldGroupsWithCompatibleProfiles.fragments.Profile}
      ${calculateRelatedFieldGroupsWithCompatibleProfiles.fragments.ProfileRelationship}
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
