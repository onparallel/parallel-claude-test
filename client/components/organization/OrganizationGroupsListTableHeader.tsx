import { Box, Button, Stack } from "@chakra-ui/react";
import { RepeatIcon } from "@parallel/chakra/icons";
import { FormattedMessage, useIntl } from "react-intl";
import { IconButtonWithTooltip } from "../common/IconButtonWithTooltip";
import { SearchInput } from "../common/SearchInput";
import { Spacer } from "../common/Spacer";
import { WhenOrgRole } from "../common/WhenOrgRole";

export type OrganizationGroupsListTableHeaderProps = {
  search: string | null;
  onSearchChange: (value: string | null) => void;
  onReload: () => void;
  onCreateGroup: () => void;
};

export function OrganizationGroupsListTableHeader({
  search,
  onSearchChange,
  onReload,
  onCreateGroup,
}: OrganizationGroupsListTableHeaderProps) {
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
      <WhenOrgRole role="ADMIN">
        <Spacer />
        <Button colorScheme="primary" onClick={onCreateGroup}>
          <FormattedMessage id="organization-groups.create-group" defaultMessage="Create team" />
        </Button>
      </WhenOrgRole>
    </Stack>
  );
}
