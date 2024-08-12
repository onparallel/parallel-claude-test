import {
  Box,
  Button,
  Checkbox,
  CheckboxGroup,
  FormControl,
  FormErrorMessage,
  Link,
  ListItem,
  Stack,
  Text,
  UnorderedList,
} from "@chakra-ui/react";
import {
  SimpleOption,
  SimpleSelect,
  SimpleSelectProps,
} from "@parallel/components/common/SimpleSelect";
import { SmallPopover } from "@parallel/components/common/SmallPopover";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";
import { OptionProps, components } from "react-select";
import { PetitionComposeFieldSettingsProps } from "../PetitionComposeFieldSettings";
import { SettingsRow } from "../rows/SettingsRow";
import { SettingsRowConfigButton } from "../rows/SettingsRowConfigButton";

export type TypeOfVerificationValue = "SIMPLE" | "EXTENDED";

export function PetitionComposeIdVerificationSettings({
  petition,
  field,
  onFieldEdit,
  isReadOnly,
}: Pick<PetitionComposeFieldSettingsProps, "petition" | "field" | "onFieldEdit" | "isReadOnly">) {
  const allowedDocuments = field.options.config.allowedDocuments;

  const showSelectTypeOfDocumentsDialog = useSelectTypeOfDocumentsDialog();
  const handleAllowedDocumentsChange = async () => {
    try {
      const { documents } = await showSelectTypeOfDocumentsDialog({
        allowedDocuments,
      });
      onFieldEdit(field.id, {
        options: {
          ...field.options,
          config: {
            ...field.options.config,
            allowedDocuments: documents,
          },
        },
      });
    } catch {}
  };

  const handleTypeOfVerificationChange = (value: TypeOfVerificationValue | null) => {
    if (!value) return;

    onFieldEdit(field.id, {
      options: {
        ...field.options,
        config: {
          ...field.options.config,
          type: value,
        },
      },
    });
  };

  const documents = useTypeOfDocuments();
  const typesOfVerification = useTypesOfVerification();
  const selectedTypeOfVerification = typesOfVerification.find(
    ({ value }) => value === field.options.config.type,
  );

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
      >
        <Box flex="1">
          <TypesOfVerificationSelect
            value={selectedTypeOfVerification?.value ?? "SIMPLE"}
            onChange={handleTypeOfVerificationChange}
            isDisabled={isReadOnly}
          />
        </Box>
      </SettingsRow>
      <SettingsRowConfigButton
        isDisabled={isReadOnly}
        data-section="allowed-documents"
        label={
          <Text as="span">
            <FormattedMessage
              id="component.petition-compose-id-verification-settings.allowed-documents"
              defaultMessage="Allowed documents"
            />
          </Text>
        }
        onConfig={() => handleAllowedDocumentsChange()}
        controlId="allowed-documents"
      >
        <SmallPopover
          content={
            <UnorderedList>
              {documents
                .filter(({ value }) => allowedDocuments.includes(value))
                .map(({ label }) => (
                  <ListItem key={label}>{label}</ListItem>
                ))}
            </UnorderedList>
          }
          width="auto"
        >
          <Text as={Link} fontSize="sm">
            {documents.length === allowedDocuments.length ? (
              <FormattedMessage
                id="component.petition-compose-id-verification-settings.all"
                defaultMessage="All"
              />
            ) : (
              <FormattedMessage
                id="component.petition-compose-id-verification-settings.x-documents-selected"
                defaultMessage="{count} selected"
                values={{ count: allowedDocuments.length }}
              />
            )}
          </Text>
        </SmallPopover>
      </SettingsRowConfigButton>
    </>
  );
}

interface SelectTypeOfDocumentsDialogProps {
  allowedDocuments?: string[];
}
interface SelectTypeOfDocumentsDialogData {
  documents: string[];
}

function SelectTypeOfDocumentsDialog({
  allowedDocuments,
  ...props
}: DialogProps<SelectTypeOfDocumentsDialogProps, SelectTypeOfDocumentsDialogData>) {
  const {
    handleSubmit,
    formState: { errors },
    control,
  } = useForm<SelectTypeOfDocumentsDialogData>({
    mode: "onSubmit",
    defaultValues: {
      documents: allowedDocuments ?? [],
    },
  });

  const documents = useTypeOfDocuments();
  return (
    <ConfirmDialog
      size="xl"
      hasCloseButton
      content={{
        as: "form",
        onSubmit: handleSubmit((data) => props.onResolve(data)),
      }}
      header={
        <Text>
          <FormattedMessage
            id="component.select-type-of-documents-dialog.title"
            defaultMessage="Types of documents"
          />
        </Text>
      }
      body={
        <Stack>
          <Text>
            <FormattedMessage
              id="component.select-type-of-documents-dialog.description"
              defaultMessage="Select the documents you want to allow in the validation."
            />
          </Text>
          <Controller
            name={"documents"}
            control={control}
            rules={{ required: true }}
            render={({ field: { onChange, value } }) => {
              return (
                <CheckboxGroup onChange={onChange} value={value}>
                  <Stack>
                    {documents.map(({ value, label }) => {
                      return (
                        <Checkbox key={value} value={value}>
                          {label}
                        </Checkbox>
                      );
                    })}
                  </Stack>
                </CheckboxGroup>
              );
            }}
          />
          <FormControl isInvalid={!!errors.documents}>
            <FormErrorMessage>
              <FormattedMessage
                id="component.select-type-of-documents-dialog.error-message"
                defaultMessage="Please, select at least one document type."
              />
            </FormErrorMessage>
          </FormControl>
        </Stack>
      }
      confirm={
        <Button colorScheme="primary" variant="solid" type="submit">
          <FormattedMessage id="generic.save" defaultMessage="Save" />
        </Button>
      }
      {...props}
    />
  );
}

function useSelectTypeOfDocumentsDialog() {
  return useDialog(SelectTypeOfDocumentsDialog);
}

function useTypeOfDocuments() {
  const intl = useIntl();
  return useMemo(
    () => [
      {
        value: "ID_CARD",
        label: intl.formatMessage({
          id: "component.select-type-of-documents-dialog.id-card",
          defaultMessage: "National identity card",
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

export function TypesOfVerificationSelect({
  value,

  ...props
}: Omit<
  SimpleSelectProps<TypeOfVerificationValue, false, TypesOfVerificationSelectOption>,
  "options"
>) {
  const options = useTypesOfVerification();

  return (
    <SimpleSelect
      isSearchable={false}
      isClearable={false}
      size="sm"
      options={options}
      value={value}
      components={{ Option }}
      {...props}
    />
  );
}

function Option(props: OptionProps<TypesOfVerificationSelectOption>) {
  return (
    <components.Option {...props}>
      <Stack spacing={0} fontSize="md">
        <Text>{props.data.label}</Text>
        <Text fontSize="sm" color={props.isSelected ? "white" : "gray.600"}>
          {props.data.description}
        </Text>
      </Stack>
    </components.Option>
  );
}
