import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";
import { Button, FormControl, FormHelperText, FormLabel, Stack } from "@chakra-ui/react";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { HelpPopover } from "@parallel/components/common/HelpPopover";
import { localizableUserTextRender } from "@parallel/components/common/LocalizableUserTextRender";
import { ProfileTypeFieldSelect } from "@parallel/components/common/ProfileTypeFieldSelect";
import { SimpleSelect, useSimpleSelectOptions } from "@parallel/components/common/SimpleSelect";
import { BackgroundCheckEntityTypeSelect } from "@parallel/components/petition-preview/fields/background-check/BackgroundCheckEntityTypeSelect";
import { Box, Checkbox, HStack, Text } from "@parallel/components/ui";
import { ConfigureProfileBackgroundCheckAutomateSearchDialog_profileTypeDocument } from "@parallel/graphql/__types";
import { ProfileTypeFieldOptions } from "@parallel/utils/profileFields";
import { Controller, useForm } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";
import { isNonNullish } from "remeda";

interface ConfigureProfileBackgroundCheckAutomateSearchDialogInput {
  profileTypeId: string;
  autoSearchConfig?: ProfileTypeFieldOptions<"BACKGROUND_CHECK">["autoSearchConfig"];
}

interface ConfigureProfileBackgroundCheckAutomateSearchDialogOutput {
  name: string[];
  date: string | null;
  type: string | null;
  country: string | null;
  birthCountry: string | null;
  activationCondition: {
    profileTypeFieldId: string;
    values: string[];
  } | null;
}

