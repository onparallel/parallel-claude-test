import { gql, useMutation, useQuery } from "@apollo/client";
import {
  Box,
  Button,
  FormControl,
  FormErrorMessage,
  Grid,
  Heading,
  Stack,
  Text,
} from "@chakra-ui/react";
import { DeleteIcon } from "@parallel/chakra/icons";
import { IconButtonWithTooltip } from "@parallel/components/common/IconButtonWithTooltip";
import { NoElement } from "@parallel/components/common/NoElement";
import { PetitionFieldSelect } from "@parallel/components/common/PetitionFieldSelect";
import { ProfileRelationshipTypeWithDirectionSelect } from "@parallel/components/common/ProfileRelationshipTypeWithDirectionSelect";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { MaybeWizardStepDialogProps } from "@parallel/components/common/dialogs/WizardDialog";
import {
  UpdatePetitionFieldGroupRelationshipInput,
  useCreateOrUpdateFieldGroupRelationshipsDialog_PetitionBaseFragment,
  useCreateOrUpdateFieldGroupRelationshipsDialog_petitionDocument,
  useCreateOrUpdateFieldGroupRelationshipsDialog_profileRelationshipTypesWithDirectionDocument,
  useCreateOrUpdateFieldGroupRelationshipsDialog_ProfileRelationshipTypeWithDirectionFragment,
  useCreateOrUpdateFieldGroupRelationshipsDialog_updatePetitionFieldGroupRelationshipsDocument,
} from "@parallel/graphql/__types";
import { UnwrapArray } from "@parallel/utils/types";
import { useRerender } from "@parallel/utils/useRerender";
import { useCallback, useEffect } from "react";
import { Controller, FormProvider, useFieldArray, useForm, useFormContext } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";
import { isNonNullish, isNullish, unique } from "remeda";

export interface CreateOrUpdateFieldGroupRelationshipsDialogProps {
  isTemplate: boolean;
  petitionId: string;
  petitionFieldId: string;
  suggestedRelationships?: PetitionFieldGroupRelationship[];
}

type PetitionFieldSelection = UnwrapArray<
  Exclude<
    useCreateOrUpdateFieldGroupRelationshipsDialog_PetitionBaseFragment["fields"],
    null | undefined
  >
>;
export interface PetitionFieldGroupRelationship {
  relationshipId: string | null;
  leftFieldGroup: PetitionFieldSelection | null;
  rightFieldGroup: PetitionFieldSelection | null;
  profileRelationshipTypeWithDirection: useCreateOrUpdateFieldGroupRelationshipsDialog_ProfileRelationshipTypeWithDirectionFragment | null;
}
interface CreateOrUpdateFieldGroupRelationshipsDialogData {
  relationships: PetitionFieldGroupRelationship[];
}

