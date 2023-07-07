import { gql, useMutation } from "@apollo/client";
import {
  Box,
  Button,
  Center,
  Checkbox,
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  HStack,
  Input,
  Stack,
  Switch,
  Text,
} from "@chakra-ui/react";
import { HelpPopover } from "@parallel/components/common/HelpPopover";
import { LocalizableUserTextInput } from "@parallel/components/common/LocalizableUserTextInput";
import { SimpleOption, SimpleSelect } from "@parallel/components/common/SimpleSelect";
import { useConfirmDeleteDialog } from "@parallel/components/common/dialogs/ConfirmDeleteDialog";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import {
  CreateProfileTypeFieldInput,
  ProfileTypeFieldType,
  useCreateOrUpdateProfileTypeFieldDialog_ProfileTypeFieldFragment,
  useCreateOrUpdateProfileTypeFieldDialog_createProfileTypeFieldDocument,
  useCreateOrUpdateProfileTypeFieldDialog_updateProfileTypeFieldDocument,
} from "@parallel/graphql/__types";
import { isApolloError } from "@parallel/utils/apollo/isApolloError";
import { useProfileTypeFieldTypes } from "@parallel/utils/profileFields";
import { useRegisterWithRef } from "@parallel/utils/react-form-hook/useRegisterWithRef";
import {
  ExpirationOption,
  durationToExpiration,
  expirationToDuration,
  useExpirationOptions,
} from "@parallel/utils/useExpirationOptions";
import { useEffect, useRef } from "react";
import { Controller, useForm } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";
import { OptionProps, SingleValueProps, components } from "react-select";
import { isDefined, omit } from "remeda";
import { ProfileTypeFieldTypeLabel } from "../ProfileTypeFieldTypeLabel";

interface CreateOrUpdateProfileTypeFieldDialogProps {
  profileTypeId: string;
  profileTypeField?: useCreateOrUpdateProfileTypeFieldDialog_ProfileTypeFieldFragment;
}

interface CreateOrUpdateProfileTypeFieldDialogData
  extends Omit<CreateProfileTypeFieldInput, "expiryAlertAheadTime"> {
  expiryAlertAheadTime: ExpirationOption;
}