export function ConfigureProfileBackgroundCheckAutomateSearchDialog({
  profileTypeId,
  autoSearchConfig,
  ...props
}: DialogProps<
  ConfigureProfileBackgroundCheckAutomateSearchDialogInput,
  ConfigureProfileBackgroundCheckAutomateSearchDialogOutput
>) {
  const intl = useIntl();
  const { data, loading } = useQuery(
    ConfigureProfileBackgroundCheckAutomateSearchDialog_profileTypeDocument,
    {
      variables: { profileTypeId },
    },
  );

  const profileType = data?.profileType ?? { fields: [] };

  const {
    handleSubmit,
    control,
    watch,
    register,
    formState: { errors },
  } = useForm({
    mode: "onSubmit",
    defaultValues: isNonNullish(autoSearchConfig)
      ? {
          name: autoSearchConfig.name
            .map((id) => profileType.fields.find((f) => f.id === id))
            .filter(isNonNullish),
          date: profileType.fields.find((field) => autoSearchConfig.date === field.id) ?? null,
          type: autoSearchConfig.type,
          country:
            profileType.fields.find((field) => autoSearchConfig.country === field.id) ?? null,
          birthCountry:
            profileType.fields.find((field) => autoSearchConfig.birthCountry === field.id) ?? null,
          hasActivationCondition: autoSearchConfig.activationCondition !== null,
          activationCondition: autoSearchConfig.activationCondition ?? null,
        }
      : {
          name: [],
          date: null,
          type: null,
          country: null,
          birthCountry: null,
          hasActivationCondition: false,
          activationCondition: null,
        },
  });

  const textFields = profileType.fields.filter((field) => field.type === "SHORT_TEXT");
  const dateFields = profileType.fields.filter((field) => field.type === "DATE");
  const countryFields = profileType.fields.filter(
    (field) =>
      field.type === "SELECT" &&
      isNonNullish(field.options?.standardList) &&
      field.options?.standardList?.includes("COUNTRIES"),
  );
  const type = watch("type");

  const activationCondition = watch("activationCondition");

  const conditionalField = profileType.fields.find(
    (f) => f.id === activationCondition?.profileTypeFieldId,
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

  return (
    <ConfirmDialog
      size="xl"
      content={{
        containerProps: {
          as: "form",
          onSubmit: handleSubmit((data) => {
            props.onResolve({
              name: data.name.map((field) => field.id),
              date: data.date?.id ?? null,
              type: data.type,
              country: data.country?.id ?? null,
              birthCountry: data.birthCountry?.id ?? null,
              activationCondition: data.hasActivationCondition ? data.activationCondition : null,
            });
          }),
        },
      }}
      header={
        <FormattedMessage
          id="component.configure-profile-automate-search-dialog.header"
          defaultMessage="Automate search"
        />
      }
      body={
        <Stack>
          <Text>
            <FormattedMessage
              id="component.configure-profile-automate-search-dialog.body"
              defaultMessage="Select the properties to be used to automate the list search."
            />
          </Text>
          <FormControl>
            <FormLabel fontWeight={400}>
              <FormattedMessage
                id="component.configure-automate-search-dialog.type-of-search-label"
                defaultMessage="Type of search"
              />
            </FormLabel>
            <Controller
              name="type"
              control={control}
              render={({ field }) => <BackgroundCheckEntityTypeSelect {...field} />}
            />
          </FormControl>
          <FormControl isDisabled={!textFields.length}>
            <FormLabel fontWeight={400}>
              {type === "COMPANY" ? (
                <FormattedMessage
                  id="component.configure-profile-automate-search-dialog.name-person-label"
                  defaultMessage="Name of person"
                />
              ) : (
                <FormattedMessage
                  id="component.configure-profile-automate-search-dialog.name-entity-label"
                  defaultMessage="Name of entity"
                />
              )}

              <Text as="span" marginStart={1}>
                *
              </Text>
            </FormLabel>
            <Controller
              name="name"
              rules={{ required: true }}
              control={control}
              render={({ field: { onChange, value }, fieldState }) => {
                return (
                  <ProfileTypeFieldSelect
                    isMulti
                    fields={profileType.fields}
                    isLoading={loading}
                    isInvalid={fieldState.invalid}
                    value={profileType.fields.filter((f) => value.find((v) => v.id === f.id))}
                    onChange={onChange}
                    filterFields={(f) => f.type === "SHORT_TEXT"}
                  />
                );
              }}
            />

            {!textFields.length ? (
              <FormHelperText>
                <FormattedMessage
                  id="component.configure-profile-automate-search-dialog.name-helper-text"
                  defaultMessage="There are no short text properties in the profile type."
                />
              </FormHelperText>
            ) : null}
          </FormControl>
          <FormControl isDisabled={!dateFields.length}>
            <FormLabel fontWeight={400}>
              {type === "COMPANY" ? (
                <FormattedMessage
                  id="component.configure-profile-automate-search-dialog.date-of-registration-label"
                  defaultMessage="Date of registration"
                />
              ) : type === "PERSON" ? (
                <FormattedMessage
                  id="component.configure-profile-automate-search-dialog.date-of-birth-label"
                  defaultMessage="Date of birth"
                />
              ) : (
                <FormattedMessage
                  id="component.configure-profile-automate-search-dialog.date-of-birth-or-registration-label"
                  defaultMessage="Date of birth / registration"
                />
              )}
            </FormLabel>
            <Controller
              name="date"
              control={control}
              render={({ field: { onChange, value }, fieldState }) => {
                return (
                  <ProfileTypeFieldSelect
                    fields={profileType.fields}
                    isLoading={loading}
                    isInvalid={fieldState.invalid}
                    value={profileType.fields.find((f) => f.id === value?.id) ?? null}
                    onChange={onChange}
                    filterFields={(f) => f.type === "DATE"}
                  />
                );
              }}
            />

            {!dateFields.length ? (
              <FormHelperText>
                <FormattedMessage
                  id="component.configure-profile-automate-search-dialog.date-of-birth-helper-text"
                  defaultMessage="There are no date properties in the profile type."
                />
              </FormHelperText>
            ) : null}
          </FormControl>
          <FormControl isDisabled={!countryFields.length}>
            <FormLabel fontWeight={400}>
              {type === "PERSON" ? (
                <FormattedMessage
                  id="component.configure-profile-automate-search-dialog.nationality-label"
                  defaultMessage="Nationality"
                />
              ) : type === "COMPANY" ? (
                <FormattedMessage id="generic.jurisdiction" defaultMessage="Jurisdiction" />
              ) : (
                <FormattedMessage
                  id="component.configure-profile-automate-search-dialog.country-label"
                  defaultMessage="Country (nationality / jurisdiction)"
                />
              )}
            </FormLabel>
            <Controller
              name="country"
              control={control}
              render={({ field: { onChange, value }, fieldState }) => {
                return (
                  <ProfileTypeFieldSelect
                    fields={profileType.fields}
                    isLoading={loading}
                    isInvalid={fieldState.invalid}
                    value={profileType.fields.find((f) => f.id === value?.id) ?? null}
                    onChange={onChange}
                    filterFields={(f) =>
                      f.type === "SELECT" &&
                      isNonNullish(f.options?.standardList) &&
                      f.options?.standardList?.includes("COUNTRIES")
                    }
                  />
                );
              }}
            />

            {!countryFields.length ? (
              <FormHelperText>
                <FormattedMessage
                  id="component.configure-profile-automate-search-dialog.country-helper-text"
                  defaultMessage="There are no compatible properties in the profile type."
                />
              </FormHelperText>
            ) : null}
          </FormControl>
          {type === "PERSON" ? (
            <>
              <FormControl isDisabled={!countryFields.length}>
                <FormLabel fontWeight={400}>
                  <FormattedMessage
                    id="component.configure-profile-automate-search-dialog.country-of-birth-label"
                    defaultMessage="Country of birth"
                  />
                </FormLabel>
                <Controller
                  name="birthCountry"
                  control={control}
                  shouldUnregister={true}
                  render={({ field: { onChange, value }, fieldState }) => {
                    return (
                      <ProfileTypeFieldSelect
                        fields={profileType.fields}
                        isLoading={loading}
                        isInvalid={fieldState.invalid}
                        value={profileType.fields.find((f) => f.id === value?.id) ?? null}
                        onChange={onChange}
                        filterFields={(f) =>
                          f.type === "SELECT" &&
                          isNonNullish(f.options?.standardList) &&
                          f.options?.standardList?.includes("COUNTRIES")
                        }
                      />
                    );
                  }}
                />

                {!countryFields.length ? (
                  <FormHelperText>
                    <FormattedMessage
                      id="component.configure-profile-automate-search-dialog.country-helper-text"
                      defaultMessage="There are no compatible properties in the profile type."
                    />
                  </FormHelperText>
                ) : null}
              </FormControl>
            </>
          ) : null}
          <Stack marginTop={1}>
            <FormControl>
              <Checkbox {...register("hasActivationCondition")}>
                <HStack alignItems="center" gap={0}>
                  <FormattedMessage
                    id="component.configure-profile-automate-search-dialog.activation-conditions-label"
                    defaultMessage="Add activation conditions"
                  />

                  <HelpPopover>
                    <FormattedMessage
                      id="component.configure-profile-automate-search-dialog.activation-conditions-help"
                      defaultMessage="Add conditions to enable or disable the search based on replies in another property. For instance, depending on the type of relationship with the customer."
                    />
                  </HelpPopover>
                </HStack>
              </Checkbox>
            </FormControl>
            {watch("hasActivationCondition") ? (
              <Stack background="gray.100" paddingX={3} paddingY={2}>
                <HStack>
                  <Text as="span" whiteSpace="nowrap">
                    <FormattedMessage
                      id="component.configure-profile-automate-search-dialog.activate-when"
                      defaultMessage="Activate when"
                    />
                  </Text>
                  <FormControl isInvalid={!!errors.activationCondition?.profileTypeFieldId}>
                    <Controller
                      name="activationCondition.profileTypeFieldId"
                      control={control}
                      rules={{ required: true }}
                      render={({ field: { value, onChange } }) => (
                        <ProfileTypeFieldSelect
                          filterFields={(f) => f.type === "SELECT"}
                          fields={profileType.fields}
                          value={profileType.fields.find((f) => f.id === value) ?? null}
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
                      id="component.configure-profile-automate-search-dialog.is-one-of"
                      defaultMessage="is one of"
                    />
                  </Text>
                  <Box flex="1" minW={0}>
                    <FormControl
                      isDisabled={conditionalFieldOptions.length === 0}
                      isInvalid={
                        !!errors.activationCondition?.values && conditionalFieldOptions.length > 0
                      }
                    >
                      <Controller
                        name="activationCondition.values"
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
        </Stack>
      }
      alternative={
        isNonNullish(autoSearchConfig) ? (
          <Button
            type="submit"
            colorScheme="red"
            variant="outline"
            onClick={() => props.onReject("DELETE_AUTO_SEARCH_CONFIG")}
          >
            <FormattedMessage id="generic.remove-setting" defaultMessage="Remove setting" />
          </Button>
        ) : null
      }
      confirm={
        <Button type="submit" colorScheme="primary" isDisabled={!textFields.length}>
          <FormattedMessage id="generic.save" defaultMessage="Save" />
        </Button>
      }
      {...props}
    />
  );
}

export function useConfigureProfileBackgroundCheckAutomateSearchDialog() {
  return useDialog(ConfigureProfileBackgroundCheckAutomateSearchDialog);
}

const _fragments = {
  ProfileType: gql`
    fragment ConfigureProfileBackgroundCheckAutomateSearchDialog_ProfileType on ProfileType {
      id
      fields {
        id
        ...ConfigureProfileBackgroundCheckAutomateSearchDialog_ProfileTypeField
        ...ProfileTypeFieldSelect_ProfileTypeField
      }
    }
  `,
  ProfileTypeField: gql`
    fragment ConfigureProfileBackgroundCheckAutomateSearchDialog_ProfileTypeField on ProfileTypeField {
      id
      type
      options
    }
  `,
};

const _queries = [
  gql`
    query ConfigureProfileBackgroundCheckAutomateSearchDialog_profileType($profileTypeId: GID!) {
      profileType(profileTypeId: $profileTypeId) {
        id
        ...ConfigureProfileBackgroundCheckAutomateSearchDialog_ProfileType
      }
    }
  `,
];
