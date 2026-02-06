import { gql } from "@apollo/client";
import { useMutation } from "@apollo/client/react";
import {
  Box,
  Center,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Heading,
  HStack,
  Stack,
} from "@chakra-ui/react";
import { DeleteIcon, DragHandleIcon, SettingsIcon } from "@parallel/chakra/icons";
import { Card, CardHeader, CardProps } from "@parallel/components/common/Card";
import { HelpPopover } from "@parallel/components/common/HelpPopover";
import { IconButtonWithTooltip } from "@parallel/components/common/IconButtonWithTooltip";
import {
  localizableUserTextRender,
  LocalizableUserTextRender,
} from "@parallel/components/common/LocalizableUserTextRender";
import { OverflownText } from "@parallel/components/common/OverflownText";
import { RestrictedFeaturePopover } from "@parallel/components/common/RestrictedFeaturePopover";
import { PlaceholderInput } from "@parallel/components/common/slate/PlaceholderInput";
import { Button, Text } from "@parallel/components/ui";
import {
  ProfileTypeSettings_createProfileTypeProcessDocument,
  ProfileTypeSettings_editProfileTypeProcessDocument,
  ProfileTypeSettings_ProfileTypeFragment,
  ProfileTypeSettings_ProfileTypeFragmentDoc,
  ProfileTypeSettings_ProfileTypeProcessFragment,
  ProfileTypeSettings_removeProfileTypeProcessDocument,
  ProfileTypeSettings_updateProfileTypeProcessPositionsDocument,
} from "@parallel/graphql/__types";
import { isApolloError } from "@parallel/utils/apollo/isApolloError";
import { updateFragment } from "@parallel/utils/apollo/updateFragment";
import { isNotEmptyText } from "@parallel/utils/strings";
import { MaybePromise } from "@parallel/utils/types";
import { MotionConfig, Reorder, useDragControls } from "framer-motion";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";
import { sortBy } from "remeda";
import { useAutoConfirmDiscardChangesDialog } from "../dialogs/ConfirmDiscardChangesDialog";
import { useConfirmRemoveProfileTypeKeyProcessDialog } from "./dialogs/ConfirmRemoveProfileTypeKeyProcessDialog";
import { useCreateOrUpdateProfileTypeKeyProcessDialog } from "./dialogs/CreateOrUpdateProfileTypeKeyProcessDialog";

const MAX_KEY_PROCESSES = 3;
interface ProfileTypeSettingsProps extends CardProps {
  profileType: ProfileTypeSettings_ProfileTypeFragment;
  onSave: (pattern: string) => MaybePromise<void>;
}

