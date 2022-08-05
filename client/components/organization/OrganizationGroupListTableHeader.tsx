import { Box, Button, Stack, Text } from "@chakra-ui/react";
import { RepeatIcon, UserPlusIcon } from "@parallel/chakra/icons";
import { FormattedMessage, useIntl } from "react-intl";
import { IconButtonWithTooltip } from "../common/IconButtonWithTooltip";
import { SearchInput } from "../common/SearchInput";
import { Spacer } from "../common/Spacer";
import { WhenOrgRole } from "../common/WhenOrgRole";

export type OrganizationGroupListTableHeaderProps = {
  search: string | null;
  onSearchChange: (value: string | null) => void;
  onReload: () => void;
  onAddMember: () => void;
};

export function OrganizationGroupListTableHeader({
  search,
  onSearchChange,
  onReload,
  onAddMember,
}: OrganizationGroupListTableHeaderProps) {
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
        <Button
          colorScheme="primary"
          leftIcon={<UserPlusIcon fontSize="18px" />}
          onClick={onAddMember}
        >
          <Text as="span" isTruncated>
            <FormattedMessage id="organization-groups.add-user" defaultMessage="Add user" />
          </Text>
        </Button>
      </WhenOrgRole>
    </Stack>
  );
}
