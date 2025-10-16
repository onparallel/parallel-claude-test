import { gql } from "@apollo/client";
import { useLazyQuery } from "@apollo/client/react";
import { Button, FormControl, HStack, Input, Stack } from "@chakra-ui/react";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import {
  useWizardDialog,
  WizardStepDialogProps,
} from "@parallel/components/common/dialogs/WizardDialog";
import { ProfileRelationshipTypeWithDirectionSelect } from "@parallel/components/common/ProfileRelationshipTypeWithDirectionSelect";
import {
  CreatePetitionFieldInput,
  PetitionFieldType,
  ProfileTypeStandardType,
  useCreatePetitionFieldGroupProfileTypeDialog_petitionDocument,
  useCreatePetitionFieldGroupProfileTypeDialog_PetitionFieldInnerFragment,
  useCreatePetitionFieldGroupProfileTypeDialog_profileRelationshipTypesWithDirectionDocument,
  useCreatePetitionFieldGroupProfileTypeDialog_ProfileRelationshipTypeWithDirectionFragment,
  useCreatePetitionFieldGroupProfileTypeDialog_ProfileTypeFragment,
} from "@parallel/graphql/__types";
import { useGenericErrorToast } from "@parallel/utils/useGenericErrorToast";
import { useGetProfileTypeGroupsSuggestions } from "@parallel/utils/useGetProfileTypeGroupsSuggestions";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";
import { isNonNullish } from "remeda";
import {
  CreateOrUpdateFieldGroupRelationshipsDialog,
  CreateOrUpdateFieldGroupRelationshipsDialogProps,
  PetitionFieldGroupRelationship,
} from "./CreateOrUpdateFieldGroupRelationshipsDialog";

type CreatePetitionFieldGroupProfileTypeDialogSteps = {
  GROUP_NAME: {
    type: ProfileTypeStandardType;
    profileTypeId: string;
    petitionId: string;
    profileTypes: useCreatePetitionFieldGroupProfileTypeDialog_ProfileTypeFragment[];
    onAddField: (params: {
      type: PetitionFieldType;
      data?: CreatePetitionFieldInput;
      profileTypeId?: string;
    }) => Promise<string | undefined>;
  };
  GROUP_RELATIONSHIPS: CreateOrUpdateFieldGroupRelationshipsDialogProps;
};

// Utility functions
const getProfileTypeIds = (
  relationshipType: useCreatePetitionFieldGroupProfileTypeDialog_ProfileRelationshipTypeWithDirectionFragment["profileRelationshipType"],
  direction: useCreatePetitionFieldGroupProfileTypeDialog_ProfileRelationshipTypeWithDirectionFragment["direction"],
) => {
  const isRightLeft = direction === "RIGHT_LEFT";
  return {
    leftSideIds: isRightLeft
      ? relationshipType.allowedRightLeftProfileTypeIds
      : relationshipType.allowedLeftRightProfileTypeIds,
    rightSideIds: isRightLeft
      ? relationshipType.allowedLeftRightProfileTypeIds
      : relationshipType.allowedRightLeftProfileTypeIds,
  };
};

const filterRightField = (
  leftField: useCreatePetitionFieldGroupProfileTypeDialog_PetitionFieldInnerFragment,
  rightField: useCreatePetitionFieldGroupProfileTypeDialog_PetitionFieldInnerFragment,
  relationshipTypeWithDirection: useCreatePetitionFieldGroupProfileTypeDialog_ProfileRelationshipTypeWithDirectionFragment,
): boolean => {
  const { leftSideIds, rightSideIds } = getProfileTypeIds(
    relationshipTypeWithDirection.profileRelationshipType,
    relationshipTypeWithDirection.direction,
  );

  return (
    rightField.isLinkedToProfileType &&
    rightField.type === "FIELD_GROUP" &&
    (relationshipTypeWithDirection.profileRelationshipType.isReciprocal
      ? true
      : rightField.id !== leftField?.id) &&
    leftSideIds.includes(leftField?.profileType?.id ?? "") &&
    rightSideIds.includes(rightField.profileType?.id ?? "")
  );
};

