import { gql } from "@apollo/client";
import { useMutation, useQuery } from "@apollo/client/react";
import {
  Alert,
  AlertDescription,
  AlertIcon,
  Center,
  Checkbox,
  FormControl,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  Input,
  List,
  ListItem,
  Spinner,
  Switch,
} from "@chakra-ui/react";
import { HelpPopover } from "@parallel/components/common/HelpPopover";
import { LocalizableUserTextInput } from "@parallel/components/common/LocalizableUserTextInput";
import { isValidLocalizableUserText } from "@parallel/components/common/LocalizableUserTextRender";
import { ProfileReference } from "@parallel/components/common/ProfileReference";
import { SimpleSelect } from "@parallel/components/common/SimpleSelect";
import { useConfirmDeleteDialog } from "@parallel/components/common/dialogs/ConfirmDeleteDialog";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import {
  DialogProps,
  isDialogError,
  useDialog,
} from "@parallel/components/common/dialogs/DialogProvider";
import { RestrictedPetitionFieldAlert } from "@parallel/components/petition-common/alerts/RestrictedPetitionFieldAlert";
import { Box, Button, HStack, Stack, Text } from "@parallel/components/ui";
import {
  CreateProfileTypeFieldInput,
  ProfileTypeFieldType,
  Scalars,
  UpdateProfileTypeFieldInput,
  useCreateOrUpdateProfileTypeFieldDialog_ProfileTypeFieldFragment,
  useCreateOrUpdateProfileTypeFieldDialog_ProfileTypeFragment,
  useCreateOrUpdateProfileTypeFieldDialog_createProfileTypeFieldDocument,
  useCreateOrUpdateProfileTypeFieldDialog_profilesWithSameContentDocument,
  useCreateOrUpdateProfileTypeFieldDialog_updateProfileTypeFieldDocument,
} from "@parallel/graphql/__types";
import { isApolloError } from "@parallel/utils/apollo/isApolloError";
import { ProfileTypeFieldOptions } from "@parallel/utils/profileFields";
import { useSetFocusRef } from "@parallel/utils/react-form-hook/useSetFocusRef";
import { assertType } from "@parallel/utils/types";
import {
  ExpirationOption,
  durationToExpiration,
  expirationToDuration,
  useExpirationOptions,
} from "@parallel/utils/useExpirationOptions";
import { useHasAdverseMediaSearch } from "@parallel/utils/useHasAdverseMediaSearch";
import { useHasBackgroundCheck } from "@parallel/utils/useHasBackgroundCheck";
import { REFERENCE_REGEX } from "@parallel/utils/validation";
import { nanoid } from "nanoid";
import { useCallback } from "react";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { FormattedMessage, IntlShape, useIntl } from "react-intl";
import { isNonNullish, omit } from "remeda";
import { ProfileTypeFieldTypeSelect } from "../ProfileTypeFieldTypeSelect";
import { ProfileFieldAutoSearchSettings } from "../settings/ProfileFieldAutoSearchSettings";
import {
  IProfileFieldMonitoringSettings,
  ProfileFieldMonitoringSettings,
} from "../settings/ProfileFieldMonitoringSettings";
import {
  ProfileFieldSelectSettings,
  SelectOptionValue,
} from "../settings/ProfileFieldSelectSettings";
import { ProfileFieldShortTextSettings } from "../settings/ProfileFieldShortTextSettings";
import { ProfileFieldUserAssignmentSettings } from "../settings/ProfileFieldUserAssignmentSettings";
import { useConfirmRemovedSelectOptionsReplacementDialog } from "./ConfirmRemovedSelectOptionsReplacementDialog";

export interface CreateOrUpdateProfileTypeFieldDialogProps {
  profileType: useCreateOrUpdateProfileTypeFieldDialog_ProfileTypeFragment;
  profileTypeField?:
    | useCreateOrUpdateProfileTypeFieldDialog_ProfileTypeFieldFragment
    | CreateProfileTypeFieldInput;
  disableFieldTypeSelect?: boolean;
}

