import { gql } from "@apollo/client";
import { Avatar, Flex, List, ListItem, PopoverProps, Stack, Text } from "@chakra-ui/react";
import { ArrowShortRightIcon, UsersIcon } from "@parallel/chakra/icons";
import { TemplateIconDefaultPermissions_TemplateDefaultPermissionFragment } from "@parallel/graphql/__types";
import { FormattedMessage } from "react-intl";
import { SmallPopover } from "../common/SmallPopover";
import { UserAvatar } from "../common/UserAvatar";

export interface TemplateIconDefaultPermissionsProps extends PopoverProps {
  defaultPermissions: TemplateIconDefaultPermissions_TemplateDefaultPermissionFragment[];
}

export function TemplateIconDefaultPermissions({
  defaultPermissions,
  ...props
}: TemplateIconDefaultPermissionsProps) {
  return (
    <SmallPopover
      content={
        <Stack fontSize="sm">
          <Text>
            <FormattedMessage
              id="component.template-icon-default-permissions.text"
              defaultMessage="Petitions will be assigned to:"
            />
          </Text>
          <Stack as={List}>
            {defaultPermissions.map((p) => {
              const permissionType =
                p.permissionType === "OWNER" ? (
                  <FormattedMessage id="petition-permission-type.owner" defaultMessage="Owner" />
                ) : p.permissionType === "WRITE" ? (
                  <FormattedMessage id="petition-permission-type.write" defaultMessage="Editor" />
                ) : null;

              return (
                <Flex key={p.id} as={ListItem} alignItems="center">
                  {p.__typename === "TemplateDefaultUserPermission" ? (
                    <>
                      <UserAvatar size="xs" user={p.user} />
                      <Text flex="1" marginLeft={2} isTruncated>
                        {p.user.fullName}{" "}
                        <Text as="span" fontSize="xs" color="gray.600">
                          ({permissionType})
                        </Text>
                      </Text>
                    </>
                  ) : p.__typename === "TemplateDefaultUserGroupPermission" ? (
                    <>
                      <Avatar
                        size="xs"
                        backgroundColor="gray.200"
                        icon={<UsersIcon boxSize={3.5} />}
                      />
                      <Text flex="1" marginLeft={2} isTruncated>
                        {p.group.name}{" "}
                        <Text as="span" fontSize="xs" color="gray.600">
                          ({permissionType})
                        </Text>
                      </Text>
                    </>
                  ) : null}
                </Flex>
              );
            })}
          </Stack>
        </Stack>
      }
      width="auto"
      {...props}
    >
      <ArrowShortRightIcon color="gray.600" boxSize={4} />
    </SmallPopover>
  );
}

TemplateIconDefaultPermissions.fragments = {
  TemplateDefaultPermission: gql`
    fragment TemplateIconDefaultPermissions_TemplateDefaultPermission on TemplateDefaultPermission {
      id
      permissionType
      ... on TemplateDefaultUserPermission {
        user {
          id
          fullName
          ...UserAvatar_User
        }
      }
      ... on TemplateDefaultUserGroupPermission {
        group {
          id
          name
          initials
        }
      }
    }
    ${UserAvatar.fragments.User}
  `,
};
