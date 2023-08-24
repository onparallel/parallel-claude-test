import { Button, Image, Stack, Text } from "@chakra-ui/react";
import { FormattedMessage } from "react-intl";
import { Link, NakedLink } from "./Link";
import { useHasPermission } from "@parallel/utils/useHasPermission";

interface UserDropdownEmptyProps {
  search: string;
  canCreateUsers?: boolean;
  includeGroups?: boolean;
}

export function UserDropdownEmpty({
  search,
  canCreateUsers,
  includeGroups,
}: UserDropdownEmptyProps) {
  const userCanListOrgUsers = useHasPermission("USERS:LIST_USERS");
  return (
    <Stack alignItems="center" textAlign="center" padding={4} spacing={4} fontSize="sm">
      {search ? (
        <>
          <Image
            flex={0}
            maxWidth="120px"
            width="100%"
            src={`${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/search/empty-search.svg`}
          />
          <Text as="strong">
            <FormattedMessage
              id="component.user-dropdown-empty.no-options"
              defaultMessage="Can't find someone?"
            />
          </Text>
          {canCreateUsers ? (
            <NakedLink href="/app/organization/users?dialog=true">
              <Button colorScheme="primary">
                <FormattedMessage
                  id="component.user-dropdown-empty.invite-button"
                  defaultMessage="Invite people"
                />
              </Button>
            </NakedLink>
          ) : (
            <Text>
              <FormattedMessage
                id="component.user-dropdown-empty.no-options-contact-admin"
                defaultMessage="Contact with <a>the owner</a> of your organization to create them an account."
                values={{
                  a: (chunks: any) =>
                    userCanListOrgUsers ? (
                      <Link href={`/app/organization/users`}>{chunks}</Link>
                    ) : (
                      chunks
                    ),
                }}
              />
            </Text>
          )}
        </>
      ) : (
        <Text as="div" color="gray.400">
          {includeGroups ? (
            <FormattedMessage
              id="component.user-dropdown-empty.search-hint-include-groups"
              defaultMessage="Search for existing users and teams"
            />
          ) : (
            <FormattedMessage
              id="component.user-dropdown-empty.search-hint"
              defaultMessage="Search for existing users"
            />
          )}
        </Text>
      )}
    </Stack>
  );
}
