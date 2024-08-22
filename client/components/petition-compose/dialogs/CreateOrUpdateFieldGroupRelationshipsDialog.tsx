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
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import {
  UpdatePetitionFieldGroupRelationshipInput,
  useCreateOrUpdateFieldGroupRelationshipsDialog_PetitionBaseFragment,
  useCreateOrUpdateFieldGroupRelationshipsDialog_ProfileRelationshipTypeWithDirectionFragment,
  useCreateOrUpdateFieldGroupRelationshipsDialog_petitionDocument,
  useCreateOrUpdateFieldGroupRelationshipsDialog_profileRelationshipTypesWithDirectionDocument,
  useCreateOrUpdateFieldGroupRelationshipsDialog_updatePetitionFieldGroupRelationshipsDocument,
} from "@parallel/graphql/__types";
import { UnwrapArray } from "@parallel/utils/types";
import { useRerender } from "@parallel/utils/useRerender";
import { useCallback, useEffect } from "react";
import { Controller, FormProvider, useFieldArray, useForm, useFormContext } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";
import { isDefined, unique } from "remeda";

interface CreateOrUpdateFieldGroupRelationshipsDialogProps {
  isTemplate: boolean;
  petitionId: string;
  petitionFieldId: string;
}

type PetitionFieldSelection = UnwrapArray<
  Exclude<
    useCreateOrUpdateFieldGroupRelationshipsDialog_PetitionBaseFragment["fields"],
    null | undefined
  >
>;

interface CreateOrUpdateFieldGroupRelationshipsDialogData {
  relationships: {
    relationshipId: string | null;
    leftFieldGroup: PetitionFieldSelection | null;
    rightFieldGroup: PetitionFieldSelection | null;
    profileRelationshipTypeWithDirection: useCreateOrUpdateFieldGroupRelationshipsDialog_ProfileRelationshipTypeWithDirectionFragment | null;
  }[];
}

