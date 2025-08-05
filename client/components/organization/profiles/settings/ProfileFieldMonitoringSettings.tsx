import { gql } from "@apollo/client";
import {
  Box,
  Center,
  Checkbox,
  Flex,
  FormControl,
  FormHelperText,
  FormLabel,
  HStack,
  Stack,
  Switch,
  Text,
} from "@chakra-ui/react";
import { HelpPopover } from "@parallel/components/common/HelpPopover";
import {
  LocalizableUserTextRender,
  localizableUserTextRender,
} from "@parallel/components/common/LocalizableUserTextRender";
import { ProfileTypeFieldSelect } from "@parallel/components/common/ProfileTypeFieldSelect";
import {
  SimpleOption,
  SimpleSelect,
  useSimpleSelectOptions,
} from "@parallel/components/common/SimpleSelect";
import {
  CreateProfileTypeFieldInput,
  ProfileFieldMonitoringSettings_ProfileTypeFieldFragment,
  ProfileFieldMonitoringSettings_ProfileTypeFragment,
  ProfileTypeFieldType,
} from "@parallel/graphql/__types";
import { ProfileTypeFieldOptions } from "@parallel/utils/profileFields";
import { Maybe } from "@parallel/utils/types";
import { useEffect, useState } from "react";
import { Controller, useFieldArray, useFormContext } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";
import { isNonNullish } from "remeda";
import {
  CreateOrUpdateProfileTypeFieldDialogData,
  useCreateOrUpdateProfileTypeFieldDialog,
} from "../dialogs/CreateOrUpdateProfileTypeFieldDialog";

type FrequencyFixedOption =
  | "5_YEARS"
  | "3_YEARS"
  | "2_YEARS"
  | "1_YEARS"
  | "9_MONTHS"
  | "6_MONTHS"
  | "3_MONTHS"
  | "1_MONTHS"
  | "1_DAYS";

export interface IProfileFieldMonitoringSettings {
  hasMonitoring?: boolean;
  monitoring?: Maybe<{
    activationCondition?: Maybe<{
      profileTypeFieldId: string;
      values: string[];
    }>;
    searchFrequency:
      | {
          type: "FIXED";
          frequency: FrequencyFixedOption;
        }
      | {
          type: "VARIABLE";
          profileTypeFieldId: string;
          options: {
            frequency: FrequencyFixedOption;
            value: string;
          }[];
        };
  }>;
}

const SUGGESTED_BUSINESS_RELATIONSHIP = {
  type: "SELECT",
  name: {
    es: "Relación de negocio",
    en: "Business relationship",
  },
  options: {
    values: [
      {
        label: {
          es: "Relación continuada",
          en: "Ongoing relationship",
        },
        color: "#E2E8F0",
        value: "relationship",
      },
      {
        label: {
          es: "Transacción puntual",
          en: "One-time transaction",
        },
        color: "#E2E8F0",
        value: "transaction",
      },
    ],
  },
} as CreateProfileTypeFieldInput;

const SUGGESTED_RISK_LEVEL = {
  type: "SELECT",
  name: {
    es: "Nivel de riesgo",
    en: "Risk level",
  },
  options: {
    showOptionsWithColors: true,
    values: [
      {
        value: "HIGH",
        label: { en: "High", es: "Alto" },
        color: "#FED7D7",
      },
      {
        value: "MEDIUM_HIGH",
        label: { en: "Medium-high", es: "Medio-alto" },
        color: "#FEEBC8",
      },
      {
        value: "MEDIUM",
        label: { en: "Medium", es: "Medio" },
        color: "#F5EFE8",
      },
      {
        value: "MEDIUM_LOW",
        label: { en: "Medium-low", es: "Medio-bajo" },
        color: "#CEEDFF",
      },
      {
        value: "LOW",
        label: { en: "Low", es: "Bajo" },
        color: "#D5E7DE",
      },
    ],
  },
} as CreateProfileTypeFieldInput;

