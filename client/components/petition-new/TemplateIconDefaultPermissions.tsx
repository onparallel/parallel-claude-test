import { gql } from "@apollo/client";
import { Flex, List, ListItem, PopoverProps, Stack, Text } from "@chakra-ui/react";
import { ArrowShortRightIcon, UsersIcon } from "@parallel/chakra/icons";
import { TemplateIconDefaultPermissions_PetitionTemplateFragment } from "@parallel/graphql/__types";
import { FormattedMessage } from "react-intl";
import { SmallPopover } from "../common/SmallPopover";
import { SubscribedNotificationsIcon } from "../common/SubscribedNotificationsIcon";
import { UserAvatar } from "../common/UserAvatar";
import { UserGroupReference } from "../common/UserGroupReference";
import { Avatar } from "../ui";

export interface TemplateIconDefaultPermissionsProps extends PopoverProps {
  template: TemplateIconDefaultPermissions_PetitionTemplateFragment;
}

export function TemplateIconDefaultPermissions({
  template,
  ...props
}: TemplateIconDefaultPermissionsProps) {
  return (
    <SmallPopover
      content={
        <Stack fontSize="sm" width="auto" maxWidth="320px">
          <Text>
            <FormattedMessage
              id="component.template-icon-default-permissions.text"
              defaultMessage="Parallels will be assigned to:"
            />
          </Text>
          <Stack as={List}>
            {template.defaultPermissions.map((p) => {
              if (p.__typename === "TemplateDefaultUserPermission") {
                const effectiveDefaultPermissions = template.effectiveDefaultPermissions.find(
                  (e) => e.user.id === p.user.id,
                );

                const permissionType =
                  effectiveDefaultPermissions?.permissionType === "OWNER" ? (
                    <FormattedMessage
                      id="generic.petition-permission-type-owner"
                      defaultMessage="Owner"
                    />
                  ) : effectiveDefaultPermissions?.permissionType === "WRITE" ? (
                    <FormattedMessage
                      id="generic.petition-permission-type-write"
                      defaultMessage="Editor"
                    />
                  ) : effectiveDefaultPermissions?.permissionType === "READ" ? (
                    <FormattedMessage
                      id="generic.petition-permission-type-reader"
                      defaultMessage="Reader"
                    />
                  ) : null;

                return (
                  <Flex key={p.id} as={ListItem} alignItems="center">
                    <UserAvatar size="xs" user={p.user} />
                    <Flex marginStart={2} direction="row" alignItems="center" gap={1}>
                      <Text noOfLines={1} wordBreak="break-all">
                        {p.user.fullName}
                      </Text>
                      <Text as="span" fontSize="xs" color="gray.600">
                        ({permissionType})
                      </Text>
                      {effectiveDefaultPermissions?.isSubscribed ? (
                        <SubscribedNotificationsIcon />
                      ) : null}
                    </Flex>
                  </Flex>
                );
              }

              if (p.__typename === "TemplateDefaultUserGroupPermission") {
                const permissionType =
                  p.permissionType === "WRITE" ? (
                    <FormattedMessage
                      id="generic.petition-permission-type-write"
                      defaultMessage="Editor"
                    />
                  ) : p.permissionType === "READ" ? (
                    <FormattedMessage
                      id="generic.petition-permission-type-reader"
                      defaultMessage="Reader"
                    />
                  ) : null;

                return (
                  <Flex key={p.id} as={ListItem} alignItems="center">
                    <Avatar.Root
                      size="xs"
                      backgroundColor="gray.200"
                      icon={<UsersIcon boxSize={3.5} />}
                      color="gray.800"
                    />
                    <Flex marginStart={2} direction="row" alignItems="center" gap={1}>
                      <Text noOfLines={1} wordBreak="break-all">
                        <UserGroupReference userGroup={p.group} />
                      </Text>
                      <Text as="span" fontSize="xs" color="gray.600">
                        ({permissionType})
                      </Text>
                      {p.isSubscribed ? <SubscribedNotificationsIcon /> : null}
                    </Flex>
                  </Flex>
                );
              }
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
  PetitionTemplate: gql`
    fragment TemplateIconDefaultPermissions_PetitionTemplate on PetitionTemplate {
      id
      defaultPermissions {
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
            initials
            ...UserGroupReference_UserGroup
          }
          isSubscribed
        }
      }
      effectiveDefaultPermissions {
        user {
          id
        }
        permissionType
        isSubscribed
      }
    }
    ${UserAvatar.fragments.User}
    ${UserGroupReference.fragments.UserGroup}
  `,
};
