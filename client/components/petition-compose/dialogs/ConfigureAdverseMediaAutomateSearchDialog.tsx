import { gql, useQuery } from "@apollo/client";
import { Button, FormControl, FormHelperText, FormLabel, Stack, Text } from "@chakra-ui/react";
import { PetitionFieldSelect } from "@parallel/components/common/PetitionFieldSelect";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import {
  ConfigureAdverseMediaAutomateSearchDialog_petitionDocument,
  PetitionComposeFieldSettings_PetitionFieldFragment,
} from "@parallel/graphql/__types";
import { FieldOptions } from "@parallel/utils/fieldOptions";
import { useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import { FormattedMessage } from "react-intl";
import { isNonNullish } from "remeda";

interface ConfigureAdverseMediaAutomateSearchDialogInput {
  petitionId: string;
  field: PetitionComposeFieldSettings_PetitionFieldFragment;
}

interface ConfigureAdverseMediaAutomateSearchOutput {
  name: string[];
  backgroundCheck: string | null;
}

export function ConfigureAdverseMediaAutomateSearchDialog({
  petitionId,
  field,
  ...props
}: DialogProps<
  ConfigureAdverseMediaAutomateSearchDialogInput,
  ConfigureAdverseMediaAutomateSearchOutput
>) {
  const { data, loading } = useQuery(ConfigureAdverseMediaAutomateSearchDialog_petitionDocument, {
    variables: { id: petitionId },
  });

  const petition = data?.petition ?? { fields: [] };

  const { autoSearchConfig } = field.options as FieldOptions["ADVERSE_MEDIA_SEARCH"];

  const fieldIsChild = field.parent !== null;

  const allFields = useMemo(
    () => petition.fields.flatMap((f) => [f, ...(fieldIsChild ? (f.children ?? []) : [])]),
    [petition.fields],
  );

  const { handleSubmit, control, watch, clearErrors } = useForm({
    mode: "onSubmit",
    defaultValues: isNonNullish(autoSearchConfig)
      ? {
          name:
            autoSearchConfig?.name
              ?.map((id) => allFields.find((f) => f.id === id))
              .filter(isNonNullish) ?? [],
          backgroundCheck:
            allFields.find((field) => autoSearchConfig?.backgroundCheck === field.id) ?? null,
        }
      : {
          name: [],
          backgroundCheck: null,
        },
  });

  const name = watch("name");
  const backgroundCheck = watch("backgroundCheck");

  const textFields = allFields.filter((field) => field.type === "SHORT_TEXT");
  const backgroundCheckFields = allFields.filter((field) => field.type === "BACKGROUND_CHECK");

  return (
    <ConfirmDialog
      size="lg"
      content={{
        containerProps: {
          as: "form",
          onSubmit: handleSubmit((data) => {
            props.onResolve({
              name: data.name.map((field) => field.id),
              backgroundCheck: data.backgroundCheck?.id ?? null,
            });
          }),
        },
      }}
      header={
        <FormattedMessage
          id="component.configure-adverse-media-automate-search-dialog.header"
          defaultMessage="Autocomplete search"
        />
      }
      body={
        <Stack>
          <Text>
            <FormattedMessage
              id="component.configure-adverse-media-automate-search-dialog.body"
              defaultMessage="Select the fields to be used to autocomplete the adverse media search."
            />
          </Text>
          <FormControl isDisabled={!backgroundCheckFields.length}>
            <FormLabel fontWeight={400}>
              <FormattedMessage
                id="component.configure-adverse-media-automate-search-dialog.profile-label"
                defaultMessage="Profile"
              />
            </FormLabel>
            <Controller
              name="backgroundCheck"
              control={control}
              rules={{
                required: !name.length,
              }}
              render={({ field: { onChange, value }, fieldState }) => (
                <PetitionFieldSelect
                  petition={petition}
                  isLoading={loading}
                  isClearable
                  expandFieldGroups={fieldIsChild}
                  isInvalid={fieldState.invalid}
                  value={value}
                  onChange={(newValue) => {
                    onChange(newValue);
                    clearErrors();
                  }}
                  filterFields={(f) =>
                    f.type === "BACKGROUND_CHECK" && (!f.parent || f.parent.id === field.parent?.id)
                  }
                />
              )}
            />
            {!backgroundCheckFields.length ? (
              <FormHelperText>
                <FormattedMessage
                  id="component.configure-adverse-media-automate-search-dialog.profile-helper-text"
                  defaultMessage="There are no background check fields in the form."
                />
              </FormHelperText>
            ) : null}
          </FormControl>
          <Text as="span" fontSize="sm">
            <FormattedMessage
              id="component.configure-adverse-media-automate-search-dialog.or-by"
              defaultMessage="Or by"
            />
          </Text>
          <FormControl isDisabled={!textFields.length}>
            <FormLabel fontWeight={400}>
              <FormattedMessage
                id="component.configure-adverse-media-automate-search-dialog.name-label"
                defaultMessage="Name of person/entity"
              />
            </FormLabel>
            <Controller
              name="name"
              control={control}
              rules={{
                required: !backgroundCheck,
              }}
              render={({ field: { onChange, value }, fieldState }) => (
                <PetitionFieldSelect
                  petition={petition}
                  isMulti
                  isLoading={loading}
                  expandFieldGroups={fieldIsChild}
                  isInvalid={fieldState.invalid}
                  value={value}
                  onChange={(newValue) => {
                    onChange(newValue);
                    clearErrors();
                  }}
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
                  id="component.configure-adverse-media-automate-search-dialog.name-helper-text"
                  defaultMessage="There are no short replies fields in the form."
                />
              </FormHelperText>
            ) : null}
          </FormControl>
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
              id="component.configure-adverse-media-automate-search-dialog.remove-setting"
              defaultMessage="Remove setting"
            />
          </Button>
        ) : null
      }
      confirm={
        <Button type="submit" colorScheme="primary">
          <FormattedMessage id="generic.save" defaultMessage="Save" />
        </Button>
      }
      {...props}
    />
  );
}

export function useConfigureAdverseMediaAutomateSearchDialog() {
  return useDialog(ConfigureAdverseMediaAutomateSearchDialog);
}

ConfigureAdverseMediaAutomateSearchDialog.fragments = {
  PetitionBase: gql`
    fragment ConfigureAdverseMediaAutomateSearchDialog_PetitionBase on PetitionBase {
      fields {
        id
        ...ConfigureAdverseMediaAutomateSearchDialog_InnerPetitionField
        children {
          id
          ...ConfigureAdverseMediaAutomateSearchDialog_InnerPetitionField
        }
      }
      ...PetitionFieldSelect_PetitionBase
    }
    ${PetitionFieldSelect.fragments.PetitionBase}

    fragment ConfigureAdverseMediaAutomateSearchDialog_InnerPetitionField on PetitionField {
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
    fragment ConfigureAdverseMediaAutomateSearchDialog_PetitionField on PetitionField {
      options
      parent {
        id
      }
    }
  `,
};

const _queries = [
  gql`
    query ConfigureAdverseMediaAutomateSearchDialog_petition($id: GID!) {
      petition(id: $id) {
        id
        ...ConfigureAdverseMediaAutomateSearchDialog_PetitionBase
      }
    }
    ${ConfigureAdverseMediaAutomateSearchDialog.fragments.PetitionBase}
  `,
];