export function ProfileTypeSettings({ profileType, onSave, ...props }: ProfileTypeSettingsProps) {
  const intl = useIntl();
  const [orderedProcesses, setOrderedProcesses] = useState(
    sortBy(profileType.keyProcesses, (p) => p.position),
  );

  useEffect(() => {
    setOrderedProcesses(sortBy(profileType.keyProcesses, (p) => p.position));
  }, [profileType.keyProcesses]);

  const {
    handleSubmit,
    control,
    reset,
    setError,
    formState: { errors, isDirty },
  } = useForm<{ pattern: string }>({
    defaultValues: { pattern: profileType.profileNamePattern },
  });

  useAutoConfirmDiscardChangesDialog(isDirty);

  const placeholders = profileType.fields
    .filter(
      (field) =>
        ["SHORT_TEXT", "SELECT"].includes(field.type) && field.defaultPermission !== "HIDDEN",
    )
    .map((field) => ({
      key: field.id,
      text: localizableUserTextRender({
        value: field.name,
        intl,
        default: intl.formatMessage({
          id: "generic.unnamed-profile-type-field",
          defaultMessage: "Unnamed property",
        }),
      }),
    }));

  const showCreateOrUpdateProfileTypeKeyProcessDialog =
    useCreateOrUpdateProfileTypeKeyProcessDialog();
  const [createProfileTypeProcess] = useMutation(
    ProfileTypeSettings_createProfileTypeProcessDocument,
  );
  const [editProfileTypeProcess] = useMutation(ProfileTypeSettings_editProfileTypeProcessDocument);

  const handleAddNewKeyProcess = async () => {
    try {
      const { processName, templateIds } = await showCreateOrUpdateProfileTypeKeyProcessDialog({});
      await createProfileTypeProcess({
        variables: {
          profileTypeId: profileType.id,
          processName,
          templateIds,
        },
        update: (cache, { data }) => {
          if (data?.createProfileTypeProcess) {
            const newProcess = data.createProfileTypeProcess;
            updateFragment(cache, {
              fragment: ProfileTypeSettings_ProfileTypeFragmentDoc,
              fragmentName: "ProfileTypeSettings_ProfileType",
              id: profileType.id,
              data: (data) => ({
                ...data!,
                keyProcesses: [...data!.keyProcesses, newProcess],
              }),
            });
          }
        },
      });
    } catch {}
  };

  const handleEditKeyProcess = async (
    keyProcess: ProfileTypeSettings_ProfileTypeProcessFragment,
  ) => {
    try {
      const { processName, templateIds } = await showCreateOrUpdateProfileTypeKeyProcessDialog({
        processName: keyProcess.name,
        templateIds: keyProcess.templates.map((t) => t.id),
      });
      await editProfileTypeProcess({
        variables: {
          data: {
            processName,
            templateIds,
          },
          profileTypeProcessId: keyProcess.id,
        },
      });
    } catch {}
  };

  const showConfirmRemoveProfileTypeKeyProcessDialog =
    useConfirmRemoveProfileTypeKeyProcessDialog();
  const [removeProfileTypeProcess] = useMutation(
    ProfileTypeSettings_removeProfileTypeProcessDocument,
  );
  const handleRemoveKeyProcess = async (profileTypeProcessId: string) => {
    try {
      await showConfirmRemoveProfileTypeKeyProcessDialog({});
      await removeProfileTypeProcess({
        variables: {
          profileTypeProcessId,
        },
      });
    } catch {}
  };

  const [updateProfileTypeProcessPositions] = useMutation(
    ProfileTypeSettings_updateProfileTypeProcessPositionsDocument,
  );
  const handleProcessesReorder = async (profileTypeProcessIds: string[]) => {
    try {
      await updateProfileTypeProcessPositions({
        variables: {
          profileTypeId: profileType.id,
          profileTypeProcessIds,
        },
      });
    } catch {}
  };

  const maxKeyProcessesReached = profileType.keyProcesses.length >= MAX_KEY_PROCESSES;

  return (
    <Card
      {...props}
      height="fit-content"
      as="form"
      onSubmit={handleSubmit(async (data) => {
        try {
          await onSave(data.pattern);
          reset(data);
        } catch (e) {
          if (isApolloError(e, "INVALID_PROFILE_NAME_PATTERN")) {
            setError("pattern", { type: "invalid_pattern" });
          }
        }
      })}
    >
      <CardHeader headingSize="md" headingLevel="h2">
        <FormattedMessage id="component.profile-type-settings.settings" defaultMessage="Settings" />
      </CardHeader>
      <Stack padding={4} spacing={3}>
        <FormControl id="pattern" isInvalid={!!errors.pattern}>
          <FormLabel
            whiteSpace="nowrap"
            display="flex"
            alignItems="center"
            alignSelf="start"
            marginTop="2"
            fontWeight={400}
          >
            <Text>
              <FormattedMessage
                id="component.profile-type-settings.profile-name-pattern"
                defaultMessage="Profile name"
              />
            </Text>
            <HelpPopover>
              <Text>
                <FormattedMessage
                  id="component.profile-type-settings.name-of-each-profile-help"
                  defaultMessage="Specify how the name of the profiles of type <b>{ProfileTypeName}</b> will be generated. If you change it, existing profiles of this type will be updated."
                  values={{
                    ProfileTypeName: (
                      <LocalizableUserTextRender
                        value={profileType.name}
                        default={intl.formatMessage({
                          id: "generic.unnamed-profile-type",
                          defaultMessage: "Unnamed profile type",
                        })}
                      />
                    ),
                  }}
                />
              </Text>
            </HelpPopover>
          </FormLabel>
          <HStack>
            <Stack flex="1" minW={0}>
              <Controller
                name="pattern"
                control={control}
                rules={{
                  required: true,
                  validate: { isNotEmptyText },
                }}
                render={({ field: { value, onChange } }) => (
                  <PlaceholderInput
                    key={profileType.id}
                    value={value}
                    placeholder={intl.formatMessage({
                      id: "component.profile-type-settings.profile-name-pattern-placeholder",
                      defaultMessage: "Select a property",
                    })}
                    onChange={onChange}
                    placeholders={placeholders}
                  />
                )}
              />

              {errors.pattern?.type === "invalid_pattern" ? (
                <FormErrorMessage>
                  <FormattedMessage
                    id="component.profile-type-settings.add-profile-type-field-to-name-error"
                    defaultMessage="Please add a property to the name"
                  />
                </FormErrorMessage>
              ) : null}
            </Stack>
            <Box paddingTop={{ base: 2, lg: 0 }} alignSelf={{ base: "end", lg: "start" }}>
              <Button disabled={!isDirty} colorPalette="primary" type="submit">
                <FormattedMessage id="generic.save" defaultMessage="Save" />
              </Button>
            </Box>
          </HStack>
        </FormControl>

        <Stack>
          <HStack justify="space-between">
            <HStack spacing={0}>
              <Heading size="sm">
                <FormattedMessage
                  id="component.profile-type-settings.processes-heading"
                  defaultMessage="Key processes {count}/{max}"
                  values={{
                    count: orderedProcesses.length,
                    max: MAX_KEY_PROCESSES,
                  }}
                />
              </Heading>
              <HelpPopover>
                <FormattedMessage
                  id="component.profile-type-settings.processes-heading-popover"
                  defaultMessage="Indicate the key processes that will be associated with each profile. For example: KYC, contract, etc."
                />
              </HelpPopover>
            </HStack>
            <RestrictedFeaturePopover
              isRestricted={maxKeyProcessesReached}
              content={
                <FormattedMessage
                  id="component.profile-type-settings.max-key-processes-popover"
                  defaultMessage="You have reached the maximum number of key processes. Remove some to add more."
                />
              }
            >
              <Button
                size="sm"
                fontSize="md"
                onClick={handleAddNewKeyProcess}
                disabled={maxKeyProcessesReached}
              >
                <FormattedMessage id="generic.add" defaultMessage="Add" />
              </Button>
            </RestrictedFeaturePopover>
          </HStack>

          {orderedProcesses.length > 0 ? (
            <MotionConfig reducedMotion="always">
              <Stack
                listStyleType="none"
                as={Reorder.Group}
                axis="y"
                values={orderedProcesses}
                onReorder={setOrderedProcesses as any}
              >
                {orderedProcesses.map((process) => {
                  const { id } = process;
                  return (
                    <ProfileTypeProccess
                      key={id}
                      process={process}
                      onDragEnd={() => handleProcessesReorder(orderedProcesses.map((i) => i.id))}
                      onEdit={() => handleEditKeyProcess(process)}
                      onRemove={() => handleRemoveKeyProcess(id)}
                    />
                  );
                })}
              </Stack>
            </MotionConfig>
          ) : (
            <Center>
              <Text fontSize="sm" color="gray.600">
                <FormattedMessage
                  id="component.profile-type-settings.no-processes-text"
                  defaultMessage="There are no key processes yet"
                />
              </Text>
            </Center>
          )}
        </Stack>
      </Stack>
    </Card>
  );
}

