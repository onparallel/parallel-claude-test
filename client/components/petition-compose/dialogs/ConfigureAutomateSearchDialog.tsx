import { gql } from "@apollo/client";
import { Button, FormControl, FormHelperText, FormLabel, Stack, Text } from "@chakra-ui/react";
import { PetitionFieldSelect } from "@parallel/components/common/PetitionFieldSelect";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { BackgroundCheckEntityTypeSelect } from "@parallel/components/petition-preview/fields/background-check/BackgroundCheckEntityTypeSelect";
import {
  BackgroundCheckEntitySearchType,
  ConfigureAutomateSearchDialog_PetitionFieldFragment,
  UpdatePetitionFieldAutoSearchConfigInput,
} from "@parallel/graphql/__types";
import { FieldOptions } from "@parallel/utils/petitionFields";
import { useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";
import { isDefined } from "remeda";

interface ConfigureAutomateSearchDialogInput {
  fields: ConfigureAutomateSearchDialog_PetitionFieldFragment[];
  field: ConfigureAutomateSearchDialog_PetitionFieldFragment;
}

export function ConfigureAutomateSearchDialog({
  fields,
  field,
  ...props
}: DialogProps<ConfigureAutomateSearchDialogInput, UpdatePetitionFieldAutoSearchConfigInput>) {
  const intl = useIntl();

  const { autoSearchConfig } = field.options as FieldOptions["BACKGROUND_CHECK"];

  const fieldIsChild = field.parent !== null;

  const allFields = useMemo(
    () => fields.flatMap((f) => [f, ...(fieldIsChild ? f.children ?? [] : [])]),
    [fields],
  );

  const { handleSubmit, control, watch } = useForm<{
    name: ConfigureAutomateSearchDialog_PetitionFieldFragment[];
    date: ConfigureAutomateSearchDialog_PetitionFieldFragment | null;
    type: BackgroundCheckEntitySearchType | null;
  }>({
    mode: "onSubmit",
    defaultValues: {
      name: isDefined(autoSearchConfig)
        ? autoSearchConfig.name.map((id) => allFields.find((f) => f.id === id)).filter(isDefined)
        : [],
      date: isDefined(autoSearchConfig)
        ? allFields.filter((field) => autoSearchConfig.date === field.id)[0]
        : null,
      type: autoSearchConfig?.type ?? null,
    },
  });

  const textFields = allFields.filter((field) => field.type === "SHORT_TEXT");
  const dateFields = allFields.filter((field) => field.type === "DATE");
  const type = watch("type");
  return (
    <ConfirmDialog
      size="xl"
      content={{
        as: "form",
        onSubmit: handleSubmit((data) => {
          props.onResolve({
            name: data.name.map((field) => field.id),
            date: data.date?.id ?? null,
            type: data.type,
          });
        }),
      }}
      header={
        <FormattedMessage
          id="component.configure-automate-search-dialog.header"
          defaultMessage="Automate search"
        />
      }
      body={
        <Stack>
          <Text>
            <FormattedMessage
              id="component.configure-automate-search-dialog.body"
              defaultMessage="Select the fields to be used to automate the list search."
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
              <FormattedMessage
                id="component.configure-automate-search-dialog.name-label"
                defaultMessage="Name of person/entity"
              />
              <Text as="span" marginLeft={1}>
                *
              </Text>
            </FormLabel>
            <Controller
              name="name"
              rules={{ required: true }}
              control={control}
              render={({ field: { onChange, value }, fieldState }) => (
                <PetitionFieldSelect
                  isMulti
                  expandFieldGroups={fieldIsChild}
                  isInvalid={fieldState.invalid}
                  value={value}
                  fields={fields}
                  onChange={onChange}
                  filterFields={(f) =>
                    f.type === "SHORT_TEXT" &&
                    !(f as ConfigureAutomateSearchDialog_PetitionFieldFragment).multiple &&
                    (!f.parent || f.parent.id === field.parent?.id)
                  }
                  placeholder={intl.formatMessage({
                    id: "component.configure-automate-search-dialog.select-field-placeholder",
                    defaultMessage: "Select a field",
                  })}
                />
              )}
            />
            {!textFields.length ? (
              <FormHelperText>
                <FormattedMessage
                  id="component.configure-automate-search-dialog.name-helper-text"
                  defaultMessage="There are no short replies fields in the form."
                />
              </FormHelperText>
            ) : null}
          </FormControl>
          <FormControl isDisabled={!dateFields.length}>
            <FormLabel fontWeight={400}>
              {type === "COMPANY" ? (
                <FormattedMessage
                  id="component.configure-automate-search-dialog.date-of-registration-label"
                  defaultMessage="Date of registration"
                />
              ) : (
                <FormattedMessage
                  id="component.configure-automate-search-dialog.date-of-birth-label"
                  defaultMessage="Date of birth"
                />
              )}
            </FormLabel>
            <Controller
              name="date"
              control={control}
              render={({ field: { onChange, value } }) => (
                <PetitionFieldSelect
                  isClearable
                  expandFieldGroups={fieldIsChild}
                  value={value}
                  fields={fields}
                  onChange={onChange}
                  filterFields={(f) =>
                    f.type === "DATE" &&
                    !(f as ConfigureAutomateSearchDialog_PetitionFieldFragment).multiple &&
                    (!f.parent || f.parent.id === field.parent?.id)
                  }
                  placeholder={intl.formatMessage({
                    id: "component.configure-automate-search-dialog.select-field-placeholder",
                    defaultMessage: "Select a field",
                  })}
                />
              )}
            />
            {!dateFields.length ? (
              <FormHelperText>
                <FormattedMessage
                  id="component.configure-automate-search-dialog.date-of-birth-helper-text"
                  defaultMessage="There are no date fields in the form."
                />
              </FormHelperText>
            ) : null}
          </FormControl>
        </Stack>
      }
      alternative={
        isDefined(autoSearchConfig) ? (
          <Button
            type="submit"
            colorScheme="red"
            variant="outline"
            onClick={() => props.onReject("DELETE_AUTO_SEARCH_CONFIG")}
          >
            <FormattedMessage
              id="component.configure-automate-search-dialog.remove-setting"
              defaultMessage="Remove setting"
            />
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

export function useConfigureAutomateSearchDialog() {
  return useDialog(ConfigureAutomateSearchDialog);
}

ConfigureAutomateSearchDialog.fragments = {
  PetitionField: gql`
    fragment ConfigureAutomateSearchDialog_PetitionField on PetitionField {
      id
      type
      options
      multiple
      parent {
        id
      }
      ...PetitionFieldSelect_PetitionField
    }
    ${PetitionFieldSelect.fragments.PetitionField}
  `,
};
