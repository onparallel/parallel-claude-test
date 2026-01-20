import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";
import {
  Alert,
  AlertDescription,
  AlertIcon,
  Box,
  Button,
  Center,
  FormControl,
  Spinner,
  Stack,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
} from "@chakra-ui/react";
import { NoElement } from "@parallel/components/common/NoElement";
import { PetitionFieldRepliesContent } from "@parallel/components/common/PetitionFieldRepliesContent";
import { ProfilePropertyContent } from "@parallel/components/common/ProfilePropertyContent";
import { ProfileReference } from "@parallel/components/common/ProfileReference";
import { ProfileTypeFieldReference } from "@parallel/components/common/ProfileTypeFieldReference";
import { ScrollTableContainer } from "@parallel/components/common/ScrollTableContainer";
import { SelectableTd, SelectableTr } from "@parallel/components/common/SelectableTd";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import {
  useWizardDialog,
  WizardStepDialogProps,
} from "@parallel/components/common/dialogs/WizardDialog";
import {
  ArchiveFieldGroupReplyIntoProfileConflictResolutionAction,
  ArchiveFieldGroupReplyIntoProfileConflictResolutionInput,
  useResolveProfilePropertiesConflictsDialog_petitionDocument,
  useResolveProfilePropertiesConflictsDialog_PetitionFragment,
  useResolveProfilePropertiesConflictsDialog_profileDocument,
  useResolveProfilePropertiesConflictsDialog_ProfileFragment,
} from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { useFieldLogic } from "@parallel/utils/fieldLogic/useFieldLogic";
import { UpdateProfileOnClose } from "@parallel/utils/fieldOptions";
import { isFileTypeField } from "@parallel/utils/isFileTypeField";
import { MaybeArray } from "@parallel/utils/types";
import { useEffect, useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import { FormattedDate, FormattedMessage } from "react-intl";
import { entries, filter, flatMap, fromEntries, isNonNullish, isNullish, map, pipe } from "remeda";
import { assert } from "ts-essentials";

type ResolveProfilePropertiesConflictsDialogSteps = {
  LOADING: {
    parentReplyId: string;
    parentFieldId: string;
    petitionId: string;
    profileId: string;
    conflicts: UpdateProfileOnClose[];
  };
  RESOLVE_CONFLICTS: {
    parentReplyId: string;
    parentFieldId: string;
    petition: useResolveProfilePropertiesConflictsDialog_PetitionFragment;
    profile: useResolveProfilePropertiesConflictsDialog_ProfileFragment;
    conflicts: UpdateProfileOnClose[];
  };
};

// ================================
// RESOLVE CONFLICTS LOADING STEP
// ================================

function ResolveProfilePropertiesConflictsLoadingDialog({
  parentReplyId,
  parentFieldId,
  petitionId,
  profileId,
  conflicts,
  onStep,
  ...props
}: WizardStepDialogProps<ResolveProfilePropertiesConflictsDialogSteps, "LOADING", void>) {
  const { data, loading } = useQuery(useResolveProfilePropertiesConflictsDialog_profileDocument, {
    variables: { profileId },
  });

  const { data: petitionData, loading: petitionLoading } = useQuery(
    useResolveProfilePropertiesConflictsDialog_petitionDocument,
    {
      variables: { petitionId },
    },
  );

  useEffect(() => {
    if (
      !loading &&
      isNonNullish(data) &&
      isNonNullish(data.profile) &&
      !petitionLoading &&
      isNonNullish(petitionData) &&
      isNonNullish(petitionData.petition) &&
      petitionData.petition.__typename === "Petition"
    ) {
      onStep("RESOLVE_CONFLICTS", {
        parentReplyId,
        parentFieldId,
        petition: petitionData.petition,
        profile: data.profile,
        conflicts,
      });
    }
  }, [loading, data, petitionLoading, petitionData, onStep, parentReplyId, parentFieldId]);

  return (
    <ConfirmDialog
      size="4xl"
      closeOnEsc={true}
      closeOnOverlayClick={false}
      hasCloseButton={true}
      header={
        <FormattedMessage
          id="component.update-profile-properties-dialog.header"
          defaultMessage="Manage existing values"
        />
      }
      body={
        <Center padding={8} minHeight="200px">
          <Spinner
            thickness="4px"
            speed="0.65s"
            emptyColor="gray.200"
            color="primary.500"
            size="xl"
          />
        </Center>
      }
      confirm={<></>}
      cancel={
        <Button disabled>
          <FormattedMessage id="generic.close" defaultMessage="Close" />
        </Button>
      }
      {...props}
    />
  );
}

type Resolution = ArchiveFieldGroupReplyIntoProfileConflictResolutionAction;

type ConflictData =
  | {
      conflict: UpdateProfileOnClose;
      property: useResolveProfilePropertiesConflictsDialog_ProfileFragment["properties"][number];
      petitionValue: {
        type: "FIELD";
        field: useResolveProfilePropertiesConflictsDialog_PetitionFragment["fields"][number];
        replies: useResolveProfilePropertiesConflictsDialog_PetitionFragment["fields"][number]["replies"];
      };
    }
  | {
      conflict: UpdateProfileOnClose;
      property: useResolveProfilePropertiesConflictsDialog_ProfileFragment["properties"][number];
      petitionValue: {
        type: "VARIABLE";
        value: string | number;
        variableName: string;
      };
    }
  | {
      conflict: UpdateProfileOnClose;
      property: useResolveProfilePropertiesConflictsDialog_ProfileFragment["properties"][number];
      petitionValue: {
        type: "PETITION_METADATA";
        value: string | null;
      };
    };

function PetitionValueContent({
  petition,
  conflictData,
}: {
  petition: useResolveProfilePropertiesConflictsDialog_PetitionFragment;
  conflictData: ConflictData;
}) {
  if (conflictData.petitionValue.type === "FIELD") {
    return (
      <PetitionFieldRepliesContent
        petitionId={petition.id}
        field={conflictData.petitionValue.field}
        replies={conflictData.petitionValue.replies}
      />
    );
  }

  if (conflictData.petitionValue.type === "VARIABLE") {
    const variableName = conflictData.petitionValue.variableName;
    const variable = petition.variables.find((v) => v.name === variableName);

    assert(isNonNullish(variable), `Variable ${variableName} not found`);

    const value = conflictData.petitionValue.value;
    let label: string | null | undefined = null;
    if (variable.__typename === "PetitionVariableNumber" && "valueLabels" in variable) {
      const valueLabels = variable.valueLabels;
      label = valueLabels.find((l) => l.value === value)?.label;
    } else if (variable.__typename === "PetitionVariableEnum" && "enumValueLabels" in variable) {
      const enumValueLabels = variable.enumValueLabels;
      label = enumValueLabels.find((l) => l.value === value)?.label;
    }

    return (
      <Text>
        {label ? (
          <>
            <b>{label}</b> ({value})
          </>
        ) : (
          String(value)
        )}
      </Text>
    );
  }

  if (conflictData.petitionValue.type === "PETITION_METADATA") {
    if (!conflictData.petitionValue.value) {
      return (
        <Box textStyle="hint">
          <FormattedMessage
            id="component.petition-field-replies-content.no-reply"
            defaultMessage="No reply"
          />
        </Box>
      );
    }

    return <FormattedDate value={conflictData.petitionValue.value} {...FORMATS.L} timeZone="UTC" />;
  }

  return null;
}

function ResolveProfilePropertiesConflictsDialog({
  parentReplyId,
  parentFieldId,
  petition,
  profile,
  conflicts,
  ...props
}: WizardStepDialogProps<
  ResolveProfilePropertiesConflictsDialogSteps,
  "RESOLVE_CONFLICTS",
  ArchiveFieldGroupReplyIntoProfileConflictResolutionInput[]
>) {
  const fieldLogic = useFieldLogic(petition);
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      conflicts: {} as Record<string, Resolution | null>,
    },
  });

  const conflictsData = useMemo((): ConflictData[] => {
    // Get all petition fields (including children)
    const allPetitionFields = pipe(
      petition.fields,
      flatMap((f) => [f, ...(f.children ?? [])]),
    );

    return pipe(
      conflicts,
      map((conflict) => {
        const property = profile.properties.find((p) => p.field.id === conflict.profileTypeFieldId);
        if (!property) return null;

        const source = conflict.source;

        if (source.type === "FIELD") {
          const field = allPetitionFields.find((f) => f.id === source.fieldId);
          if (!field) return null;
          const result: ConflictData = {
            conflict,
            property,
            petitionValue: {
              type: "FIELD" as const,
              field,
              replies:
                field.parent?.id === parentFieldId
                  ? field.replies.filter((r) => r.parent?.id === parentReplyId)
                  : field.replies,
            },
          };
          return result;
        }

        if (source.type === "VARIABLE") {
          const finalValue = fieldLogic[0].finalVariables[source.name];
          if (isNullish(finalValue)) return null;
          const result: ConflictData = {
            conflict,
            property,
            petitionValue: {
              type: "VARIABLE" as const,
              value: finalValue,
              variableName: source.name,
            },
          };
          return result;
        }

        if (source.type === "PETITION_METADATA") {
          const result: ConflictData = {
            conflict,
            property,
            petitionValue: {
              type: "PETITION_METADATA" as const,
              value: petition.closedAt ?? null,
            },
          };
          return result;
        }

        return null;
      }),
      filter(isNonNullish),
    );
  }, [conflicts, profile, petition, fieldLogic, parentReplyId]);

  const hasFieldsUsedInProfileName = conflictsData.some(
    ({ property }) => property.field.isUsedInProfileName,
  );

  useEffect(() => {
    reset({
      conflicts: pipe(
        conflictsData,
        map(({ petitionValue, property }) => {
          const hasValue =
            petitionValue.type === "FIELD"
              ? petitionValue.replies.length > 0
              : petitionValue.type === "VARIABLE"
                ? true
                : isNonNullish(petitionValue.value);

          return [
            property.field.id,
            !hasValue
              ? ("IGNORE" as const)
              : property.field.type === "FILE"
                ? ("APPEND" as const)
                : ("OVERWRITE" as const),
          ] as const;
        }),
        fromEntries(),
      ),
    });
  }, [conflictsData, reset]);

  return (
    <ConfirmDialog
      size="4xl"
      closeOnEsc={true}
      closeOnOverlayClick={false}
      hasCloseButton={true}
      content={{
        containerProps: {
          as: "form",
          onSubmit: handleSubmit(async (data) => {
            props.onResolve(
              entries(data.conflicts).map(([profileTypeFieldId, action]) => ({
                profileTypeFieldId,
                action: action!,
              })),
            );
          }),
        },
      }}
      {...props}
      header={
        <FormattedMessage
          id="component.update-profile-properties-dialog.header"
          defaultMessage="Manage existing values"
        />
      }
      body={
        <Stack spacing={4} maxHeight="420px">
          {hasFieldsUsedInProfileName ? (
            <Alert status="info" borderRadius="md">
              <AlertIcon />
              <AlertDescription display="block" flex="1">
                <FormattedMessage
                  id="component.update-profile-properties-dialog.alert-properties-used-in-profile-name"
                  defaultMessage="The name has changed. This might indicate that the data belongs to a different profile. If so, create a new profile for this information."
                />
              </AlertDescription>
              <Button
                variant="outline"
                colorScheme="blue"
                backgroundColor="white"
                marginX={2}
                onClick={() => props.onReject("CREATE_NEW_PROFILE")}
              >
                <FormattedMessage
                  id="component.update-profile-properties-dialog.create-new-profile"
                  defaultMessage="Create new profile"
                />
              </Button>
            </Alert>
          ) : null}
          <Text>
            <FormattedMessage
              id="component.update-profile-properties-dialog.body"
              defaultMessage="The following properties of <b>{profileName}</b> profile already contain information."
              values={{ profileName: <ProfileReference profile={profile} /> }}
            />
          </Text>
          <Text>
            <FormattedMessage
              id="component.update-profile-properties-dialog.body-2"
              defaultMessage="Select the value you want to keep:"
            />
          </Text>
          <ScrollTableContainer>
            <Table variant="parallel" layout="fixed" height="1px">
              <Thead>
                <Tr>
                  <Th width="33%">
                    <FormattedMessage
                      id="component.use-profile-properties-columns.property-name"
                      defaultMessage="Property"
                    />
                  </Th>
                  <Th width="33%">
                    <FormattedMessage
                      id="component.use-profile-properties-columns.current-value"
                      defaultMessage="Value in profile"
                    />
                  </Th>
                  <Th width="33%">
                    <FormattedMessage
                      id="component.use-profile-properties-columns.new-value"
                      defaultMessage="New value"
                    />
                  </Th>
                </Tr>
              </Thead>
              <Tbody overflow="auto">
                {conflictsData.map(({ conflict, property, petitionValue }) => {
                  const hasPetitionValue =
                    petitionValue.type === "FIELD"
                      ? petitionValue.replies.length > 0
                      : petitionValue.type === "VARIABLE"
                        ? true
                        : isNonNullish(petitionValue.value);

                  const isFileType = property.field.type === "FILE";
                  const isBackgroundCheck = property.field.type === "BACKGROUND_CHECK";
                  const petitionFieldType =
                    petitionValue.type === "FIELD" ? petitionValue.field.type : null;
                  const isPetitionFileType =
                    petitionFieldType && isFileTypeField(petitionFieldType);

                  const selectableType = isFileType && hasPetitionValue ? "CHECKBOX" : "RADIO";
                  const isInvalid = !!errors.conflicts?.[property.field.id];

                  return (
                    <Controller
                      key={property.field.id}
                      control={control}
                      name={`conflicts.${property.field.id}`}
                      rules={{ required: true }}
                      render={({ field: { value, onChange } }) => {
                        let _value: MaybeArray<Resolution>;
                        let handleChange: (value: any) => void;
                        if (selectableType === "CHECKBOX") {
                          handleChange = (value: Resolution[]) => {
                            // both checkboxes selected => "APPEND"
                            return value.length === 2
                              ? onChange("APPEND")
                              : onChange(value[0] ?? null);
                          };
                          if (value === "APPEND") {
                            _value = ["IGNORE", "OVERWRITE"];
                          } else {
                            _value = isNullish(value) ? [] : [value];
                          }
                        } else {
                          handleChange = onChange;
                          _value = value as Resolution;
                        }
                        return (
                          <FormControl as={NoElement} isInvalid={isInvalid}>
                            <SelectableTr
                              labelId={`conflict-profile-type-property.field-${property.field.id}`}
                              type={selectableType}
                              value={_value}
                              onChange={handleChange}
                              backgroundColor={isInvalid ? "red.50" : undefined}
                            >
                              <Td
                                id={`conflict-profile-type-property.field-${property.field.id}`}
                                verticalAlign="top"
                              >
                                <ProfileTypeFieldReference field={property.field} />
                              </Td>
                              <SelectableTd
                                value="IGNORE"
                                _content={
                                  isFileType || isBackgroundCheck ? { paddingY: 1.5 } : undefined
                                }
                              >
                                <ProfilePropertyContent
                                  profileId={profile.id}
                                  field={property.field}
                                  value={property.value}
                                  files={property.files}
                                />
                              </SelectableTd>
                              <SelectableTd
                                value="OVERWRITE"
                                _content={
                                  (isPetitionFileType || isBackgroundCheck) && hasPetitionValue
                                    ? { paddingY: 1.5 }
                                    : undefined
                                }
                              >
                                <PetitionValueContent
                                  petition={petition}
                                  conflictData={
                                    { conflict, property, petitionValue } as ConflictData
                                  }
                                />
                              </SelectableTd>
                            </SelectableTr>
                          </FormControl>
                        );
                      }}
                    />
                  );
                })}
              </Tbody>
            </Table>
          </ScrollTableContainer>
        </Stack>
      }
      cancel={
        <Button onClick={() => props.onReject()}>
          <FormattedMessage id="generic.cancel" defaultMessage="Cancel" />
        </Button>
      }
      confirm={
        <Button colorScheme="primary" type="submit">
          <FormattedMessage id="generic.continue" defaultMessage="Continue" />
        </Button>
      }
    />
  );
}

