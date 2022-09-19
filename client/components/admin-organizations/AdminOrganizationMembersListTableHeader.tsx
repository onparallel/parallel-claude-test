import { Badge, Box, Button, Stack } from "@chakra-ui/react";
import { RepeatIcon } from "@parallel/chakra/icons";
import { FormattedMessage, useIntl } from "react-intl";
import { IconButtonWithTooltip } from "../common/IconButtonWithTooltip";
import { SearchInput } from "../common/SearchInput";
import { Spacer } from "../common/Spacer";

export interface AdminOrganizationMembersListTableHeaderProps {
  search: string | null;
  onSearchChange(value: string | null): void;
  onReload(): void;
  onInviteClick(): void;
  hasSsoProvider: boolean;
}

export function AdminOrganizationMembersListTableHeader({
  search,
  onSearchChange,
  onReload,
  onInviteClick,
  hasSsoProvider,
}: AdminOrganizationMembersListTableHeaderProps) {
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
      {hasSsoProvider ? (
        <Badge colorScheme="primary">
          <FormattedMessage
            id="component.organization-memebers-list-table-headr.sso-provider"
            defaultMessage="SSO provider"
          />
        </Badge>
      ) : null}
      <Spacer />
      <Box>
        <Button colorScheme="primary" onClick={onInviteClick}>
          <FormattedMessage id="generic.invite-user" defaultMessage="Invite user" />
        </Button>
      </Box>
    </Stack>
  );
}
