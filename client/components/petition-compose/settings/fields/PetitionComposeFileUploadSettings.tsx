import { gql } from "@apollo/client";
import { Box } from "@chakra-ui/react";
import { MultiCheckboxSimpleSelect } from "@parallel/components/common/MultiCheckboxSimpleSelect";
import { SimpleSelect, useSimpleSelectOptions } from "@parallel/components/common/SimpleSelect";
import { DocumentProcessingType } from "@parallel/graphql/__types";
import { FieldOptions, FileUploadAccepts } from "@parallel/utils/fieldOptions";
import { UnwrapArray } from "@parallel/utils/types";
import { useFileUploadFormats } from "@parallel/utils/useFileUploadFormats";
import { ValueProps } from "@parallel/utils/ValueProps";
import { Children, useMemo } from "react";
import { FormattedList, FormattedMessage, useIntl } from "react-intl";
import { ValueContainerProps, components } from "react-select";
import { difference, intersectionWith, isNonNullish } from "remeda";
import { PetitionComposeFieldSettingsProps } from "../PetitionComposeFieldSettings";
import { SettingsRow } from "../rows/SettingsRow";
import { SettingsRowSwitch } from "../rows/SettingsRowSwitch";

export function PetitionComposeFileUploadSettings({
  field,
  onFieldEdit,
  isReadOnly,
  user,
}: Pick<PetitionComposeFieldSettingsProps, "field" | "onFieldEdit" | "isReadOnly" | "user">) {
  const intl = useIntl();

  const options = field.options as FieldOptions["FILE_UPLOAD"];

  const documentTypes = useSimpleSelectOptions<DocumentProcessingType>(
    (intl) => [
      {
        label: intl.formatMessage({
          id: "component.petition-compose-file-upload-settings.document-type-payslip",
          defaultMessage: "Payslip",
        }),
        value: "PAYSLIP",
      },
    ],
    [],
  );

  const isAiDocumentProcessingActive =
    user.organization.hasAiCompletionIntegration && user.hasDocumentProcessingAccess;
  return (
    <>
      {user.organization.hasDocumentProcessingIntegration ? (
        <SettingsRow
          controlId="document-type"
          textStyle={isReadOnly ? "muted" : undefined}
          label={
            <FormattedMessage
              id="component.petition-compose-file-upload-settings.document-type"
              defaultMessage="Document type"
            />
          }
          isReadOnly={isReadOnly}
          description={
            <FormattedMessage
              id="component.petition-compose-file-upload-settings.document-type-description"
              defaultMessage="When uploading the selected document type, the information will be extracted for quicker review."
            />
          }
        >
          <Box flex={1}>
            <SimpleSelect
              data-testid="petition-compose-file-upload-type-select"
              size="sm"
              isClearable
              isDisabled={isReadOnly}
              options={documentTypes}
              value={options.documentProcessing?.processDocumentAs ?? null}
              onChange={(processDocumentAs) => {
                onFieldEdit(field.id, {
                  options: {
                    ...field.options,
                    documentProcessing: processDocumentAs
                      ? { integrationId: null, processDocumentAs }
                      : null,
                  },
                });
              }}
              placeholder={intl.formatMessage({
                id: "generic.all-types",
                defaultMessage: "All",
              })}
            />
          </Box>
        </SettingsRow>
      ) : (
        <SettingsRowSwitch
          isChecked={isAiDocumentProcessingActive && !!field.options.processDocument}
          onChange={(processDocument) =>
            onFieldEdit(field.id, {
              options: {
                processDocument,
              },
            })
          }
          isDisabled={isReadOnly || !isAiDocumentProcessingActive}
          label={
            <FormattedMessage
              id="component.petition-compose-file-upload-settings.ai-document-processing"
              defaultMessage="AI document processing"
            />
          }
          isReadOnly={isReadOnly}
          description={
            <FormattedMessage
              id="component.petition-compose-file-upload-settings.ai-document-processing-description"
              defaultMessage="Enable AI document processing to automatically extract information from uploaded documents."
            />
          }
          showPaidBadge={!isAiDocumentProcessingActive}
          contactMessage={intl.formatMessage(
            {
              id: "generic.more-information-about",
              defaultMessage: "Hi, I would like more information about {name}.",
            },
            {
              name: intl.formatMessage({
                id: "component.petition-compose-file-upload-settings.ai-document-processing",
                defaultMessage: "AI document processing",
              }),
            },
          )}
          controlId="ai-document-processing"
        />
      )}

      <SettingsRow
        controlId="allowed-format"
        textStyle={isReadOnly ? "muted" : undefined}
        label={
          <FormattedMessage
            id="component.petition-compose-file-upload-settings.allowed-formats"
            defaultMessage="Allowed formats"
          />
        }
        isReadOnly={
          isReadOnly ||
          isNonNullish(field.options.documentProcessing) ||
          (isAiDocumentProcessingActive && !!field.options.processDocument)
        }
      >
        <Box flex={1}>
          <AllowedFormatsSelect
            value={options.accepts}
            onChange={(accepts) => onFieldEdit(field.id, { options: { accepts } })}
          />
        </Box>
      </SettingsRow>
    </>
  );
}