export function ProfileFieldMonitoringSettings({
  profileFieldType,
  profileType,
  isDisabled,
}: {
  profileFieldType: ProfileTypeFieldType;
  profileType: ProfileFieldMonitoringSettings_ProfileTypeFragment;
  isDisabled?: boolean;
}) {
  const intl = useIntl();

  const [profileTypeFields, setProfileTypeFields] = useState(profileType.fields);
  const hasRiskProperty = profileTypeFields.some(
    (f) =>
      f.type === "SELECT" &&
      (f.alias === "p_risk" || f.name.en === "Risk level" || f.name.es === "Nivel de riesgo"),
  );
  const hasBusinessRelationshipProperty = profileTypeFields.some(
    (f) =>
      f.type === "SELECT" &&
      (f.name.en === "Business relationship" || f.name.es === "Relación de negocio"),
  );
  const {
    register,
    watch,
    control,
    formState: { errors },
    setValue,
  } = useFormContext<CreateOrUpdateProfileTypeFieldDialogData>();
  const hasMonitoring = watch("options.hasMonitoring");
  const monitoring = watch("options.monitoring");
  const hasActivationCondition = isNonNullish(monitoring?.activationCondition);

  function handleActivationConditionChange(event: React.ChangeEvent<HTMLInputElement>) {
    setValue(
      "options.monitoring.activationCondition",
      event.target.checked
        ? {
            profileTypeFieldId: profileTypeFields.find((f) => f.type === "SELECT")?.id ?? "",
            values: [],
          }
        : null,
    );
  }

  const conditionalField = profileTypeFields.find(
    (f) => f.id === monitoring?.activationCondition?.profileTypeFieldId,
  );

  const conditionalFieldOptions = useSimpleSelectOptions(
    (intl) => {
      if (!conditionalField) {
        return [];
      }
      return (conditionalField!.options as ProfileTypeFieldOptions<"SELECT">).values.map(
        ({ label, value }) => ({
          label: localizableUserTextRender({
            value: label,
            intl,
            default: intl.formatMessage({
              id: "generic.unnamed-profile-type-field",
              defaultMessage: "Unnamed property",
            }),
          }),
          value,
        }),
      );
    },
    [conditionalField?.id],
  );

  const searchFrequencyProfileField = profileTypeFields.find(
    (f) =>
      f.id ===
      (monitoring?.searchFrequency.type === "VARIABLE"
        ? monitoring.searchFrequency.profileTypeFieldId
        : null),
  );

  const searchFrequencyTypes = useSimpleSelectOptions(
    (intl) => [
      {
        label: intl.formatMessage({
          id: "component.profile-field-monitoring-settings.fixed-search-frequency",
          defaultMessage: "Fixed",
        }),
        value: "FIXED",
      },
      {
        label: intl.formatMessage({
          id: "component.profile-field-monitoring-settings.variable-search-frequency",
          defaultMessage: "Based on options",
        }),
        value: "VARIABLE",
      },
    ],
    [],
  );

  const searchFrequencyFixedOptions = useSimpleSelectOptions<FrequencyFixedOption>(
    (intl) => [
      ...([5, 3, 2, 1] as const).map((count) => ({
        value: `${count}_YEARS` as const,
        label: intl.formatMessage(
          {
            id: "generic.n-years",
            defaultMessage: "{count, plural, =1 {1 year} other {# years}}",
          },
          { count },
        ),
      })),
      ...([9, 6, 3, 1] as const).map((count) => ({
        value: `${count}_MONTHS` as const,
        label: intl.formatMessage(
          {
            id: "generic.n-months",
            defaultMessage: "{count, plural, =1 {1 month} other {# months}}",
          },
          { count },
        ),
      })),
      ...([1] as const).map((count) => ({
        value: `${count}_DAYS` as const,
        label: intl.formatMessage(
          {
            id: "generic.n-days",
            defaultMessage: "{count, plural, =1 {1 day} other {# days}}",
          },
          { count },
        ),
      })),
    ],
    [],
  );

  const showCreateOrUpdateProfileTypeFieldDialog = useCreateOrUpdateProfileTypeFieldDialog();

  const getDefaultSelectProfileField = (name: string) =>
    ({
      type: "SELECT",
      name: {
        [intl.locale]: name,
      },
      options: {
        values: [{ color: "#E2E8F0", label: { [intl.locale]: "" }, value: "" }],
        showOptionsWithColors: false,
      },
    }) as CreateProfileTypeFieldInput;

  return (
    <Stack spacing={4}>
      <FormControl as={HStack} isDisabled={isDisabled}>
        <Stack flex={1} spacing={1}>
          <FormLabel margin={0}>
            <FormattedMessage
              id="component.profile-field-monitoring-settings.monitoring-label"
              defaultMessage="Ongoing Monitoring"
            />
          </FormLabel>
          <FormHelperText margin={0}>
            <FormattedMessage
              id="component.profile-field-monitoring-settings.monitoring-description"
              defaultMessage="Monitor search results to detect relevant changes."
            />
          </FormHelperText>
        </Stack>
        <Center>
          <Switch {...register("options.hasMonitoring")} />
        </Center>
      </FormControl>
      {hasMonitoring ? (
        <>
          <Stack>
            <FormControl isDisabled={isDisabled}>
              <Checkbox
                onChange={handleActivationConditionChange}
                isChecked={hasActivationCondition}
              >
                <HStack alignItems="center" spacing={0}>
                  <FormattedMessage
                    id="component.profile-field-monitoring-settings.activation-conditions-label"
                    defaultMessage="Add activation conditions"
                  />
                  <HelpPopover>
                    <FormattedMessage
                      id="component.profile-field-monitoring-settings.activation-conditions-help"
                      defaultMessage="Add conditions to enable or disable monitoring based on replies in another property. For instance, depending on the type of relationship with the customer."
                    />
                  </HelpPopover>
                </HStack>
              </Checkbox>
            </FormControl>
            {hasActivationCondition ? (
              <Stack background="gray.100" paddingX={3} paddingY={2}>
                <HStack>
                  <Text as="span" whiteSpace="nowrap">
                    <FormattedMessage
                      id="component.profile-field-monitoring-settings.activate-when"
                      defaultMessage="Activate when"
                    />
                  </Text>
                  <FormControl
                    isInvalid={
                      !!errors.options?.monitoring?.activationCondition?.profileTypeFieldId
                    }
                    isDisabled={isDisabled}
                  >
                    <Controller
                      name="options.monitoring.activationCondition.profileTypeFieldId"
                      control={control}
                      rules={{ required: true }}
                      render={({ field: { value, onChange } }) => (
                        <ProfileTypeFieldSelect
                          filterFields={(f) => f.type === "SELECT"}
                          onCreateProperty={async (name, isSuggested) => {
                            try {
                              const profileTypeField =
                                await showCreateOrUpdateProfileTypeFieldDialog({
                                  profileType: profileType as any,
                                  profileTypeField: isSuggested
                                    ? SUGGESTED_BUSINESS_RELATIONSHIP
                                    : getDefaultSelectProfileField(name),
                                  disableFieldTypeSelect: true,
                                });
                              setProfileTypeFields((profileTypeFields) => [
                                ...profileTypeFields,
                                profileTypeField,
                              ]);
                              onChange(profileTypeField.id);
                            } catch {}
                          }}
                          suggestedPropertyName={
                            hasBusinessRelationshipProperty
                              ? undefined
                              : intl.formatMessage({
                                  id: "component.profile-field-monitoring-settings.business-relationship",
                                  defaultMessage: "Business relationship",
                                })
                          }
                          fields={profileTypeFields}
                          value={profileTypeFields.find((f) => f.id === value) ?? null}
                          onChange={(field) => {
                            onChange(field?.id ?? null);
                          }}
                        />
                      )}
                    />
                  </FormControl>
                </HStack>
                <HStack>
                  <Text as="span" whiteSpace="nowrap">
                    <FormattedMessage
                      id="component.profile-field-monitoring-settings.is-one-of"
                      defaultMessage="is one of"
                    />
                  </Text>
                  <Box flex="1" minW={0}>
                    <FormControl
                      isDisabled={conditionalFieldOptions.length === 0 || isDisabled}
                      isInvalid={
                        !!errors.options?.monitoring?.activationCondition?.values &&
                        conditionalFieldOptions.length > 0
                      }
                    >
                      <Controller
                        name="options.monitoring.activationCondition.values"
                        control={control}
                        rules={{ required: true }}
                        render={({ field }) => (
                          <SimpleSelect
                            options={conditionalFieldOptions}
                            isMulti
                            placeholder={intl.formatMessage({
                              id: "generic.select-an-option",
                              defaultMessage: "Select an option",
                            })}
                            {...field}
                          />
                        )}
                      />
                    </FormControl>
                  </Box>
                </HStack>
              </Stack>
            ) : null}
          </Stack>
          <Stack>
            <HStack align="flex-end">
              <FormControl
                isInvalid={!!errors.options?.monitoring?.searchFrequency?.type}
                isDisabled={isDisabled}
              >
                <Flex alignItems="center" marginBottom={2}>
                  <FormLabel fontWeight={400} margin={0}>
                    <FormattedMessage
                      id="component.profile-field-monitoring-settings.search-frequency-label"
                      defaultMessage="Search frequency"
                    />
                  </FormLabel>
                  <HelpPopover>
                    {profileFieldType === "ADVERSE_MEDIA_SEARCH" ? (
                      <FormattedMessage
                        id="component.profile-field-monitoring-settings.search-frequency-help-adverse-media-search"
                        defaultMessage="Indicate how often you want the news to be monitored. You can choose a fixed frequency or a variable frequency based on the option selected in another property. For instance, adjusting the frequency based on the client's risk."
                      />
                    ) : (
                      <FormattedMessage
                        id="component.profile-field-monitoring-settings.search-frequency-help"
                        defaultMessage="Indicate how often you want each profile to be monitored. You can choose a fixed frequency or a variable frequency based on the option selected in another property. For instance, adjusting the frequency based on the client's risk."
                      />
                    )}
                  </HelpPopover>
                </Flex>
                <Controller
                  name="options.monitoring.searchFrequency.type"
                  defaultValue="FIXED"
                  control={control}
                  rules={{ required: true }}
                  render={({ field }) => <SimpleSelect options={searchFrequencyTypes} {...field} />}
                />
              </FormControl>
              {monitoring?.searchFrequency.type !== "VARIABLE" ? (
                <FormControl
                  isInvalid={!!(errors.options?.monitoring?.searchFrequency as any)?.frequency}
                  isDisabled={isDisabled}
                >
                  <Controller
                    name="options.monitoring.searchFrequency.frequency"
                    defaultValue="3_YEARS"
                    control={control}
                    rules={{ required: true }}
                    shouldUnregister={true}
                    render={({ field }) => (
                      <SimpleSelect
                        {...field}
                        options={searchFrequencyFixedOptions}
                        value={field.value ?? null}
                      />
                    )}
                  />
                </FormControl>
              ) : null}
            </HStack>
            {monitoring?.searchFrequency.type === "VARIABLE" ? (
              <>
                <FormControl
                  isInvalid={
                    !!(errors.options?.monitoring?.searchFrequency as any)?.profileTypeFieldId
                  }
                  isDisabled={isDisabled}
                >
                  <Controller
                    name="options.monitoring.searchFrequency.profileTypeFieldId"
                    control={control}
                    rules={{ required: true }}
                    shouldUnregister={true}
                    render={({ field: { value, onChange } }) => (
                      <ProfileTypeFieldSelect
                        filterFields={(f) => f.type === "SELECT"}
                        onCreateProperty={async (name, isSuggested) => {
                          try {
                            const profileTypeField = await showCreateOrUpdateProfileTypeFieldDialog(
                              {
                                profileType: profileType as any,
                                profileTypeField: isSuggested
                                  ? SUGGESTED_RISK_LEVEL
                                  : getDefaultSelectProfileField(name),
                                disableFieldTypeSelect: true,
                              },
                            );
                            setProfileTypeFields((profileTypeFields) => [
                              ...profileTypeFields,
                              profileTypeField,
                            ]);
                            onChange(profileTypeField.id);
                          } catch {}
                        }}
                        suggestedPropertyName={
                          hasRiskProperty
                            ? undefined
                            : intl.formatMessage({
                                id: "component.profile-field-monitoring-settings.risk-level",
                                defaultMessage: "Risk level",
                              })
                        }
                        fields={profileTypeFields}
                        value={profileTypeFields.find((f) => f.id === value) ?? null}
                        onChange={(field) => {
                          onChange(field?.id ?? null);
                        }}
                      />
                    )}
                  />
                </FormControl>
                {searchFrequencyProfileField ? (
                  <SearchFrequencyOptions
                    searchFrequencyProfileField={searchFrequencyProfileField}
                    searchFrequencyFixedOptions={searchFrequencyFixedOptions}
                    isDisabled={isDisabled}
                  />
                ) : null}
              </>
            ) : null}
          </Stack>
        </>
      ) : null}
    </Stack>
  );
}

