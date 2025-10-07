import { gql, useQuery } from "@apollo/client";
import { Button, FormControl, FormHelperText, FormLabel, Stack, Text } from "@chakra-ui/react";
import { PetitionFieldSelect } from "@parallel/components/common/PetitionFieldSelect";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { BackgroundCheckEntityTypeSelect } from "@parallel/components/petition-preview/fields/background-check/BackgroundCheckEntityTypeSelect";
import {
  ConfigureBackgroundCheckAutomateSearchDialog_petitionDocument,
  PetitionComposeFieldSettings_PetitionFieldFragment,
} from "@parallel/graphql/__types";
import { FieldOptions } from "@parallel/utils/fieldOptions";
import { useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import { FormattedMessage } from "react-intl";
import { isNonNullish } from "remeda";

interface ConfigureBackgroundCheckAutomateSearchDialogInput {
  petitionId: string;
  field: PetitionComposeFieldSettings_PetitionFieldFragment;
}

interface ConfigureBackgroundCheckAutomateSearchDialogOutput {
  name: string[];
  date: string | null;
  type: string | null;
  country: string | null;
  birthCountry: string | null;
}

export function ConfigureBackgroundCheckAutomateSearchDialog({
  petitionId,
  field,
  ...props
}: DialogProps<
  ConfigureBackgroundCheckAutomateSearchDialogInput,
  ConfigureBackgroundCheckAutomateSearchDialogOutput
>) {
  const { data, loading } = useQuery(
    ConfigureBackgroundCheckAutomateSearchDialog_petitionDocument,
    {
      variables: { id: petitionId },
    },
  );

  const petition = data?.petition ?? { fields: [] };

  const { autoSearchConfig } = field.options as FieldOptions["BACKGROUND_CHECK"];

  const fieldIsChild = field.parent !== null;

  const allFields = useMemo(
    () => petition.fields.flatMap((f) => [f, ...(fieldIsChild ? (f.children ?? []) : [])]),
    [petition.fields],
  );

  const { handleSubmit, control, watch } = useForm({
    mode: "onSubmit",
    defaultValues: isNonNullish(autoSearchConfig)
      ? {
          name: autoSearchConfig.name
            .map((id) => allFields.find((f) => f.id === id))
            .filter(isNonNullish),
          date: allFields.find((field) => autoSearchConfig.date === field.id) ?? null,
          type: autoSearchConfig.type,
          country: allFields.find((field) => autoSearchConfig.country === field.id) ?? null,
          birthCountry:
            allFields.find((field) => autoSearchConfig.birthCountry === field.id) ?? null,
        }
      : {
          name: [],
          date: null,
          type: null,
          country: null,
          birthCountry: null,
        },
  });

  const textFields = allFields.filter((field) => field.type === "SHORT_TEXT");
  const dateFields = allFields.filter((field) => field.type === "DATE");
  const countryFields = allFields.filter(
    (field) =>
      field.type === "SELECT" &&
      typeof field.options?.standardList === "string" &&
      field.options?.standardList.includes("COUNTRIES") &&
      !field.multiple,
  );
  const type = watch("type");
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
            });
          }),
        },
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
                defaultMessage="Name of person / entity"
              />
              <Text as="span" marginStart={1}>
                *
              </Text>
            </FormLabel>
            <Controller
              name="name"
              rules={{ required: true }}
              control={control}
              render={({ field: { onChange, value }, fieldState }) => (
                <PetitionFieldSelect
                  petition={petition}
                  isMulti
                  isLoading={loading}
                  expandFieldGroups={fieldIsChild}
                  isInvalid={fieldState.invalid}
                  value={value}
                  onChange={onChange}
                  filterFields={(f) =>
                    f.type === "SHORT_TEXT" &&
                    !f.multiple &&
                    (!f.parent || f.parent.id === field.parent?.id)
                  }
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
                  petition={petition}
                  isClearable
                  isLoading={loading}
                  expandFieldGroups={fieldIsChild}
                  value={value}
                  onChange={onChange}
                  filterFields={(f) =>
                    f.type === "DATE" &&
                    !f.multiple &&
                    (!f.parent || f.parent.id === field.parent?.id)
                  }
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
          <FormControl isDisabled={!countryFields.length}>
            <FormLabel fontWeight={400}>
              {type === "PERSON" ? (
                <FormattedMessage
                  id="component.configure-automate-search-dialog.nationality-label"
                  defaultMessage="Nationality"
                />
              ) : type === "COMPANY" ? (
                <FormattedMessage id="generic.jurisdiction" defaultMessage="Jurisdiction" />
              ) : (
                <FormattedMessage
                  id="component.configure-automate-search-dialog.country-label"
                  defaultMessage="Country (nationality / jurisdiction)"
                />
              )}
            </FormLabel>
            <Controller
              name="country"
              control={control}
              render={({ field: { onChange, value }, fieldState }) => (
                <PetitionFieldSelect
                  petition={petition}
                  isLoading={loading}
                  isClearable
                  expandFieldGroups={fieldIsChild}
                  isInvalid={fieldState.invalid}
                  value={value}
                  onChange={onChange}
                  filterFields={(f) =>
                    f.type === "SELECT" &&
                    !f.multiple &&
                    typeof f.options?.standardList === "string" &&
                    f.options?.standardList.includes("COUNTRIES") &&
                    (!f.parent || f.parent.id === field.parent?.id)
                  }
                />
              )}
            />
            {!countryFields.length ? (
              <FormHelperText>
                <FormattedMessage
                  id="component.configure-automate-search-dialog.country-helper-text"
                  defaultMessage="There are no compatible fields in the form."
                />
              </FormHelperText>
            ) : null}
          </FormControl>
          {type === "PERSON" ? (
            <FormControl isDisabled={!countryFields.length}>
              <FormLabel fontWeight={400}>
                <FormattedMessage
                  id="component.configure-automate-search-dialog.birth-country-label"
                  defaultMessage="Country of birth"
                />
              </FormLabel>
              <Controller
                name="birthCountry"
                control={control}
                shouldUnregister={true}
                render={({ field: { onChange, value }, fieldState }) => (
                  <PetitionFieldSelect
                    petition={petition}
                    isLoading={loading}
                    isClearable
                    expandFieldGroups={fieldIsChild}
                    isInvalid={fieldState.invalid}
                    value={value}
                    onChange={onChange}
                    filterFields={(f) =>
                      f.type === "SELECT" &&
                      !f.multiple &&
                      typeof f.options?.standardList === "string" &&
                      f.options?.standardList.includes("COUNTRIES") &&
                      (!f.parent || f.parent.id === field.parent?.id)
                    }
                  />
                )}
              />
              {!countryFields.length ? (
                <FormHelperText>
                  <FormattedMessage
                    id="component.configure-automate-search-dialog.country-helper-text"
                    defaultMessage="There are no compatible fields in the form."
                  />
                </FormHelperText>
              ) : null}
            </FormControl>
          ) : null}
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

export function useConfigureBackgroundCheckAutomateSearchDialog() {
  return useDialog(ConfigureBackgroundCheckAutomateSearchDialog);
}

ConfigureBackgroundCheckAutomateSearchDialog.fragments = {
  PetitionBase: gql`
    fragment ConfigureBackgroundCheckAutomateSearchDialog_PetitionBase on PetitionBase {
      fields {
        id
        ...ConfigureBackgroundCheckAutomateSearchDialog_InnerPetitionField
        children {
          id
          ...ConfigureBackgroundCheckAutomateSearchDialog_InnerPetitionField
        }
      }
      ...PetitionFieldSelect_PetitionBase
    }
    ${PetitionFieldSelect.fragments.PetitionBase}

    fragment ConfigureBackgroundCheckAutomateSearchDialog_InnerPetitionField on PetitionField {
      id
      type
      options
      multiple
      parent {
        id
      }
    }
  `,
  PetitionField: gql`
    fragment ConfigureBackgroundCheckAutomateSearchDialog_PetitionField on PetitionField {
      options
      parent {
        id
      }
    }
  `,
};

const _queries = [
  gql`
    query ConfigureBackgroundCheckAutomateSearchDialog_petition($id: GID!) {
      petition(id: $id) {
        id
        ...ConfigureBackgroundCheckAutomateSearchDialog_PetitionBase
      }
    }
    ${ConfigureBackgroundCheckAutomateSearchDialog.fragments.PetitionBase}
  `,
];