export interface CreateOrUpdateProfileTypeFieldDialogFormData {
  type: ProfileTypeFieldType;
  alias: string;
  expiryAlertAheadTime: ExpirationOption;
  isExpirable: boolean;
  isUnique: boolean;
  name: Scalars["LocalizableUserText"]["input"];
  options: {
    format?: string | null;
    useReplyAsExpiryDate?: boolean;
    listingType?: "STANDARD" | "CUSTOM";
    values?: {
      id?: string;
      existing?: boolean;
      value: string;
      label: Scalars["LocalizableUserText"]["input"];
      color?: string;
      isStandard?: boolean;
      isHidden?: boolean;
    }[];
    showOptionsWithColors?: boolean;
    standardList?: string | null;
    autoSearchConfig?: ProfileTypeFieldOptions<"BACKGROUND_CHECK">["autoSearchConfig"];
    allowedUserGroupId?: string | null;
  } & IProfileFieldMonitoringSettings;
}

function defaultOptions(
  intl: IntlShape,
  type: ProfileTypeFieldType,
  options: any,
): CreateOrUpdateProfileTypeFieldDialogFormData["options"] {
  if (type === "SELECT") {
    assertType<ProfileTypeFieldOptions<"SELECT">>(options);
    return {
      ...options,
      showOptionsWithColors: options.showOptionsWithColors ?? false,
      listingType: options.standardList ? "STANDARD" : "CUSTOM",
      values:
        options.values?.length && !options.standardList
          ? options.values.map((option) => ({
              ...option,
              id: nanoid(),
              existing: true,
            }))
          : [{ id: nanoid(), label: { [intl.locale]: "" }, value: "" }],
    };
  } else if (type === "CHECKBOX") {
    assertType<ProfileTypeFieldOptions<"CHECKBOX">>(options);
    return {
      ...options,
      listingType: options.standardList ? "STANDARD" : "CUSTOM",
      values:
        options.values?.length && !options.standardList
          ? options.values.map((option) => ({
              ...option,
              id: nanoid(),
              existing: true,
            }))
          : [{ id: nanoid(), label: { [intl.locale]: "" }, value: "" }],
    };
  } else if (type === "BACKGROUND_CHECK") {
    assertType<ProfileTypeFieldOptions<"BACKGROUND_CHECK">>(options);
    return {
      hasMonitoring: isNonNullish(options.monitoring),
      monitoring: options.monitoring ?? {
        searchFrequency: { type: "FIXED", frequency: "3_YEARS" },
      },
      autoSearchConfig: options.autoSearchConfig ?? null,
    };
  } else if (type === "ADVERSE_MEDIA_SEARCH") {
    assertType<ProfileTypeFieldOptions<"ADVERSE_MEDIA_SEARCH">>(options);
    return {
      hasMonitoring: isNonNullish(options.monitoring),
      monitoring: options.monitoring ?? {
        searchFrequency: { type: "FIXED", frequency: "3_YEARS" },
      },
    };
  } else if (type === "USER_ASSIGNMENT") {
    assertType<ProfileTypeFieldOptions<"USER_ASSIGNMENT">>(options);
    return {
      allowedUserGroupId: options.allowedUserGroupId ?? null,
    };
  } else {
    return options;
  }
}

