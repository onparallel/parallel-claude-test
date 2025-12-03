import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";
import {
  Box,
  Button,
  Center,
  FormControl,
  FormErrorMessage,
  Grid,
  Spinner,
  Stack,
  Text,
} from "@chakra-ui/react";
import { PlusCircleIcon } from "@parallel/chakra/icons";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import {
  useWizardDialog,
  WizardStepDialogProps,
} from "@parallel/components/common/dialogs/WizardDialog";
import { localizableUserTextRender } from "@parallel/components/common/LocalizableUserTextRender";
import { ProfileTypeFieldSelect } from "@parallel/components/common/ProfileTypeFieldSelect";
import { SimpleOption, SimpleSelect } from "@parallel/components/common/SimpleSelect";
import {
  isFieldCompatible,
  PetitionUpdateProfileOnCloseSourceSelect,
  PetitionUpdateProfileOnCloseSourceSelectOptionValue,
} from "@parallel/components/petition-compose/PetitionUpdateProfileOnCloseSourceSelect";
import { Input } from "@parallel/components/ui";
import {
  ConfigureUpdateProfileOnCloseDialog_petitionDocument,
  ConfigureUpdateProfileOnCloseDialog_profileTypeDocument,
  PetitionFieldType,
  PetitionVariableType,
  ProfileTypeFieldType,
  useConfigureUpdateProfileOnCloseDialog_PetitionBaseFragment,
  useConfigureUpdateProfileOnCloseDialog_PetitionFieldFragment,
  useConfigureUpdateProfileOnCloseDialog_PetitionVariableFragment,
  useConfigureUpdateProfileOnCloseDialog_ProfileTypeFieldFragment,
  useConfigureUpdateProfileOnCloseDialog_ProfileTypeFragment,
} from "@parallel/graphql/__types";
import { FieldOptions, UpdateProfileOnClose } from "@parallel/utils/fieldOptions";
import { ProfileTypeFieldOptions } from "@parallel/utils/profileFields";
import { useSetFocusRef } from "@parallel/utils/react-form-hook/useSetFocusRef";
import { Fragment, useEffect, useMemo } from "react";
import { Controller, FormProvider, useFieldArray, useForm, useFormContext } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";
import { components } from "react-select";
import { fromEntries, isNonNullish, isNullish } from "remeda";

const MAX_UPDATES = 20;

type ProfileUpdateWithType =
  | {
      type: "FIELD";
      fieldId: string | null;
      map?: Record<string, string | null>;
    }
  | { type: "VARIABLE_ENUM" | "VARIABLE_NUMBER"; name: string; map?: Record<string, string | null> }
  | { type: "ASK_USER" }
  | { type: "PETITION_METADATA"; name: PetitionMetadata };

type ProfileUpdateType = {
  profileTypeFieldId: string | null;
  source: ProfileUpdateWithType;
};

// VARIABLE_ENUM and VARIABLE_NUMBER needs to be mapped to VARIABLE, _ENUM and _NUMBER are only used in the client side
export const PROFILE_TYPE_FIELD_TO_PETITION_FIELD_TYPE: Record<
  ProfileTypeFieldType,
  (PetitionFieldType | ProfileUpdateWithType["type"])[]
> = {
  TEXT: ["TEXT", "SHORT_TEXT", "SELECT", "CHECKBOX", "VARIABLE_ENUM", "ASK_USER"],
  SHORT_TEXT: ["SHORT_TEXT", "SELECT", "CHECKBOX", "VARIABLE_ENUM", "ASK_USER"],
  NUMBER: ["NUMBER", "VARIABLE_NUMBER", "ASK_USER"],
  PHONE: ["PHONE", "ASK_USER"],
  DATE: ["DATE", "PETITION_METADATA", "ASK_USER"],
  FILE: ["FILE_UPLOAD", "ID_VERIFICATION", "ES_TAX_DOCUMENTS", "DOW_JONES_KYC", "ASK_USER"],
  SELECT: ["SELECT", "VARIABLE_ENUM", "ASK_USER"],
  BACKGROUND_CHECK: ["BACKGROUND_CHECK", "ASK_USER"],
  CHECKBOX: ["CHECKBOX", "ASK_USER"],
  ADVERSE_MEDIA_SEARCH: ["ADVERSE_MEDIA_SEARCH", "ASK_USER"],
  USER_ASSIGNMENT: ["USER_ASSIGNMENT", "ASK_USER"],
};