export function CreateOrUpdateFieldGroupRelationshipsDialog({
  isTemplate,
  petitionId,
  petitionFieldId,
  suggestedRelationships,
  fromStep,
  onBack,
  ...props
}: MaybeWizardStepDialogProps<CreateOrUpdateFieldGroupRelationshipsDialogProps>) {
  const { data: petitionData, loading: isPetitionLoading } = useQuery(
    useCreateOrUpdateFieldGroupRelationshipsDialog_petitionDocument,
    {
      variables: { id: petitionId },
    },
  );

  const isSuggestingRelationships = isNonNullish(suggestedRelationships);

  const { data: relationshipTypesData, loading: isRelationshipTypesLoading } = useQuery(
    useCreateOrUpdateFieldGroupRelationshipsDialog_profileRelationshipTypesWithDirectionDocument,
  );

  const petition = petitionData?.petition ?? { id: petitionId, fields: [], fieldRelationships: [] };
  const petitionField = petition?.fields.find((f) => f.id === petitionFieldId) ?? null;

  const defaultRow = {
    relationshipId: null,
    leftFieldGroup: petitionField,
    rightFieldGroup: null,
    profileRelationshipTypeWithDirection: null,
  };

  const form = useForm<CreateOrUpdateFieldGroupRelationshipsDialogData>({
    mode: "onChange",
    defaultValues: {
      relationships: suggestedRelationships ?? [defaultRow],
    },
  });
  const { handleSubmit, control } = form;

  const { fields, append, remove, replace } = useFieldArray({
    name: "relationships",
    control,
  });

  useEffect(() => {
    if (isPetitionLoading || isRelationshipTypesLoading || isSuggestingRelationships) {
      return;
    }

    const emptyRelationship = [
      {
        relationshipId: null,
        leftFieldGroup: petitionField,
        rightFieldGroup: null,
        profileRelationshipTypeWithDirection: null,
      },
    ];

    const currentPetitionRelationships = petition?.fieldRelationships.map(
      ({ id, leftSidePetitionField, relationshipTypeWithDirection, rightSidePetitionField }) => {
        return {
          relationshipId: id,
          leftFieldGroup: petition.fields.find((f) => f.id === leftSidePetitionField.id)!,
          rightFieldGroup: petition.fields.find((f) => f.id === rightSidePetitionField.id)!,
          profileRelationshipTypeWithDirection: relationshipTypeWithDirection,
        };
      },
    );

    replace([...currentPetitionRelationships, ...emptyRelationship]);
  }, [isPetitionLoading, isRelationshipTypesLoading, petitionField?.id]);

  const handleCreateRelationship = useCallback(() => {
    append(defaultRow);
  }, [petitionField?.id]);

  const [updatePetitionFieldGroupRelationships] = useMutation(
    useCreateOrUpdateFieldGroupRelationshipsDialog_updatePetitionFieldGroupRelationshipsDocument,
  );

  return (
    <ConfirmDialog
      size="5xl"
      closeOnEsc={true}
      closeOnOverlayClick={false}
      content={{
        containerProps: {
          as: "form",
          onSubmit: handleSubmit(async (data) => {
            if (!petition) return;
            try {
              let currentRelationships = [] as UpdatePetitionFieldGroupRelationshipInput[];
              if (isSuggestingRelationships) {
                currentRelationships = petition?.fieldRelationships.map(
                  ({
                    id,
                    leftSidePetitionField,
                    rightSidePetitionField,
                    relationshipTypeWithDirection,
                  }) => {
                    return {
                      id,
                      direction: relationshipTypeWithDirection!.direction,
                      leftSidePetitionFieldId: leftSidePetitionField.id,
                      rightSidePetitionFieldId: rightSidePetitionField.id,
                      profileRelationshipTypeId:
                        relationshipTypeWithDirection!.profileRelationshipType.id,
                    };
                  },
                );
              }
              const relationships = data.relationships
                .filter((r) => isNonNullish(r.leftFieldGroup))
                .map<UpdatePetitionFieldGroupRelationshipInput>(
                  ({
                    relationshipId,
                    leftFieldGroup,
                    rightFieldGroup,
                    profileRelationshipTypeWithDirection,
                  }) => {
                    return {
                      direction: profileRelationshipTypeWithDirection!.direction,
                      id: relationshipId,
                      leftSidePetitionFieldId: leftFieldGroup!.id,
                      profileRelationshipTypeId:
                        profileRelationshipTypeWithDirection!.profileRelationshipType.id,
                      rightSidePetitionFieldId: rightFieldGroup!.id,
                    };
                  },
                );

              await updatePetitionFieldGroupRelationships({
                variables: {
                  petitionId,
                  relationships: [...currentRelationships, ...relationships],
                },
              });

              props.onResolve();
            } catch (e) {}
          }),
        },
      }}
      {...props}
      header={
        <Heading size="md" noOfLines={1}>
          {isSuggestingRelationships ? (
            <FormattedMessage
              id="component.create-or-update-field-group-relationships-dialog.header-suggestions"
              defaultMessage="Do you want to add these compatible relationships?"
            />
          ) : (
            <FormattedMessage
              id="component.create-or-update-field-group-relationships-dialog.header"
              defaultMessage="Set up relationships"
            />
          )}
        </Heading>
      }
      body={
        <Stack spacing={0}>
          {isSuggestingRelationships ? null : (
            <Text>
              <FormattedMessage
                id="component.create-or-update-field-group-relationships-dialog.body"
                defaultMessage="Associate groups from this {isTemplate, select, true{template} other{parallel}} to create relationships automatically when creating the profile."
                values={{
                  isTemplate,
                }}
              />
            </Text>
          )}

          <Grid
            gap={2}
            templateColumns="2fr 2fr 2fr auto"
            marginTop={4}
            maxHeight="320px"
            overflow="auto"
            paddingX={1}
            paddingBottom={1}
          >
            <Text>
              <FormattedMessage
                id="component.create-or-update-field-group-relationships-dialog.field-group"
                defaultMessage="Group"
              />
            </Text>
            <Text>
              <FormattedMessage
                id="component.create-or-update-field-group-relationships-dialog.relationship-with"
                defaultMessage="Relationship with"
              />
            </Text>
            <Text>
              <FormattedMessage
                id="component.create-or-update-field-group-relationships-dialog.field-group"
                defaultMessage="Group"
              />
            </Text>
            <Box></Box>

            <FormProvider {...form}>
              {fields.map(({ id, relationshipId }, index) => {
                return (
                  <FieldGroupRelationship
                    key={id}
                    isSaved={isNonNullish(relationshipId)}
                    petition={petition}
                    profileRelationshipTypesWithDirection={
                      relationshipTypesData?.profileRelationshipTypesWithDirection ?? []
                    }
                    index={index}
                    onRemove={() => remove(index)}
                    canRemove={fields.length > 1}
                    isDisabled={isRelationshipTypesLoading || isPetitionLoading}
                    isSuggestedRelationship={isSuggestingRelationships}
                  />
                );
              })}
            </FormProvider>
          </Grid>
          {fields.length >= 100 || isSuggestingRelationships ? null : (
            <Box marginTop={2} paddingX={1}>
              <Button onClick={handleCreateRelationship} isLoading={isPetitionLoading}>
                <FormattedMessage
                  id="component.create-or-update-field-group-relationships-dialog.add-group"
                  defaultMessage="Add group"
                />
              </Button>
            </Box>
          )}
        </Stack>
      }
      cancel={
        isSuggestingRelationships ? (
          <Button onClick={() => props.onReject()}>
            <FormattedMessage
              id="component.create-or-update-field-group-relationships-dialog.ignore"
              defaultMessage="Ignore"
            />
          </Button>
        ) : (
          <Button onClick={() => props.onReject()}>
            <FormattedMessage id="generic.cancel" defaultMessage="Cancel" />
          </Button>
        )
      }
      confirm={
        <Button colorScheme="primary" type="submit" isDisabled={isPetitionLoading}>
          {isSuggestingRelationships ? (
            <FormattedMessage
              id="component.create-or-update-field-group-relationships-dialog.add-relationships"
              defaultMessage="Add relationships"
            />
          ) : (
            <FormattedMessage id="generic.save" defaultMessage="Save" />
          )}
        </Button>
      }
    />
  );
}

