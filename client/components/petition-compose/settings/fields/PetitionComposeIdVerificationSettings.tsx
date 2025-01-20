import { gql } from "@apollo/client";
import { Box, Stack, Text } from "@chakra-ui/react";
import { MultiCheckboxSimpleSelect } from "@parallel/components/common/MultiCheckboxSimpleSelect";
import { SimpleOption, SimpleSelect } from "@parallel/components/common/SimpleSelect";
import { UnwrapArray } from "@parallel/utils/types";
import { Children, useMemo } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { OptionProps, ValueContainerProps, components } from "react-select";
import { omit } from "remeda";
import { PetitionComposeFieldSettingsProps } from "../PetitionComposeFieldSettings";
import { SettingsRow } from "../rows/SettingsRow";

export function PetitionComposeIdVerificationSettings({
  field,
  onFieldEdit,
  isReadOnly,
}: Pick<PetitionComposeFieldSettingsProps, "field" | "onFieldEdit" | "isReadOnly">) {
  const documents = useTypesOfDocuments();
  const typesOfVerification = useTypesOfVerification();

  return (
    <>
      <SettingsRow
        controlId="type-of-verification"
        textStyle={isReadOnly ? "muted" : undefined}
        label={
          <FormattedMessage
            id="component.petition-compose-id-verification-settings.type-of-verification"
            defaultMessage="Type of verification"
          />
        }
        isDisabled={isReadOnly}
      >
        <Box flex="1">
          <SimpleSelect
            isSearchable={false}
            isClearable={false}
            size="sm"
            options={typesOfVerification}
            value={field.options.config.type}
            components={{ Option }}
            onChange={(value) =>
              onFieldEdit(field.id, {
                options: {
                  config: {
                    ...field.options.config,
                    type: value,
                  },
                },
              })
            }
          />
        </Box>
      </SettingsRow>
      <SettingsRow
        isDisabled={isReadOnly}
        data-section="allowed-documents"
        label={
          <Text as="span">
            <FormattedMessage
              id="component.petition-compose-id-verification-settings.allowed-documents"
              defaultMessage="Identify with"
            />
          </Text>
        }
        controlId="allowed-documents"
      >
        <Box flex={1}>
          <MultiCheckboxSimpleSelect
            size="sm"
            options={documents}
            value={field.options.config.allowedDocuments}
            isClearable={false}
            isSearchable={false}
            onChange={(values) => {
              if (values.length === 0) {
                return;
              }
              onFieldEdit(field.id, {
                options: {
                  config: {
                    ...field.options.config,
                    allowedDocuments: values,
                  },
                },
              });
            }}
            components={{ ValueContainer }}
            styles={{
              valueContainer: (styles) => {
                return omit(styles, ["flexWrap"]);
              },
            }}
          />
        </Box>
      </SettingsRow>
    </>
  );
}

function ValueContainer({
  innerProps,
  children,
  ...props
}: ValueContainerProps<UnwrapArray<ReturnType<typeof useTypesOfDocuments>>>) {
  return (
    <components.ValueContainer innerProps={{ ...innerProps } as any} {...props}>
      {props.getValue().length === 1 ? (
        <Box as="span" noOfLines={1}>
          {props.getValue()[0].label}
        </Box>
      ) : (
        <Box as="span" fontStyle="italic">
          {props.getValue().length === props.selectProps.options.length ? (
            <FormattedMessage
              id="component.petition-compose-id-verification-settings.all"
              defaultMessage="Any document type"
            />
          ) : (
            <FormattedMessage
              id="component.petition-compose-id-verification-settings.n-documents-selected"
              defaultMessage="{count} selected"
              values={{ count: props.getValue().length }}
            />
          )}
        </Box>
      )}
      {Children.toArray(children).at(-1)}
    </components.ValueContainer>
  );
}

function useTypesOfDocuments() {
  const intl = useIntl();
  return useMemo(
    () => [
      {
        value: "ID_CARD",
        label: intl.formatMessage({
          id: "component.select-type-of-documents-dialog.id-card",
          defaultMessage: "National ID card",
        }),
      },
      {
        value: "PASSPORT",
        label: intl.formatMessage({
          id: "component.select-type-of-documents-dialog.passport",
          defaultMessage: "Passport",
        }),
      },
      {
        value: "RESIDENCE_PERMIT",
        label: intl.formatMessage({
          id: "component.select-type-of-documents-dialog.residence-permit",
          defaultMessage: "Residence permit",
        }),
      },
      {
        value: "DRIVER_LICENSE",
        label: intl.formatMessage({
          id: "component.select-type-of-documents-dialog.driver-license",
          defaultMessage: "Driver's license",
        }),
      },
    ],
    [intl.locale],
  );
}

type TypeOfVerificationValue = "SIMPLE" | "EXTENDED";
interface TypesOfVerificationSelectOption extends SimpleOption<TypeOfVerificationValue> {
  description: string;
}

function useTypesOfVerification() {
  const intl = useIntl();
  return useMemo<TypesOfVerificationSelectOption[]>(
    () => [
      {
        value: "SIMPLE",
        label: intl.formatMessage({
          id: "component.select-type-of-documents-dialog.simple",
          defaultMessage: "Simple",
        }),
        description: intl.formatMessage({
          id: "component.select-type-of-documents-dialog.simple-description",
          defaultMessage: "Identity document only",
        }),
      },
      {
        value: "EXTENDED",
        label: intl.formatMessage({
          id: "component.select-type-of-documents-dialog.extended",
          defaultMessage: "Extended",
        }),
        description: intl.formatMessage({
          id: "component.select-type-of-documents-dialog.extended-description",
          defaultMessage: "Identity card + Selfie",
        }),
      },
    ],
    [intl.locale],
  );
}

function Option(props: OptionProps<TypesOfVerificationSelectOption>) {
  return (
    <components.Option {...props}>
      <Stack spacing={0}>
        <Box>{props.data.label}</Box>
        <Box fontSize="xs" opacity={0.6}>
          {props.data.description}
        </Box>
      </Stack>
    </components.Option>
  );
}

PetitionComposeIdVerificationSettings.fragments = {
  PetitionField: gql`
    fragment PetitionComposeIdVerificationSettings_PetitionField on PetitionField {
      id
      options
    }
  `,
};
