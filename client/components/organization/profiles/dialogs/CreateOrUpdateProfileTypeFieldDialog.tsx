import { gql, useMutation } from "@apollo/client";
import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertProps,
  Box,
  Button,
  Center,
  Checkbox,
  FormControl,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  HStack,
  Input,
  Stack,
  Switch,
  Text,
} from "@chakra-ui/react";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { HelpPopover } from "@parallel/components/common/HelpPopover";
import { LocalizableUserTextInput } from "@parallel/components/common/LocalizableUserTextInput";
import { isValidLocalizableUserText } from "@parallel/components/common/LocalizableUserTextRender";
import { SimpleSelect } from "@parallel/components/common/SimpleSelect";
import { useConfirmDeleteDialog } from "@parallel/components/common/dialogs/ConfirmDeleteDialog";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { RestrictedPetitionFieldAlert } from "@parallel/components/petition-common/RestrictedPetitionFieldAlert";
import {
  CreateProfileTypeFieldInput,
  ProfileTypeFieldType,
  UserLocale,
  useCreateOrUpdateProfileTypeFieldDialog_ProfileTypeFieldFragment,
  useCreateOrUpdateProfileTypeFieldDialog_ProfileTypeFragment,
  useCreateOrUpdateProfileTypeFieldDialog_createProfileTypeFieldDocument,
  useCreateOrUpdateProfileTypeFieldDialog_updateProfileTypeFieldDocument,
} from "@parallel/graphql/__types";
import { isApolloError } from "@parallel/utils/apollo/isApolloError";
import { getReferencedInBackgroundCheck } from "@parallel/utils/getFieldsReferencedInBackgroundCheck";
import { ProfileTypeFieldOptions } from "@parallel/utils/profileFields";
import { useSetFocusRef } from "@parallel/utils/react-form-hook/useSetFocusRef";
import { useConstant } from "@parallel/utils/useConstant";
import {
  ExpirationOption,
  durationToExpiration,
  expirationToDuration,
  useExpirationOptions,
} from "@parallel/utils/useExpirationOptions";
import { useHasBackgroundCheck } from "@parallel/utils/useHasBackgroundCheck";
import { REFERENCE_REGEX } from "@parallel/utils/validation";
import { nanoid } from "nanoid";
import { useCallback } from "react";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";
import { isDefined, omit, pick } from "remeda";
import { ProfileTypeFieldTypeSelect } from "../ProfileTypeFieldTypeSelect";
import { ProfileFieldBackgroundCheckSettings } from "../settings/ProfileFieldBackgroundCheckSettings";
import {
  ProfileFieldSelectSettings,
  SelectOptionValue,
} from "../settings/ProfileFieldSelectSettings";
import { useConfirmRemovedSelectOptionsReplacementDialog } from "./ConfirmRemovedSelectOptionsReplacementDialog";
import { ProfileFieldShortTextSettings } from "../settings/ProfileFieldShortTextSettings";

export interface CreateOrUpdateProfileTypeFieldDialogProps {
  profileType: useCreateOrUpdateProfileTypeFieldDialog_ProfileTypeFragment;
  profileTypeField?:
    | useCreateOrUpdateProfileTypeFieldDialog_ProfileTypeFieldFragment
    | CreateProfileTypeFieldInput;
  disableFieldTypeSelect?: boolean;
}

export interface CreateOrUpdateProfileTypeFieldDialogData<TType extends ProfileTypeFieldType = any>
  extends Omit<CreateProfileTypeFieldInput, "expiryAlertAheadTime" | "options"> {
  expiryAlertAheadTime: ExpirationOption;
  options: TType extends "SELECT"
    ? ProfileTypeFieldOptions<TType> & {
        listingType: "STANDARD" | "CUSTOM";
        values: (ProfileTypeFieldOptions<TType>["values"][number] & { id: string })[];
      }
    : ProfileTypeFieldOptions<TType>;
}