interface ProfileTypeProccessProps {
  process: ProfileTypeSettings_ProfileTypeProcessFragment;
  onDragEnd: () => void;
  onEdit: () => void;
  onRemove: () => void;
}

function ProfileTypeProccess({ process, onDragEnd, onEdit, onRemove }: ProfileTypeProccessProps) {
  const intl = useIntl();
  const dragControls = useDragControls();
  return (
    <Reorder.Item
      key={process.id}
      value={process}
      id={process.id}
      dragListener={false}
      dragControls={dragControls}
      onDragEnd={onDragEnd}
    >
      <HStack justify="space-between" spacing={3}>
        <HStack minWidth={0}>
          <Center
            cursor="grab"
            color="gray.400"
            _hover={{
              color: "gray.700",
            }}
            aria-label={intl.formatMessage({
              id: "component.profile-type-settings.drag-process-aria-label",
              defaultMessage: "Drag to sort this process",
            })}
            onPointerDown={(event) => dragControls.start(event)}
          >
            <DragHandleIcon role="presentation" boxSize={3} />
          </Center>

          <OverflownText>
            <LocalizableUserTextRender value={process.name} default="" />
          </OverflownText>
          <Text as="span" fontSize="sm" color="gray.600" whiteSpace="nowrap">
            <FormattedMessage
              id="generic.number-of-templates"
              defaultMessage="{count, plural, =1 {# template} other {# templates}}"
              values={{ count: process.templates.length }}
            />
          </Text>
        </HStack>
        <HStack>
          <IconButtonWithTooltip
            size="sm"
            icon={<SettingsIcon boxSize={4} />}
            label={intl.formatMessage({
              id: "generic.edit-setting",
              defaultMessage: "Edit setting",
            })}
            onClick={onEdit}
          />

          <IconButtonWithTooltip
            variant="outline"
            size="sm"
            icon={<DeleteIcon boxSize={4} />}
            label={intl.formatMessage({
              id: "generic.remove",
              defaultMessage: "Remove",
            })}
            onClick={onRemove}
          />
        </HStack>
      </HStack>
    </Reorder.Item>
  );
}

