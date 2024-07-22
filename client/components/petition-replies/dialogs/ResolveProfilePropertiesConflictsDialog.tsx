import { gql, useQuery } from "@apollo/client";
import {
  Button,
  Checkbox,
  CheckboxGroup,
  Flex,
  FormControl,
  HStack,
  Radio,
  Stack,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useRadioGroup,
} from "@chakra-ui/react";
import { BusinessIcon, SearchIcon, UserIcon } from "@parallel/chakra/icons";
import { LocalizableUserTextRender } from "@parallel/components/common/LocalizableUserTextRender";
import { OverflownText } from "@parallel/components/common/OverflownText";
import { SimpleFileButton } from "@parallel/components/common/SimpleFileButton";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { ProfileTypeFieldTypeName } from "@parallel/components/organization/profiles/ProfileTypeFieldTypeName";
import {
  ArchiveFieldGroupReplyIntoProfileConflictResolutionAction,
  ArchiveFieldGroupReplyIntoProfileConflictResolutionInput,
  useResolveProfilePropertiesConflictsDialog_PetitionFieldFragment,
  useResolveProfilePropertiesConflictsDialog_PetitionFieldReplyFragment,
  useResolveProfilePropertiesConflictsDialog_ProfileFieldPropertyFragment,
  useResolveProfilePropertiesConflictsDialog_profileDocument,
} from "@parallel/graphql/__types";
import { getEntityTypeLabel } from "@parallel/utils/getEntityTypeLabel";
import { useDownloadProfileFieldFile } from "@parallel/utils/useDownloadProfileFieldFile";
import { useDownloadReplyFile } from "@parallel/utils/useDownloadReplyFile";
import { ReactNode, useEffect } from "react";
import { Controller, FormProvider, useFieldArray, useForm, useFormContext } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";
import { isDefined } from "remeda";

interface ResolveProfilePropertiesConflictsDialogProps {
  petitionId: string;
  profileId: string;
  profileName: ReactNode;
  profileTypeFieldsWithReplies: [
    useResolveProfilePropertiesConflictsDialog_PetitionFieldFragment,
    useResolveProfilePropertiesConflictsDialog_PetitionFieldReplyFragment[],
  ][];
}

interface ResolveProfilePropertiesConflictsTableData {
  conflicts: {
    property: useResolveProfilePropertiesConflictsDialog_ProfileFieldPropertyFragment;
    action: ArchiveFieldGroupReplyIntoProfileConflictResolutionAction | null;
  }[];
}

