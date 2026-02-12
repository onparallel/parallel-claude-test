import { RepeatIcon, UserPlusIcon } from "@parallel/chakra/icons";
import { Box, Button, Stack, Text } from "@parallel/components/ui";
import { FormattedMessage, useIntl } from "react-intl";
import { IconButtonWithTooltip } from "../common/IconButtonWithTooltip";
import { SearchInput } from "../common/SearchInput";
import { Spacer } from "../common/Spacer";
import { WhenPermission } from "../common/WhenPermission";

export interface OrganizationGroupListTableHeaderProps {
  search: string | null;
  onSearchChange: (value: string | null) => void;
  onReload: () => void;
  onAddMember: () => void;
  canAddMember?: boolean;
}

export function OrganizationGroupListTableHeader({
  search,
  canAddMember,
  onSearchChange,
  onReload,
  onAddMember,
}: OrganizationGroupListTableHeaderProps) {
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
        <Button
          colorPalette="primary"
          leftIcon={<UserPlusIcon fontSize="18px" />}
          onClick={onAddMember}
          disabled={!canAddMember}
        >
          <Text as="span" whiteSpace="nowrap" overflow="hidden" textOverflow="ellipsis">
            <FormattedMessage id="organization-groups.add-user" defaultMessage="Add user" />
          </Text>
        </Button>
      </WhenPermission>
    </Stack>
  );
}