function AllowedFormatsSelect({
  value,
  onChange,
}: ValueProps<FieldOptions["FILE_UPLOAD"]["accepts"]>) {
  const options = useFileUploadFormats();
  const _value = useMemo(() => (value === null ? ["ALL" as const] : value), [value?.join(",")]);
  return (
    <MultiCheckboxSimpleSelect
      size="sm"
      options={options}
      value={_value}
      isClearable={false}
      isSearchable={false}
      formatOptionLabel={(option) => (
        <Box as="span">
          <Box as="span">{option.label}</Box>
          {option.extensions ? (
            <Box as="span" opacity={0.6} fontSize="0.8em" marginStart={1}>
              <FormattedList
                value={option.extensions.map((ext) => `.${ext}`)}
                type="conjunction"
                style="narrow"
              />
            </Box>
          ) : null}
        </Box>
      )}
      onChange={(values, meta) => {
        if (meta.action === "select-option") {
          if (meta.option!.value === "ALL") {
            onChange(null);
          } else {
            onChange(
              // doing it this way so formats are in same order as defined in hook
              intersectionWith(
                options,
                // remove ALL when anything is selected
                difference(values, ["ALL"]),
                (f, v) => f.value === v,
              ).map((f) => f.value) as FileUploadAccepts[],
            );
          }
        } else if (meta.action === "deselect-option") {
          if (meta.option!.value === "ALL") {
            // cant deselect ALL
          } else {
            // if anything is selected then ALL is selected
            onChange(values.length === 0 ? null : (values as FileUploadAccepts[]));
          }
        } else {
          //nothing
        }
      }}
      components={{ ValueContainer }}
    />
  );
}

function ValueContainer({
  innerProps,
  children,
  ...props
}: ValueContainerProps<UnwrapArray<ReturnType<typeof useFileUploadFormats>>>) {
  return (
    <components.ValueContainer innerProps={{ ...innerProps } as any} {...props}>
      <FormattedList type="conjunction" value={props.getValue().map((v) => v.label)} />
      {Children.toArray(children).at(-1)}
    </components.ValueContainer>
  );
}

PetitionComposeFileUploadSettings.fragments = {
  User: gql`
    fragment PetitionComposeFileUploadSettings_User on User {
      hasDocumentProcessingAccess: hasFeatureFlag(featureFlag: DOCUMENT_PROCESSING)
      organization {
        hasDocumentProcessingIntegration: hasIntegration(integration: DOCUMENT_PROCESSING)
        hasAiCompletionIntegration: hasIntegration(integration: AI_COMPLETION)
      }
    }
  `,
  PetitionField: gql`
    fragment PetitionComposeFileUploadSettings_PetitionField on PetitionField {
      id
      options
    }
  `,
};
