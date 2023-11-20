import { Box, Button, Stack } from "@chakra-ui/react";
import { RepeatIcon } from "@parallel/chakra/icons";
import { FormattedMessage, useIntl } from "react-intl";
import { IconButtonWithTooltip } from "../common/IconButtonWithTooltip";
import { SearchInput } from "../common/SearchInput";
import { Spacer } from "../common/Spacer";
import { useEffect, useRef } from "react";

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
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <Stack direction="row" alignItems="center" padding={2}>
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
      <Box flex="0 1 400px">
        <SearchInput
          ref={inputRef}
          value={search ?? ""}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </Box>
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