function ResolveProfilePropertiesConflictsDialog({
  petitionId,
  profileId,
  profileName,
  profileTypeFieldsWithReplies,
  ...props
}: DialogProps<
  ResolveProfilePropertiesConflictsDialogProps,
  ArchiveFieldGroupReplyIntoProfileConflictResolutionInput[]
>) {
  const { data, loading } = useQuery(useResolveProfilePropertiesConflictsDialog_profileDocument, {
    variables: { profileId },
    nextFetchPolicy: "cache-and-network",
  });

  const form = useForm<ResolveProfilePropertiesConflictsTableData>({
    defaultValues: {
      conflicts: [],
    },
  });
  const { control, handleSubmit } = form;

  const { fields, replace } = useFieldArray({ name: "conflicts", control });

  useEffect(() => {
    if (!loading) {
      const conflicts = isDefined(data?.profile)
        ? profileTypeFieldsWithReplies
            .map(([petitionField]) => {
              const property = data.profile.properties.find(
                (property) => property.field.id === petitionField.profileTypeField!.id,
              );
              if (!property) {
                return null;
              }

              return {
                property,
                action: property.field.type === "FILE" ? "APPEND" : "OVERWRITE",
              };
            })
            .filter(isDefined)
        : [];
      replace(conflicts as ResolveProfilePropertiesConflictsTableData["conflicts"]);
    }
  }, [loading]);

  return (
    <ConfirmDialog
      size="4xl"
      closeOnEsc={true}
      closeOnOverlayClick={false}
      hasCloseButton={true}
      content={{
        as: "form",
        onSubmit: handleSubmit(async (data) => {
          props.onResolve(
            data.conflicts.map((conflict) => ({
              profileTypeFieldId: conflict.property.field.id,
              action: conflict.action!,
            })),
          );
        }),
      }}
      {...props}
      header={
        <FormattedMessage
          id="component.update-profile-properties-dialog.header"
          defaultMessage="Update properties"
        />
      }
      body={
        <Stack spacing={4} maxHeight="420px">
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
          <TableContainer
            maxHeight="100%"
            overflowY="auto"
            border="1px solid"
            borderColor="gray.200"
          >
            <Table
              variant="unstyled"
              sx={{
                tableLayout: "fixed",
                borderCollapse: "separate",
                borderSpacing: 0,
                "& th": {
                  padding: 2,
                  fontWeight: 400,
                  fontSize: "sm",
                  borderBottom: "1px solid",
                  borderColor: "gray.200",
                  position: "sticky",
                  top: 0,
                  zIndex: 1,
                  background: "gray.50",
                },
                "& th:first-of-type": {
                  paddingStart: 4,
                },
                "& th:last-of-type": {
                  paddingEnd: 4,
                },
                "& td": {
                  borderBottom: "1px solid",
                  borderColor: "gray.200",
                },
                "& tr:last-of-type td": {
                  borderBottom: "none",
                },
              }}
            >
              <Thead>
                <Tr>
                  <Th width="33%">
                    <FormattedMessage
                      id="component.use-profile-properties-columns.property-name"
                      defaultMessage="Property"
                    />
                  </Th>
                  <Th width="auto">
                    <FormattedMessage
                      id="component.use-profile-properties-columns.current-value"
                      defaultMessage="Value in profile"
                    />
                  </Th>
                  <Th width="auto">
                    <FormattedMessage
                      id="component.use-profile-properties-columns.new-value"
                      defaultMessage="Value in parallel"
                    />
                  </Th>
                </Tr>
              </Thead>
              <Tbody overflow="auto">
                <FormProvider {...form}>
                  {fields.map((field, index) => {
                    const replies = profileTypeFieldsWithReplies[index][1];

                    return (
                      <TableRow
                        key={field.id}
                        index={index}
                        petitionId={petitionId}
                        profileId={profileId}
                        replies={replies}
                      />
                    );
                  })}
                </FormProvider>
              </Tbody>
            </Table>
          </TableContainer>
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

function TableRow({
  index,
  petitionId,
  profileId,
  replies,
}: {
  index: number;
  petitionId: string;
  profileId: string;
  replies: useResolveProfilePropertiesConflictsDialog_PetitionFieldReplyFragment[];
}) {
  const intl = useIntl();
  const {
    control,
    watch,
    formState: { errors },
  } = useFormContext<ResolveProfilePropertiesConflictsTableData>();

  const property = watch(`conflicts.${index}.property`);
  const { field } = property;

  const getValue = (content: any) => {
    if (field.type === "SELECT") {
      const label = field.options.values.find(
        (option: any) => option.value === content?.value,
      )?.label;
      return label ? <LocalizableUserTextRender value={label} default={<></>} /> : null;
    }

    if (field.type === "BACKGROUND_CHECK") {
      return content?.entity
        ? content.entity.name
        : [
            getEntityTypeLabel(intl, content?.query?.type),
            content?.query?.name,
            content?.query?.date,
          ]
            .filter(isDefined)
            .join(" | ");
    }

    return content?.value;
  };

  const reply = replies[0];

  const downloadReplyFile = useDownloadReplyFile();

  const downloadProfileFieldFile = useDownloadProfileFieldFile();

  return (
    <FormControl as={Tr} isInvalid={!!errors.conflicts?.[index]?.action}>
      <Td paddingY={2} paddingEnd={2} paddingStart={4}>
        <ProfileTypeFieldTypeName type={field.type} name={field.name} />
      </Td>
      <Controller
        name={`conflicts.${index}.action` as const}
        control={control}
        rules={{ required: true }}
        render={({ field: { onChange, value } }) => {
          const checkedItems = value === "APPEND" ? ["IGNORE", "OVERWRITE"] : value ? [value] : [];
          const handleCheckBoxChange = (checked: string[]) => {
            onChange(checked.length === 2 ? "APPEND" : checked[0]);
          };

          if (field.type === "FILE") {
            if (replies.length > 0) {
              return (
                <CheckboxGroup
                  colorScheme="primary"
                  onChange={handleCheckBoxChange}
                  defaultValue={checkedItems}
                >
                  <Td paddingX={2} paddingY={3} verticalAlign="top">
                    <HStack alignItems="flex-start">
                      <Checkbox value="IGNORE" marginTop={1.5} />
                      <Flex flex="1" gap={2} flexWrap="wrap" minWidth={0}>
                        {property.files?.map(({ id, file }) => {
                          if (!file) return null;
                          return (
                            <SimpleFileButton
                              key={id}
                              onClick={async () => {
                                await downloadProfileFieldFile(
                                  profileId,
                                  property.field.id,
                                  id,
                                  true,
                                );
                              }}
                              isDisabled={!file.isComplete}
                              filename={file.filename}
                              contentType={file.contentType}
                            />
                          );
                        })}
                      </Flex>
                    </HStack>
                  </Td>
                  <Td paddingX={2} paddingY={3} verticalAlign="top">
                    <HStack alignItems="flex-start">
                      <Checkbox value="OVERWRITE" marginTop={1.5} />
                      <Flex gap={2} flexWrap="wrap" minWidth={0}>
                        {replies.map((reply) => {
                          const file = reply.content;
                          return (
                            <SimpleFileButton
                              key={reply.id}
                              onClick={async () => {
                                await downloadReplyFile(petitionId, reply, true);
                              }}
                              isDisabled={!file.uploadComplete}
                              filename={file.filename}
                              contentType={file.contentType}
                            />
                          );
                        })}
                      </Flex>
                    </HStack>
                  </Td>
                </CheckboxGroup>
              );
            } else {
              return (
                <FileRadioGroup
                  newValue={
                    <Text as="span" textStyle="hint">
                      {intl.formatMessage({
                        id: "component.resolve-profile-properties-conflicts-dialog.no-value",
                        defaultMessage: "No value",
                      })}
                    </Text>
                  }
                  oldValue={
                    <Flex flex="1" gap={2} flexWrap="wrap" minWidth={0}>
                      {property.files?.map(({ id, file }) => {
                        if (!file) return null;
                        return (
                          <SimpleFileButton
                            key={id}
                            onClick={async () => {
                              await downloadProfileFieldFile(
                                profileId,
                                property.field.id,
                                id,
                                true,
                              );
                            }}
                            isDisabled={!file.isComplete}
                            filename={file.filename}
                            contentType={file.contentType}
                          />
                        );
                      })}
                    </Flex>
                  }
                  onChange={onChange}
                />
              );
            }
          }

          const oldValue = getValue(property.value?.content);
          const newValue = getValue(reply?.content);

          const getBgCheckIcon = (content: any) => {
            return content?.entity ? (
              content.entity.type === "Person" ? (
                <UserIcon marginEnd={1} />
              ) : (
                <BusinessIcon marginEnd={1} />
              )
            ) : (
              <SearchIcon marginEnd={1} />
            );
          };
          const oldValueIcon =
            field.type === "BACKGROUND_CHECK" ? getBgCheckIcon(property.value?.content) : null;
          const newValueIcon =
            field.type === "BACKGROUND_CHECK" ? getBgCheckIcon(reply?.content) : null;

          return (
            <TextValueRadioGroup
              newValue={newValue}
              oldValue={oldValue}
              oldValueIcon={oldValueIcon}
              newValueIcon={newValueIcon}
              onChange={onChange}
            />
          );
        }}
      />
    </FormControl>
  );
}

function TextValueRadioGroup({
  oldValue,
  newValue,
  onChange,
  oldValueIcon,
  newValueIcon,
}: {
  oldValue: string | null;
  newValue: string | null;
  onChange: (value: string) => void;
  oldValueIcon?: ReactNode;
  newValueIcon?: ReactNode;
}) {
  const intl = useIntl();
  const { getRadioProps } = useRadioGroup({
    defaultValue: "OVERWRITE",
    onChange,
  });

  return (
    <>
      <Td paddingX={2} paddingY={3} verticalAlign="top">
        <HStack>
          <Radio {...getRadioProps({ value: "IGNORE" })} />
          <Flex minWidth={0}>
            {oldValueIcon}
            <OverflownText as="span">{oldValue}</OverflownText>
          </Flex>
        </HStack>
      </Td>
      <Td paddingX={2} paddingY={3} verticalAlign="top">
        <HStack>
          <Radio {...getRadioProps({ value: "OVERWRITE" })} />
          <Flex minWidth={0}>
            {newValueIcon}
            <OverflownText as="span" textStyle={isDefined(newValue) ? undefined : "hint"}>
              {newValue ??
                intl.formatMessage({
                  id: "component.resolve-profile-properties-conflicts-dialog.no-value",
                  defaultMessage: "No value",
                })}
            </OverflownText>
          </Flex>
        </HStack>
      </Td>
    </>
  );
}

function FileRadioGroup({
  oldValue,
  newValue,
  onChange,
}: {
  oldValue: ReactNode;
  newValue: ReactNode;
  onChange: (value: string) => void;
}) {
  const { getRadioProps } = useRadioGroup({
    defaultValue: "OVERWRITE",
    onChange,
  });

  return (
    <>
      <Td paddingX={2} paddingY={3} verticalAlign="middle">
        <HStack>
          <Radio {...getRadioProps({ value: "IGNORE" })}>{oldValue}</Radio>
        </HStack>
      </Td>
      <Td paddingX={2} paddingY={3} verticalAlign="middle">
        <HStack>
          <Radio {...getRadioProps({ value: "OVERWRITE" })}>{newValue}</Radio>
        </HStack>
      </Td>
    </>
  );
}

export function useResolveProfilePropertiesConflictsDialog() {
  return useDialog(ResolveProfilePropertiesConflictsDialog);
}

useResolveProfilePropertiesConflictsDialog.fragments = {
  ProfileFieldProperty: gql`
    fragment useResolveProfilePropertiesConflictsDialog_ProfileFieldProperty on ProfileFieldProperty {
      field {
        id
        type
        name
        options
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
    }
  `,
  PetitionField: gql`
    fragment useResolveProfilePropertiesConflictsDialog_PetitionField on PetitionField {
      id
      profileTypeField {
        id
      }
    }
  `,
  PetitionFieldReply: gql`
    fragment useResolveProfilePropertiesConflictsDialog_PetitionFieldReply on PetitionFieldReply {
      id
      content
    }
  `,
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
