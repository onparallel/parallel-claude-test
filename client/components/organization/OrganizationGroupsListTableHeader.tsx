import { RepeatIcon } from "@parallel/chakra/icons";
import { Box, Button, Stack, Text } from "@parallel/components/ui";
import { FormattedMessage, useIntl } from "react-intl";
import { IconButtonWithTooltip } from "../common/IconButtonWithTooltip";
import { SearchInput } from "../common/SearchInput";
import { Spacer } from "../common/Spacer";
import { WhenPermission } from "../common/WhenPermission";

export interface OrganizationGroupsListTableHeaderProps {
  search: string | null;
  onSearchChange: (value: string | null) => void;
  onReload: () => void;
  onCreateGroup: () => void;
}

export function OrganizationGroupsListTableHeader({
  search,
  onSearchChange,
  onReload,
  onCreateGroup,
}: OrganizationGroupsListTableHeaderProps) {
  const intl = useIntl();
  return (
    <Stack direction="row" padding={2}>
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
        <SearchInput value={search ?? ""} onChange={(e) => onSearchChange(e.target.value)} />
      </Box>

      <WhenPermission permission="TEAMS:CRUD_TEAMS">
        <Spacer />
        <Button colorPalette="primary" onClick={onCreateGroup}>
          <Text as="span" whiteSpace="nowrap" overflow="hidden" textOverflow="ellipsis">
            <FormattedMessage id="organization-groups.create-group" defaultMessage="Create team" />
          </Text>
        </Button>
      </WhenPermission>
    </Stack>
  );
}