function CreatePetitionFieldGroupProfileTypeDialogGroupName({
  type,
  profileTypeId,
  petitionId,
  onAddField,
  onStep,
  ...props
}: WizardStepDialogProps<CreatePetitionFieldGroupProfileTypeDialogSteps, "GROUP_NAME">) {
  const intl = useIntl();
  const {
    handleSubmit,
    register,
    setValue,
    watch,
    formState: { errors },
  } = useForm<{ name: string }>({
    mode: "onSubmit",
    defaultValues: { name: "" },
  });

  const [getPetition] = useLazyQuery(useCreatePetitionFieldGroupProfileTypeDialog_petitionDocument);
  const [getRelationshipTypesWithDirection] = useLazyQuery(
    useCreatePetitionFieldGroupProfileTypeDialog_profileRelationshipTypesWithDirectionDocument,
  );
  const [isLoading, setIsLoading] = useState(false);
  const suggestions = useGetProfileTypeGroupsSuggestions(type);
  const currentName = watch("name");
  const focusRef = useRef<HTMLInputElement>(null);
  const showGenericErrorToast = useGenericErrorToast();

  const onSubmit = handleSubmit(async ({ name }) => {
    setIsLoading(true);

    try {
      // Create petition field
      const selectedSuggestion = suggestions.find(
        (s) => s.name.toLowerCase() === name.toLowerCase(),
      );
      const petitionFieldId = await onAddField({
        type: "FIELD_GROUP",
        data: {
          ...(selectedSuggestion?.settings ?? {}),
          options: { groupName: name },
        },
        profileTypeId,
      });

      // Fetch petition and relationship data in parallel
      const [petitionResponse, relationshipResponse] = await Promise.all([
        getPetition({ variables: { id: petitionId } }),
        getRelationshipTypesWithDirection(),
      ]);

      const petition = petitionResponse.data?.petition;
      const relationshipTypesData = relationshipResponse.data;

      if (petitionFieldId && isNonNullish(petition)) {
        const petitionField = petition.fields.find((f) => f.id === petitionFieldId);
        let defaultRelationships: PetitionFieldGroupRelationship[] = [];
        if (
          isNonNullish(relationshipTypesData) &&
          isNonNullish(petitionField) &&
          isNonNullish(petitionField.profileType?.standardType)
        ) {
          const suggestion = suggestions.find((s) => s.name === petitionField.options.groupName);

          const profileRelationshipTypeWithDirection =
            relationshipTypesData.profileRelationshipTypesWithDirection.find((ptd) =>
              isNonNullish(suggestion?.relationship)
                ? ptd.profileRelationshipType.alias === suggestion.relationship.alias &&
                  ptd.direction === suggestion.relationship.direction
                : false,
            ) ?? null;

          const fields = petition.fields.filter((f) =>
            profileRelationshipTypeWithDirection
              ? filterRightField(petitionField, f, profileRelationshipTypeWithDirection)
              : false,
          );

          defaultRelationships = fields.map((f) => ({
            relationshipId: null,
            leftFieldGroup: petitionField,
            rightFieldGroup: f,
            profileRelationshipTypeWithDirection,
          }));
        }

        if (defaultRelationships.length) {
          onStep("GROUP_RELATIONSHIPS", {
            isTemplate: petition.__typename === "PetitionTemplate",
            petitionFieldId,
            petitionId: petition.id,
            suggestedRelationships: defaultRelationships,
          });
        } else {
          props.onResolve();
        }
      }
    } catch (error) {
      showGenericErrorToast(error);
    } finally {
      setIsLoading(false);
    }
  });

  return (
    <ConfirmDialog
      size="lg"
      content={{
        containerProps: {
          as: "form",
          onSubmit,
        },
      }}
      initialFocusRef={focusRef}
      hasCloseButton
      header={
        type === "CONTRACT" ? (
          <FormattedMessage
            id="component.create-petition-field-group-profile-type-dialog.header-group-name-contract"
            defaultMessage="What do you need information about?"
          />
        ) : (
          <FormattedMessage
            id="component.create-petition-field-group-profile-type-dialog.header-group-name-others"
            defaultMessage="Who do you need information from?"
          />
        )
      }
      body={
        <Stack>
          <FormControl isInvalid={!!errors.name}>
            <Input
              {...register("name", { required: true })}
              placeholder={intl.formatMessage(
                { id: "generic.for-example", defaultMessage: "E.g. {example}" },
                {
                  example:
                    type === "CONTRACT"
                      ? intl.formatMessage({
                          id: "component.create-petition-field-group-profile-type-dialog.placeholder-contract",
                          defaultMessage: "Contract",
                        })
                      : intl.formatMessage({
                          id: "component.create-petition-field-group-profile-type-dialog.placeholder-client",
                          defaultMessage: "Client",
                        }),
                },
              )}
            />

            <HStack flexWrap="wrap" marginTop={2} gap={2} spacing={0}>
              {suggestions
                .filter((suggestion) => suggestion.name.toLowerCase() !== currentName.toLowerCase())
                .map((suggestion) => (
                  <Button
                    key={suggestion.id}
                    variant="outline"
                    size="xs"
                    colorScheme="purple"
                    fontWeight={400}
                    fontSize="sm"
                    isDisabled={isLoading}
                    onClick={() => {
                      setValue("name", suggestion.name, { shouldValidate: true });
                      onSubmit();
                    }}
                  >
                    {suggestion.name}
                  </Button>
                ))}
            </HStack>
          </FormControl>
        </Stack>
      }
      confirm={
        <Button type="submit" colorScheme="primary" isLoading={isLoading}>
          <FormattedMessage id="generic.continue" defaultMessage="Continue" />
        </Button>
      }
      {...props}
    />
  );
}

