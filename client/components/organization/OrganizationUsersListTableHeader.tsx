import { RepeatIcon, UserPlusIcon } from "@parallel/chakra/icons";
import { Box, Button, Stack } from "@parallel/components/ui";
import { FormattedMessage, useIntl } from "react-intl";
import { IconButtonWithTooltip } from "../common/IconButtonWithTooltip";
import { SearchInput } from "../common/SearchInput";
import { Spacer } from "../common/Spacer";
import { WhenPermission } from "../common/WhenPermission";

export interface OrganizationUsersListTableHeaderProps {
  search: string | null;
  hasSsoProvider: boolean;
  isCreateUserButtonDisabled?: boolean;
  isActivateUserButtonDisabled?: boolean;
  onSearchChange(value: string | null): void;
  onReload(): void;
  onCreateUser(): void;
}

export function OrganizationUsersListTableHeader({
  search,
  hasSsoProvider,
  isCreateUserButtonDisabled,
  isActivateUserButtonDisabled,
  onSearchChange,
  onReload,
  onCreateUser,
}: OrganizationUsersListTableHeaderProps) {
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
      <WhenPermission permission="USERS:CRUD_USERS">
        <Spacer />
        {hasSsoProvider ? null : (
          <Button
            disabled={isCreateUserButtonDisabled}
            colorPalette="primary"
            leftIcon={<UserPlusIcon fontSize="18px" />}
            onClick={onCreateUser}
          >
            <FormattedMessage id="generic.invite-user" defaultMessage="Invite user" />
          </Button>
        )}
      </WhenPermission>
    </Stack>
  );
}