function CreateOrUpdateProfileTypeFieldDialog({
  profileTypeId,
  profileTypeField,
  ...props
}: DialogProps<
  CreateOrUpdateProfileTypeFieldDialogProps,
  CreateOrUpdateProfileTypeFieldDialogData
>) {
  const intl = useIntl();

  const {
    name = {
      [intl.locale]: "",
    },
    type = "SHORT_TEXT",
    alias,
    isExpirable,
    expiryAlertAheadTime,
    options,
  } = profileTypeField ?? {};

  const {
    control,
    formState: { errors },
    register,
    handleSubmit,
    watch,
    setError,
    setValue,
  } = useForm<CreateOrUpdateProfileTypeFieldDialogData>({
    defaultValues: {
      name,
      type,
      alias,
      isExpirable,
      options,
      expiryAlertAheadTime:
        expiryAlertAheadTime === null && isExpirable
          ? "DO_NOT_REMEMBER"
          : durationToExpiration(expiryAlertAheadTime ?? { months: 1 }),
    },
  });

  const nameRef = useRef<HTMLInputElement>(null);
  const nameRegisterProps = useRegisterWithRef(nameRef, register, "name", {
    required: true,
    validate: {
      isNotEmpty: (name) => Object.values(name).some((value) => value!.trim().length > 0),
    },
  });

  const _isExpirable = watch("isExpirable");
  const selectedType = watch("type");

  useEffect(() => {
    setValue(
      "options.useReplyAsExpiryDate",
      selectedType !== "DATE" ? undefined : options?.useReplyAsExpiryDate ?? true,
    );
  }, [selectedType, options]);

  const profileTypeFieldTypes = useProfileTypeFieldTypes();

  const expirationOptions = useExpirationOptions();

  const [createProfileTypeField] = useMutation(
    useCreateOrUpdateProfileTypeFieldDialog_createProfileTypeFieldDocument,
  );

  function useUpdateProfileTypeFieldWithForce() {
    const intl = useIntl();
    const [updateProfileTypeField] = useMutation(
      useCreateOrUpdateProfileTypeFieldDialog_updateProfileTypeFieldDocument,
    );
    const showRemoveProfileTypeFieldIsExpirableErrorDialog = useConfirmDeleteDialog();

    return async (options: Parameters<typeof updateProfileTypeField>[0]) => {
      try {
        await updateProfileTypeField(options);
      } catch (e) {
        if (isApolloError(e, "REMOVE_PROFILE_TYPE_FIELD_IS_EXPIRABLE_ERROR")) {
          await showRemoveProfileTypeFieldIsExpirableErrorDialog({
            header: intl.formatMessage({
              id: "component.create-or-update-profile-type-field-dialog.remove-profile-type-field-is-expirable-error-dialog.header",
              defaultMessage: "Remove expiration dates",
            }),
            description: (
              <FormattedMessage
                id="component.create-or-update-profile-type-field-dialog.remove-profile-type-field-is-expirable-error-dialog.description"
                defaultMessage="There are some properties with expiration dates set. If you remove the expiration from this field, these dates will be removed. Would you like to continue?"
              />
            ),
            confirmation: intl
              .formatMessage({
                id: "generic.confirm",
                defaultMessage: "Confirm",
              })
              .toLocaleLowerCase(),
            cancel: (
              <Button onClick={() => props.onReject("CANCEL")}>
                <FormattedMessage id="generic.no-go-back" defaultMessage="No, go back" />
              </Button>
            ),
            confirm: (
              <Button colorScheme="red" type="submit">
                <FormattedMessage id="generic.yes-continue" defaultMessage="Yes, continue" />
              </Button>
            ),
          });
          await updateProfileTypeField({
            ...options,
            variables: {
              ...options!.variables!,
              force: true,
            },
          });
        } else {
          throw e;
        }
      }
    };
  }

  const updateProfileTypeField = useUpdateProfileTypeFieldWithForce();

  return (
    <ConfirmDialog
      {...props}
      initialFocusRef={nameRef}
      closeOnEsc
      closeOnOverlayClick={false}
      size="md"
      content={{
        as: "form",
        onSubmit: handleSubmit(async (data) => {
          try {
            const expiryAlertAheadTime =
              data.isExpirable && data.expiryAlertAheadTime !== "DO_NOT_REMEMBER"
                ? expirationToDuration(data.expiryAlertAheadTime)
                : null;

            if (isDefined(profileTypeField)) {
              await updateProfileTypeField({
                variables: {
                  profileTypeId,
                  profileTypeFieldId: profileTypeField.id,
                  data: {
                    ...omit(data, ["expiryAlertAheadTime", "type"]),
                    expiryAlertAheadTime,
                  },
                },
              });
            } else {
              await createProfileTypeField({
                variables: {
                  profileTypeId,
                  data: {
                    ...omit(data, ["expiryAlertAheadTime"]),
                    expiryAlertAheadTime,
                  },
                },
              });
            }

            props.onResolve();
          } catch (e) {
            if (isApolloError(e, "ALIAS_ALREADY_EXISTS")) {
              setError("alias", { type: "unavailable" });
            }
          }
        }),
      }}
      header={
        isDefined(profileTypeField) ? (
          <FormattedMessage
            id="component.create-or-update-property-dialog.edit-profile-type-field"
            defaultMessage="Edit property"
          />
        ) : (
          <FormattedMessage
            id="component.create-or-update-property-dialog.new-property"
            defaultMessage="New property"
          />
        )
      }
      body={
        <Stack spacing={4}>
          <FormControl isInvalid={!!errors.name}>
            <FormLabel fontWeight={400}>
              <FormattedMessage
                id="component.create-or-update-property-dialog.property-name"
                defaultMessage="Property name"
              />
            </FormLabel>
            <Controller
              name="name"
              control={control}
              render={({ field: { value, onChange } }) => (
                <LocalizableUserTextInput
                  ref={nameRegisterProps.ref}
                  value={value}
                  onChange={onChange}
                />
              )}
            />

            <FormErrorMessage>
              <FormattedMessage
                id="generic.forms.field-required-error"
                defaultMessage="This field is required"
              />
            </FormErrorMessage>
          </FormControl>
          <FormControl isInvalid={!!errors.type}>
            <FormLabel fontWeight={400}>
              <FormattedMessage
                id="component.create-or-update-property-dialog.type-of-property"
                defaultMessage="Type of property"
              />
            </FormLabel>
            <Controller
              name="type"
              control={control}
              rules={{
                required: true,
              }}
              render={({ field: { value, onChange } }) => (
                <SimpleSelect<ProfileTypeFieldType, false>
                  value={value}
                  options={profileTypeFieldTypes}
                  onChange={(value) => onChange(value!)}
                  components={{ SingleValue, Option }}
                  isDisabled={isDefined(profileTypeField)}
                />
              )}
            />
            <FormErrorMessage>
              <FormattedMessage
                id="generic.forms.field-required-error"
                defaultMessage="This field is required"
              />
            </FormErrorMessage>
          </FormControl>
          <FormControl isInvalid={!!errors.alias}>
            <FormLabel display="flex" alignItems="center" fontWeight={400}>
              <FormattedMessage
                id="component.create-or-update-property-dialog.unique-identifier"
                defaultMessage="Unique identifier"
              />
              <HelpPopover>
                <Text>
                  <FormattedMessage
                    id="component.create-or-update-property-dialog.unique-identifier-help"
                    defaultMessage="Allows to easily identify the property in API replies."
                  />
                </Text>
              </HelpPopover>
            </FormLabel>
            <Input {...register("alias")} maxLength={50} />
            <FormErrorMessage>
              <FormattedMessage
                id="component.create-or-update-property-dialog.unique-identifier-alredy-exists"
                defaultMessage="This identifier is already in use"
              />
            </FormErrorMessage>
          </FormControl>
          <Stack spacing={2}>
            <FormControl isInvalid={!!errors.isExpirable}>
              <HStack>
                <Stack as={FormLabel} spacing={1} margin={0}>
                  <Text fontWeight={600}>
                    <FormattedMessage
                      id="component.create-or-update-property-dialog.expiration"
                      defaultMessage="Expiration"
                    />
                  </Text>
                  <Text color="gray.600" fontSize="sm" fontWeight="normal">
                    <FormattedMessage
                      id="component.create-or-update-property-dialog.expiration-description"
                      defaultMessage="Select if this property will have an expiration date. Example: Passports and contracts."
                    />
                  </Text>
                </Stack>
                <Center>
                  <Switch {...register("isExpirable")} />
                </Center>
              </HStack>
            </FormControl>
            {_isExpirable ? (
              <>
                {selectedType === "DATE" ? (
                  <FormControl>
                    <HStack spacing={2}>
                      <Controller
                        name="options.useReplyAsExpiryDate"
                        control={control}
                        render={({ field: { value, onChange } }) => (
                          <Checkbox isChecked={value} value={value} onChange={onChange} />
                        )}
                      />
                      <FormLabel fontSize="sm" whiteSpace="nowrap" fontWeight="normal">
                        <FormattedMessage
                          id="component.create-or-update-property-dialog.use-reply-as-expiry-date"
                          defaultMessage="Use reply as expiry date"
                        />
                      </FormLabel>
                    </HStack>
                  </FormControl>
                ) : null}
                <FormControl isInvalid={!!errors.expiryAlertAheadTime}>
                  <HStack spacing={4}>
                    <FormLabel fontSize="sm" whiteSpace="nowrap" fontWeight="normal" margin={0}>
                      <FormattedMessage
                        id="component.create-or-update-property-dialog.expiry-alert-ahead-time-label"
                        defaultMessage="Remind on:"
                      />
                    </FormLabel>
                    <Box width="100%">
                      <Controller
                        name="expiryAlertAheadTime"
                        control={control}
                        rules={{
                          required: _isExpirable ? true : false,
                        }}
                        render={({ field: { value, onChange, ref } }) => (
                          <SimpleSelect
                            ref={ref}
                            size="sm"
                            value={value ?? null}
                            options={expirationOptions}
                            onChange={(value) => onChange(value!)}
                          />
                        )}
                      />
                    </Box>
                  </HStack>
                </FormControl>
              </>
            ) : null}
          </Stack>
        </Stack>
      }
      confirm={
        <Button colorScheme="primary" type="submit">
          <FormattedMessage id="generic.accept" defaultMessage="Accept" />
        </Button>
      }
    />
  );
}