function CreateOrUpdateProfileTypeFieldDialog({
  profileType,
  profileTypeField,
  disableFieldTypeSelect,
  ...props
}: DialogProps<
  CreateOrUpdateProfileTypeFieldDialogProps,
  { profileTypeField: useCreateOrUpdateProfileTypeFieldDialog_ProfileTypeFieldFragment }
>) {
  const intl = useIntl();

  const isUpdating = isDefined(profileTypeField) && "id" in profileTypeField;
  const hasBackgroundCheck = useHasBackgroundCheck();
  const isStandard = isUpdating ? profileTypeField!.isStandard : false;

  const referencedIn =
    isUpdating && profileTypeField.type === "SELECT"
      ? getReferencedInBackgroundCheck({
          profileTypeFields: profileType.fields,
          profileTypeFieldId: profileTypeField.id,
        })
      : [];

  const referencedPropertiesNames = referencedIn
    .map((field) => field.name[intl.locale as UserLocale])
    .filter(isDefined);

  const isDisabled = referencedIn.length > 0;

  const intialOptions = useConstant(() => {
    if (profileTypeField?.type === "SELECT") {
      const options = profileTypeField.options as ProfileTypeFieldOptions<"SELECT">;

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
    } else if (profileTypeField?.type === "BACKGROUND_CHECK") {
      const options = profileTypeField.options as ProfileTypeFieldOptions<"BACKGROUND_CHECK">;
      return {
        hasMonitoring: isDefined(options.monitoring),
        monitoring: options.monitoring ?? {
          searchFrequency: { type: "FIXED", frequency: "3_YEARS" },
        },
      };
    }
  }) as CreateOrUpdateProfileTypeFieldDialogData["options"];

  const form = useForm<CreateOrUpdateProfileTypeFieldDialogData<any>>({
    mode: "onSubmit",
    defaultValues: {
      name: profileTypeField?.name ?? { [intl.locale]: "" },
      type: profileTypeField?.type ?? "SHORT_TEXT",
      alias: profileTypeField?.alias ?? "",
      isExpirable: profileTypeField?.isExpirable ?? false,
      options:
        profileTypeField?.type === "SELECT" || profileTypeField?.type === "BACKGROUND_CHECK"
          ? intialOptions
          : profileTypeField?.options ?? {},
      expiryAlertAheadTime:
        isDefined(profileTypeField) &&
        profileTypeField.isExpirable &&
        profileTypeField.expiryAlertAheadTime === null
          ? "DO_NOT_REMEMBER"
          : durationToExpiration(profileTypeField?.expiryAlertAheadTime ?? { months: 1 }),
    },
  });
  const {
    control,
    formState: { errors, dirtyFields },
    register,
    handleSubmit,
    watch,
    setError,
    setValue,
    setFocus,
  } = form;

  const isExpirable = watch("isExpirable");
  const selectedType = watch("type");
  const values = watch("options.values");

  const showConfirmRemovedSelectOptionsReplacementDialog =
    useConfirmRemovedSelectOptionsReplacementDialog();

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
  const showConfirmDisableMonitoringDialog = useConfirmDisableMonitoringDialog();

  function getDirtyFieldsKeys(obj: Record<string, any>): string[] {
    return Object.entries(obj)
      .filter(
        ([, value]) =>
          (typeof value === "boolean" && value) ||
          (typeof value === "object" && value !== null && getDirtyFieldsKeys(value).length > 0),
      )
      .map(([key]) => key);
  }

  return (
    <ConfirmDialog
      {...props}
      initialFocusRef={useSetFocusRef(setFocus, "name")}
      hasCloseButton
      closeOnEsc
      closeOnOverlayClick={false}
      size={selectedType === "SELECT" ? "3xl" : "lg"}
      content={{
        as: "form",
        onSubmit: handleSubmit(async (formData) => {
          let profileField = {} as useCreateOrUpdateProfileTypeFieldDialog_ProfileTypeFieldFragment;

          try {
            const dirtyFieldsKeys = getDirtyFieldsKeys(omit(dirtyFields, ["type"]));
            const dirtyData = pick(
              formData,
              dirtyFieldsKeys as (keyof CreateOrUpdateProfileTypeFieldDialogData)[],
            );

            const expiryAlertAheadTime =
              formData.isExpirable && formData.expiryAlertAheadTime !== "DO_NOT_REMEMBER"
                ? expirationToDuration(formData.expiryAlertAheadTime)
                : null;

            if (isUpdating) {
              if (formData.type === "SELECT") {
                const hasStandardList =
                  formData.options.listingType === "STANDARD" && formData.options.standardList;

                const options = isDefined(dirtyData.options)
                  ? {
                      showOptionsWithColors: dirtyData.options.showOptionsWithColors ?? false,
                      standardList: hasStandardList ? dirtyData.options.standardList : null,
                      values: hasStandardList
                        ? []
                        : dirtyData.options.values!.map((value: any) =>
                            omit(value, ["id", "existing"]),
                          ),
                    }
                  : undefined;
                try {
                  await updateProfileTypeField({
                    variables: {
                      profileTypeId: profileType.id,
                      profileTypeFieldId: profileTypeField.id,
                      data: {
                        ...(isStandard
                          ? {}
                          : {
                              ...dirtyData,
                              ...(isDefined(dirtyData.alias)
                                ? { alias: dirtyData.alias || null }
                                : {}),
                            }),

                        options,
                        isExpirable: formData.isExpirable,
                        expiryAlertAheadTime,
                      },
                    },
                  });
                } catch (error) {
                  if (isApolloError(error, "REMOVE_PROFILE_TYPE_FIELD_SELECT_OPTIONS_ERROR")) {
                    const removedOptions = error.graphQLErrors[0].extensions
                      ?.removedOptions as (SelectOptionValue & { count: number })[];

                    const currentOptions = error.graphQLErrors[0].extensions
                      ?.currentOptions as SelectOptionValue[];

                    const optionValuesToUpdate =
                      await showConfirmRemovedSelectOptionsReplacementDialog({
                        currentOptions,
                        removedOptions,
                        showOptionsWithColors: dirtyData.options.showOptionsWithColors ?? false,
                      });

                    await updateProfileTypeField({
                      variables: {
                        profileTypeId: profileType.id,
                        profileTypeFieldId: profileTypeField.id,
                        data: {
                          ...(isStandard ? {} : dirtyData),
                          ...(isDefined(dirtyData.alias) ? { alias: dirtyData.alias || null } : {}),
                          options,
                          isExpirable: formData.isExpirable,
                          expiryAlertAheadTime,
                          substitutions: optionValuesToUpdate,
                        },
                      },
                    });
                  } else {
                    throw error;
                  }
                }
              } else {
                try {
                  await updateProfileTypeField({
                    variables: {
                      profileTypeId: profileType.id,
                      profileTypeFieldId: profileTypeField.id,
                      data: {
                        ...dirtyData,
                        ...(isDefined(dirtyData.alias) ? { alias: dirtyData.alias || null } : {}),
                        options:
                          formData.type === "DATE"
                            ? pick(formData.options, ["useReplyAsExpiryDate"])
                            : formData.type === "BACKGROUND_CHECK"
                              ? formData.options.hasMonitoring
                                ? pick(formData.options, ["monitoring"])
                                : { monitoring: null }
                              : {},
                        isExpirable: formData.isExpirable,
                        expiryAlertAheadTime,
                      },
                    },
                  });
                } catch (error) {
                  if (isApolloError(error, "REMOVE_PROFILE_TYPE_FIELD_MONITORING_ERROR")) {
                    try {
                      const profileIds = error.graphQLErrors[0]?.extensions?.profileIds as string[];
                      await showConfirmDisableMonitoringDialog({
                        profileCount: profileIds?.length ?? 1,
                      });
                      await updateProfileTypeField({
                        variables: {
                          profileTypeId: profileType.id,
                          profileTypeFieldId: profileTypeField.id,
                          data: {
                            ...omit(formData, ["expiryAlertAheadTime", "type", "alias"]),
                            alias: formData.alias || null,
                            expiryAlertAheadTime,
                            options:
                              formData.type === "DATE"
                                ? pick(formData.options, ["useReplyAsExpiryDate"])
                                : formData.type === "BACKGROUND_CHECK"
                                  ? formData.options.hasMonitoring
                                    ? pick(formData.options, ["monitoring"])
                                    : { monitoring: null }
                                  : {},
                          },
                          force: true,
                        },
                      });
                    } catch {}
                  }
                }
              }
            } else {
              const hasStandardList =
                formData.options.listingType === "STANDARD" && formData.options.standardList;

              let options = {};
              switch (formData.type) {
                case "SELECT":
                  options = {
                    showOptionsWithColors: formData.options.showOptionsWithColors ?? false,
                    standardList: hasStandardList ? formData.options.standardList : null,
                    values: hasStandardList
                      ? []
                      : formData.options.values!.map((value: any) =>
                          omit(value, ["id", "existing"]),
                        ),
                  };
                  break;
                case "DATE":
                  options = pick(formData.options, ["useReplyAsExpiryDate"]);
                  break;
                case "BACKGROUND_CHECK":
                  options = formData.options.hasMonitoring
                    ? pick(formData.options, ["monitoring"])
                    : { monitoring: null };
                  break;
                case "SHORT_TEXT":
                  options = pick(formData.options, ["format"]);
                  break;
                default:
                  break;
              }

              const { data } = await createProfileTypeField({
                variables: {
                  profileTypeId: profileType.id,
                  data: {
                    ...omit(formData, ["expiryAlertAheadTime", "alias"]),
                    alias: formData.alias || null,
                    options,
                    expiryAlertAheadTime,
                  },
                },
              });
              if (data?.createProfileTypeField) {
                profileField = data!.createProfileTypeField;
              }
            }

            props.onResolve({ profileTypeField: profileField });
          } catch (e) {
            if (isApolloError(e, "ALIAS_ALREADY_EXISTS")) {
              setError("alias", { type: "unavailable" });
            }
            if (
              isApolloError(e, "ARG_VALIDATION_ERROR") &&
              (e.graphQLErrors[0].extensions?.extra as any)?.code ===
                "REMOVE_STANDARD_OPTIONS_ERROR"
            ) {
              setError("options.values", { type: "validate" });
            }
          }
        }),
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
        <Stack spacing={4}>
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
          {!hasBackgroundCheck && selectedType === "BACKGROUND_CHECK" ? (
            <RestrictedPetitionFieldAlert fieldType="BACKGROUND_CHECK" />
          ) : null}
          {referencedIn.length ? (
            <PropertyReferencedAlert propertyNames={referencedPropertiesNames} />
          ) : null}
          <FormControl isInvalid={!!errors.name} isDisabled={isDisabled || isStandard}>
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
          <FormControl isInvalid={!!errors.type} isDisabled={isUpdating || isDisabled}>
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
                        : value === "SELECT"
                          ? { values: [{ id: nanoid(), label: { [intl.locale]: "" }, value: "" }] }
                          : {},
                    );
                    if (value === "SELECT") {
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
          <FormControl isInvalid={!!errors.alias} isDisabled={isStandard || isDisabled}>
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
              <ProfileFieldShortTextSettings isDisabled={isUpdating || isDisabled} />
            ) : null}
            {selectedType === "SELECT" ? (
              <ProfileFieldSelectSettings
                isStandard={isStandard || values?.some((v: any) => v.isStandard)}
                isDisabled={isDisabled || referencedIn.length > 0}
              />
            ) : null}
            {selectedType === "BACKGROUND_CHECK" ? (
              <ProfileFieldBackgroundCheckSettings
                profileType={profileType}
                isDisabled={isDisabled}
              />
            ) : null}
          </FormProvider>
          <Stack spacing={2}>
            <FormControl as={HStack} isInvalid={!!errors.isExpirable} isDisabled={isDisabled}>
              <Stack flex={1} spacing={1}>
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
                  <FormControl isDisabled={isDisabled}>
                    <Checkbox {...register("options.useReplyAsExpiryDate")}>
                      <FormattedMessage
                        id="component.create-or-update-property-dialog.use-reply-as-expiry-date"
                        defaultMessage="Use reply as expiry date"
                      />
                    </Checkbox>
                  </FormControl>
                ) : null}
                <FormControl
                  as={HStack}
                  isInvalid={!!errors.expiryAlertAheadTime}
                  isDisabled={isDisabled}
                >
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
                        required: isExpirable ? true : false,
                      }}
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
        <Button colorScheme="primary" type="submit">
          <FormattedMessage id="generic.accept" defaultMessage="Accept" />
        </Button>
      }
    />
  );
}

