import { gql, useQuery } from "@apollo/client";
import {
  Alert,
  AlertDescription,
  AlertIcon,
  Button,
  FormControl,
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
import { ProfileTypeFieldReference } from "@parallel/components/common/ProfileTypeFieldReference";
import { ScrollTableContainer } from "@parallel/components/common/ScrollTableContainer";
import { SelectableTd, SelectableTr } from "@parallel/components/common/SelectableTd";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import {
  ArchiveFieldGroupReplyIntoProfileConflictResolutionAction,
  ArchiveFieldGroupReplyIntoProfileConflictResolutionInput,
  useResolveProfilePropertiesConflictsDialog_PetitionFieldFragment,
  useResolveProfilePropertiesConflictsDialog_PetitionFieldReplyFragment,
  useResolveProfilePropertiesConflictsDialog_profileDocument,
} from "@parallel/graphql/__types";
import { isFileTypeField } from "@parallel/utils/isFileTypeField";
import { MaybeArray } from "@parallel/utils/types";
import { ReactNode, useEffect, useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import { FormattedMessage } from "react-intl";
import { entries, filter, fromEntries, isNonNullish, isNullish, map, pipe } from "remeda";

interface ResolveProfilePropertiesConflictsDialogProps {
  petitionId: string;
  profileId: string;
  profileName: ReactNode;
  conflictingPetitionFieldWithReplies: [
    useResolveProfilePropertiesConflictsDialog_PetitionFieldFragment,
    useResolveProfilePropertiesConflictsDialog_PetitionFieldReplyFragment[],
  ][];
}

type Resolution = ArchiveFieldGroupReplyIntoProfileConflictResolutionAction;

function ResolveProfilePropertiesConflictsDialog({
  petitionId,
  profileId,
  profileName,
  conflictingPetitionFieldWithReplies: profileTypeFieldsWithReplies,
  ...props
}: DialogProps<
  ResolveProfilePropertiesConflictsDialogProps,
  ArchiveFieldGroupReplyIntoProfileConflictResolutionInput[]
>) {
  const { data } = useQuery(useResolveProfilePropertiesConflictsDialog_profileDocument, {
    variables: { profileId },
    nextFetchPolicy: "cache-and-network",
  });

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

  const fieldsWithRepliesAndProperty = useMemo(() => {
    if (isNonNullish(data?.profile)) {
      return pipe(
        profileTypeFieldsWithReplies,
        map(([petitionField, replies]) => {
          const property = data!.profile.properties.find(
            (p) => p.field.id === petitionField.profileTypeField!.id,
          );
          return isNonNullish(property) ? ([petitionField, replies, property] as const) : null;
        }),
        filter(isNonNullish),
      );
    } else {
      return [];
    }
  }, [profileTypeFieldsWithReplies, data?.profile]);

  const hasFieldsUsedInProfileName = fieldsWithRepliesAndProperty.some(
    ([, , property]) => property.field.isUsedInProfileName,
  );

  useEffect(() => {
    reset({
      conflicts: pipe(
        fieldsWithRepliesAndProperty,
        map(([, replies, property]) => {
          return [
            property.field.id,
            replies.length === 0
              ? ("IGNORE" as const)
              : property.field.type === "FILE"
                ? ("APPEND" as const)
                : ("OVERWRITE" as const),
          ] as const;
        }),
        filter(isNonNullish),
        fromEntries(),
      ),
    });
  }, [fieldsWithRepliesAndProperty]);

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
              values={{ profileName }}
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
                      defaultMessage="Value in parallel"
                    />
                  </Th>
                </Tr>
              </Thead>
              <Tbody overflow="auto">
                {fieldsWithRepliesAndProperty.map(([field, replies, property]) => {
                  const selectableType =
                    property.field.type === "FILE" && replies.length > 0 ? "CHECKBOX" : "RADIO";
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
                                  property.field.type === "FILE" ||
                                  property.field.type === "BACKGROUND_CHECK"
                                    ? { paddingY: 1.5 }
                                    : undefined
                                }
                              >
                                <ProfilePropertyContent
                                  profileId={profileId}
                                  field={property.field}
                                  value={property.value}
                                  files={property.files}
                                />
                              </SelectableTd>
                              <SelectableTd
                                value="OVERWRITE"
                                _content={
                                  (isFileTypeField(field.type) ||
                                    field.type === "BACKGROUND_CHECK") &&
                                  replies.length > 0
                                    ? { paddingY: 1.5 }
                                    : undefined
                                }
                              >
                                <PetitionFieldRepliesContent
                                  petitionId={petitionId}
                                  field={field}
                                  replies={replies}
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
          <FormattedMessage id="generic.go-back" defaultMessage="Go back" />
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
  return useDialog(ResolveProfilePropertiesConflictsDialog);
}

useResolveProfilePropertiesConflictsDialog.fragments = {
  get ProfileFieldProperty() {
    return gql`
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
    `;
  },
  get Profile() {
    return gql`
      fragment useResolveProfilePropertiesConflictsDialog_Profile on Profile {
        id
        properties {
          ...useResolveProfilePropertiesConflictsDialog_ProfileFieldProperty
        }
      }
      ${this.ProfileFieldProperty}
    `;
  },
  get PetitionField() {
    return gql`
      fragment useResolveProfilePropertiesConflictsDialog_PetitionField on PetitionField {
        id
        ...PetitionFieldRepliesContent_PetitionField
        profileTypeField {
          id
        }
      }
      ${PetitionFieldRepliesContent.fragments.PetitionField}
    `;
  },
  get PetitionFieldReply() {
    return gql`
      fragment useResolveProfilePropertiesConflictsDialog_PetitionFieldReply on PetitionFieldReply {
        ...PetitionFieldRepliesContent_PetitionFieldReply
      }
      ${PetitionFieldRepliesContent.fragments.PetitionFieldReply}
    `;
  },
};

const _queries = {
  Profile: gql`
    query useResolveProfilePropertiesConflictsDialog_profile($profileId: GID!) {
      profile(profileId: $profileId) {
        ...useResolveProfilePropertiesConflictsDialog_Profile
      }
    }
    ${useResolveProfilePropertiesConflictsDialog.fragments.Profile}
  `,
};