function SingleValue(props: SingleValueProps<SimpleOption<ProfileTypeFieldType>>) {
  return (
    <components.SingleValue {...props}>
      <Flex>
        <ProfileTypeFieldTypeLabel type={props.data.value} />
      </Flex>
    </components.SingleValue>
  );
}

function Option(props: OptionProps<SimpleOption<ProfileTypeFieldType>>) {
  return (
    <components.Option {...props}>
      <Flex>
        <ProfileTypeFieldTypeLabel type={props.data.value} />
      </Flex>
    </components.Option>
  );
}

export function useCreateOrUpdateProfileTypeFieldDialog() {
  return useDialog(CreateOrUpdateProfileTypeFieldDialog);
}

useCreateOrUpdateProfileTypeFieldDialog.fragments = {
  ProfileTypeField: gql`
    fragment useCreateOrUpdateProfileTypeFieldDialog_ProfileTypeField on ProfileTypeField {
      id
      name
      type
      alias
      options
      isExpirable
      expiryAlertAheadTime
      options
    }
  `,
};

const _mutations = [
  gql`
    mutation useCreateOrUpdateProfileTypeFieldDialog_createProfileTypeField(
      $profileTypeId: GID!
      $data: CreateProfileTypeFieldInput!
    ) {
      createProfileTypeField(profileTypeId: $profileTypeId, data: $data) {
        ...useCreateOrUpdateProfileTypeFieldDialog_ProfileTypeField
      }
    }
    ${useCreateOrUpdateProfileTypeFieldDialog.fragments.ProfileTypeField}
  `,
  gql`
    mutation useCreateOrUpdateProfileTypeFieldDialog_updateProfileTypeField(
      $profileTypeId: GID!
      $profileTypeFieldId: GID!
      $data: UpdateProfileTypeFieldInput!
      $force: Boolean
    ) {
      updateProfileTypeField(
        profileTypeId: $profileTypeId
        profileTypeFieldId: $profileTypeFieldId
        data: $data
        force: $force
      ) {
        ...useCreateOrUpdateProfileTypeFieldDialog_ProfileTypeField
      }
    }
    ${useCreateOrUpdateProfileTypeFieldDialog.fragments.ProfileTypeField}
  `,
];