export function useCreateOrUpdateProfileTypeFieldDialog() {
  return useDialog(CreateOrUpdateProfileTypeFieldDialog);
}

useCreateOrUpdateProfileTypeFieldDialog.fragments = {
  get ProfileTypeField() {
    return gql`
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
        ...getReferencedInBackgroundCheck_ProfileTypeField
      }
      ${getReferencedInBackgroundCheck.fragments.ProfileTypeField}
    `;
  },
  get ProfileType() {
    return gql`
      fragment useCreateOrUpdateProfileTypeFieldDialog_ProfileType on ProfileType {
        id
        fields {
          ...useCreateOrUpdateProfileTypeFieldDialog_ProfileTypeField
        }
        ...ProfileFieldBackgroundCheckSettings_ProfileType
      }
      ${ProfileFieldBackgroundCheckSettings.fragments.ProfileType}
      ${this.ProfileTypeField}
    `;
  },
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

interface PropertyReferencedAlertProps extends AlertProps {
  propertyNames: string[];
}

const PropertyReferencedAlert = chakraForwardRef<"div", PropertyReferencedAlertProps>(
  function PropertyReferencedAlert({ propertyNames, ...props }, ref) {
    const intl = useIntl();
    return (
      <Alert status="warning" rounded="md" paddingX={4} paddingY={2} ref={ref} {...props}>
        <AlertIcon color="yellow.500" />
        <HStack spacing={4} width="100%">
          <Box flex="1">
            <FormattedMessage
              id="component.property-referenced-alert.referenced-in"
              defaultMessage="This property cannot be edited as it is currently employed for the ongoing monitoring of the {properties} {count, plural, =1{property} other {properties}}. To make changes, you must first remove it from the configuration."
              values={{
                properties: intl.formatList(propertyNames.map((name, i) => <b key={i}>{name}</b>)),
                count: propertyNames.length,
              }}
            />
          </Box>
        </HStack>
      </Alert>
    );
  },
);

function useConfirmDisableMonitoringDialog() {
  const showDialog = useConfirmDeleteDialog();
  const intl = useIntl();
  return useCallback(async ({ profileCount }: { profileCount: number }) => {
    return await showDialog({
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
              profileCount,
            }}
          />
        </Text>
      ),
      confirmation: intl.formatMessage({
        id: "component.use-confirm-disable-monitoring-dialog.confirm",
        defaultMessage: "confirm",
      }),
      confirm: (
        <Button colorScheme="red" type="submit">
          <FormattedMessage id="generic.deactivate" defaultMessage="Deactivate" />
        </Button>
      ),
    });
  }, []);
}
