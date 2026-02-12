import { gql } from "@apollo/client";
import { useMutation } from "@apollo/client/react";
import { Center } from "@chakra-ui/react";
import { DeleteIcon, RepeatIcon } from "@parallel/chakra/icons";
import { Card } from "@parallel/components/common/Card";
import { DateTime } from "@parallel/components/common/DateTime";
import { Divider } from "@parallel/components/common/Divider";
import { IconButtonWithTooltip } from "@parallel/components/common/IconButtonWithTooltip";
import { NormalLink } from "@parallel/components/common/Link";
import { Spacer } from "@parallel/components/common/Spacer";
import { Table, TableColumn } from "@parallel/components/common/Table";
import { useConfirmDeleteDialog } from "@parallel/components/common/dialogs/ConfirmDeleteDialog";
import { withDialogs } from "@parallel/components/common/dialogs/DialogProvider";
import { WithApolloDataContext, withApolloData } from "@parallel/components/common/withApolloData";
import { withPermission } from "@parallel/components/common/withPermission";
import { DevelopersLayout } from "@parallel/components/layout/DevelopersLayout";
import { useGenerateNewTokenDialog } from "@parallel/components/settings/dialogs/GenerateNewTokenDialog";
import { Box, Button, Stack, Text } from "@parallel/components/ui";
import {
  Tokens_UserAuthenticationTokenFragment,
  Tokens_revokeUserAuthTokenDocument,
  Tokens_tokensDocument,
  Tokens_userDocument,
} from "@parallel/graphql/__types";
import { useAssertQuery } from "@parallel/utils/apollo/useAssertQuery";
import { compose } from "@parallel/utils/compose";
import { FORMATS } from "@parallel/utils/dates";
import { useCallback, useMemo, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";

function Tokens() {
  const intl = useIntl();
  const { data: queryObject } = useAssertQuery(Tokens_userDocument);
  const {
    data: {
      me: { tokens },
    },
    refetch,
  } = useAssertQuery(Tokens_tokensDocument);

  const apiTokensColumns = useApiTokensColumns();
  const [selectedTokens, setSelectedTokens] = useState<string[]>([]);

  const showGenerateNewTokenDialog = useGenerateNewTokenDialog();
  const handleGenerateNewToken = async () => {
    try {
      await showGenerateNewTokenDialog();
      await refetch();
    } catch {}
  };

  const showConfirmDeleteAccessTokenDialog = useConfirmDeleteAccessTokenDialog();
  const [revokeUserAuthToken] = useMutation(Tokens_revokeUserAuthTokenDocument);
  const handleRevokeTokens = async () => {
    try {
      await showConfirmDeleteAccessTokenDialog({ count: selectedTokens.length });
      await revokeUserAuthToken({ variables: { authTokenIds: selectedTokens } });
      await refetch();
      setSelectedTokens([]);
    } catch {}
  };

  const actions = [
    {
      key: "delete",
      onClick: () => handleRevokeTokens(),
      leftIcon: <DeleteIcon />,
      children: <FormattedMessage id="generic.delete" defaultMessage="Delete" />,
      colorScheme: "red",
    },
  ];

  return (
    <DevelopersLayout currentTabKey="tokens" queryObject={queryObject}>
      <Stack padding={6} gap={6} paddingBottom={24}>
        <Text>
          <FormattedMessage
            id="page.tokens.explanation"
            defaultMessage="Personal Access Tokens can be used to access the <a>Parallel API</a>."
            values={{
              a: (chunks: any) => (
                <NormalLink href="https://www.onparallel.com/developers/api" target="_blank">
                  {chunks}
                </NormalLink>
              ),
            }}
          />
        </Text>
        <Card display="flex" flexDirection="column" overflow="hidden">
          <Stack direction="row" padding={2}>
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
            <Button colorPalette="primary" onClick={handleGenerateNewToken}>
              <FormattedMessage id="page.tokens.create-token" defaultMessage="Create token" />
            </Button>
          </Stack>
          <Box overflowX="auto">
            {tokens.length ? (
              <Table
                flex="0 1 auto"
                minHeight={0}
                isSelectable
                isHighlightable
                columns={apiTokensColumns}
                rows={tokens}
                rowKeyProp="id"
                onSelectionChange={setSelectedTokens}
                actions={actions}
              />
            ) : (
              <>
                <Divider />
                <Center textStyle="hint" minHeight="60px">
                  <FormattedMessage
                    id="page.tokens.no-tokens-message"
                    defaultMessage="You haven't created any API tokens yet"
                  />
                </Center>
              </>
            )}
          </Box>
        </Card>
      </Stack>
    </DevelopersLayout>
  );
}

function useApiTokensColumns(): TableColumn<Tokens_UserAuthenticationTokenFragment>[] {
  const intl = useIntl();
  return useMemo(
    () => [
      {
        key: "tokenName",
        label: intl.formatMessage({
          id: "page.tokens.column-header-token-name",
          defaultMessage: "Name",
        }),
        cellProps: {
          width: "80%",
        },
        CellContent: ({ row }) => {
          return <>{row.tokenName}</>;
        },
      },
      {
        key: "hint",
        label: intl.formatMessage({
          id: "page.tokens.column-header-hint",
          defaultMessage: "Token",
        }),
        CellContent: ({ row }) => {
          return (
            <Text as="span" textStyle={row.hint ? undefined : "hint"}>
              {row.hint?.concat("...") ??
                intl.formatMessage({
                  id: "generic.unavailable",
                  defaultMessage: "Unavailable",
                })}
            </Text>
          );
        },
        cellProps: {
          minWidth: "150px",
          width: "20%",
        },
      },
      {
        key: "lastUsedAt",
        label: intl.formatMessage({
          id: "generic.last-used-at",
          defaultMessage: "Last used at",
        }),
        cellProps: {
          width: "5%",
          whiteSpace: "nowrap",
          minWidth: "180px",
        },
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
              <FormattedMessage id="generic.never-used" defaultMessage="Never used" />
            </Text>
          ),
      },
      {
        key: "createdAt",
        label: intl.formatMessage({
          id: "generic.created-at",
          defaultMessage: "Created at",
        }),
        cellProps: {
          minWidth: "170px",
          width: "5%",
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

    [intl.locale],
  );
}

function useConfirmDeleteAccessTokenDialog() {
  const showDialog = useConfirmDeleteDialog();
  return useCallback(async ({ count }: { count: number }) => {
    return await showDialog({
      header: (
        <FormattedMessage
          id="page.tokens.confirm-delete-header"
          defaultMessage="Revoke access {count, plural, =1 {token} other {tokens}}"
          values={{ count }}
        />
      ),

      description: (
        <Stack>
          <Text>
            <FormattedMessage
              id="page.tokens.confirm-delete-body"
              defaultMessage="Are you sure you want to delete the {count, plural, =1 {selected access token} other {# selected access tokens}}?"
              values={{ count }}
            />
          </Text>
          <Text>
            <FormattedMessage
              id="page.tokens.confirm-delete-warning"
              defaultMessage="Any applications or scripts using this {count, plural, =1 {token} other {tokens}} will no longer be able to access the Parallel API. This action <b>cannot be undone</b>."
              values={{ count }}
            />
          </Text>
        </Stack>
      ),
    });
  }, []);
}

const _fragments = {
  UserAuthenticationToken: gql`
    fragment Tokens_UserAuthenticationToken on UserAuthenticationToken {
      id
      tokenName
      hint
      createdAt
      lastUsedAt
    }
  `,
};

const _mutations = [
  gql`
    mutation Tokens_revokeUserAuthToken($authTokenIds: [GID!]!) {
      revokeUserAuthToken(authTokenIds: $authTokenIds)
    }
  `,
];

const _queries = [
  gql`
    query Tokens_tokens {
      me {
        id
        tokens {
          ...Tokens_UserAuthenticationToken
        }
      }
    }
  `,

  gql`
    query Tokens_user {
      ...DevelopersLayout_Query
    }
  `,
];

Tokens.getInitialProps = async ({ fetchQuery }: WithApolloDataContext) => {
  await Promise.all([fetchQuery(Tokens_userDocument), fetchQuery(Tokens_tokensDocument)]);
};

export default compose(
  withDialogs,
  withPermission("INTEGRATIONS:CRUD_API"),
  withApolloData,
)(Tokens);