function CreateOrUpdateFieldGroupRelationshipsDialog({
  isTemplate,
  petitionId,
  petitionFieldId,
  ...props
}: DialogProps<
  CreateOrUpdateFieldGroupRelationshipsDialogProps,
  CreateOrUpdateFieldGroupRelationshipsDialogData
>) {
  const { data: petitionData, loading: isPetitionLoading } = useQuery(
    useCreateOrUpdateFieldGroupRelationshipsDialog_petitionDocument,
    {
      variables: { id: petitionId },
    },
  );
  const petition = petitionData?.petition ?? { id: petitionId, fields: [], fieldRelationships: [] };
  const petitionField = petition?.fields.find((f) => f.id === petitionFieldId) ?? null;

  const isUpdating = isDefined(petition) && petition.fieldRelationships.length > 0;

  const defaultRow = {
    relationshipId: null,
    leftFieldGroup: petitionField,
    rightFieldGroup: null,
    profileRelationshipTypeWithDirection: null,
  };

  const form = useForm<CreateOrUpdateFieldGroupRelationshipsDialogData>({
    mode: "onChange",
    defaultValues: {
      relationships: [defaultRow],
    },
  });
  const { handleSubmit, control } = form;

  const { fields, append, remove, replace } = useFieldArray({
    name: "relationships",
    control,
  });

  useEffect(() => {
    if (isPetitionLoading) {
      return;
    }

    if (isUpdating) {
      replace(
        petition?.fieldRelationships.map(
          ({
            id,
            leftSidePetitionField,
            relationshipTypeWithDirection,
            rightSidePetitionField,
          }) => {
            return {
              relationshipId: id,
              leftFieldGroup: petition.fields.find((f) => f.id === leftSidePetitionField.id)!,
              rightFieldGroup: petition.fields.find((f) => f.id === rightSidePetitionField.id)!,
              profileRelationshipTypeWithDirection: relationshipTypeWithDirection,
            };
          },
        ),
      );
    } else {
      replace([
        {
          relationshipId: null,
          leftFieldGroup: petitionField,
          rightFieldGroup: null,
          profileRelationshipTypeWithDirection: null,
        },
      ]);
    }
  }, [isPetitionLoading]);

  const { data, loading } = useQuery(
    useCreateOrUpdateFieldGroupRelationshipsDialog_profileRelationshipTypesWithDirectionDocument,
  );

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
        as: "form",
        onSubmit: handleSubmit(async (data) => {
          if (!petition) return;
          try {
            const relationships = data.relationships
              .filter((r) => isDefined(r.leftFieldGroup))
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
              variables: { petitionId, relationships },
            });

            props.onResolve();
          } catch (e) {}
        }),
      }}
      {...props}
      header={
        <Heading size="md" noOfLines={1}>
          {isUpdating ? (
            <FormattedMessage
              id="component.create-or-update-field-group-relationships-dialog.header-updating"
              defaultMessage="Associated groups"
            />
          ) : (
            <FormattedMessage
              id="component.create-or-update-field-group-relationships-dialog.header"
              defaultMessage="Set up relationships between groups"
            />
          )}
        </Heading>
      }
      body={
        <Stack spacing={0}>
          <Text>
            <FormattedMessage
              id="component.create-or-update-field-group-relationships-dialog.body"
              defaultMessage="Associate groups from this {isTemplate, select, true{template} other{parallel}} to create relationships automatically when creating the profile."
              values={{
                isTemplate,
              }}
            />
          </Text>
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
              {fields.map(({ id }, index) => {
                return (
                  <FieldGroupRelationship
                    key={id}
                    petition={petition}
                    profileRelationshipTypesWithDirection={
                      data?.profileRelationshipTypesWithDirection ?? []
                    }
                    index={index}
                    onRemove={() => remove(index)}
                    canRemove={fields.length > 1}
                    isDisabled={loading || isPetitionLoading}
                  />
                );
              })}
            </FormProvider>
          </Grid>
          {fields.length >= 100 ? null : (
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
      confirm={
        <Button colorScheme="primary" type="submit" isDisabled={isPetitionLoading}>
          <FormattedMessage id="generic.save" defaultMessage="Save" />
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

interface FieldGroupRelationshipRowProps {
  index: number;
  petition: useCreateOrUpdateFieldGroupRelationshipsDialog_PetitionBaseFragment;
  profileRelationshipTypesWithDirection: useCreateOrUpdateFieldGroupRelationshipsDialog_ProfileRelationshipTypeWithDirectionFragment[];
  onRemove: () => void;
  canRemove: boolean;
  isDisabled: boolean;
}

function FieldGroupRelationship({
  index,
  petition,
  profileRelationshipTypesWithDirection,
  onRemove,
  canRemove,
  isDisabled,
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

  const [allowedLeftRightProfileTypeIds, allowedRightLeftProfileTypeIds] = isDefined(
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
    isDefined(leftFieldGroup) && !isDefined(rightFieldGroup)
      ? profileRelationshipTypesWithDirection.filter((prtwd) =>
          prtwd.profileRelationshipType[
            prtwd.direction === "LEFT_RIGHT"
              ? "allowedLeftRightProfileTypeIds"
              : "allowedRightLeftProfileTypeIds"
          ].includes(leftFieldGroup.profileType!.id),
        )
      : isDefined(rightFieldGroup) && !isDefined(leftFieldGroup)
        ? profileRelationshipTypesWithDirection.filter((prtwd) =>
            prtwd.profileRelationshipType[
              prtwd.direction === "LEFT_RIGHT"
                ? "allowedRightLeftProfileTypeIds"
                : "allowedLeftRightProfileTypeIds"
            ].includes(rightFieldGroup.profileType!.id),
          )
        : isDefined(rightFieldGroup) && isDefined(leftFieldGroup)
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
      (isDefined(selectedProfileRelationshipTypeWithDirection) &&
      selectedProfileRelationshipTypeWithDirection.profileRelationshipType.isReciprocal === false
        ? f.id !== rightFieldGroup?.id
        : true) &&
      (isDefined(rightFieldGroup)
        ? rightSideIds.includes(rightFieldGroup.profileType!.id)
        : true) &&
      (isDefined(rightFieldGroup) || isDefined(selectedProfileRelationshipTypeWithDirection)
        ? leftSideIds.includes(f.profileType!.id)
        : true)
    );
  };

  const filterRightField = (f: PetitionFieldSelection) => {
    return (
      f.isLinkedToProfileType &&
      f.type === "FIELD_GROUP" &&
      (isDefined(selectedProfileRelationshipTypeWithDirection) &&
      selectedProfileRelationshipTypeWithDirection.profileRelationshipType.isReciprocal === false
        ? f.id !== leftFieldGroup?.id
        : true) &&
      (isDefined(leftFieldGroup) ? leftSideIds.includes(leftFieldGroup.profileType!.id) : true) &&
      (isDefined(leftFieldGroup) || isDefined(selectedProfileRelationshipTypeWithDirection)
        ? rightSideIds.includes(f.profileType!.id)
        : true)
    );
  };

  const hasLeftGroupError = isDefined(errors.relationships?.[index]?.leftFieldGroup);

  const hasRelationshipError =
    errors.relationships?.[index]?.leftFieldGroup?.type === "duplicated" ||
    isDefined(errors.relationships?.[index]?.profileRelationshipTypeWithDirection);

  const hasRightGroupError =
    errors.relationships?.[index]?.leftFieldGroup?.type === "duplicated" ||
    isDefined(errors.relationships?.[index]?.rightFieldGroup);

  const hasSomethingSelected =
    isDefined(leftFieldGroup) ||
    isDefined(rightFieldGroup) ||
    isDefined(selectedProfileRelationshipTypeWithDirection);

  return (
    <FormControl
      as={NoElement}
      isInvalid={isDefined(errors.relationships?.[index]?.leftFieldGroup?.type)}
    >
      <FormControl isDisabled={isDisabled} minWidth={0} isInvalid={hasLeftGroupError}>
        <Controller
          name={`relationships.${index}.leftFieldGroup` as const}
          control={control}
          rules={{
            required: hasSomethingSelected,
            validate: {
              duplicated: () => {
                const relationships = watch("relationships");
                const values = relationships.map(
                  ({ leftFieldGroup, rightFieldGroup, profileRelationshipTypeWithDirection }) => {
                    return {
                      leftFieldGroupId: leftFieldGroup?.id,
                      rightFieldGroupId: rightFieldGroup?.id,
                      profileRelationshipTypeId:
                        profileRelationshipTypeWithDirection?.profileRelationshipType.id,
                      direction: profileRelationshipTypeWithDirection?.direction,
                      isReciprocal:
                        profileRelationshipTypeWithDirection?.profileRelationshipType.isReciprocal,
                    };
                  },
                );
                const current = values[index];
                const others = values.filter(
                  ({ leftFieldGroupId, rightFieldGroupId, profileRelationshipTypeId }, i) =>
                    i !== index &&
                    isDefined(leftFieldGroupId) &&
                    isDefined(rightFieldGroupId) &&
                    isDefined(profileRelationshipTypeId),
                );

                if (!others.length) return true;

                return !others.some((v) => {
                  const hasEqualFieldsInverted =
                    v.leftFieldGroupId === current.rightFieldGroupId &&
                    v.rightFieldGroupId === current.leftFieldGroupId;

                  const hasEqualFieldsEqual =
                    v.leftFieldGroupId === current.leftFieldGroupId &&
                    v.rightFieldGroupId === current.rightFieldGroupId;

                  const hasEqualRelationship =
                    hasEqualFieldsInverted && !v.isReciprocal
                      ? v.direction !== current.direction &&
                        v.profileRelationshipTypeId === current.profileRelationshipTypeId
                      : v.direction === current.direction &&
                        v.profileRelationshipTypeId === current.profileRelationshipTypeId;

                  const hasEqualFields = v.isReciprocal
                    ? hasEqualFieldsEqual || hasEqualFieldsInverted
                    : v.direction !== current.direction
                      ? hasEqualFieldsInverted
                      : hasEqualFieldsEqual;

                  return hasEqualFields && hasEqualRelationship;
                });
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
                onChange={(field) => {
                  onChange(field);
                }}
                filterFields={filterLeftField as any}
                placeholder={intl.formatMessage({
                  id: "component.create-or-update-field-group-relationships-dialog.select-a-group",
                  defaultMessage: "Select a group...",
                })}
              />
            );
          }}
        />
      </FormControl>
      <FormControl isDisabled={isDisabled} minWidth={0} isInvalid={hasRelationshipError}>
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
      />

      {isDefined(errors.relationships?.[index]?.leftFieldGroup?.type) &&
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
