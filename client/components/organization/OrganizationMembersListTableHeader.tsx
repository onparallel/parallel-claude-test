import { Box, Stack } from "@chakra-ui/react";
import { RepeatIcon } from "@parallel/chakra/icons";
import { useIntl } from "react-intl";
import { IconButtonWithTooltip } from "../common/IconButtonWithTooltip";
import { SearchInput } from "../common/SearchInput";

export type OrganizationMembersListTableHeaderProps = {
  search: string | null;
  onSearchChange: (value: string | null) => void;
  onReload: () => void;
};

export function OrganizationMembersListTableHeader({
  search,
  onSearchChange,
  onReload,
}: OrganizationMembersListTableHeaderProps) {
  const intl = useIntl();

  return (
    <Stack direction="row" padding={2}>
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
    </Stack>
  );
}