const _fragments = {
  ProfileTypeField: gql`
    fragment ProfileTypeSettings_ProfileTypeField on ProfileTypeField {
      id
      name
      type
      defaultPermission
    }
  `,
  ProfileTypeProcess: gql`
    fragment ProfileTypeSettings_ProfileTypeProcess on ProfileTypeProcess {
      id
      name
      position
      templates {
        id
      }
    }
  `,
  ProfileType: gql`
    fragment ProfileTypeSettings_ProfileType on ProfileType {
      id
      name
      fields {
        id
        ...ProfileTypeSettings_ProfileTypeField
      }
      isStandard
      profileNamePattern
      keyProcesses {
        id
        ...ProfileTypeSettings_ProfileTypeProcess
      }
    }
  `,
};

const _mutations = [
  gql`
    mutation ProfileTypeSettings_createProfileTypeProcess(
      $profileTypeId: GID!
      $processName: LocalizableUserText!
      $templateIds: [GID!]!
    ) {
      createProfileTypeProcess(
        profileTypeId: $profileTypeId
        processName: $processName
        templateIds: $templateIds
      ) {
        ...ProfileTypeSettings_ProfileTypeProcess
      }
    }
  `,
  gql`
    mutation ProfileTypeSettings_editProfileTypeProcess(
      $profileTypeProcessId: GID!
      $data: EditProfileTypeProcessInput!
    ) {
      editProfileTypeProcess(profileTypeProcessId: $profileTypeProcessId, data: $data) {
        ...ProfileTypeSettings_ProfileTypeProcess
      }
    }
  `,
  gql`
    mutation ProfileTypeSettings_removeProfileTypeProcess($profileTypeProcessId: GID!) {
      removeProfileTypeProcess(profileTypeProcessId: $profileTypeProcessId) {
        id
        keyProcesses {
          id
        }
      }
    }
  `,
  gql`
    mutation ProfileTypeSettings_updateProfileTypeProcessPositions(
      $profileTypeId: GID!
      $profileTypeProcessIds: [GID!]!
    ) {
      updateProfileTypeProcessPositions(
        profileTypeId: $profileTypeId
        profileTypeProcessIds: $profileTypeProcessIds
      ) {
        id
        keyProcesses {
          id
          position
        }
      }
    }
  `,
];
