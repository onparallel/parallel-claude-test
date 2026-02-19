import { gql } from "@apollo/client";
import { useMutation } from "@apollo/client/react";
import { MenuDivider, MenuItem, MenuList } from "@chakra-ui/react";
import { CopyIcon, DeleteIcon } from "@parallel/chakra/icons";
import { userGroupReferenceText } from "@parallel/components/common/UserGroupReference";
import {
  SettingsTabsInnerLayout,
  TabDefinition,
} from "@parallel/components/layout/SettingsTabsInnerLayout";
import {
  UserGroupLayout_QueryFragment,
  UserGroupLayout_UserGroupFragment,
  UserGroupLayout_cloneUserGroupsDocument,
  UserGroupLayout_deleteUserGroupDocument,
  UserGroupLayout_updateUserGroupDocument,
  UserLocale,
} from "@parallel/graphql/__types";
import { useConfirmDeleteGroupsDialog } from "@parallel/pages/app/organization/groups";
import { asSupportedUserLocale } from "@parallel/utils/locales";
import { withError } from "@parallel/utils/promises/withError";
import { useHasPermission } from "@parallel/utils/useHasPermission";
import { Flex } from "@parallel/components/ui";
import { useRouter } from "next/router";
import { ReactNode, useEffect, useMemo, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { EditableHeading } from "../common/EditableHeading";
import { MoreOptionsMenuButton } from "../common/MoreOptionsMenuButton";
import { WhenPermission } from "../common/WhenPermission";
import { OrganizationSettingsLayout } from "./OrganizationSettingsLayout";

type UserGroupSection = "users" | "permissions";

interface UserGroupLayoutProps {
  queryObject: UserGroupLayout_QueryFragment;
  currentTabKey: UserGroupSection;
  groupId: string;
  children: ReactNode;
  userGroup?: UserGroupLayout_UserGroupFragment | null;
}

export function UserGroupLayout({
  currentTabKey,
  groupId,
  queryObject,
  children,
  userGroup,
}: UserGroupLayoutProps) {
  const intl = useIntl();
  const router = useRouter();
  const { me } = queryObject;
  const canCrudTeams = useHasPermission("TEAMS:CRUD_TEAMS");
  const canReadPermissions = useHasPermission("TEAMS:READ_PERMISSIONS");
  const tabs = useMemo<TabDefinition<UserGroupSection>[]>(
    () => [
      {
        key: "users",
        title: intl.formatMessage({
          id: "component.user-group-layout.users",
          defaultMessage: "Users",
        }),
        href: `/app/organization/groups/${groupId}`,
      },
      {
        key: "permissions",
        title: intl.formatMessage({
          id: "component.user-group-layout.permissions",
          defaultMessage: "Permissions",
        }),
        href: `/app/organization/groups/${groupId}/permissions`,
        isDisabled: !canReadPermissions,
      },
    ],
    [intl.locale, canReadPermissions],
  );
  const currentTab = tabs.find((t) => t.key === currentTabKey)!;

  const [name, setName] = useState(userGroupReferenceText(userGroup!, intl.locale as UserLocale));

  useEffect(() => {
    setName(userGroupReferenceText(userGroup!, intl.locale as UserLocale));
  }, [userGroup]);

  const [updateUserGroup] = useMutation(UserGroupLayout_updateUserGroupDocument);
  const handleChangeGroupName = async (newName: string) => {
    if (newName.trim() && name.trim() !== newName.trim()) {
      await updateUserGroup({
        variables: {
          id: groupId,
          data: {
            name: newName,
          },
        },
      });
    }
  };

  const [deleteUserGroup] = useMutation(UserGroupLayout_deleteUserGroupDocument);
  const confirmDelete = useConfirmDeleteGroupsDialog();
  const handleDeleteGroup = async () => {
    const [error] = await withError(confirmDelete({ name }));
    if (!error) {
      await deleteUserGroup({ variables: { ids: [groupId] } });
      router.push("/app/organization/groups");
    }
  };

  const [cloneUserGroups] = useMutation(UserGroupLayout_cloneUserGroupsDocument);
  const handleCloneGroup = async () => {
    const { data } = await cloneUserGroups({
      variables: { ids: [groupId], locale: asSupportedUserLocale(intl.locale) },
    });
    const cloneUserGroupId = data?.cloneUserGroups[0].id || "";

    router.push(`/app/organization/groups/${cloneUserGroupId}`);
  };

  return (
    <OrganizationSettingsLayout
      title={`${currentTab.title}`}
      queryObject={queryObject}
      basePath="/app/organization/groups"
      header={
        <Flex width="100%" justifyContent="space-between" alignItems="center">
          <EditableHeading
            maxLength={100}
            isDisabled={!canCrudTeams || userGroup!.type === "ALL_USERS"}
            value={name}
            onChange={handleChangeGroupName}
          />
          <WhenPermission permission="TEAMS:CRUD_TEAMS">
            <MoreOptionsMenuButton
              variant="outline"
              options={
                <MenuList>
                  <MenuItem
                    onClick={handleCloneGroup}
                    isDisabled={!canCrudTeams || userGroup!.type === "ALL_USERS"}
                    icon={<CopyIcon display="block" boxSize={4} />}
                  >
                    <FormattedMessage
                      id="component.group-header.clone-label"
                      defaultMessage="Clone team"
                    />
                  </MenuItem>
                  <MenuDivider />
                  <MenuItem
                    color="red.500"
                    onClick={handleDeleteGroup}
                    isDisabled={
                      !canCrudTeams ||
                      userGroup!.type === "ALL_USERS" ||
                      (userGroup!.type === "INITIAL" && !me.hasPermissionManagement)
                    }
                    icon={<DeleteIcon display="block" boxSize={4} />}
                  >
                    <FormattedMessage
                      id="component.group-header.delete-label"
                      defaultMessage="Delete team"
                    />
                  </MenuItem>
                </MenuList>
              }
            />
          </WhenPermission>
        </Flex>
      }
      showBackButton={true}
    >
      <SettingsTabsInnerLayout tabs={tabs} currentTabKey={currentTabKey}>
        {children}
      </SettingsTabsInnerLayout>
    </OrganizationSettingsLayout>
  );
}

const _fragments = {
  Query: gql`
    fragment UserGroupLayout_Query on Query {
      ...OrganizationSettingsLayout_Query
      me {
        id
        hasPermissionManagement: hasFeatureFlag(featureFlag: PERMISSION_MANAGEMENT)
      }
    }
  `,
  UserGroup: gql`
    fragment UserGroupLayout_UserGroup on UserGroup {
      id
      name
      type
      ...UserGroupReference_UserGroup
    }
  `,
};

const _mutations = [
  gql`
    mutation UserGroupLayout_updateUserGroup($id: GID!, $data: UpdateUserGroupInput!) {
      updateUserGroup(id: $id, data: $data) {
        ...UserGroupLayout_UserGroup
      }
    }
  `,
  gql`
    mutation UserGroupLayout_deleteUserGroup($ids: [GID!]!) {
      deleteUserGroup(ids: $ids)
    }
  `,
  gql`
    mutation UserGroupLayout_cloneUserGroups($ids: [GID!]!, $locale: UserLocale!) {
      cloneUserGroups(userGroupIds: $ids, locale: $locale) {
        ...UserGroupLayout_UserGroup
      }
    }
  `,
];
