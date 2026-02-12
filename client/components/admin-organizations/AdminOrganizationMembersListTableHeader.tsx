import { Badge } from "@chakra-ui/react";
import { RepeatIcon } from "@parallel/chakra/icons";
import { Box, Button, HStack, Stack, Text } from "@parallel/components/ui";
import { FormattedMessage, useIntl } from "react-intl";
import { IconButtonWithTooltip } from "../common/IconButtonWithTooltip";
import { SearchInput } from "../common/SearchInput";
import { Spacer } from "../common/Spacer";

export interface AdminOrganizationMembersListTableHeaderProps {
  search: string | null;
  onSearchChange(value: string | null): void;
  onReload(): void;
  onInviteClick(): void;
  onChangeLimit(): void;
  usersCount: number;
  usersLimit: number;
  hasSsoProvider: boolean;
  canInviteUsers: boolean;
}

export function AdminOrganizationMembersListTableHeader({
  search,
  onSearchChange,
  onReload,
  onInviteClick,
  onChangeLimit,
  usersCount,
  usersLimit,
  hasSsoProvider,
  canInviteUsers,
}: AdminOrganizationMembersListTableHeaderProps) {
  const intl = useIntl();

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
        <SearchInput value={search ?? ""} onChange={(e) => onSearchChange(e.target.value)} />
      </Box>
      {hasSsoProvider ? (
        <Badge colorScheme="primary">
          <FormattedMessage
            id="component.organization-memebers-list-table-header.sso-provider"
            defaultMessage="SSO provider"
          />
        </Badge>
      ) : null}
      <Text>
        <FormattedMessage
          id="component.organization-memebers-list-table-header.users-usage"
          defaultMessage="<b>Usage:</b> {usersCount}/{usersLimit} users"
          values={{ usersCount, usersLimit }}
        />
      </Text>
      <Spacer />
      <HStack>
        <Button onClick={onChangeLimit}>
          <FormattedMessage
            id="component.organization-memebers-list-table-header.change-limit"
            defaultMessage="Change limit"
          />
        </Button>
        <Button colorPalette="primary" disabled={!canInviteUsers} onClick={onInviteClick}>
          <FormattedMessage id="generic.invite-user" defaultMessage="Invite user" />
        </Button>
      </HStack>
    </Stack>
  );
}