export function useCreateOrUpdateFieldGroupRelationshipsDialog() {
  return useDialog(CreateOrUpdateFieldGroupRelationshipsDialog);
}

useCreateOrUpdateFieldGroupRelationshipsDialog.fragments = {
  get PetitionBase() {
    return gql`
      fragment useCreateOrUpdateFieldGroupRelationshipsDialog_PetitionBase on PetitionBase {
        id
        fieldRelationships {
          id
          leftSidePetitionField {
            ...useCreateOrUpdateFieldGroupRelationshipsDialog_PetitionField
          }
          rightSidePetitionField {
            ...useCreateOrUpdateFieldGroupRelationshipsDialog_PetitionField
          }
          relationshipTypeWithDirection {
            ...useCreateOrUpdateFieldGroupRelationshipsDialog_ProfileRelationshipTypeWithDirection
          }
        }
        fields {
          id
          ...useCreateOrUpdateFieldGroupRelationshipsDialog_PetitionField
        }
        ...PetitionFieldSelect_PetitionBase
      }
      ${this.ProfileRelationshipTypeWithDirection}
      ${PetitionFieldSelect.fragments.PetitionBase}
    `;
  },
  get PetitionField() {
    return gql`
      fragment useCreateOrUpdateFieldGroupRelationshipsDialog_PetitionField on PetitionField {
        id
        isLinkedToProfileType
        profileType {
          id
          standardType
        }
      }
    `;
  },
  get ProfileRelationshipTypeWithDirection() {
    return gql`
      fragment useCreateOrUpdateFieldGroupRelationshipsDialog_ProfileRelationshipTypeWithDirection on ProfileRelationshipTypeWithDirection {
        ...ProfileRelationshipTypeWithDirectionSelect_ProfileRelationshipTypeWithDirection
      }
      ${ProfileRelationshipTypeWithDirectionSelect.fragments.ProfileRelationshipTypeWithDirection}
    `;
  },
};