function SearchFrequencyOptions({
  searchFrequencyProfileField,
  searchFrequencyFixedOptions,
  isDisabled,
}: {
  searchFrequencyProfileField: ProfileFieldMonitoringSettings_ProfileTypeFieldFragment;
  searchFrequencyFixedOptions: SimpleOption<FrequencyFixedOption>[];
  isDisabled?: boolean;
}) {
  const intl = useIntl();
  const {
    control,
    formState: { errors },
  } = useFormContext<CreateOrUpdateProfileTypeFieldDialogData>();

  const { fields: searchFrequencyOptions, replace } = useFieldArray({
    name: "options.monitoring.searchFrequency.options",
    control,
    shouldUnregister: true,
  });

  useEffect(() => {
    if (searchFrequencyProfileField) {
      replace(
        (searchFrequencyProfileField.options as ProfileTypeFieldOptions<"SELECT">).values.map(
          ({ value }) => ({
            value,
            frequency:
              searchFrequencyOptions.find((f) => f.value === value)?.frequency ?? "1_MONTHS",
          }),
        ),
      );
    }
  }, [searchFrequencyProfileField?.id]);

  if (!searchFrequencyOptions.length) return null;

  return (
    <Stack background="gray.100" paddingX={3} paddingY={2}>
      {searchFrequencyOptions.map(({ id, value }, index) => {
        const { label } =
          (searchFrequencyProfileField?.options as ProfileTypeFieldOptions<"SELECT">)?.values.find(
            (f) => f.value === value,
          ) ?? {};

        if (!label) return null;

        return (
          <FormControl
            key={id}
            isInvalid={
              !!(errors.options?.monitoring?.searchFrequency as any)?.options?.[index]?.frequency
            }
            isDisabled={isDisabled}
          >
            <HStack>
              <FormLabel fontWeight={400} margin={0} flex="1" noOfLines={3}>
                <LocalizableUserTextRender
                  value={label}
                  default={intl.formatMessage({
                    id: "generic.unnamed-profile-type-field",
                    defaultMessage: "Unnamed property",
                  })}
                />
                :
              </FormLabel>
              <Box flex="2">
                <Controller
                  name={`options.monitoring.searchFrequency.options.${index}.frequency`}
                  control={control}
                  rules={{ required: true }}
                  render={({ field }) => (
                    <SimpleSelect
                      options={searchFrequencyFixedOptions}
                      placeholder={intl.formatMessage({
                        id: "component.profile-field-monitoring-settings.select-frequency",
                        defaultMessage: "Choose a frequency",
                      })}
                      {...field}
                    />
                  )}
                />
              </Box>
            </HStack>
          </FormControl>
        );
      })}
    </Stack>
  );
}

ProfileFieldMonitoringSettings.fragments = {
  get ProfileTypeField() {
    return gql`
      fragment ProfileFieldMonitoringSettings_ProfileTypeField on ProfileTypeField {
        id
        name
        type
        options
        alias
        ...ProfileTypeFieldSelect_ProfileTypeField
      }
      ${ProfileTypeFieldSelect.fragments.ProfileTypeField}
    `;
  },
  get ProfileType() {
    return gql`
      fragment ProfileFieldMonitoringSettings_ProfileType on ProfileType {
        id
        fields {
          id
          ...ProfileFieldMonitoringSettings_ProfileTypeField
        }
      }
      ${this.ProfileTypeField}
    `;
  },
};
