import { Box, Button, Stack } from "@chakra-ui/react";
import { RepeatIcon } from "@parallel/chakra/icons";
import { FormattedMessage, useIntl } from "react-intl";
import { IconButtonWithTooltip } from "../common/IconButtonWithTooltip";
import { SearchInput } from "../common/SearchInput";
import { Spacer } from "../common/Spacer";

export interface AdminOrganizationsListTableHeaderProps {
  search: string | null;
  onSearchChange(value: string | null): void;
  onReload(): void;
  onCreateClick(): void;
}

export function AdminOrganizationsListTableHeader({
  search,
  onSearchChange,
  onReload,
  onCreateClick,
}: AdminOrganizationsListTableHeaderProps) {
  const intl = useIntl();

  return (
    <Stack direction="row" alignItems="center" padding={2}>
      <Box flex="0 1 400px">
        <SearchInput value={search ?? ""} onChange={(e) => onSearchChange(e.target.value)} />
      </Box>
      <IconButtonWithTooltip
        onClick={onReload}
        icon={<RepeatIcon />}
        placement="bottom"
        variant="outline"
        label={intl.formatMessage({
          id: "generic.reload-data",
          defaultMessage: "Reload",
        })}
      />
      <Spacer />
      <Box>
        <Button colorScheme="primary" onClick={onCreateClick}>
          <FormattedMessage
            id="component.admin-organizations-list-table-header.create-organization"
            defaultMessage="Create organization"
          />
        </Button>
      </Box>
    </Stack>
  );
}
