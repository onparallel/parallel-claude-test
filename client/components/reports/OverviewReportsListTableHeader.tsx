import { Box, ButtonGroup, Stack, useRadioGroup } from "@chakra-ui/react";
import { DownloadIcon } from "@parallel/chakra/icons";
import { FormattedMessage, useIntl } from "react-intl";
import { IconButtonWithTooltip } from "../common/IconButtonWithTooltip";
import { RadioButton } from "../common/RadioButton";
import { SearchInput } from "../common/SearchInput";
import { Spacer } from "../common/Spacer";

export type OverviewTableType = "STATUS" | "TIME";

export type OverviewReportsListTableHeaderProps = {
  tableType: OverviewTableType;
  search: string | null;
  onSearchChange: (value: string | null) => void;
  onChangeTableType: (value: OverviewTableType) => void;
};

export function OverviewReportsListTableHeader({
  tableType,
  search,
  onSearchChange,
  onChangeTableType,
}: OverviewReportsListTableHeaderProps) {
  const intl = useIntl();

  const { getRootProps, getRadioProps } = useRadioGroup({
    name: "categories",
    value: tableType,
    onChange: onChangeTableType,
  });

  return (
    <Stack direction="row" padding={2}>
      <Box flex="0 1 400px">
        <SearchInput value={search ?? ""} onChange={(e) => onSearchChange(e.target.value)} />
      </Box>
      <Spacer />
      <ButtonGroup isAttached variant="outline" {...getRootProps()}>
        <RadioButton {...getRadioProps({ value: "STATUS" })} minWidth="fit-content">
          <FormattedMessage
            id="component.overview-reports-list-table-header.status"
            defaultMessage="Status"
          />
        </RadioButton>
        <RadioButton {...getRadioProps({ value: "TIME" })}>
          <FormattedMessage
            id="component.overview-reports-list-table-header.time"
            defaultMessage="Time"
          />
        </RadioButton>
      </ButtonGroup>
      <IconButtonWithTooltip
        icon={<DownloadIcon />}
        label={intl.formatMessage({
          id: "component.overview-reports-list-table-header.download-report",
          defaultMessage: "Download report",
        })}
      />
    </Stack>
  );
}