function CreateOrUpdateProfileTypeFieldDialog({
  profileType,
  profileTypeField,
  disableFieldTypeSelect,
  ...props
}: DialogProps<
  CreateOrUpdateProfileTypeFieldDialogProps,
  useCreateOrUpdateProfileTypeFieldDialog_ProfileTypeFieldFragment
>) {
  const intl = useIntl();

  const isUpdating = isNonNullish(profileTypeField) && "id" in profileTypeField;
  const hasBackgroundCheck = useHasBackgroundCheck();
  const hasAdverseMediaSearch = useHasAdverseMediaSearch();
  const isStandard = isUpdating ? profileTypeField!.isStandard : false;

  const form = useForm<CreateOrUpdateProfileTypeFieldDialogFormData>({
    mode: "onSubmit",
    defaultValues: {
      name: profileTypeField?.name ?? { [intl.locale]: "" },
      type: profileTypeField?.type ?? "SHORT_TEXT",
      alias: profileTypeField?.alias ?? "",
      isExpirable: profileTypeField?.isExpirable ?? false,
      options: defaultOptions(
        intl,
        profileTypeField?.type ?? "SHORT_TEXT",
        profileTypeField?.options ?? {},
      ),
      expiryAlertAheadTime:
        isNonNullish(profileTypeField) &&
        profileTypeField.isExpirable &&
        profileTypeField.expiryAlertAheadTime === null
          ? "DO_NOT_REMIND"
          : durationToExpiration(profileTypeField?.expiryAlertAheadTime ?? { months: 1 }),
      isUnique: profileTypeField?.isUnique ?? false,
    },
  });
  const {
    control,
    formState: { errors },
    register,
    handleSubmit,
    watch,
    setError,
    setValue,
    setFocus,
  } = form;

  const isExpirable = watch("isExpirable");
  const selectedType = watch("type");

  const showConfirmRemovedSelectOptionsReplacementDialog =
    useConfirmRemovedSelectOptionsReplacementDialog();
  const showProfilesWithSameContentDialog = useDialog(ProfilesWithSameContentDialog);

  const expirationOptions = useExpirationOptions();

  const [createProfileTypeField] = useMutation(
    useCreateOrUpdateProfileTypeFieldDialog_createProfileTypeFieldDocument,
  );
  const [updateProfileTypeField] = useMutation(
    useCreateOrUpdateProfileTypeFieldDialog_updateProfileTypeFieldDocument,
  );
  const showConfirmDeleteDialog = useConfirmDeleteDialog();
  const showConfirmDialog = useCallback(
    async (...args: Parameters<typeof showConfirmDeleteDialog>) => {
      try {
        await showConfirmDeleteDialog(...args);
        return true;
      } catch {
        return false;
      }
    },
    [showConfirmDeleteDialog],
  );

  return (
    <ConfirmDialog
      {...props}
      initialFocusRef={useSetFocusRef(setFocus, "name")}
      hasCloseButton
      closeOnEsc
      closeOnOverlayClick={false}
      size={selectedType === "SELECT" || selectedType === "CHECKBOX" ? "3xl" : "lg"}
      content={{
        containerProps: {
          as: "form",
          onSubmit: handleSubmit(async (formData) => {
            if (isUpdating) {
              const data: UpdateProfileTypeFieldInput = {
                ...omit(formData, ["type", "expiryAlertAheadTime", "alias"]),
                expiryAlertAheadTime:
                  formData.isExpirable && formData.expiryAlertAheadTime !== "DO_NOT_REMIND"
                    ? expirationToDuration(formData.expiryAlertAheadTime)
                    : null,
              };

              if (!formData.alias.startsWith("p_")) {
                data.alias = formData.alias === "" ? null : formData.alias;
              }

              if (formData.type === "SELECT" || formData.type === "CHECKBOX") {
                data.options = {
                  standardList:
                    formData.options.listingType === "STANDARD"
                      ? formData.options.standardList
                      : null,
                  values:
                    formData.options.listingType === "STANDARD"
                      ? []
                      : formData.options.values!.map((value) => omit(value, ["id", "existing"])),
                };
                if (formData.type === "SELECT") {
                  data.options.showOptionsWithColors =
                    formData.options.showOptionsWithColors ?? false;
                }
              } else if (formData.type === "DATE") {
                data.options = {
                  useReplyAsExpiryDate:
                    formData.isExpirable && formData.options.useReplyAsExpiryDate ? true : false,
                };
              } else if (formData.type === "BACKGROUND_CHECK") {
                data.options = {
                  monitoring: formData.options.hasMonitoring ? formData.options.monitoring : null,
                  autoSearchConfig: formData.options.autoSearchConfig,
                };
              } else if (formData.type === "ADVERSE_MEDIA_SEARCH") {
                data.options = formData.options.hasMonitoring
                  ? { monitoring: formData.options.monitoring }
                  : { monitoring: null };
              } else if (formData.type === "SHORT_TEXT") {
                // options.format is not allowed to be changed
                data.isUnique = formData.isUnique ?? false;
              } else if (formData.type === "USER_ASSIGNMENT") {
                data.options = {
                  allowedUserGroupId: formData.options.allowedUserGroupId ?? null,
                };
              }

              let force = false;

              do {
                try {
                  const result = await updateProfileTypeField({
                    variables: {
                      profileTypeId: profileType.id,
                      profileTypeFieldId: profileTypeField.id,
                      data,
                      force,
                    },
                  });
                  return props.onResolve(result.data!.updateProfileTypeField);
                } catch (e) {
                  if (isApolloError(e, "ALIAS_ALREADY_EXISTS")) {
                    setError("alias", { type: "unavailable" });
                    return;
                  } else if (isApolloError(e, "REMOVE_PROFILE_TYPE_FIELD_IS_EXPIRABLE_ERROR")) {
                    if (
                      await showConfirmDialog({
                        header: intl.formatMessage({
                          id: "component.create-or-update-profile-type-field-dialog.remove-profile-type-field-is-expirable-error-dialog-header",
                          defaultMessage: "Remove expiration dates",
                        }),
                        description: (
                          <FormattedMessage
                            id="component.create-or-update-profile-type-field-dialog.remove-profile-type-field-is-expirable-error-dialog-description"
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
                            <FormattedMessage
                              id="generic.no-go-back"
                              defaultMessage="No, go back"
                            />
                          </Button>
                        ),

                        confirm: (
                          <Button colorPalette="red" type="submit">
                            <FormattedMessage
                              id="generic.yes-continue"
                              defaultMessage="Yes, continue"
                            />
                          </Button>
                        ),
                      })
                    ) {
                      force = true;
                    } else {
                      return;
                    }
                  } else if (isApolloError(e, "REMOVE_PROFILE_TYPE_FIELD_SELECT_OPTIONS_ERROR")) {
                    try {
                      data.substitutions = await showConfirmRemovedSelectOptionsReplacementDialog({
                        ...(e.errors[0].extensions as {
                          removedOptions: (SelectOptionValue & { count: number })[];
                          currentOptions: SelectOptionValue[];
                        }),
                        showOptionsWithColors: data.options!.showOptionsWithColors,
                      });
                    } catch (error) {
                      if (isDialogError(error) && error.message === "CANCEL") {
                        return;
                      }
                    }
                  } else if (isApolloError(e, "REMOVE_PROFILE_TYPE_FIELD_MONITORING_ERROR")) {
                    const { profileIds } = e.errors[0]?.extensions as {
                      profileIds: string[];
                    };
                    if (
                      await showConfirmDialog({
                        size: "lg",
                        header: (
                          <FormattedMessage
                            id="component.use-confirm-disable-monitoring-dialog.header"
                            defaultMessage="Deactivate ongoing monitoring"
                          />
                        ),

                        description: (
                          <Text>
                            <FormattedMessage
                              id="component.use-confirm-disable-monitoring-dialog.description"
                              defaultMessage="There are <b>{profileCount, plural, =1 {1 profile} other {# profiles}}</b> with active monitoring. If you continue, it will be deactivated and you will not be notified if there are any changes in your searches. Would you like to continue?"
                              values={{
                                profileCount: profileIds.length,
                              }}
                            />
                          </Text>
                        ),

                        confirmation: intl.formatMessage({
                          id: "component.use-confirm-disable-monitoring-dialog.confirm",
                          defaultMessage: "confirm",
                        }),
                        confirm: (
                          <Button colorPalette="red" type="submit">
                            <FormattedMessage id="generic.deactivate" defaultMessage="Deactivate" />
                          </Button>
                        ),
                      })
                    ) {
                      force = true;
                    } else {
                      return;
                    }
                  } else if (isApolloError(e, "DUPLICATE_VALUES_EXIST")) {
                    await showProfilesWithSameContentDialog.ignoringDialogErrors({
                      profileTypeId: profileType.id,
                      profileTypeFieldId: profileTypeField.id,
                    });
                    return;
                  } else {
                    throw e;
                  }
                }
              } while (true);
            } else {
              const data: CreateProfileTypeFieldInput = {
                name: formData.name,
                type: formData.type,
                alias: formData.alias === "" ? null : formData.alias,
                expiryAlertAheadTime:
                  formData.isExpirable && formData.expiryAlertAheadTime !== "DO_NOT_REMIND"
                    ? expirationToDuration(formData.expiryAlertAheadTime)
                    : null,
              };
              if (formData.type === "SELECT" || formData.type === "CHECKBOX") {
                data.options = {
                  ...(formData.options.listingType === "STANDARD"
                    ? {
                        standardList: formData.options.standardList,
                        values: [],
                      }
                    : {
                        standardList: null,
                        values: formData.options.values!.map((value) =>
                          omit(value, ["id", "existing"]),
                        ),
                      }),
                };
                if (formData.type === "SELECT") {
                  data.options.showOptionsWithColors =
                    formData.options.showOptionsWithColors ?? false;
                }
              } else if (formData.type === "DATE") {
                data.options = {
                  useReplyAsExpiryDate:
                    formData.isExpirable && formData.options.useReplyAsExpiryDate ? true : false,
                };
              } else if (formData.type === "BACKGROUND_CHECK") {
                data.options = {
                  monitoring: formData.options.hasMonitoring ? formData.options.monitoring : null,
                  autoSearchConfig: formData.options.autoSearchConfig ?? null,
                };
              } else if (formData.type === "ADVERSE_MEDIA_SEARCH") {
                data.options = formData.options.hasMonitoring
                  ? { monitoring: formData.options.monitoring }
                  : { monitoring: null };
              } else if (formData.type === "SHORT_TEXT") {
                data.options = {
                  format: formData.options.format ?? null,
                };
                data.isUnique = formData.isUnique ?? false;
              } else if (formData.type === "USER_ASSIGNMENT") {
                data.options = {
                  allowedUserGroupId: formData.options.allowedUserGroupId ?? null,
                };
              }

              try {
                const result = await createProfileTypeField({
                  variables: {
                    profileTypeId: profileType.id,
                    data,
                  },
                });
                return props.onResolve(result.data!.createProfileTypeField);
              } catch (error) {
                if (isApolloError(error, "ALIAS_ALREADY_EXISTS")) {
                  setError("alias", { type: "unavailable" });
                } else {
                  throw error;
                }
              }
            }
          }),
        },
      }}
      header={
        isUpdating ? (
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
        <Stack gap={4}>
          {isStandard ? (
            <Alert status="info" rounded="md">
              <AlertIcon />
              <AlertDescription>
                <FormattedMessage
                  id="component.create-or-update-property-dialog.property-standard-alert-description"
                  defaultMessage="This property is provided by Parallel, and only some of the options can be modified."
                />
              </AlertDescription>
            </Alert>
          ) : null}
          {(!hasBackgroundCheck && selectedType === "BACKGROUND_CHECK") ||
          (!hasAdverseMediaSearch && selectedType === "ADVERSE_MEDIA_SEARCH") ? (
            <RestrictedPetitionFieldAlert fieldType={selectedType} />
          ) : null}
          <FormControl isInvalid={!!errors.name} isDisabled={isStandard}>
            <FormLabel fontWeight={400}>
              <FormattedMessage
                id="component.create-or-update-property-dialog.property-name"
                defaultMessage="Property name"
              />
            </FormLabel>
            <Controller
              name="name"
              control={control}
              rules={{
                required: true,
                validate: { isValidLocalizableUserText },
              }}
              render={({ field: { ref, ...field } }) => (
                <LocalizableUserTextInput
                  inputProps={{ "data-1p-ignore": "" } as any}
                  {...field}
                  inputRef={ref}
                />
              )}
            />

            <FormErrorMessage>
              <FormattedMessage
                id="generic.field-required-error"
                defaultMessage="This field is required"
              />
            </FormErrorMessage>
          </FormControl>
          <FormControl isInvalid={!!errors.type} isDisabled={isUpdating}>
            <FormLabel fontWeight={400}>
              <FormattedMessage
                id="component.create-or-update-property-dialog.type-of-property"
                defaultMessage="Type of property"
              />
            </FormLabel>
            <Controller
              name="type"
              control={control}
              rules={{ required: true }}
              render={({ field: { onChange, ...field } }) => (
                <ProfileTypeFieldTypeSelect
                  {...field}
                  isDisabled={disableFieldTypeSelect}
                  onChange={(value) => {
                    onChange(value!);
                    setValue(
                      "options",
                      value === "DATE"
                        ? { useReplyAsExpiryDate: true }
                        : value === "SELECT" || value === "CHECKBOX"
                          ? {
                              values: [{ id: nanoid(), label: { [intl.locale]: "" }, value: "" }],
                            }
                          : {},
                    );
                    if (value === "SELECT" || value === "CHECKBOX") {
                      setTimeout(() => setFocus("options.values.0.label"));
                    }
                  }}
                />
              )}
            />

            <FormErrorMessage>
              <FormattedMessage
                id="generic.field-required-error"
                defaultMessage="This field is required"
              />
            </FormErrorMessage>
          </FormControl>
          <FormControl isInvalid={!!errors.alias} isDisabled={isStandard}>
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
            <Input
              {...register("alias", {
                validate: {
                  isAliasReservedError: (value) => {
                    return value && !isStandard ? /^(?!p_).*$/.test(value) : true;
                  },
                  isInvalidReferenceError: (value) => {
                    return value && !isStandard ? REFERENCE_REGEX.test(value) : true;
                  },
                },
              })}
              maxLength={50}
            />

            <FormErrorMessage>
              {errors.alias?.type === "unavailable" ? (
                <FormattedMessage
                  id="component.create-or-update-property-dialog.unique-identifier-alredy-exists"
                  defaultMessage="This identifier is already in use"
                />
              ) : errors.alias?.type === "isAliasReservedError" ? (
                <FormattedMessage
                  id="component.create-or-update-property-dialog.reserved-alias-error"
                  defaultMessage="This identifier is reserved and can't be used"
                />
              ) : (
                <FormattedMessage
                  id="component.create-or-update-property-dialog.only-letters-numbers-alias-error"
                  defaultMessage="Use only letters, numbers or _"
                />
              )}
            </FormErrorMessage>
          </FormControl>

          <FormProvider {...form}>
            {selectedType === "SHORT_TEXT" ? (
              <ProfileFieldShortTextSettings isDisabled={isUpdating} />
            ) : null}
            {selectedType === "SELECT" || selectedType === "CHECKBOX" ? (
              <ProfileFieldSelectSettings
                profileType={profileType}
                profileTypeField={isUpdating ? profileTypeField : undefined}
                profileFieldType={selectedType}
              />
            ) : null}
            {selectedType === "BACKGROUND_CHECK" || selectedType === "ADVERSE_MEDIA_SEARCH" ? (
              <ProfileFieldMonitoringSettings
                profileFieldType={selectedType}
                profileType={profileType}
              />
            ) : null}
            {selectedType === "BACKGROUND_CHECK" ? (
              <ProfileFieldAutoSearchSettings profileTypeId={profileType.id} />
            ) : null}
            {selectedType === "USER_ASSIGNMENT" ? <ProfileFieldUserAssignmentSettings /> : null}
          </FormProvider>

          <Stack gap={2}>
            <FormControl as={HStack} isInvalid={!!errors.isExpirable}>
              <Stack flex={1} gap={1}>
                <FormLabel margin={0}>
                  <FormattedMessage
                    id="component.create-or-update-property-dialog.expiration"
                    defaultMessage="Expiration"
                  />
                </FormLabel>
                <FormHelperText margin={0}>
                  <FormattedMessage
                    id="component.create-or-update-property-dialog.expiration-description"
                    defaultMessage="Select if this property will have an expiration date. Example: Passports and contracts."
                  />
                </FormHelperText>
              </Stack>
              <Center>
                <Switch {...register("isExpirable")} />
              </Center>
            </FormControl>
            {isExpirable ? (
              <>
                {selectedType === "DATE" ? (
                  <FormControl>
                    <Checkbox {...register("options.useReplyAsExpiryDate")}>
                      <FormattedMessage
                        id="component.create-or-update-property-dialog.use-reply-as-expiry-date"
                        defaultMessage="Use reply as expiry date"
                      />
                    </Checkbox>
                  </FormControl>
                ) : null}
                <FormControl as={HStack} isInvalid={!!errors.expiryAlertAheadTime}>
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
                      rules={{ required: isExpirable ? true : false }}
                      render={({ field }) => (
                        <SimpleSelect size="sm" options={expirationOptions} {...field} />
                      )}
                    />
                  </Box>
                </FormControl>
              </>
            ) : null}
          </Stack>
        </Stack>
      }
      confirm={
        <Button colorPalette="primary" type="submit">
          {isUpdating ? (
            <FormattedMessage id="generic.save" defaultMessage="Save" />
          ) : (
            <FormattedMessage id="generic.create" defaultMessage="Create" />
          )}
        </Button>
      }
    />
  );
}

export function useCreateOrUpdateProfileTypeFieldDialog() {
  return useDialog(CreateOrUpdateProfileTypeFieldDialog);
}

const _fragments = {
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
      isStandard
      isUnique
      ...ProfileFieldSelectSettings_ProfileTypeField
      ...ProfileFieldUserAssignmentSettings_ProfileTypeField
    }
  `,
  ProfileType: gql`
    fragment useCreateOrUpdateProfileTypeFieldDialog_ProfileType on ProfileType {
      id
      fields {
        id
      }
      ...ProfileFieldSelectSettings_ProfileType
      ...ProfileFieldMonitoringSettings_ProfileType
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
  `,
];

const _queries = [
  gql`
    query useCreateOrUpdateProfileTypeFieldDialog_profilesWithSameContent(
      $profileTypeId: GID!
      $profileTypeFieldId: GID!
    ) {
      profilesWithSameContent(
        profileTypeId: $profileTypeId
        profileTypeFieldId: $profileTypeFieldId
      ) {
        content
        profiles {
          ...ProfileReference_Profile
        }
      }
    }
  `,
];

function ProfilesWithSameContentDialog({
  profileTypeId,
  profileTypeFieldId,
  ...props
}: DialogProps<{ profileTypeId: string; profileTypeFieldId: string }>) {
  const intl = useIntl();

  const { data, loading } = useQuery(
    useCreateOrUpdateProfileTypeFieldDialog_profilesWithSameContentDocument,
    {
      variables: {
        profileTypeId,
        profileTypeFieldId,
      },
      fetchPolicy: "network-only",
    },
  );
  return (
    <ConfirmDialog
      header={intl.formatMessage({
        id: "component.create-or-update-profile-type-field-dialog.profiles-with-same-content-dialog-header",
        defaultMessage: "Profiles with same content",
      })}
      body={
        <Stack>
          <Text>
            <FormattedMessage
              id="component.create-or-update-profile-type-field-dialog.profiles-with-same-content-dialog-body-1"
              defaultMessage="The following groups of profiles have the same content for this field."
            />
          </Text>
          <Text>
            <FormattedMessage
              id="component.create-or-update-profile-type-field-dialog.profiles-with-same-content-dialog-body-2"
              defaultMessage="Please remove the duplicate values to enable the field to be unique."
            />
          </Text>
          {loading ? (
            <Center>
              <Spinner />
            </Center>
          ) : (
            <List spacing={2}>
              {data!.profilesWithSameContent.map((item, i) => (
                <ListItem key={i}>
                  <List listStyleType="disc" paddingInlineStart={5}>
                    {item.profiles.map((profile) => (
                      <ListItem key={profile.id}>
                        <ProfileReference
                          profile={profile}
                          showNameEvenIfDeleted
                          asLink
                          target="_blank"
                        />
                      </ListItem>
                    ))}
                  </List>
                </ListItem>
              ))}
            </List>
          )}
        </Stack>
      }
      cancel={<></>}
      confirm={
        <Button colorPalette="primary" onClick={() => props.onResolve()}>
          <FormattedMessage id="generic.ok" defaultMessage="OK" />
        </Button>
      }
      {...props}
    />
  );
}
