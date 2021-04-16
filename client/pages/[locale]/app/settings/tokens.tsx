import { gql } from "@apollo/client";
import { Box, Button, Flex, Stack, Text } from "@chakra-ui/react";
import { RepeatIcon } from "@parallel/chakra/icons";
import { DateTime } from "@parallel/components/common/DateTime";
import { withDialogs } from "@parallel/components/common/DialogProvider";
import { IconButtonWithTooltip } from "@parallel/components/common/IconButtonWithTooltip";
import { NormalLink } from "@parallel/components/common/Link";
import { SearchInput } from "@parallel/components/common/SearchInput";
import { Spacer } from "@parallel/components/common/Spacer";
import { TableColumn } from "@parallel/components/common/Table";
import { TablePage } from "@parallel/components/common/TablePage";
import {
  withApolloData,
  WithApolloDataContext,
} from "@parallel/components/common/withApolloData";
import { withFeatureFlag } from "@parallel/components/common/withFeatureFlag";
import { SettingsLayout } from "@parallel/components/layout/SettingsLayout";
import { useDeleteAccessTokenDialog } from "@parallel/components/settings/DeleteAccessTokenDialog";
import { useGenerateNewTokenDialog } from "@parallel/components/settings/GenerateNewTokenDialog";
import {
  TokensQuery,
  Tokens_UserAuthenticationTokenFragment,
  UserAuthenticationTokens_OrderBy,
  useRevokeUserAuthTokenMutation,
  useTokensQuery,
} from "@parallel/graphql/__types";
import { useAssertQueryOrPreviousData } from "@parallel/utils/apollo/assertQuery";
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
import { useDebouncedCallback } from "@parallel/utils/useDebouncedCallback";
import { useSettingsSections } from "@parallel/utils/useSettingsSections";
import { useCallback, useMemo, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";

const SORTING = ["tokenName", "createdAt", "lastUsedAt"] as const;
const QUERY_STATE = {
  page: integer({ min: 1 }).orDefault(1),
  items: values([10, 25, 50]).orDefault(10),
  search: string(),
  sort: sorting(SORTING).orDefault({
    field: "createdAt",
    direction: "DESC",
  }),
};

function Tokens() {
  const intl = useIntl();
  const [state, setQueryState] = useQueryState(QUERY_STATE);

  const {
    data: { me },
    loading,
    refetch,
  } = useAssertQueryOrPreviousData(
    useTokensQuery({
      variables: {
        offset: state.items * (state.page - 1),
        limit: state.items,
        search: state.search,
        sortBy: [
          `${state.sort.field}_${state.sort.direction}` as UserAuthenticationTokens_OrderBy,
        ],
      },
    })
  );
  const sections = useSettingsSections(me);
  const authTokens = me.authenticationTokens;

  const [selected, setSelected] = useState<string[]>([]);

  const [search, setSearch] = useState(state.search);
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

  const showGenerateNewTokenDialog = useGenerateNewTokenDialog();
  const handleGenerateNewToken = async () => {
    try {
      await showGenerateNewTokenDialog({});
      await refetch();
    } catch {}
  };

  const showRevokeAccessToken = useDeleteAccessTokenDialog();
  const [revokeTokens] = useRevokeUserAuthTokenMutation();
  const handleRevokeTokens = async (tokenIds: string[]) => {
    try {
      await showRevokeAccessToken({ selectedCount: tokenIds.length });
      await revokeTokens({
        variables: {
          authTokenIds: tokenIds,
        },
      });

      await refetch();
    } catch {}
  };

  const columns = useAuthTokensTableColumns();

  return (
    <SettingsLayout
      title={intl.formatMessage({
        id: "settings.api-tokens",
        defaultMessage: "API Tokens",
      })}
      basePath="/app/settings"
      sections={sections}
      user={me}
      sectionsHeader={
        <FormattedMessage id="settings.title" defaultMessage="Settings" />
      }
      header={
        <FormattedMessage
          id="settings.api-tokens"
          defaultMessage="API Tokens"
        />
      }
    >
      <Flex flexDirection="column" flex="1" padding={4}>
        <Text marginBottom={4}>
          <FormattedMessage
            id="settings.api-tokens.explainer"
            defaultMessage="Personal Access Tokens can be used to access the <a>Parallel API</a>."
            values={{
              a: (chunks: any[]) => (
                <NormalLink href="/developers/api" target="_blank">
                  {chunks}
                </NormalLink>
              ),
            }}
          />
        </Text>
        <TablePage
          flex="1"
          isSelectable
          isHighlightable
          columns={columns}
          rows={authTokens.items}
          rowKeyProp="id"
          loading={loading}
          page={state.page}
          pageSize={state.items}
          totalCount={authTokens.totalCount}
          sort={state.sort}
          onSelectionChange={setSelected}
          onPageChange={(page) => setQueryState((s) => ({ ...s, page }))}
          onPageSizeChange={(items) =>
            setQueryState((s) => ({ ...s, items, page: 1 }))
          }
          onSortChange={(sort) => setQueryState((s) => ({ ...s, sort }))}
          header={
            <Stack direction="row" padding={2}>
              <Box flex="0 1 400px">
                <SearchInput
                  value={search ?? ""}
                  onChange={(e) => handleSearchChange(e.target.value)}
                />
              </Box>
              <IconButtonWithTooltip
                onClick={() => refetch()}
                icon={<RepeatIcon />}
                placement="bottom"
                variant="outline"
                label={intl.formatMessage({
                  id: "generic.reload-data",
                  defaultMessage: "Reload",
                })}
              />
              <Spacer />

              <Button
                isDisabled={selected.length === 0}
                onClick={() => handleRevokeTokens(selected)}
              >
                <Text color="red.500">
                  <FormattedMessage
                    id="generic.delete"
                    defaultMessage="Delete"
                  />
                </Text>
              </Button>

              <Button colorScheme="purple" onClick={handleGenerateNewToken}>
                <FormattedMessage
                  id="settings.api-tokens.generate-new-token"
                  defaultMessage="Create token"
                />
              </Button>
            </Stack>
          }
        />
      </Flex>
    </SettingsLayout>
  );
}

function useAuthTokensTableColumns(): TableColumn<Tokens_UserAuthenticationTokenFragment>[] {
  const intl = useIntl();
  return useMemo(
    () => [
      {
        key: "tokenName",
        isSortable: true,
        header: intl.formatMessage({
          id: "settings.api-tokens.header.token-name",
          defaultMessage: "Name",
        }),
        CellContent: ({ row }) => {
          return (
            <Text
              as="span"
              display="inline-flex"
              whiteSpace="nowrap"
              alignItems="center"
            >
              {row.tokenName}
            </Text>
          );
        },
      },
      {
        key: "lastUsedAt",
        header: intl.formatMessage({
          id: "generic.last-used-at",
          defaultMessage: "Last used at",
        }),
        cellProps: {
          width: "1px",
        },
        isSortable: true,
        CellContent: ({ row }) =>
          row.lastUsedAt ? (
            <DateTime
              value={row.lastUsedAt}
              format={FORMATS.LLL}
              useRelativeTime
              whiteSpace="nowrap"
            />
          ) : (
            <Text textStyle="hint">
              <FormattedMessage
                id="generic.never-used"
                defaultMessage="Never used"
              />
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
          width: "1px",
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

Tokens.fragments = {
  UserAuthenticationToken: gql`
    fragment Tokens_UserAuthenticationToken on UserAuthenticationToken {
      id
      tokenName
      createdAt
      lastUsedAt
    }
  `,
};

Tokens.mutations = [
  gql`
    mutation RevokeUserAuthToken($authTokenIds: [GID!]!) {
      revokeUserAuthToken(authTokenIds: $authTokenIds)
    }
  `,
];

Tokens.getInitialProps = async ({
  fetchQuery,
  ...context
}: WithApolloDataContext) => {
  const { page, items, search, sort } = parseQuery(context.query, QUERY_STATE);

  await fetchQuery<TokensQuery>(
    gql`
      query Tokens(
        $offset: Int!
        $limit: Int!
        $search: String
        $sortBy: [UserAuthenticationTokens_OrderBy!]
      ) {
        me {
          id
          authenticationTokens(
            limit: $limit
            offset: $offset
            search: $search
            sortBy: $sortBy
          ) {
            totalCount
            items {
              ...Tokens_UserAuthenticationToken
            }
          }
          ...SettingsLayout_User
          ...useSettingsSections_User
        }
      }
      ${SettingsLayout.fragments.User}
      ${useSettingsSections.fragments.User}
      ${Tokens.fragments.UserAuthenticationToken}
    `,
    {
      variables: {
        offset: items * (page - 1),
        limit: items,
        search,
        sortBy: [
          `${sort.field}_${sort.direction}` as UserAuthenticationTokens_OrderBy,
        ],
      },
    }
  );
};

export default compose(
  withDialogs,
  withFeatureFlag("API_TOKENS"),
  withApolloData
)(Tokens);
