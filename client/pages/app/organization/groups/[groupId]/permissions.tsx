import { gql, useMutation } from "@apollo/client";
import {
  Badge,
  Box,
  Button,
  Center,
  Flex,
  FormControl,
  FormLabel,
  Grid,
  HStack,
  ListItem,
  Stack,
  Text,
  UnorderedList,
} from "@chakra-ui/react";
import { CircleCheckIcon, DashIcon, ForbiddenIcon } from "@parallel/chakra/icons";
import { Card, CardHeader } from "@parallel/components/common/Card";
import { ContactSupportAlert } from "@parallel/components/common/ContactSupportAlert";
import { HelpCenterLink } from "@parallel/components/common/HelpCenterLink";
import { HelpPopover } from "@parallel/components/common/HelpPopover";
import { HighlightText } from "@parallel/components/common/HighlightText";
import { SearchInput } from "@parallel/components/common/SearchInput";
import { SimpleOption, SimpleSelect } from "@parallel/components/common/SimpleSelect";
import { withDialogs } from "@parallel/components/common/dialogs/DialogProvider";
import { WithApolloDataContext, withApolloData } from "@parallel/components/common/withApolloData";
import { withPermission } from "@parallel/components/common/withPermission";
import { UserGroupLayout } from "@parallel/components/layout/UserGroupLayout";
import {
  PermissionsGroup_updateUserGroupPermissionsDocument,
  PermissionsGroup_userDocument,
  PermissionsGroup_userGroupDocument,
  UpdateUserGroupPermissionsInputEffect,
} from "@parallel/graphql/__types";
import { useAssertQuery } from "@parallel/utils/apollo/useAssertQuery";
import { compose } from "@parallel/utils/compose";
import { useHandleNavigation } from "@parallel/utils/navigation";
import { UnwrapPromise } from "@parallel/utils/types";
import { useHasPermission } from "@parallel/utils/useHasPermission";
import { Fragment, useEffect, useMemo, useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";
import { OptionProps, SingleValueProps, components } from "react-select";
import { zip } from "remeda";

type PermissionsGroupProps = UnwrapPromise<ReturnType<typeof PermissionsGroup.getInitialProps>>;

interface PermissionsFormData {
  permissions: {
    name: string;
    effect: UpdateUserGroupPermissionsInputEffect;
  }[];
}

export function PermissionsGroup({ groupId }: PermissionsGroupProps) {
  const intl = useIntl();
  const { data: queryObject, refetch: refetchMe } = useAssertQuery(PermissionsGroup_userDocument);
  const { me } = queryObject;
  const {
    data: { userGroup },
  } = useAssertQuery(PermissionsGroup_userGroupDocument, {
    variables: {
      id: groupId,
    },
  });

  const canEdit = useHasPermission("TEAMS:UPDATE_PERMISSIONS") && me.hasPermissionManagement;

  const permissionsCategories = useMemo(
    () => [
      ...(me.organization.status === "ROOT"
        ? [
            {
              category: intl.formatMessage({
                id: "page.permissions-group.category-superadmin",
                defaultMessage: "SuperAdmin",
              }),
              permissions: [
                {
                  name: "SUPERADMIN",
                  title: intl.formatMessage({
                    id: "page.permissions-group.superadmin",
                    defaultMessage: "SuperAdmin",
                  }),
                  description: intl.formatMessage({
                    id: "page.permissions-group.superadmin-description",
                    defaultMessage:
                      "Grants users in this team permissions to access the Admin Panel. (only for Parallel org)",
                  }),
                },
              ],
            },
          ]
        : []),
      {
        category: intl.formatMessage({
          id: "page.permissions-group.category-organization",
          defaultMessage: "Organization",
        }),
        permissions: [
          {
            name: "ORG_SETTINGS",
            title: intl.formatMessage({
              id: "page.permissions-group.org-settings",
              defaultMessage: "Edit organization settings",
            }),
            description: intl.formatMessage({
              id: "page.permissions-group.org-settings-description",
              defaultMessage:
                "Grants users in this team permissions to access and edit the general settings of the organization.",
            }),
          },
        ],
      },
      {
        category: intl.formatMessage({
          id: "page.permissions-group.category-petitions",
          defaultMessage: "Parallels",
        }),
        permissions: [
          {
            name: "PETITIONS:CREATE_TEMPLATES",
            title: intl.formatMessage({
              id: "page.permissions-group.petitions-create-templates",
              defaultMessage: "Create templates",
            }),
            description: intl.formatMessage({
              id: "page.permissions-group.petitions-create-templates-description",
              defaultMessage:
                "Grants users in this team permissions to create templates on the organization.",
            }),
          },
          {
            name: "PETITIONS:LIST_PUBLIC_TEMPLATES",
            title: intl.formatMessage({
              id: "page.permissions-group.petitions-view-public-templates",
              defaultMessage: "View public templates",
            }),
            description: intl.formatMessage({
              id: "page.permissions-group.petitions-view-public-templates-description",
              defaultMessage: "Grant users in this team permission to browse public templates.",
            }),
          },
          {
            name: "PETITIONS:CREATE_PETITIONS",
            title: intl.formatMessage({
              id: "page.permissions-group.petitions-create",
              defaultMessage: "Create petitions",
            }),
            description: intl.formatMessage({
              id: "page.permissions-group.petitions-create-description",
              defaultMessage:
                "Grants users in this team permissions to create parallels on the organization.",
            }),
          },
          {
            name: "PETITIONS:CHANGE_PATH",
            title: intl.formatMessage({
              id: "page.permissions-group.petitions-change-path",
              defaultMessage: "Move templates and parallels",
            }),
            description: intl.formatMessage({
              id: "page.permissions-group.petitions-change-path-description",
              defaultMessage:
                "Grants users in this team permissions to create and manage folders of templates and parallels.",
            }),
          },
          ...(me.hasOnBehalfOfAccess
            ? [
                {
                  name: "PETITIONS:SEND_ON_BEHALF",
                  title: intl.formatMessage({
                    id: "page.permissions-group.petitions-send-on-behalf",
                    defaultMessage: "Send on behalf of anyone",
                  }),
                  description: intl.formatMessage({
                    id: "page.permissions-group.petitions-send-on-behalf-description",
                    defaultMessage:
                      "Grants users in this team permissions to send parallels on behalf of any other user in their organization without explicit delegation.",
                  }),
                },
              ]
            : []),
        ],
      },
      {
        category: intl.formatMessage({
          id: "page.permissions-group.category-reports",
          defaultMessage: "Reports",
        }),
        permissions: [
          {
            name: "REPORTS:OVERVIEW",
            title: intl.formatMessage({
              id: "page.permissions-group.reports-overview",
              defaultMessage: "Reports overview",
            }),
            description: intl.formatMessage({
              id: "page.permissions-group.reports-overview-description",
              defaultMessage:
                "Grants users in this team permissions to view the general usage report of the organization.",
            }),
          },
          {
            name: "REPORTS:TEMPLATE_STATISTICS",
            title: intl.formatMessage({
              id: "page.permissions-group.reports-template-statistics",
              defaultMessage: "Template statistics",
            }),
            description: intl.formatMessage({
              id: "page.permissions-group.reports-template-statistics-description",
              defaultMessage:
                "Grants users in this team permissions to view the template statistics report of the organization.",
            }),
          },
          {
            name: "REPORTS:TEMPLATE_REPLIES",
            title: intl.formatMessage({
              id: "page.permissions-group.reports-template-replies",
              defaultMessage: "Template replies",
            }),
            description: intl.formatMessage({
              id: "page.permissions-group.reports-template-replies-description",
              defaultMessage:
                "Grants users in this team permissions to view the template replies report of the organization.",
            }),
          },
        ],
      },
      ...(me.hasProfilesAccess
        ? [
            {
              category: intl.formatMessage({
                id: "page.permissions-group.category-profiles",
                defaultMessage: "Profiles",
              }),
              permissions: [
                {
                  name: "PROFILE_TYPES:CRUD_PROFILE_TYPES",
                  title: intl.formatMessage({
                    id: "page.permissions-group.profile-types-crud",
                    defaultMessage: "Create and manage profile types",
                  }),
                  description: intl.formatMessage({
                    id: "page.permissions-group.profile-types-crud-description",
                    defaultMessage:
                      "Grants users in this team permissions to configure and create profile types on the organization.",
                  }),
                },
                {
                  name: "PROFILES:LIST_PROFILES",
                  title: intl.formatMessage({
                    id: "page.permissions-group.profiles-list",
                    defaultMessage: "List profiles",
                  }),
                  description: intl.formatMessage({
                    id: "page.permissions-group.profiles-list-description",
                    defaultMessage:
                      "Grants users in this team permissions to view the list of profiles created on the organization.",
                  }),
                },
                {
                  name: "PROFILES:CREATE_PROFILES",
                  title: intl.formatMessage({
                    id: "page.permissions-group.profiles-create",
                    defaultMessage: "Create and update profiles",
                  }),
                  description: intl.formatMessage({
                    id: "page.permissions-group.profiles-create-description",
                    defaultMessage:
                      "Grants users in this team permissions to create and manage profiles on the organization.",
                  }),
                },
                {
                  name: "PROFILES:CLOSE_PROFILES",
                  title: intl.formatMessage({
                    id: "page.permissions-group.profiles-close",
                    defaultMessage: "Close profiles",
                  }),
                  description: intl.formatMessage({
                    id: "page.permissions-group.profiles-close-description",
                    defaultMessage:
                      "Grants users in this team permissions to close and reopen profiles on the organization.",
                  }),
                },
                {
                  name: "PROFILES:DELETE_PROFILES",
                  title: intl.formatMessage({
                    id: "page.permissions-group.profile-delete-profiles",
                    defaultMessage: "Delete profiles",
                  }),
                  description: intl.formatMessage({
                    id: "page.permissions-group.profile-delete-profiles-description",
                    defaultMessage:
                      "Grants users in this team permissions to send profiles to the thrash bin.",
                  }),
                },
                {
                  name: "PROFILES:DELETE_PERMANENTLY_PROFILES",
                  title: intl.formatMessage({
                    id: "page.permissions-group.profiles-delete-permanently-profiles",
                    defaultMessage: "Delete profiles permanently",
                  }),
                  description: intl.formatMessage({
                    id: "page.permissions-group.profiles-delete-permanently-profiles-description",
                    defaultMessage:
                      "Grants users in this team permissions to permanently delete profiles.",
                  }),
                },
                {
                  name: "PROFILE_ALERTS:LIST_ALERTS",
                  title: intl.formatMessage({
                    id: "page.permissions-group.profile-alerts-list",
                    defaultMessage: "View alerts",
                  }),
                  description: intl.formatMessage({
                    id: "page.permissions-group.profile-alerts-list-description",
                    defaultMessage:
                      "Grants users in this team permissions to view the list of property expiration alerts of the profiles.",
                  }),
                },
                {
                  name: "PROFILES:SUBSCRIBE_PROFILES",
                  title: intl.formatMessage({
                    id: "page.permissions-group.profiles-subscribe",
                    defaultMessage: "Subscribe to profiles",
                  }),
                  description: intl.formatMessage({
                    id: "page.permissions-group.profiles-subscribe-description",
                    defaultMessage:
                      "Grants users in this team permissions to manage profile alerts subscriptions.",
                  }),
                },
                {
                  name: "PROFILES:IMPORT_EXPORT_PROFILES",
                  title: intl.formatMessage({
                    id: "page.permissions-group.profiles-import-export",
                    defaultMessage: "Import and export profiles",
                  }),
                  description: intl.formatMessage({
                    id: "page.permissions-group.profiles-import-export-description",
                    defaultMessage:
                      "Grants users in this team permissions to import and export profiles to Excel.",
                  }),
                },
              ],
            },
          ]
        : []),
      {
        category: intl.formatMessage({
          id: "page.permissions-group.category-integrations",
          defaultMessage: "Integrations",
        }),
        permissions: [
          {
            name: "INTEGRATIONS:CRUD_INTEGRATIONS",
            title: intl.formatMessage({
              id: "page.permissions-group.integrations-crud",
              defaultMessage: "Create and manage integrations",
            }),
            description: intl.formatMessage({
              id: "page.permissions-group.integrations-crud-description",
              defaultMessage:
                "Grants users in this team permissions to manage the different integrations of the organization.",
            }),
          },
          {
            name: "INTEGRATIONS:CRUD_API",
            title: intl.formatMessage({
              id: "page.permissions-group.integrations-crud-api",
              defaultMessage: "Developer access",
            }),
            description: intl.formatMessage({
              id: "page.permissions-group.integrations-crud-api-description",
              defaultMessage:
                "Grants users in this team permissions to access their Developers panel for managing subscriptions and API tokens.",
            }),
          },
        ],
      },
      {
        category: intl.formatMessage({
          id: "page.permissions-group.category-users",
          defaultMessage: "Users",
        }),
        permissions: [
          {
            name: "USERS:LIST_USERS",
            title: intl.formatMessage({
              id: "page.permissions-group.users-list",
              defaultMessage: "View users",
            }),
            description: intl.formatMessage({
              id: "page.permissions-group.users-list-description",
              defaultMessage:
                "Grants users in this team permissions to view the list of users on the organization",
            }),
          },

          {
            name: "USERS:CRUD_USERS",
            title: intl.formatMessage({
              id: "page.permissions-group.users-crud",
              defaultMessage: "Manage users",
            }),
            description: intl.formatMessage({
              id: "page.permissions-group.users-crud-description",
              defaultMessage:
                "Grants users in this team permissions to manage the users on the organization",
            }),
          },
          ...(me.hasLoginAsAccess
            ? [
                {
                  name: "USERS:GHOST_LOGIN",
                  title: intl.formatMessage({
                    id: "page.permissions-group.users-ghost-login",
                    defaultMessage: "Login as other users",
                  }),
                  description: intl.formatMessage({
                    id: "page.permissions-group.users-ghost-login-description",
                    defaultMessage:
                      "Grants users in this team permissions to login as other users on the organization.",
                  }),
                },
              ]
            : []),
        ],
      },
      {
        category: intl.formatMessage({
          id: "page.permissions-group.category-teams",
          defaultMessage: "Teams",
        }),
        permissions: [
          {
            name: "TEAMS:LIST_TEAMS",
            title: intl.formatMessage({
              id: "page.permissions-group.teams-list",
              defaultMessage: "View teams",
            }),
            description: intl.formatMessage({
              id: "page.permissions-group.teams-list-description",
              defaultMessage:
                "Grants users in this team permissions to view the list of teams on the organization.",
            }),
          },
          {
            name: "TEAMS:CRUD_TEAMS",
            title: intl.formatMessage({
              id: "page.permissions-group.teams-crud",
              defaultMessage: "Create and manage teams",
            }),
            description: intl.formatMessage({
              id: "page.permissions-group.teams-crud-description",
              defaultMessage:
                "Grants users in this team permissions to manage the teams on the organization.",
            }),
          },
          {
            name: "TEAMS:READ_PERMISSIONS",
            title: intl.formatMessage({
              id: "page.permissions-group.teams-read-permissions",
              defaultMessage: "View team permissions",
            }),
            description: intl.formatMessage({
              id: "page.permissions-group.teams-read-permissions-description",
              defaultMessage:
                "Grants users in this team permissions to view the permissions of each team on the organization.",
            }),
          },
          {
            name: "TEAMS:UPDATE_PERMISSIONS",
            title: intl.formatMessage({
              id: "page.permissions-group.teams-edit-permissions",
              defaultMessage: "Manage team permissions",
            }),
            description: intl.formatMessage({
              id: "page.permissions-group.teams-edit-permissions-description",
              defaultMessage:
                "Grants users in this team permissions to manage the permissions of each team on the organization.",
            }),
          },
        ],
      },
      {
        category: intl.formatMessage({
          id: "page.permissions-group.category-contacts",
          defaultMessage: "Contacts",
        }),
        permissions: [
          {
            name: "CONTACTS:LIST_CONTACTS",
            title: intl.formatMessage({
              id: "page.permissions-group.contacts-list",
              defaultMessage: "View contacts",
            }),
            description: intl.formatMessage({
              id: "page.permissions-group.contacts-list-description",
              defaultMessage:
                "Grants users in this team permissions to view the list of contacts on the organization.",
            }),
          },
          {
            name: "CONTACTS:DELETE_CONTACTS",
            title: intl.formatMessage({
              id: "page.permissions-group.delete-contacts",
              defaultMessage: "Delete contacts",
            }),
            description: intl.formatMessage({
              id: "page.permissions-group.delete-contacts-description",
              defaultMessage:
                "Grants users in this team permissions to delete contacts on the organization.",
            }),
          },
        ],
      },
      {
        category: intl.formatMessage({
          id: "page.permissions-group.category-tags",
          defaultMessage: "Tags",
        }),
        permissions: [
          {
            name: "TAGS:CREATE_TAGS",
            title: intl.formatMessage({
              id: "page.permissions-group.tags-create-tags",
              defaultMessage: "Create tags",
            }),
            description: intl.formatMessage({
              id: "page.permissions-group.tags-create-tags-description",
              defaultMessage: "Grants users in this team permissions to create new tags.",
            }),
          },
          {
            name: "TAGS:UPDATE_TAGS",
            title: intl.formatMessage({
              id: "page.permissions-group.tags-update-tags",
              defaultMessage: "Update tags",
            }),
            description: intl.formatMessage({
              id: "page.permissions-group.tags-update-tags-description",
              defaultMessage: "Grants users in this team permissions to update existing tags.",
            }),
          },
          {
            name: "TAGS:DELETE_TAGS",
            title: intl.formatMessage({
              id: "page.permissions-group.tags-delete-tags",
              defaultMessage: "Delete tags",
            }),
            description: intl.formatMessage({
              id: "page.permissions-group.tags-delete-tags-description",
              defaultMessage: "Grants users in this team permissions to delete tags.",
            }),
          },
        ],
      },
      {
        category: intl.formatMessage({
          id: "page.permissions-group.category-dashboards",
          defaultMessage: "Dashboards",
        }),
        permissions: [
          {
            name: "DASHBOARDS:CRUD_DASHBOARDS",
            title: intl.formatMessage({
              id: "page.permissions-group.dashboards-crud",
              defaultMessage: "Create and manage dashboards",
            }),
            description: intl.formatMessage({
              id: "page.permissions-group.dashboards-crud-description",
              defaultMessage:
                "Grants users in this team permissions to create and manage dashboards.",
            }),
          },
        ],
      },
    ],
    [intl.locale],
  );

  const permissionEffects = useMemo(
    () =>
      [
        {
          value: "GRANT",
          label: intl.formatMessage({
            id: "page.permissions-group.effects-grant",
            defaultMessage: "Grant",
          }),
          description: intl.formatMessage({
            id: "page.permissions-group.effects-grant-description",
            defaultMessage:
              "Grants access to the feature, unless there's a specific denial in another group the user is a part of.",
          }),
        },
        {
          value: "NONE",
          label: intl.formatMessage({
            id: "page.permissions-group.effects-do-not-grant",
            defaultMessage: "Don't grant",
          }),
          description: intl.formatMessage({
            id: "page.permissions-group.effects-do-not-grant-description",
            defaultMessage:
              "It neither grants nor denies the access to the feature. It's a neutral state.",
          }),
        },
        {
          value: "DENY",
          label: intl.formatMessage({
            id: "page.permissions-group.effects-deny",
            defaultMessage: "Deny",
          }),
          description: intl.formatMessage({
            id: "page.permissions-group.effects-deny-description",
            defaultMessage:
              "It denies access to the feature, even if it was allowed in a different group.",
          }),
        },
      ] as (SimpleOption<UpdateUserGroupPermissionsInputEffect> & { description: string })[],
    [intl.locale],
  );

  const { control, handleSubmit, reset, formState } = useForm<PermissionsFormData>({
    defaultValues: {
      permissions: permissionsCategories.flatMap((category) =>
        category.permissions.flatMap((p) => {
          const permission = userGroup!.permissions.find((ugp) => ugp.name === p.name);
          return { name: p.name, effect: permission?.effect ?? "NONE" };
        }),
      ),
    },
  });

  const [search, setSearch] = useState("");

  const { fields } = useFieldArray({ name: "permissions", control });

  const [updateUserGroupPermissions, { loading: isSubmitting }] = useMutation(
    PermissionsGroup_updateUserGroupPermissionsDocument,
  );

  async function handleSubmitPermissionsGroup(data: PermissionsFormData) {
    const dirtyPermissions = zip(data.permissions, formState.dirtyFields.permissions ?? [])
      .filter(([, dirty]) => dirty?.effect ?? false)
      .map(([permission]) => permission);

    await updateUserGroupPermissions({
      variables: {
        userGroupId: groupId,
        permissions: dirtyPermissions,
      },
    });
    reset({
      permissions: data.permissions,
    });
    await refetchMe();
  }

  const navigate = useHandleNavigation();
  useEffect(() => {
    // if user removes their permission to edit permissions, redirect to the group view
    if (!me.permissions.includes("TEAMS:READ_PERMISSIONS")) {
      navigate(`/app/organization/groups/${groupId}`);
    }
  }, [me.permissions.includes("TEAMS:READ_PERMISSIONS")]);

  return (
    <UserGroupLayout
      groupId={groupId}
      currentTabKey="permissions"
      queryObject={queryObject}
      userGroup={userGroup}
    >
      {me.hasPermissionManagement ? null : (
        <Box>
          <ContactSupportAlert
            borderRadius="0px"
            body={
              <Text>
                <FormattedMessage
                  id="component.user-group-layout.permissions-enterprise-explanation"
                  defaultMessage="This is an enterprise feature. To know more contact our support team."
                />
              </Text>
            }
            contactMessage={intl.formatMessage({
              id: "component.user-group-layout.permissions-enterprise-message",
              defaultMessage:
                "Hi, I would like to get more information about permission management.",
            })}
          />
        </Box>
      )}
      <Flex
        padding={4}
        gap={4}
        flexDirection={{ base: "column", xl: "row" }}
        alignItems={{ base: "stretch", xl: "start" }}
        css={{ sm: { background: "red" } }}
      >
        <Card flex={2} as="form" onSubmit={handleSubmit(handleSubmitPermissionsGroup)}>
          <CardHeader>
            <FormattedMessage
              id="page.permissions-group.permissions-group"
              defaultMessage="Team permissions"
            />
          </CardHeader>
          <Stack paddingX={6} paddingY={4} spacing={4}>
            <SearchInput value={search ?? ""} onChange={(e) => setSearch(e.target.value)} />
            {permissionsCategories
              .filter(({ permissions }) => {
                const _search = search.toLowerCase().trim();
                return permissions.some(
                  ({ name, title }) =>
                    name.toLowerCase().includes(_search) || title.toLowerCase().includes(_search),
                );
              })
              .map(({ category, permissions }) => {
                return (
                  <UnorderedList key={category} listStyleType="none" marginStart={0}>
                    <ListItem fontWeight={500}>{category}</ListItem>
                    <UnorderedList listStyleType="none" marginStart={2} spacing={2}>
                      {permissions.map(({ name, title, description }) => {
                        const index = fields.findIndex((f) => f.name === name)!;
                        return (
                          <FormControl
                            key={fields[index].id}
                            as={ListItem}
                            display="flex"
                            alignItems="center"
                            gap={2}
                          >
                            <Flex flex={1} alignItems="center">
                              <FormLabel margin={0} fontWeight={400}>
                                <HighlightText as="span" search={search}>
                                  {title}
                                </HighlightText>
                              </FormLabel>
                              <HelpPopover popoverWidth="xs">
                                <Text fontSize="sm">{description}</Text>
                              </HelpPopover>
                            </Flex>
                            <HStack alignItems="center">
                              {formState.dirtyFields?.permissions?.[index]?.effect ? (
                                <Badge colorScheme="yellow">
                                  <FormattedMessage
                                    id="generic.edited-indicator"
                                    defaultMessage="Edited"
                                  />
                                </Badge>
                              ) : null}
                              <Box width="165px">
                                <Controller
                                  control={control}
                                  name={`permissions.${index}.effect`}
                                  render={({ field: { onChange, value } }) => (
                                    <SimpleSelect
                                      isSearchable={false}
                                      value={value}
                                      options={permissionEffects}
                                      onChange={onChange}
                                      components={{ SingleValue, Option }}
                                      isDisabled={!canEdit}
                                    />
                                  )}
                                />
                              </Box>
                            </HStack>
                          </FormControl>
                        );
                      })}
                    </UnorderedList>
                  </UnorderedList>
                );
              })}

            <HStack paddingTop={6} alignSelf="flex-end">
              <Button onClick={() => reset()} isDisabled={!formState.isDirty || !canEdit}>
                <FormattedMessage id="generic.cancel" defaultMessage="Cancel" />
              </Button>
              <Button
                colorScheme="primary"
                type="submit"
                isDisabled={!formState.isDirty || !canEdit}
                isLoading={isSubmitting}
              >
                <FormattedMessage id="generic.save-changes" defaultMessage="Save changes" />
              </Button>
            </HStack>
          </Stack>
        </Card>
        <Card flex={1} position={{ xl: "sticky" }} top={{ xl: 4 }}>
          <CardHeader
            rightAction={
              <HelpCenterLink articleId={5935983}>
                <FormattedMessage id="generic.help" defaultMessage="Help" />
              </HelpCenterLink>
            }
          >
            <FormattedMessage id="generic.legend" defaultMessage="Legend" />
          </CardHeader>
          <Grid as="dl" templateColumns="auto 1fr" padding={4} gap={4}>
            {permissionEffects.map((permission) => (
              <Fragment key={permission.value}>
                <Box as="dt">
                  <PermissionOption option={permission} />
                </Box>
                <Box as="dd">{permission.description}</Box>
              </Fragment>
            ))}
          </Grid>
        </Card>
      </Flex>
    </UserGroupLayout>
  );
}

const _fragments = {
  get UserGroup() {
    return gql`
      fragment PermissionsGroup_UserGroup on UserGroup {
        id
        ...UserGroupLayout_UserGroup
        permissions {
          id
          name
          effect
        }
      }

      ${UserGroupLayout.fragments.UserGroup}
    `;
  },
};

const _queries = [
  gql`
    query PermissionsGroup_userGroup($id: GID!) {
      userGroup(id: $id) {
        ...PermissionsGroup_UserGroup
      }
    }
    ${_fragments.UserGroup}
  `,
  gql`
    query PermissionsGroup_user {
      ...UserGroupLayout_Query
      me {
        id
        permissions
        hasOnBehalfOfAccess: hasFeatureFlag(featureFlag: ON_BEHALF_OF)
        hasProfilesAccess: hasFeatureFlag(featureFlag: PROFILES)
        hasLoginAsAccess: hasFeatureFlag(featureFlag: GHOST_LOGIN)
        hasPermissionManagement: hasFeatureFlag(featureFlag: PERMISSION_MANAGEMENT)
        organization {
          id
          status
        }
      }
    }
    ${UserGroupLayout.fragments.Query}
  `,
];

const _mutations = [
  gql`
    mutation PermissionsGroup_updateUserGroupPermissions(
      $userGroupId: GID!
      $permissions: [UpdateUserGroupPermissionsInput!]!
    ) {
      updateUserGroupPermissions(userGroupId: $userGroupId, permissions: $permissions) {
        ...PermissionsGroup_UserGroup
      }
    }
    ${_fragments.UserGroup}
  `,
];

function PermissionOption({
  option: { label, value },
  color,
}: {
  color?: string;
  option: SimpleOption<UpdateUserGroupPermissionsInputEffect>;
}) {
  return (
    <HStack
      display="inline-flex"
      color={color ?? (value === "DENY" ? "red.600" : value === "GRANT" ? "green.600" : "gray.500")}
    >
      <Center boxSize={4}>
        {value === "DENY" ? (
          <ForbiddenIcon />
        ) : value === "GRANT" ? (
          <CircleCheckIcon />
        ) : (
          <DashIcon />
        )}
      </Center>
      <Box whiteSpace="nowrap">{label}</Box>
    </HStack>
  );
}

function SingleValue(
  props: SingleValueProps<
    SimpleOption<UpdateUserGroupPermissionsInputEffect> & { description: string }
  >,
) {
  return (
    <components.SingleValue {...props}>
      <PermissionOption option={props.data} />
    </components.SingleValue>
  );
}

function Option({
  children,
  ...props
}: OptionProps<SimpleOption<UpdateUserGroupPermissionsInputEffect> & { description: string }>) {
  return (
    <components.Option
      {...props}
      innerProps={{
        ...props.innerProps,
      }}
    >
      <PermissionOption option={props.data} color={props.isSelected ? "white" : undefined} />
    </components.Option>
  );
}

PermissionsGroup.getInitialProps = async ({ query, fetchQuery }: WithApolloDataContext) => {
  const groupId = query.groupId as string;
  await Promise.all([
    fetchQuery(PermissionsGroup_userGroupDocument, { variables: { id: groupId } }),
    fetchQuery(PermissionsGroup_userDocument),
  ]);
  return { groupId };
};

export default compose(
  withDialogs,
  withPermission("TEAMS:READ_PERMISSIONS", { orPath: "/app/organization" }),
  withApolloData,
)(PermissionsGroup);
