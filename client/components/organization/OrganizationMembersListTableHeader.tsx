import { Box, Button, HStack } from "@chakra-ui/react";
import { RepeatIcon } from "@parallel/chakra/icons";
import { FormattedMessage, useIntl } from "react-intl";
import { IconButtonWithTooltip } from "../common/IconButtonWithTooltip";
import { SearchInput } from "../common/SearchInput";

export interface OrganizationMembersListTableHeaderProps {
  search: string | null;
  onSearchChange(value: string | null): void;
  onReload(): void;
  onInviteClick(): void;
}

export function OrganizationMembersListTableHeader({
  search,
  onSearchChange,
  onReload,
  onInviteClick,
}: OrganizationMembersListTableHeaderProps) {
  const intl = useIntl();

  return (
    <HStack padding={2} justifyContent="space-between">
      <HStack>
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
      </HStack>
      <Button colorScheme="primary" onClick={onInviteClick}>
        <FormattedMessage id="generic.invite-user" defaultMessage="Invite user" />
      </Button>
    </HStack>
  );
}