const _queries = [
  gql`
    query useCreateOrUpdateFieldGroupRelationshipsDialog_petition($id: GID!) {
      petition(id: $id) {
        ...useCreateOrUpdateFieldGroupRelationshipsDialog_PetitionBase
      }
    }
    ${useCreateOrUpdateFieldGroupRelationshipsDialog.fragments.PetitionBase}
  `,
  gql`
    query useCreateOrUpdateFieldGroupRelationshipsDialog_profileRelationshipTypesWithDirection {
      profileRelationshipTypesWithDirection {
        ...useCreateOrUpdateFieldGroupRelationshipsDialog_ProfileRelationshipTypeWithDirection
      }
    }
    ${useCreateOrUpdateFieldGroupRelationshipsDialog.fragments.ProfileRelationshipTypeWithDirection}
  `,
];

const _mutations = [
  gql`
    mutation useCreateOrUpdateFieldGroupRelationshipsDialog_updatePetitionFieldGroupRelationships(
      $petitionId: GID!
      $relationships: [UpdatePetitionFieldGroupRelationshipInput!]!
    ) {
      updatePetitionFieldGroupRelationships(
        petitionId: $petitionId
        relationships: $relationships
      ) {
        ...useCreateOrUpdateFieldGroupRelationshipsDialog_PetitionBase
      }
    }
    ${useCreateOrUpdateFieldGroupRelationshipsDialog.fragments.PetitionBase}
  `,
];

function hasDuplicateRelationships(
  current: PetitionFieldGroupRelationship,
  others: PetitionFieldGroupRelationship[],
) {
  return others.some((v) => {
    const hasEqualFieldsInverted =
      v.leftFieldGroup?.id === current.rightFieldGroup?.id &&
      v.rightFieldGroup?.id === current.leftFieldGroup?.id;

    const hasEqualFieldsEqual =
      v.leftFieldGroup?.id === current.leftFieldGroup?.id &&
      v.rightFieldGroup?.id === current.rightFieldGroup?.id;

    const hasEqualRelationship =
      hasEqualFieldsInverted &&
      !v.profileRelationshipTypeWithDirection?.profileRelationshipType.isReciprocal
        ? v.profileRelationshipTypeWithDirection?.direction !==
            current.profileRelationshipTypeWithDirection?.direction &&
          v.profileRelationshipTypeWithDirection?.profileRelationshipType.id ===
            current.profileRelationshipTypeWithDirection?.profileRelationshipType.id
        : v.profileRelationshipTypeWithDirection?.direction ===
            current.profileRelationshipTypeWithDirection?.direction &&
          v.profileRelationshipTypeWithDirection?.profileRelationshipType.id ===
            current.profileRelationshipTypeWithDirection?.profileRelationshipType.id;

    const hasEqualFields = v.profileRelationshipTypeWithDirection?.profileRelationshipType
      .isReciprocal
      ? hasEqualFieldsEqual || hasEqualFieldsInverted
      : v.profileRelationshipTypeWithDirection?.direction !==
          current.profileRelationshipTypeWithDirection?.direction
        ? hasEqualFieldsInverted
        : hasEqualFieldsEqual;

    return hasEqualFields && hasEqualRelationship;
  });
}