type PetitionMetadata = "CLOSED_AT";

// Wizard steps definition
type ConfigureUpdateProfileOnCloseDialogSteps = {
  LOADING: {
    petitionId: string;
    profileTypeId: string;
    options?: FieldOptions["FIELD_GROUP"];
  };
  STEP_1: {
    petition: useConfigureUpdateProfileOnCloseDialog_PetitionBaseFragment;
    profileType: useConfigureUpdateProfileOnCloseDialog_ProfileTypeFragment;
    options?: FieldOptions["FIELD_GROUP"];
  };
};

function ConfigureUpdateProfileOnCloseDialogLoading({
  petitionId,
  profileTypeId,
  options,
  onStep,
  ...props
}: WizardStepDialogProps<ConfigureUpdateProfileOnCloseDialogSteps, "LOADING", void>) {
  const { data, loading } = useQuery(ConfigureUpdateProfileOnCloseDialog_petitionDocument, {
    variables: { petitionId },
  });

  const { data: profileTypeData, loading: profileTypeLoading } = useQuery(
    ConfigureUpdateProfileOnCloseDialog_profileTypeDocument,
    {
      variables: { profileTypeId },
    },
  );

  const petition = data?.petition;
  const profileType = profileTypeData?.profileType;

  // Once data is loaded, move to step 1
  useEffect(() => {
    if (!loading && isNonNullish(petition) && !profileTypeLoading && isNonNullish(profileType)) {
      onStep("STEP_1", { petition, profileType, options });
    }
  }, [loading, petition, profileType, onStep]);

  return (
    <ConfirmDialog
      size="3xl"
      hasCloseButton
      header={
        <FormattedMessage
          id="component.configure-update-profile-on-close-dialog.header"
          defaultMessage="Properties of the profile to update"
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
      confirm={
        <Button colorScheme="primary" isDisabled>
          <FormattedMessage id="generic.continue" defaultMessage="Continue" />
        </Button>
      }
      cancel={
        <Button isDisabled>
          <FormattedMessage id="generic.cancel" defaultMessage="Cancel" />
        </Button>
      }
      {...props}
    />
  );
}

type ConfigureUpdateProfileOnCloseDialogFormData = {
  updates: ProfileUpdateType[];
};

function ConfigureUpdateProfileOnCloseDialogStep1({
  petition,
  profileType,
  options,
  onStep,
  ...props
}: WizardStepDialogProps<
  ConfigureUpdateProfileOnCloseDialogSteps,
  "STEP_1",
  { updates: UpdateProfileOnClose[] }
>) {
  const form = useForm<ConfigureUpdateProfileOnCloseDialogFormData>({
    mode: "onSubmit",
    defaultValues: {
      updates: isNonNullish(options?.updateProfileOnClose)
        ? mapDefaultValues(options.updateProfileOnClose, petition)
        : [
            {
              profileTypeFieldId: null,
              source: {
                type: "FIELD",
                fieldId: null,
              },
            },
          ],
    },
  });

  const { control, setFocus } = form;

  const { fields, append, remove } = useFieldArray({
    control,
    name: "updates",
  });

  const handleAddUpdate = () => {
    append({
      profileTypeFieldId: null,
      source: { type: "FIELD", fieldId: null },
    });
  };

  return (
    <ConfirmDialog
      size="3xl"
      hasCloseButton
      initialFocusRef={useSetFocusRef(setFocus, "updates.0.profileTypeFieldId")}
      content={{
        containerProps: {
          as: "form",
          onSubmit: form.handleSubmit((data) => {
            const resolveSource = (
              source: ProfileUpdateWithType,
            ): UpdateProfileOnClose["source"] => {
              switch (source.type) {
                case "VARIABLE_ENUM":
                case "VARIABLE_NUMBER":
                  return {
                    ...source,
                    type: "VARIABLE",
                  };
                case "FIELD":
                  return {
                    ...source,
                    fieldId: source.fieldId!,
                    type: "FIELD",
                  };
                case "PETITION_METADATA":
                  return {
                    name: source.name,
                    type: "PETITION_METADATA",
                  };
                case "ASK_USER":
                  return {
                    type: "ASK_USER",
                  };
                default:
                  return source;
              }
            };

            const mappedUpdates = data.updates.map((update) => {
              return {
                profileTypeFieldId: update.profileTypeFieldId!,
                source: resolveSource(update.source),
              };
            });

            props.onResolve({ updates: mappedUpdates });
          }),
        },
      }}
      header={
        <FormattedMessage
          id="component.configure-update-profile-on-close-dialog.header"
          defaultMessage="Properties of the profile to update"
        />
      }
      body={
        <Stack spacing={2}>
          <Text paddingBottom={2}>
            <FormattedMessage
              id="component.configure-update-profile-on-close-dialog.body"
              defaultMessage="Select the properties of the profile to update when the parallel is closed."
            />
          </Text>
          <FormProvider {...form}>
            <Stack>
              {fields.map(({ id }, index) => (
                <UpdatePropertyCard
                  key={id}
                  index={index}
                  fieldsLength={fields.length}
                  profileType={profileType}
                  petition={petition}
                  onRemove={() => remove(index)}
                />
              ))}
            </Stack>
          </FormProvider>
          <Box>
            <Button
              leftIcon={<PlusCircleIcon />}
              fontSize="md"
              size="sm"
              fontWeight={400}
              onClick={handleAddUpdate}
              isDisabled={fields.length >= MAX_UPDATES}
            >
              <FormattedMessage
                id="component.configure-update-profile-on-close-dialog.add-property-button"
                defaultMessage="Add property"
              />
            </Button>
          </Box>
        </Stack>
      }
      confirm={
        <Button colorScheme="primary" type="submit">
          <FormattedMessage id="generic.save" defaultMessage="Save" />
        </Button>
      }
      cancel={
        <Button type="button" onClick={() => props.onReject()}>
          <FormattedMessage id="generic.cancel" defaultMessage="Cancel" />
        </Button>
      }
      alternative={
        isNonNullish(options?.updateProfileOnClose) ? (
          <Button
            type="submit"
            colorScheme="red"
            variant="outline"
            onClick={() => props.onReject("REMOVE_SETTING")}
          >
            <FormattedMessage id="generic.remove-setting" defaultMessage="Remove setting" />
          </Button>
        ) : null
      }
      {...props}
    />
  );
}

interface UpdatePropertyCardProps {
  index: number;
  fieldsLength: number;
  profileType: useConfigureUpdateProfileOnCloseDialog_ProfileTypeFragment;
  petition: useConfigureUpdateProfileOnCloseDialog_PetitionBaseFragment;
  onRemove: () => void;
}

function UpdatePropertyCard({
  index,
  fieldsLength,
  profileType,
  petition,
  onRemove,
}: UpdatePropertyCardProps) {
  const intl = useIntl();
  const {
    control,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<ConfigureUpdateProfileOnCloseDialogFormData>();
  const update = watch(`updates.${index}`);
  const profileTypeFieldId = update?.profileTypeFieldId;
  const petitionFieldId = update?.source?.type === "FIELD" ? update.source.fieldId : null;
  const variable =
    update?.source?.type === "VARIABLE_ENUM" || update?.source?.type === "VARIABLE_NUMBER"
      ? petition.variables.find(
          (v) =>
            (update.source.type === "VARIABLE_ENUM" || update.source.type === "VARIABLE_NUMBER") &&
            v.name === update.source.name,
        )
      : null;
  const profileTypeField = profileType.fields.find((f) => f.id === profileTypeFieldId);
  const allPetitionFields = useMemo(
    () => petition.fields.flatMap((f) => [f, ...(f.children ?? [])]),
    [petition],
  );
  const petitionField = allPetitionFields.find((f) => f.id === petitionFieldId);

  const showSelectMapping = isSelectMappingCompatible(
    profileTypeField,
    petitionField,
    variable?.type,
  );

  const isSourceCompatible = ({
    profileTypeField,
    source,
  }: {
    profileTypeField: useConfigureUpdateProfileOnCloseDialog_ProfileTypeFieldFragment;
    source: ProfileUpdateWithType;
  }) => {
    if (source.type === "FIELD") {
      const petitionField = allPetitionFields.find((f) => f.id === source.fieldId);
      return isNonNullish(petitionField) && isFieldCompatible(profileTypeField, petitionField);
    } else {
      return PROFILE_TYPE_FIELD_TO_PETITION_FIELD_TYPE[
        profileTypeField.type as ProfileTypeFieldType
      ].includes(source.type);
    }
  };

  return (
    <Stack
      paddingX={4}
      paddingY={3}
      border="1px solid"
      borderRadius="md"
      borderColor="gray.200"
      backgroundColor="gray.50"
    >
      <Grid templateColumns="auto 1fr" gap={2}>
        <Text alignSelf="center" marginEnd={4}>
          <FormattedMessage
            id="component.configure-update-profile-on-close-dialog.complete-label"
            defaultMessage="Complete"
          />
        </Text>
        <FormControl flex="1" isInvalid={isNonNullish(errors.updates?.[index]?.profileTypeFieldId)}>
          <Controller
            name={`updates.${index}.profileTypeFieldId`}
            control={control}
            rules={{
              required: true,
              validate: {
                isUnique: (value) => {
                  const updates = watch("updates");
                  return updates
                    .filter((_, i) => i !== index)
                    .some((update) => update.profileTypeFieldId === value)
                    ? intl.formatMessage({
                        id: "component.configure-update-profile-on-close-dialog.field-already-in-use",
                        defaultMessage: "This field is already in use",
                      })
                    : true;
                },
              },
            }}
            render={({ field }) => {
              return (
                <ProfileTypeFieldSelect
                  ref={field.ref}
                  fields={profileType.fields}
                  value={profileType.fields.find((f) => f.id === field.value) ?? null}
                  onChange={(v) => {
                    if (isNonNullish(v)) {
                      const profileTypeField = profileType.fields.find((f) => f.id === v.id);
                      if (isNonNullish(profileTypeField)) {
                        if (
                          isSourceCompatible({
                            profileTypeField,
                            source: watch(`updates.${index}.source`),
                          }) === false
                        ) {
                          setValue(`updates.${index}.source`, { type: "FIELD", fieldId: null });
                        }
                      }
                    }
                    field.onChange(v?.id ?? null);
                  }}
                  isTooltipDisabled={true}
                />
              );
            }}
          />
          <FormErrorMessage>
            {errors.updates?.[index]?.profileTypeFieldId?.message}
          </FormErrorMessage>
        </FormControl>

        <Text alignSelf="center" marginEnd={4}>
          <FormattedMessage
            id="component.configure-update-profile-on-close-dialog.with-label"
            defaultMessage="with"
          />
        </Text>
        <FormControl flex="1" isInvalid={isNonNullish(errors.updates?.[index]?.source)}>
          <Controller
            name={`updates.${index}.source`}
            control={control}
            rules={{
              required: true,
              validate: (value) => {
                if (value.type === "FIELD") {
                  return isNonNullish(value.fieldId) ? true : false;
                } else if (value.type === "VARIABLE_ENUM" || value.type === "VARIABLE_NUMBER") {
                  return isNonNullish(value.name) ? true : false;
                } else if (value.type === "PETITION_METADATA") {
                  return isNonNullish(value.name) ? true : false;
                }
                return true;
              },
            }}
            render={({ field }) => {
              let currentValue: PetitionUpdateProfileOnCloseSourceSelectOptionValue<
                typeof petition
              > | null = null;

              if (field.value.type === "FIELD") {
                const petitionFieldValue = field.value as {
                  type: "FIELD";
                  fieldId: string | null;
                };
                const foundField = allPetitionFields.find(
                  (f) => f.id === petitionFieldValue.fieldId,
                );
                if (foundField) {
                  currentValue = { type: "FIELD" as const, field: foundField };
                }
              } else {
                currentValue = field.value;
              }

              return (
                <PetitionUpdateProfileOnCloseSourceSelect
                  key={profileTypeFieldId}
                  placeholder={intl.formatMessage({
                    id: "component.configure-update-profile-on-close-dialog.select-source-placeholder",
                    defaultMessage: "Select a source",
                  })}
                  isDisabled={isNullish(profileTypeField)}
                  petition={petition}
                  value={currentValue}
                  profileTypeField={profileTypeField}
                  onChange={(v) => {
                    if (!v) {
                      field.onChange({
                        type: "FIELD",
                        fieldId: null,
                      });
                      return;
                    }

                    if (v.type === "FIELD") {
                      field.onChange({
                        type: "FIELD",
                        fieldId: v.field.id ?? null,
                      });
                    } else if (
                      v.type === "VARIABLE_ENUM" ||
                      v.type === "VARIABLE_NUMBER" ||
                      v.type === "PETITION_METADATA"
                    ) {
                      field.onChange({
                        type: v.type,
                        name: v.name,
                      });
                    } else if (v.type === "ASK_USER") {
                      field.onChange({
                        type: "ASK_USER",
                      });
                    }
                  }}
                />
              );
            }}
          />
        </FormControl>
      </Grid>
      {isNonNullish(profileTypeField) && showSelectMapping ? (
        <UpdatePropertySelectMapping
          index={index}
          petitionField={petitionField}
          profileTypeField={profileTypeField}
          variable={variable}
        />
      ) : null}
      <Box alignSelf="flex-end">
        <Button
          colorScheme="red"
          size="sm"
          fontSize="md"
          fontWeight={400}
          variant="ghost"
          onClick={onRemove}
          isDisabled={fieldsLength === 1}
        >
          <FormattedMessage
            id="component.configure-update-profile-on-close-dialog.remove-property-button"
            defaultMessage="Remove property"
          />
        </Button>
      </Box>
    </Stack>
  );
}

const mapDefaultValues = (
  data: UpdateProfileOnClose[],
  petition: useConfigureUpdateProfileOnCloseDialog_PetitionBaseFragment,
): ProfileUpdateType[] => {
  return data.map((update): ProfileUpdateType => {
    const type =
      update.source.type === "VARIABLE"
        ? petition.variables.find(
            (v) => update.source.type === "VARIABLE" && v.name === update.source.name,
          )?.type === "ENUM"
          ? "VARIABLE_ENUM"
          : "VARIABLE_NUMBER"
        : update.source.type;

    return {
      profileTypeFieldId: update.profileTypeFieldId,
      source: {
        ...update.source,
        type,
      } as ProfileUpdateWithType,
    };
  });
};

function isSelectMappingCompatible(
  profileTypeField?: useConfigureUpdateProfileOnCloseDialog_ProfileTypeFieldFragment,
  petitionField?: useConfigureUpdateProfileOnCloseDialog_PetitionFieldFragment,
  variableType?: PetitionVariableType | null,
) {
  if (isNullish(profileTypeField)) {
    return false;
  }

  if (
    isNonNullish(variableType) &&
    variableType === "ENUM" &&
    (profileTypeField.type === "SELECT" || profileTypeField.type === "CHECKBOX")
  ) {
    return true;
  }

  if (isNullish(petitionField)) {
    return false;
  }

  const isTheSameField =
    isNonNullish(petitionField.profileTypeField) &&
    profileTypeField.id === petitionField.profileTypeField.id;

  return (
    (profileTypeField.type === "SELECT" || profileTypeField.type === "CHECKBOX") &&
    isFieldCompatible(profileTypeField, petitionField) &&
    isNullish(petitionField.options?.standardList) &&
    !isTheSameField
  );
}

interface UpdatePropertySelectMappingProps {
  index: number;
  profileTypeField: useConfigureUpdateProfileOnCloseDialog_ProfileTypeFieldFragment;
  petitionField?: useConfigureUpdateProfileOnCloseDialog_PetitionFieldFragment;
  variable?: useConfigureUpdateProfileOnCloseDialog_PetitionVariableFragment | null;
}

function UpdatePropertySelectMapping({
  index,
  profileTypeField,
  petitionField,
  variable,
}: UpdatePropertySelectMappingProps) {
  const intl = useIntl();
  const { control, setValue, watch } =
    useFormContext<ConfigureUpdateProfileOnCloseDialogFormData>();
  const currentMap = watch(`updates.${index}.source.map`);
  const isVariable = isNonNullish(variable) && variable.__typename === "PetitionVariableEnum";
  const profileTypeFieldOptions = profileTypeField.options as ProfileTypeFieldOptions<"SELECT">;
  const options = isNonNullish(petitionField)
    ? petitionField.type === "SELECT"
      ? (petitionField.options as FieldOptions["SELECT"]).values.map((o, i) => ({
          value: o,
          label: (petitionField.options as FieldOptions["SELECT"]).labels?.[i] ?? o,
        }))
      : []
    : isVariable
      ? variable.valueLabels.map((o) => ({
          value: o.value,
          label: o.label,
        }))
      : [];

  const propertyOptions = useMemo(
    () =>
      (
        profileTypeFieldOptions.values.map((o) => ({
          value: o.value,
          label: localizableUserTextRender({
            intl,
            value: o.label,
            default: o.value,
          }),
        })) as Array<SimpleOption<string> | { label: string; options: SimpleOption<string>[] }>
      ).concat([
        {
          label: intl.formatMessage({
            id: "component.configure-update-profile-on-close-dialog.select-mapping-other-option-label",
            defaultMessage: "Others",
          }),
          options: [
            {
              label: intl.formatMessage({
                id: "component.configure-update-profile-on-close-dialog.select-mapping-keep-current-option-label",
                defaultMessage: "Keep current value",
              }),
              value: "-KEEP",
              type: "OTHER",
            },
            {
              label: intl.formatMessage({
                id: "component.configure-update-profile-on-close-dialog.select-mapping-delete-current-option-label",
                defaultMessage: "Delete current value",
              }),
              value: "-DELETE",
              type: "OTHER",
            },
          ],
        },
      ]),
    [profileTypeField.id, profileTypeFieldOptions.values, intl.locale],
  );

  //Check if the map has options that can be autocompleted
  useEffect(() => {
    if (isNonNullish(currentMap)) {
      return;
    }
    const map = fromEntries(
      options.map(({ value, label }) => {
        const compatibleOption = propertyOptions.find(
          (o): o is SimpleOption<string> =>
            ("value" in o && (o.value === value || o.label === value)) ||
            ("label" in o && o.label === label),
        );
        if (isNonNullish(compatibleOption)) {
          return [value, compatibleOption.value];
        }
        return [value, null];
      }),
    );
    setValue(`updates.${index}.source.map`, map);
  }, [currentMap, profileTypeField, petitionField?.id, variable?.name, index, setValue]);

  return (
    <Grid
      templateColumns="1fr 1fr"
      gap={2}
      backgroundColor="purple.75"
      padding={3}
      borderRadius="md"
    >
      <Text>
        {isVariable ? (
          <FormattedMessage
            id="component.configure-update-profile-on-close-dialog.select-mapping-variable-options-label"
            defaultMessage="Variable options"
          />
        ) : (
          <FormattedMessage
            id="component.configure-update-profile-on-close-dialog.select-mapping-field-options-label"
            defaultMessage="Field options"
          />
        )}
      </Text>
      <Text>
        <FormattedMessage
          id="component.configure-update-profile-on-close-dialog.select-mapping-property-options-label"
          defaultMessage="Property options"
        />
      </Text>
      {options.map(({ label, value }) => (
        <Fragment key={value}>
          <Input
            value={label || value}
            disabled
            opacity={1}
            _disabled={{
              backgroundColor: "white",
              opacity: 1,
              color: "gray.500",
              cursor: "not-allowed",
            }}
          />
          <FormControl>
            <Controller
              shouldUnregister={true}
              name={`updates.${index}.source.map.${value}`}
              control={control}
              render={({ field }) => {
                return (
                  <SimpleSelect
                    value={field.value}
                    onChange={(v) => {
                      field.onChange(v);
                    }}
                    options={propertyOptions}
                    isClearable
                    components={{ SingleValue: FormatSingleValue, Option: FormatOption }}
                  />
                );
              }}
            />
          </FormControl>
        </Fragment>
      ))}
    </Grid>
  );
}

const FormatSingleValue: typeof components.SingleValue = function FormatSingleValue(props) {
  const { label, type } = props.data as unknown as { label: string; type?: "OTHER" };

  return (
    <components.SingleValue {...props}>
      <Text as="span" fontWeight={type === "OTHER" ? 500 : 400}>
        {label}
      </Text>
    </components.SingleValue>
  );
};

const FormatOption: typeof components.Option = function FormatOption(props) {
  const { label, type } = props.data as unknown as { label: string; type?: "OTHER" };
  return (
    <components.Option {...props}>
      <Text as="span" fontWeight={type === "OTHER" ? 500 : 400}>
        {label}
      </Text>
    </components.Option>
  );
};

export function useConfigureUpdateProfileOnCloseDialog() {
  return useWizardDialog(
    {
      LOADING: ConfigureUpdateProfileOnCloseDialogLoading,
      STEP_1: ConfigureUpdateProfileOnCloseDialogStep1,
    },
    "LOADING",
  );
}

useConfigureUpdateProfileOnCloseDialog.fragments = {
  get PetitionField() {
    return gql`
      fragment useConfigureUpdateProfileOnCloseDialog_PetitionField on PetitionField {
        id
        type
        options
        multiple
        parent {
          id
          multiple
        }
        profileTypeField {
          id
          type
        }
      }
    `;
  },
  get PetitionVariable() {
    return gql`
      fragment useConfigureUpdateProfileOnCloseDialog_PetitionVariable on PetitionVariable {
        name
        type
        ... on PetitionVariableEnum {
          valueLabels {
            value
            label
          }
        }
      }
    `;
  },
  get PetitionBase() {
    return gql`
      fragment useConfigureUpdateProfileOnCloseDialog_PetitionBase on PetitionBase {
        id
        fields {
          id
          ...useConfigureUpdateProfileOnCloseDialog_PetitionField
          children {
            id
            ...useConfigureUpdateProfileOnCloseDialog_PetitionField
          }
        }
        variables {
          ...useConfigureUpdateProfileOnCloseDialog_PetitionVariable
        }
        ...PetitionUpdateProfileOnCloseSourceSelect_PetitionBase
      }
      ${this.PetitionField}
      ${this.PetitionVariable}
      ${PetitionUpdateProfileOnCloseSourceSelect.fragments.PetitionBase}
    `;
  },
  get ProfileTypeField() {
    return gql`
      fragment useConfigureUpdateProfileOnCloseDialog_ProfileTypeField on ProfileTypeField {
        id
        options
        ...ProfileTypeFieldSelect_ProfileTypeField
        ...PetitionUpdateProfileOnCloseSourceSelect_ProfileTypeField
      }
      ${ProfileTypeFieldSelect.fragments.ProfileTypeField}
      ${PetitionUpdateProfileOnCloseSourceSelect.fragments.ProfileTypeField}
    `;
  },
  get ProfileType() {
    return gql`
      fragment useConfigureUpdateProfileOnCloseDialog_ProfileType on ProfileType {
        id
        fields {
          id
          ...useConfigureUpdateProfileOnCloseDialog_ProfileTypeField
        }
      }
      ${this.ProfileTypeField}
    `;
  },
};

const _queries = [
  gql`
    query ConfigureUpdateProfileOnCloseDialog_petition($petitionId: GID!) {
      petition(id: $petitionId) {
        id
        ...useConfigureUpdateProfileOnCloseDialog_PetitionBase
      }
    }
    ${useConfigureUpdateProfileOnCloseDialog.fragments.PetitionBase}
  `,
  gql`
    query ConfigureUpdateProfileOnCloseDialog_profileType($profileTypeId: GID!) {
      profileType(profileTypeId: $profileTypeId) {
        id
        ...useConfigureUpdateProfileOnCloseDialog_ProfileType
      }
    }
    ${useConfigureUpdateProfileOnCloseDialog.fragments.ProfileType}
  `,
];
