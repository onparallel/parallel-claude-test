import { gql, useMutation } from "@apollo/client";
import { Button, Center, Heading, Stack, Text } from "@chakra-ui/react";
import { RepeatIcon } from "@parallel/chakra/icons";
import { Card } from "@parallel/components/common/Card";
import { DateTime } from "@parallel/components/common/DateTime";
import { useConfirmDeleteDialog } from "@parallel/components/common/dialogs/ConfirmDeleteDialog";
import { Divider } from "@parallel/components/common/Divider";
import { IconButtonWithTooltip } from "@parallel/components/common/IconButtonWithTooltip";
import { NormalLink } from "@parallel/components/common/Link";
import { Spacer } from "@parallel/components/common/Spacer";
import { Table, TableColumn } from "@parallel/components/common/Table";
import {
  ApiTokensTable_revokeUserAuthTokenDocument,
  ApiTokensTable_UserAuthenticationTokenFragment,
} from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { useCallback, useMemo, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { useGenerateNewTokenDialog } from "../dialogs/GenerateNewTokenDialog";

interface ApiTokensTableProps {
  tokens: ApiTokensTable_UserAuthenticationTokenFragment[];
  onRefetch?: () => void;
}

export function ApiTokensTable({ tokens, onRefetch }: ApiTokensTableProps) {
  const intl = useIntl();
  const apiTokensColumns = useApiTokensColumns();
  const [selectedTokens, setSelectedTokens] = useState<string[]>([]);

  const showGenerateNewTokenDialog = useGenerateNewTokenDialog();
  const handleGenerateNewToken = async () => {
    try {
      await showGenerateNewTokenDialog();
      await onRefetch?.();
    } catch {}
  };

  const showConfirmDeleteAccessTokenDialog = useConfirmDeleteAccessTokenDialog();
  const [revokeUserAuthToken] = useMutation(ApiTokensTable_revokeUserAuthTokenDocument);
  const handleRevokeTokens = async () => {
    try {
      await showConfirmDeleteAccessTokenDialog({ count: selectedTokens.length });
      await revokeUserAuthToken({ variables: { authTokenIds: selectedTokens } });
      await onRefetch?.();
      setSelectedTokens([]);
    } catch {}
  };

  return (
    <Stack>
      <Heading as="h4" size="md">
        <FormattedMessage id="component.api-tokens-table.title" defaultMessage="API Tokens" />
      </Heading>
      <Text>
        <FormattedMessage
          id="component.api-tokens-table.explanation"
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
            onClick={() => onRefetch?.()}
            icon={<RepeatIcon />}
            placement="bottom"
            variant="outline"
            label={intl.formatMessage({
              id: "generic.reload-data",
              defaultMessage: "Reload",
            })}
          />
          <Spacer />
          {selectedTokens.length ? (
            <Button colorScheme="red" variant="ghost" onClick={handleRevokeTokens}>
              <FormattedMessage id="generic.delete" defaultMessage="Delete" />
            </Button>
          ) : null}
          <Button colorScheme="primary" onClick={handleGenerateNewToken}>
            <FormattedMessage
              id="component.api-tokens-table.create-token"
              defaultMessage="Create token"
            />
          </Button>
        </Stack>
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
          />
        ) : (
          <>
            <Divider />
            <Center textStyle="hint" minHeight="60px">
              <FormattedMessage
                id="component.api-tokens-table.no-tokens-message"
                defaultMessage="You haven't created any API tokens yet"
              />
            </Center>
          </>
        )}
      </Card>
    </Stack>
  );
}

function useApiTokensColumns(): TableColumn<ApiTokensTable_UserAuthenticationTokenFragment>[] {
  const intl = useIntl();
  return useMemo(
    () => [
      {
        key: "tokenName",
        header: intl.formatMessage({
          id: "component.api-tokens-table.header.token-name",
          defaultMessage: "Name",
        }),
        CellContent: ({ row }) => {
          return <>{row.tokenName}</>;
        },
      },
      {
        key: "hint",
        header: intl.formatMessage({
          id: "component.api-tokens-table.header.hint",
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
          width: "150px",
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
    [intl.locale],
  );
}

ApiTokensTable.fragments = {
  UserAuthenticationToken: gql`
    fragment ApiTokensTable_UserAuthenticationToken on UserAuthenticationToken {
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
    mutation ApiTokensTable_revokeUserAuthToken($authTokenIds: [GID!]!) {
      revokeUserAuthToken(authTokenIds: $authTokenIds)
    }
  `,
];

function useConfirmDeleteAccessTokenDialog() {
  const showDialog = useConfirmDeleteDialog();
  return useCallback(async ({ count }: { count: number }) => {
    return await showDialog({
      header: (
        <FormattedMessage
          id="component.api-tokens-table.confirm-delete-header"
          defaultMessage="Revoke access {count, plural, =1 {token} other {tokens}}"
          values={{ count }}
        />
      ),
      description: (
        <Stack>
          <Text>
            <FormattedMessage
              id="component.api-tokens-table.confirm-delete-body"
              defaultMessage="Are you sure you want to delete the {count, plural, =1 {selected access token} other {# selected access tokens}}?"
              values={{ count }}
            />
          </Text>
          <Text>
            <FormattedMessage
              id="component.api-tokens-table.confirm-delete-warning"
              defaultMessage="Any applications or scripts using this {count, plural, =1 {token} other {tokens}} will no longer be able to access the Parallel API. This action <b>cannot be undone</b>."
              values={{ count }}
            />
          </Text>
        </Stack>
      ),
    });
  }, []);
}