export function useCreatePetitionFieldGroupProfileTypeDialog() {
  return useWizardDialog(
    {
      GROUP_NAME: CreatePetitionFieldGroupProfileTypeDialogGroupName,
      GROUP_RELATIONSHIPS: CreateOrUpdateFieldGroupRelationshipsDialog,
    },
    "GROUP_NAME",
  );
}

useCreatePetitionFieldGroupProfileTypeDialog.fragments = {
  get PetitionBase() {
    return gql`
      fragment useCreatePetitionFieldGroupProfileTypeDialog_PetitionBase on PetitionBase {
        id
        fieldRelationships {
          id
          leftSidePetitionField {
            ...useCreatePetitionFieldGroupProfileTypeDialog_PetitionFieldInner
          }
          rightSidePetitionField {
            ...useCreatePetitionFieldGroupProfileTypeDialog_PetitionFieldInner
          }
          relationshipTypeWithDirection {
            ...useCreatePetitionFieldGroupProfileTypeDialog_ProfileRelationshipTypeWithDirection
          }
        }
        fields {
          ...useCreatePetitionFieldGroupProfileTypeDialog_PetitionFieldInner
        }
      }
      ${this.PetitionFieldInner}
      ${this.ProfileRelationshipTypeWithDirection}
    `;
  },
  get ProfileType() {
    return gql`
      fragment useCreatePetitionFieldGroupProfileTypeDialog_ProfileType on ProfileType {
        id
        name
        fields {
          id
          alias
          name
          type
        }
      }
    `;
  },
  get PetitionFieldInner() {
    return gql`
      fragment useCreatePetitionFieldGroupProfileTypeDialog_PetitionFieldInner on PetitionField {
        id
        type
        options
        isLinkedToProfileType
        isLinkedToProfileTypeField
        profileType {
          id
          standardType
          ...useCreatePetitionFieldGroupProfileTypeDialog_ProfileType
        }
        profileTypeField {
          id
        }
      }
      ${this.ProfileType}
    `;
  },
  get ProfileRelationshipTypeWithDirection() {
    return gql`
      fragment useCreatePetitionFieldGroupProfileTypeDialog_ProfileRelationshipTypeWithDirection on ProfileRelationshipTypeWithDirection {
        ...ProfileRelationshipTypeWithDirectionSelect_ProfileRelationshipTypeWithDirection
      }
      ${ProfileRelationshipTypeWithDirectionSelect.fragments.ProfileRelationshipTypeWithDirection}
    `;
  },
};

const _queries = [
  gql`
    query useCreatePetitionFieldGroupProfileTypeDialog_petition($id: GID!) {
      petition(id: $id) {
        ...useCreatePetitionFieldGroupProfileTypeDialog_PetitionBase
      }
    }
    ${useCreatePetitionFieldGroupProfileTypeDialog.fragments.PetitionBase}
  `,
  gql`
    query useCreatePetitionFieldGroupProfileTypeDialog_profileRelationshipTypesWithDirection {
      profileRelationshipTypesWithDirection {
        ...useCreatePetitionFieldGroupProfileTypeDialog_ProfileRelationshipTypeWithDirection
      }
    }
    ${useCreatePetitionFieldGroupProfileTypeDialog.fragments.ProfileRelationshipTypeWithDirection}
  `,
];
