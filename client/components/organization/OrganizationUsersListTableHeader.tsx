import { Box, Button, Stack } from "@chakra-ui/react";
import { RepeatIcon, UserPlusIcon } from "@parallel/chakra/icons";
import { FormattedMessage, useIntl } from "react-intl";
import { IconButtonWithTooltip } from "../common/IconButtonWithTooltip";
import { SearchInput } from "../common/SearchInput";
import { Spacer } from "../common/Spacer";
import { WhenOrgRole } from "../common/WhenOrgRole";

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
        {hasSsoProvider ? null : (
          <Button
            isDisabled={isCreateUserButtonDisabled}
            colorScheme="primary"
            leftIcon={<UserPlusIcon fontSize="18px" />}
            onClick={onCreateUser}
          >
            <FormattedMessage id="generic.invite-user" defaultMessage="Invite user" />
          </Button>
        )}
      </WhenOrgRole>
    </Stack>
  );
}
