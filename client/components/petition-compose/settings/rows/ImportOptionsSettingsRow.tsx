import { gql } from "@apollo/client";
import { Box, Button } from "@chakra-ui/react";
import { UpdatePetitionFieldInput } from "@parallel/graphql/__types";
import { FormattedMessage, IntlShape, useIntl } from "react-intl";
import { SettingsRow } from "./SettingsRow";

import { useImportSelectOptionsDialog } from "@parallel/components/common/dialogs/ImportSelectOptionsDialog";
import { ImportOptionsSettingsRow_PetitionFieldFragment } from "@parallel/graphql/__types";
import { generateExcel } from "@parallel/utils/generateExcel";
import { parseValueLabelFromExcel } from "@parallel/utils/parseValueLabelFromExcel";
import { sanitizeFilenameWithSuffix } from "@parallel/utils/sanitizeFilenameWithSuffix";
import { times, zip } from "remeda";

export function ImportOptionsSettingsRow({
  field,
  onChange,
  isDisabled,
}: {
  field: ImportOptionsSettingsRow_PetitionFieldFragment;
  onChange: (data: UpdatePetitionFieldInput) => void;
  isDisabled?: boolean;
}) {
  const intl = useIntl();
  const showImportSelectOptionsDialog = useImportSelectOptionsDialog();
  const handleImportOptions = async () => {
    try {
      await showImportSelectOptionsDialog({
        hasOptions: field.options.values.length > 0,
        onDownloadEmptyOptions: async () => {
          await generateValueLabelExcel(intl, {
            fileName: sanitizeFilenameWithSuffix(
              intl.formatMessage({
                id: "component.import-options-settings-row.default-file-name",
                defaultMessage: "options",
              }),
              ".xlsx",
            ),
            values: [],
            labels: [],
          });
        },
        onDownloadExistingOptions: async () => {
          await generateValueLabelExcel(intl, {
            fileName: sanitizeFilenameWithSuffix(
              field.title ??
                intl.formatMessage({
                  id: "component.import-options-settings-row.default-file-name",
                  defaultMessage: "options",
                }),
              ".xlsx",
            ),
            values: field.options.values,
            labels: field.options.labels ?? null,
          });
        },
        onExcelDrop: async (file) => {
          const { values, labels } = await parseValueLabelFromExcel(file);
          await onChange({
            options: {
              ...field.options,
              values,
              labels,
              ...(field.type === "SELECT" ? { standardList: null } : {}),
            },
          });
        },
      });
    } catch {}
  };
  return (
    <SettingsRow
      label={
        <FormattedMessage
          id="component.import-options-settings-row.label"
          defaultMessage="Import options from Excel"
        />
      }
      description={
        <FormattedMessage
          id="component.import-options-settings-row.description-1"
          defaultMessage="Upload an <b>.xlsx file</b> to load the list of options."
        />
      }
      controlId="import-options-excel"
    >
      <Box>
        <Button
          size="sm"
          fontWeight="normal"
          fontSize="16px"
          isDisabled={isDisabled}
          onClick={handleImportOptions}
        >
          <FormattedMessage id="generic.import" defaultMessage="Import" />
        </Button>
      </Box>
    </SettingsRow>
  );
}

ImportOptionsSettingsRow.fragments = {
  PetitionField: gql`
    fragment ImportOptionsSettingsRow_PetitionField on PetitionField {
      id
      type
      title
      options
    }
  `,
};

async function generateValueLabelExcel(
  intl: IntlShape,
  {
    fileName,
    values,
    labels,
  }: {
    fileName: string;
    values: string[];
    labels: string[] | null;
  },
) {
  return await generateExcel({
    fileName,
    columns: [
      {
        key: "value",
        cell: {
          value: intl.formatMessage({
            id: "component.import-select-options-dialog.excel-header-value",
            defaultMessage: "Internal value",
          }),
          fontWeight: "bold",
        },
      },
      {
        key: "label",
        cell: {
          value: intl.formatMessage({
            id: "component.import-select-options-dialog.excel-header-label",
            defaultMessage: "Label (optional)",
          }),
          fontWeight: "bold",
        },
      },
    ],
    rows: zip(values, labels ?? times(values.length, () => null)).map(([value, label]) => ({
      value,
      label,
    })),
  });
}