interface FieldGroupRelationshipRowProps {
  index: number;
  isSaved: boolean;
  petition: useCreateOrUpdateFieldGroupRelationshipsDialog_PetitionBaseFragment;
  profileRelationshipTypesWithDirection: useCreateOrUpdateFieldGroupRelationshipsDialog_ProfileRelationshipTypeWithDirectionFragment[];
  onRemove: () => void;
  canRemove: boolean;
  isDisabled: boolean;
  isSuggestedRelationship: boolean;
}

function FieldGroupRelationship({
  index,
  isSaved,
  petition,
  profileRelationshipTypesWithDirection,
  onRemove,
  canRemove,
  isDisabled,
  isSuggestedRelationship,
}: FieldGroupRelationshipRowProps) {
  const intl = useIntl();

  const {
    control,
    formState: { errors },
    clearErrors,
    watch,
    reset,
  } = useFormContext<CreateOrUpdateFieldGroupRelationshipsDialogData>();

  const [key, rerender] = useRerender();

  const leftFieldGroup = watch(`relationships.${index}.leftFieldGroup`);
  const rightFieldGroup = watch(`relationships.${index}.rightFieldGroup`);
  const selectedProfileRelationshipTypeWithDirection = watch(
    `relationships.${index}.profileRelationshipTypeWithDirection`,
  );

  useEffect(() => {
    rerender();
  }, [
    selectedProfileRelationshipTypeWithDirection?.direction,
    selectedProfileRelationshipTypeWithDirection?.profileRelationshipType,
    leftFieldGroup?.id,
    rightFieldGroup?.id,
  ]);

  const allCompatibleLeftRightProfileTypeIds = unique(
    profileRelationshipTypesWithDirection.flatMap(({ profileRelationshipType }) => {
      return profileRelationshipType.allowedLeftRightProfileTypeIds;
    }),
  );
  const allCompatibleRightLeftProfileTypeIds = unique(
    profileRelationshipTypesWithDirection.flatMap(({ profileRelationshipType }) => {
      return profileRelationshipType.allowedRightLeftProfileTypeIds;
    }),
  );

  const [allowedLeftRightProfileTypeIds, allowedRightLeftProfileTypeIds] = isNonNullish(
    selectedProfileRelationshipTypeWithDirection,
  )
    ? [
        selectedProfileRelationshipTypeWithDirection.profileRelationshipType
          .allowedLeftRightProfileTypeIds,
        selectedProfileRelationshipTypeWithDirection.profileRelationshipType
          .allowedRightLeftProfileTypeIds,
      ]
    : [allCompatibleLeftRightProfileTypeIds, allCompatibleRightLeftProfileTypeIds];

  const leftSideIds =
    selectedProfileRelationshipTypeWithDirection?.direction === "RIGHT_LEFT"
      ? allowedRightLeftProfileTypeIds
      : allowedLeftRightProfileTypeIds;

  const rightSideIds =
    selectedProfileRelationshipTypeWithDirection?.direction === "RIGHT_LEFT"
      ? allowedLeftRightProfileTypeIds
      : allowedRightLeftProfileTypeIds;

  const options =
    isNonNullish(leftFieldGroup) && isNullish(rightFieldGroup)
      ? profileRelationshipTypesWithDirection.filter((prtwd) =>
          prtwd.profileRelationshipType[
            prtwd.direction === "LEFT_RIGHT"
              ? "allowedLeftRightProfileTypeIds"
              : "allowedRightLeftProfileTypeIds"
          ].includes(leftFieldGroup.profileType!.id),
        )
      : isNonNullish(rightFieldGroup) && isNullish(leftFieldGroup)
        ? profileRelationshipTypesWithDirection.filter((prtwd) =>
            prtwd.profileRelationshipType[
              prtwd.direction === "LEFT_RIGHT"
                ? "allowedRightLeftProfileTypeIds"
                : "allowedLeftRightProfileTypeIds"
            ].includes(rightFieldGroup.profileType!.id),
          )
        : isNonNullish(rightFieldGroup) && isNonNullish(leftFieldGroup)
          ? profileRelationshipTypesWithDirection.filter(
              (prtwd) =>
                prtwd.profileRelationshipType[
                  prtwd.direction === "LEFT_RIGHT"
                    ? "allowedLeftRightProfileTypeIds"
                    : "allowedRightLeftProfileTypeIds"
                ].includes(leftFieldGroup.profileType!.id) &&
                prtwd.profileRelationshipType[
                  prtwd.direction === "LEFT_RIGHT"
                    ? "allowedRightLeftProfileTypeIds"
                    : "allowedLeftRightProfileTypeIds"
                ].includes(rightFieldGroup.profileType!.id) &&
                (rightFieldGroup.id === leftFieldGroup.id
                  ? prtwd.profileRelationshipType.isReciprocal
                  : true),
            )
          : profileRelationshipTypesWithDirection;

  const filterLeftField = (f: PetitionFieldSelection) => {
    return (
      f.isLinkedToProfileType &&
      f.type === "FIELD_GROUP" &&
      (isNonNullish(selectedProfileRelationshipTypeWithDirection) &&
      selectedProfileRelationshipTypeWithDirection.profileRelationshipType.isReciprocal === false
        ? f.id !== rightFieldGroup?.id
        : true) &&
      (isNonNullish(rightFieldGroup)
        ? rightSideIds.includes(rightFieldGroup.profileType!.id)
        : true) &&
      (isNonNullish(rightFieldGroup) || isNonNullish(selectedProfileRelationshipTypeWithDirection)
        ? leftSideIds.includes(f.profileType!.id)
        : true)
    );
  };

  const filterRightField = (f: PetitionFieldSelection) => {
    return (
      f.isLinkedToProfileType &&
      f.type === "FIELD_GROUP" &&
      (isNonNullish(selectedProfileRelationshipTypeWithDirection) &&
      selectedProfileRelationshipTypeWithDirection.profileRelationshipType.isReciprocal === false
        ? f.id !== leftFieldGroup?.id
        : true) &&
      (isNonNullish(leftFieldGroup)
        ? leftSideIds.includes(leftFieldGroup.profileType!.id)
        : true) &&
      (isNonNullish(leftFieldGroup) || isNonNullish(selectedProfileRelationshipTypeWithDirection)
        ? rightSideIds.includes(f.profileType!.id)
        : true)
    );
  };

  const hasLeftGroupError = isNonNullish(errors.relationships?.[index]?.leftFieldGroup);

  const hasRelationshipError =
    errors.relationships?.[index]?.leftFieldGroup?.type === "duplicated" ||
    isNonNullish(errors.relationships?.[index]?.profileRelationshipTypeWithDirection);

  const hasRightGroupError =
    errors.relationships?.[index]?.leftFieldGroup?.type === "duplicated" ||
    isNonNullish(errors.relationships?.[index]?.rightFieldGroup);

  const hasSomethingSelected =
    isNonNullish(leftFieldGroup) ||
    isNonNullish(rightFieldGroup) ||
    isNonNullish(selectedProfileRelationshipTypeWithDirection);

  return (
    <FormControl
      as={NoElement}
      isInvalid={isNonNullish(errors.relationships?.[index]?.leftFieldGroup?.type)}
    >
      <FormControl
        isDisabled={isDisabled || isSuggestedRelationship}
        minWidth={0}
        isInvalid={hasLeftGroupError}
      >
        <Controller
          name={`relationships.${index}.leftFieldGroup` as const}
          control={control}
          rules={{
            required: hasSomethingSelected,
            validate: {
              duplicated: () => {
                const relationships = watch("relationships");
                const current = relationships[index];
                const others = relationships.filter(
                  ({ leftFieldGroup, rightFieldGroup, profileRelationshipTypeWithDirection }, i) =>
                    i !== index &&
                    isNonNullish(leftFieldGroup?.id) &&
                    isNonNullish(rightFieldGroup?.id) &&
                    isNonNullish(profileRelationshipTypeWithDirection?.profileRelationshipType.id),
                );

                if (!others.length) return true;

                return !hasDuplicateRelationships(current, others);
              },
            },
          }}
          render={({ field: { onChange, value } }) => {
            return (
              <PetitionFieldSelect
                key={key}
                petition={petition}
                isClearable
                isSearchable
                value={value}
                onChange={onChange}
                filterFields={filterLeftField as any}
                placeholder={intl.formatMessage({
                  id: "component.create-or-update-field-group-relationships-dialog.select-a-group",
                  defaultMessage: "Select a group...",
                })}
                getOptionLabel={(option) => option.field.options.groupName as string}
              />
            );
          }}
        />
      </FormControl>
      <FormControl
        isDisabled={isDisabled || isSuggestedRelationship}
        minWidth={0}
        isInvalid={hasRelationshipError}
      >
        <Controller
          name={`relationships.${index}.profileRelationshipTypeWithDirection` as const}
          control={control}
          rules={{ required: hasSomethingSelected }}
          render={({ field: { onChange, ...rest } }) => {
            return (
              <ProfileRelationshipTypeWithDirectionSelect
                isClearable
                options={options}
                onChange={(v) => {
                  if (hasRelationshipError) {
                    clearErrors(`relationships.${index}`);
                  }
                  onChange(v);
                }}
                {...rest}
              />
            );
          }}
        />
      </FormControl>
      <FormControl isDisabled={isDisabled} minWidth={0} isInvalid={hasRightGroupError}>
        <Controller
          name={`relationships.${index}.rightFieldGroup` as const}
          control={control}
          rules={{ required: hasSomethingSelected }}
          render={({ field: { onChange, value } }) => {
            return (
              <PetitionFieldSelect
                key={key}
                petition={petition}
                isClearable
                isSearchable
                value={value}
                onChange={onChange}
                filterFields={filterRightField as any}
                placeholder={intl.formatMessage({
                  id: "component.create-or-update-field-group-relationships-dialog.select-a-group",
                  defaultMessage: "Select a group...",
                })}
                getOptionLabel={(option) => option.field.options.groupName as string}
              />
            );
          }}
        />
      </FormControl>

      <IconButtonWithTooltip
        onClick={() => {
          clearErrors();
          if (canRemove) {
            onRemove();
          } else {
            reset({
              relationships: [
                {
                  leftFieldGroup: null,
                  rightFieldGroup: null,
                  profileRelationshipTypeWithDirection: null,
                  relationshipId: null,
                },
              ],
            });
          }
        }}
        icon={<DeleteIcon />}
        variant="outline"
        label={intl.formatMessage({
          id: "generic.remove",
          defaultMessage: "Remove",
        })}
        isDisabled={isSuggestedRelationship && index === 0}
      />

      {isNonNullish(errors.relationships?.[index]?.leftFieldGroup?.type) &&
      errors.relationships?.[index]?.leftFieldGroup?.type === "duplicated" ? (
        <FormErrorMessage gridColumn={"1 / -1"} margin={0}>
          <FormattedMessage
            id="component.create-or-update-field-group-relationships-dialog.duplicated-relationship"
            defaultMessage="This association is duplicated"
          />
        </FormErrorMessage>
      ) : null}
    </FormControl>
  );
}