export function useResolveProfilePropertiesConflictsDialog() {
  return useWizardDialog(
    {
      LOADING: ResolveProfilePropertiesConflictsLoadingDialog,
      RESOLVE_CONFLICTS: ResolveProfilePropertiesConflictsDialog,
    },
    "LOADING",
  );
}

const _fragments = {
  ProfileFieldProperty: gql`
    fragment useResolveProfilePropertiesConflictsDialog_ProfileFieldProperty on ProfileFieldProperty {
      field {
        id
        type
        name
        options
        isUsedInProfileName
      }
      files {
        id
        file {
          size
          isComplete
          filename
          contentType
        }
      }
      value {
        id
        content
      }
    }
  `,
  Profile: gql`
    fragment useResolveProfilePropertiesConflictsDialog_Profile on Profile {
      id
      properties {
        ...useResolveProfilePropertiesConflictsDialog_ProfileFieldProperty
      }
      ...ProfileReference_Profile
    }
  `,

  PetitionFieldReply: gql`
    fragment useResolveProfilePropertiesConflictsDialog_PetitionFieldReply on PetitionFieldReply {
      id
      parent {
        id
      }
      ...PetitionFieldRepliesContent_PetitionFieldReply
    }
  `,
  PetitionField: gql`
    fragment useResolveProfilePropertiesConflictsDialog_PetitionField on PetitionField {
      id
      ...PetitionFieldRepliesContent_PetitionField
      parent {
        id
      }
      profileTypeField {
        id
      }
      replies {
        ...useResolveProfilePropertiesConflictsDialog_PetitionFieldReply
      }
    }
  `,
  Petition: gql`
    fragment useResolveProfilePropertiesConflictsDialog_Petition on Petition {
      id
      closedAt
      fields {
        id
        ...useResolveProfilePropertiesConflictsDialog_PetitionField
        children {
          id
          ...useResolveProfilePropertiesConflictsDialog_PetitionField
        }
      }
      variables {
        name
        __typename
        ... on PetitionVariableNumber {
          valueLabels {
            value
            label
          }
        }
        ... on PetitionVariableEnum {
          enumValueLabels: valueLabels {
            value
            label
          }
        }
      }
      ...useFieldLogic_PetitionBase
    }
  `,
};

const _queries = {
  profile: gql`
    query useResolveProfilePropertiesConflictsDialog_profile($profileId: GID!) {
      profile(profileId: $profileId) {
        ...useResolveProfilePropertiesConflictsDialog_Profile
      }
    }
  `,
  petition: gql`
    query useResolveProfilePropertiesConflictsDialog_petition($petitionId: GID!) {
      petition(id: $petitionId) {
        id
        ...useResolveProfilePropertiesConflictsDialog_Petition
      }
    }
  `,
};
