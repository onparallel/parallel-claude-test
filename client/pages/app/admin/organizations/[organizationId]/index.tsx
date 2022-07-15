import { gql, useMutation } from "@apollo/client";
import {
  Badge,
  Button,
  Divider,
  Flex,
  Heading,
  HStack,
  Stack,
  Switch,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  Tooltip,
  useToast,
} from "@chakra-ui/react";
import { ForbiddenIcon, LogInIcon } from "@parallel/chakra/icons";
import { Card, CardHeader } from "@parallel/components/common/Card";
import { DateTime } from "@parallel/components/common/DateTime";
import { withDialogs } from "@parallel/components/common/dialogs/DialogProvider";
import { HelpCenterLink } from "@parallel/components/common/HelpCenterLink";
import { HelpPopover } from "@parallel/components/common/HelpPopover";
import { SearchInput } from "@parallel/components/common/SearchInput";
import { TableColumn } from "@parallel/components/common/Table";
import { TablePage } from "@parallel/components/common/TablePage";
import { withApolloData, WithApolloDataContext } from "@parallel/components/common/withApolloData";
import { withSuperAdminAccess } from "@parallel/components/common/withSuperAdminAccess";
import { AppLayout } from "@parallel/components/layout/AppLayout";
import { SettingsLayout } from "@parallel/components/layout/SettingsLayout";
import { useInviteUserDialog } from "@parallel/components/organization/dialogs/InviteUserDialog";
import { OrganizationMembersListTableHeader } from "@parallel/components/organization/OrganizationMembersListTableHeader";
import {
  FeatureFlag,
  FeatureFlagEntry,
  OrganizationMembers_createOrganizationUserDocument,
  OrganizationMembers_organizationDocument,
  OrganizationMembers_OrganizationUserFragment,
  OrganizationMembers_updateFeatureFlagsDocument,
  OrganizationMembers_userDocument,
  OrganizationRole,
  OrganizationUsers_OrderBy,
} from "@parallel/graphql/__types";
import {
  useAssertQuery,
  useAssertQueryOrPreviousData,
} from "@parallel/utils/apollo/useAssertQuery";
import { compose } from "@parallel/utils/compose";
import { FORMATS } from "@parallel/utils/dates";
import {
  integer,
  parseQuery,
  sorting,
  string,
  useQueryState,
  values,
} from "@parallel/utils/queryState";
import { UnwrapPromise } from "@parallel/utils/types";
import { useAdminSections } from "@parallel/utils/useAdminSections";
import { useClipboardWithToast } from "@parallel/utils/useClipboardWithToast";
import { useDebouncedCallback } from "@parallel/utils/useDebouncedCallback";
import { useFeatureFlagDescriptions } from "@parallel/utils/useFeatureFlagDescriptions";
import { useLoginAs } from "@parallel/utils/useLoginAs";
import { useOrganizationRoles } from "@parallel/utils/useOrganizationRoles";
import { FormEvent, useCallback, useMemo, useRef, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { equals, isDefined } from "remeda";

const SORTING = ["fullName", "email", "createdAt", "lastActiveAt"] as const;

const QUERY_STATE = {
  page: integer({ min: 1 }).orDefault(1),
  search: string(),
  items: values([10, 25, 50]).orDefault(10),
  sort: sorting(SORTING).orDefault({
    field: "createdAt",
    direction: "ASC",
  }),
};

type OrganizationMembersProps = UnwrapPromise<
  ReturnType<typeof OrganizationMembers.getInitialProps>
>;

function OrganizationMembers({ organizationId }: OrganizationMembersProps) {
  const intl = useIntl();
  const toast = useToast();

  const [state, setQueryState] = useQueryState(QUERY_STATE);
  const [search, setSearch] = useState(state.search);
  const [selected, setSelected] = useState<string[]>([]);
  const {
    data: { me, realMe },
  } = useAssertQuery(OrganizationMembers_userDocument);

  const { data, loading, refetch } = useAssertQueryOrPreviousData(
    OrganizationMembers_organizationDocument,
    {
      variables: {
        id: organizationId,
        offset: state.items * (state.page - 1),
        limit: state.items,
        search: state.search,
        sortBy: [`${state.sort.field}_${state.sort.direction}` as OrganizationUsers_OrderBy],
      },
    }
  );
  const organization = data.organization!;
  const users = organization.users.items;

  const selectedUsers = useMemo(
    () => selected.map((userId) => users.find((u) => u.id === userId)).filter(isDefined),
    [selected.join(","), users]
  );

  const [createOrganizationUser] = useMutation(OrganizationMembers_createOrganizationUserDocument);
  const showInviteUserDialog = useInviteUserDialog();
  async function handleInviteUser() {
    try {
      const user = await showInviteUserDialog({});

      await createOrganizationUser({
        variables: {
          ...user,
          orgId: organization.id,
        },
        update: () => {
          refetch();
        },
      });

      toast({
        isClosable: true,
        duration: 5000,
        status: "success",
        title: intl.formatMessage({
          id: "organization.user-created-success.toast-title",
          defaultMessage: "User created successfully.",
        }),
        description: intl.formatMessage(
          {
            id: "organization.user-created-success.toast-description",
            defaultMessage:
              "We have sent an email to {email} with instructions to register in Parallel.",
          },
          {
            email: user.email,
          }
        ),
      });
    } catch {}
  }

  const sections = useAdminSections();
  const columns = useOrganizationMembersTableColumns();
  const debouncedOnSearchChange = useDebouncedCallback(
    (value) => {
      setQueryState((current) => ({
        ...current,
        search: value,
        page: 1,
      }));
    },
    300,
    [setQueryState]
  );

  const handleSearchChange = useCallback(
    (value: string | null) => {
      setSearch(value);
      debouncedOnSearchChange(value || null);
    },
    [debouncedOnSearchChange]
  );

  const loginAs = useLoginAs();
  const handleLoginAs = async () => {
    await loginAs(selected[0]);
  };

  const [featureFlags, setFeatureFlags] = useState(organization.features);
  const [editedFeatures, setEditedFeatures] = useState<FeatureFlagEntry[]>([]);
  const [featureSearch, setFeatureSearch] = useState("");
  const originalFeatureFlags = useRef(organization.features);

  function handleChangeFeature(name: FeatureFlag, value: boolean) {
    setFeatureFlags((currentFeatures) => {
      return currentFeatures.map((f) => {
        if (f.name === name) {
          return { ...f, value };
        }
        return f;
      });
    });

    const originalFeature = originalFeatureFlags.current.find((f) => f.name === name);
    if (equals({ name: originalFeature?.name, value: originalFeature?.value }, { name, value })) {
      setEditedFeatures((ef) => ef.filter((f) => f.name !== name));
    } else {
      setEditedFeatures((ef) => [...ef, { name, value }]);
    }
  }

  const [updateFeatureFlags, { loading: updatingFeatureFlags }] = useMutation(
    OrganizationMembers_updateFeatureFlagsDocument
  );

  async function handleSubmitFeatureFlags(event: FormEvent) {
    event.preventDefault();
    try {
      const { data } = await updateFeatureFlags({
        variables: { orgId: organization.id, featureFlags: editedFeatures },
      });

      const featureFlags = data?.updateFeatureFlags.features;
      if (isDefined(featureFlags)) {
        originalFeatureFlags.current = featureFlags;
        setFeatureFlags(featureFlags);
        setEditedFeatures([]);
      }
    } catch {}
  }

  const featureFlagDescriptions = useFeatureFlagDescriptions();

  return (
    <SettingsLayout
      title={organization?.name ?? ""}
      basePath="/app/admin/organizations"
      sections={sections}
      me={me}
      realMe={realMe}
      sectionsHeader={<FormattedMessage id="admin.title" defaultMessage="Admin panel" />}
      header={
        <Heading as="h3" size="md">
          {organization?.name ?? ""}
        </Heading>
      }
      showBackButton={true}
    >
      <Tabs variant="enclosed">
        <TabList paddingLeft={6} background="white" paddingTop={2}>
          <Tab
            fontWeight="500"
            _selected={{
              backgroundColor: "gray.50",
              borderColor: "gray.200",
              borderBottom: "1px solid transparent",
              color: "blue.600",
            }}
          >
            <FormattedMessage id="page.oganizations.users" defaultMessage="Users" />
          </Tab>
          <Tab
            fontWeight="500"
            _selected={{
              backgroundColor: "gray.50",
              borderColor: "gray.200",
              borderBottom: "1px solid transparent",
              color: "blue.600",
            }}
          >
            <FormattedMessage id="page.oganizations.features" defaultMessage="Features" />
          </Tab>
        </TabList>
        <TabPanels>
          <TabPanel padding={0}>
            <Flex flexDirection="column" flex="1" minHeight={0} padding={4} paddingBottom={16}>
              <TablePage
                flex="0 1 auto"
                minHeight={0}
                isSelectable
                isHighlightable
                columns={columns}
                rows={users ?? []}
                rowKeyProp="id"
                loading={loading}
                page={state.page}
                pageSize={state.items}
                totalCount={organization?.users.totalCount ?? 0}
                sort={state.sort}
                onSelectionChange={setSelected}
                onPageChange={(page) => setQueryState((s) => ({ ...s, page }))}
                onPageSizeChange={(items) => setQueryState((s) => ({ ...s, items, page: 1 }))}
                onSortChange={(sort) => setQueryState((s) => ({ ...s, sort }))}
                actions={[
                  {
                    key: "login-as",
                    onClick: handleLoginAs,
                    isDisabled:
                      selectedUsers.length !== 1 ||
                      selectedUsers[0].id === me.id ||
                      selectedUsers[0].status === "INACTIVE",
                    leftIcon: <LogInIcon />,
                    children: (
                      <FormattedMessage
                        id="organization-users.login-as"
                        defaultMessage="Login as..."
                      />
                    ),
                  },
                ]}
                header={
                  <OrganizationMembersListTableHeader
                    search={search}
                    onReload={() => refetch()}
                    onSearchChange={handleSearchChange}
                    onInviteClick={handleInviteUser}
                  />
                }
                body={
                  users.length === 0 && !loading ? (
                    state.search ? (
                      <Flex flex="1" alignItems="center" justifyContent="center">
                        <Text color="gray.300" fontSize="lg">
                          <FormattedMessage
                            id="view.group.no-results"
                            defaultMessage="There's no users matching your search"
                          />
                        </Text>
                      </Flex>
                    ) : (
                      <Flex flex="1" alignItems="center" justifyContent="center">
                        <Text fontSize="lg">
                          <FormattedMessage
                            id="view.group.no-users"
                            defaultMessage="No users added to this team yet"
                          />
                        </Text>
                      </Flex>
                    )
                  ) : null
                }
              />
            </Flex>
          </TabPanel>
          <TabPanel padding={4}>
            <Card maxWidth="container.sm" as="form" onSubmit={handleSubmitFeatureFlags}>
              <CardHeader>
                <FormattedMessage
                  id="page.oganizations.features-active"
                  defaultMessage="Enabled features"
                />
              </CardHeader>
              <Stack paddingX={6} paddingY={4} spacing={4}>
                <SearchInput
                  value={featureSearch ?? ""}
                  onChange={(e) => setFeatureSearch(e.target.value)}
                />
                {featureFlags.map(({ name, value }) => {
                  const featureName = featureFlagDescriptions[name as FeatureFlag]?.name ?? name;

                  const search = featureSearch.toLowerCase().trim();
                  if (
                    search &&
                    !featureName.toLowerCase().includes(search) &&
                    !name.toLowerCase().includes(search)
                  ) {
                    return null;
                  }

                  const isEdited = editedFeatures.some((f) => f.name === name);

                  return (
                    <HStack key={name} alignItems="center" justifyContent="space-between">
                      <Flex alignItems="center">
                        <Text as="span">{featureName}</Text>

                        <HelpPopover popoverWidth="sm">
                          <Stack>
                            <Text fontSize="xs">{name}</Text>
                            <Divider />
                            <Text fontSize="sm">
                              {featureFlagDescriptions[name as FeatureFlag]?.description ??
                                intl.formatMessage({
                                  id: "generic.no-description",
                                  defaultMessage: "No description",
                                })}
                            </Text>

                            {isDefined(featureFlagDescriptions[name as FeatureFlag]?.articleId) ? (
                              <HelpCenterLink
                                articleId={featureFlagDescriptions[name as FeatureFlag]!.articleId!}
                                width="fit-content"
                              >
                                <FormattedMessage id="generic.help" defaultMessage="Help" />
                              </HelpCenterLink>
                            ) : null}
                          </Stack>
                        </HelpPopover>
                      </Flex>
                      <HStack alignItems="center">
                        {isEdited ? (
                          <Badge colorScheme="yellow">
                            <FormattedMessage
                              id="generic.edited-indicator"
                              defaultMessage="Edited"
                            />
                          </Badge>
                        ) : null}
                        <Switch
                          isChecked={value}
                          onChange={(event) => {
                            handleChangeFeature(name, event.target.checked);
                          }}
                        />
                      </HStack>
                    </HStack>
                  );
                })}
                <HStack paddingTop={6} alignSelf="flex-end">
                  <Button
                    onClick={() => {
                      setFeatureFlags(originalFeatureFlags.current);
                      setEditedFeatures([]);
                    }}
                    isDisabled={!editedFeatures.length}
                  >
                    <FormattedMessage id="generic.cancel" defaultMessage="Cancel" />
                  </Button>
                  <Button
                    colorScheme="primary"
                    type="submit"
                    isDisabled={!editedFeatures.length}
                    isLoading={updatingFeatureFlags}
                  >
                    <FormattedMessage id="generic.save-changes" defaultMessage="Save changes" />
                  </Button>
                </HStack>
              </Stack>
            </Card>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </SettingsLayout>
  );
}

function useOrganizationMembersTableColumns() {
  const intl = useIntl();
  const roles = useOrganizationRoles();
  return useMemo<TableColumn<OrganizationMembers_OrganizationUserFragment>[]>(
    () => [
      {
        key: "id",
        header: intl.formatMessage({
          id: "organization-users.header.id",
          defaultMessage: "ID",
        }),
        cellProps: {
          width: "10%",
          minWidth: "140px",
        },
        CellContent: ({ row }) => {
          const copyToClipboard = useClipboardWithToast({
            text: intl.formatMessage({
              id: "organization-users.header.id.copied-toast",
              defaultMessage: "ID copied to clipboard",
            }),
          });
          return (
            <Text cursor="pointer" onClick={() => copyToClipboard({ value: row.id })}>
              {row.id}
            </Text>
          );
        },
      },
      {
        key: "fullName",
        isSortable: true,
        header: intl.formatMessage({
          id: "organization-users.header.name",
          defaultMessage: "Name",
        }),
        cellProps: {
          width: "30%",
          minWidth: "200px",
        },
        CellContent: ({ row }) => {
          return (
            <Text as="span" display="inline-flex" whiteSpace="nowrap" alignItems="center">
              <Text as="span" textDecoration={row.status === "INACTIVE" ? "line-through" : "none"}>
                {row.fullName}
              </Text>
              {row.status === "INACTIVE" ? (
                <Tooltip
                  label={intl.formatMessage({
                    id: "organization-users.header.inactive-user",
                    defaultMessage: "Inactive user",
                  })}
                >
                  <ForbiddenIcon
                    marginLeft={2}
                    color="red.300"
                    aria-label={intl.formatMessage({
                      id: "organization-users.header.inactive-user",
                      defaultMessage: "Inactive user",
                    })}
                  />
                </Tooltip>
              ) : null}
            </Text>
          );
        },
      },
      {
        key: "email",
        isSortable: true,
        header: intl.formatMessage({
          id: "organization-users.header.user-email",
          defaultMessage: "Email",
        }),
        cellProps: {
          width: "30%",
          minWidth: "200px",
        },
        CellContent: ({ row }) => <>{row.email}</>,
      },
      {
        key: "role",
        header: intl.formatMessage({
          id: "organization-role.header.user",
          defaultMessage: "Role",
        }),
        cellProps: {
          width: "10%",
          minWidth: "130px",
        },
        CellContent: ({ row }) => (
          <Badge
            colorScheme={
              (
                {
                  OWNER: "primary",
                  ADMIN: "green",
                } as Record<OrganizationRole, string>
              )[row.role] ?? "gray"
            }
          >
            {roles.find((r) => r.role === row.role)?.label ?? (null as never)}
          </Badge>
        ),
      },
      {
        key: "lastActiveAt",
        header: intl.formatMessage({
          id: "generic.last-active-at",
          defaultMessage: "Last active at",
        }),
        isSortable: true,
        cellProps: {
          width: "10%",
          minWidth: "210px",
        },
        CellContent: ({ row }) =>
          row.lastActiveAt ? (
            <DateTime
              value={row.lastActiveAt}
              format={FORMATS.LLL}
              useRelativeTime
              whiteSpace="nowrap"
            />
          ) : (
            <Text textStyle="hint">
              <FormattedMessage id="generic.never-active" defaultMessage="Never active" />
            </Text>
          ),
      },
      {
        key: "createdAt",
        isSortable: true,
        header: intl.formatMessage({
          id: "generic.created-at",
          defaultMessage: "Created at",
        }),
        cellProps: {
          width: "10%",
          minWidth: "195px",
        },
        CellContent: ({ row }) => (
          <DateTime
            value={row.createdAt}
            format={FORMATS.LLL}
            useRelativeTime
            whiteSpace="nowrap"
          />
        ),
      },
    ],
    [intl.locale]
  );
}

OrganizationMembers.fragments = {
  get OrganizationUser() {
    return gql`
      fragment OrganizationMembers_OrganizationUser on User {
        id
        fullName
        email
        role
        createdAt
        lastActiveAt
        status
      }
    `;
  },
  get Organization() {
    return gql`
      fragment OrganizationMembers_Organization on Organization {
        id
        name
        hasSsoProvider
        features {
          name
          value
        }
      }
    `;
  },
};

OrganizationMembers.mutations = [
  gql`
    mutation OrganizationMembers_updateFeatureFlags(
      $orgId: GID!
      $featureFlags: [InputFeatureFlag!]!
    ) {
      updateFeatureFlags(orgId: $orgId, featureFlags: $featureFlags) {
        id
        features {
          name
          value
        }
      }
    }
  `,
  gql`
    mutation OrganizationMembers_createOrganizationUser(
      $firstName: String!
      $lastName: String!
      $email: String!
      $role: OrganizationRole!
      $locale: String
      $orgId: GID
    ) {
      createOrganizationUser(
        email: $email
        firstName: $firstName
        lastName: $lastName
        role: $role
        locale: $locale
        orgId: $orgId
      ) {
        ...OrganizationMembers_OrganizationUser
      }
    }
    ${OrganizationMembers.fragments.OrganizationUser}
  `,
];

const _queries = [
  gql`
    query OrganizationMembers_user {
      ...AppLayout_Query
    }
    ${AppLayout.fragments.Query}
  `,
  gql`
    query OrganizationMembers_organization(
      $id: GID!
      $offset: Int!
      $limit: Int!
      $search: String
      $sortBy: [OrganizationUsers_OrderBy!]
    ) {
      organization(id: $id) {
        ...OrganizationMembers_Organization
        users(
          offset: $offset
          limit: $limit
          search: $search
          sortBy: $sortBy
          includeInactive: true
        ) {
          totalCount
          items {
            ...OrganizationMembers_OrganizationUser
          }
        }
      }
    }
    ${OrganizationMembers.fragments.OrganizationUser}
    ${OrganizationMembers.fragments.Organization}
  `,
];

OrganizationMembers.getInitialProps = async ({ query, fetchQuery }: WithApolloDataContext) => {
  const { page, items, search, sort } = parseQuery(query, QUERY_STATE);
  await Promise.all([
    fetchQuery(OrganizationMembers_organizationDocument, {
      variables: {
        id: query!.organizationId as string,
        offset: items * (page - 1),
        limit: items,
        search,
        sortBy: [`${sort.field}_${sort.direction}` as OrganizationUsers_OrderBy],
      },
    }),
    fetchQuery(OrganizationMembers_userDocument),
  ]);
  return { organizationId: query.organizationId as string };
};

export default compose(withSuperAdminAccess, withDialogs, withApolloData)(OrganizationMembers);
