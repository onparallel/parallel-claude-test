import { gql, useMutation } from "@apollo/client";
import {
  Badge,
  Box,
  Button,
  Center,
  Divider,
  Heading,
  List,
  ListItem,
  Stack,
  Switch,
  Text,
} from "@chakra-ui/react";
import { EditIcon, RepeatIcon } from "@parallel/chakra/icons";
import { Card } from "@parallel/components/common/Card";
import { CopyToClipboardButton } from "@parallel/components/common/CopyToClipboardButton";
import { DateTime } from "@parallel/components/common/DateTime";
import { withDialogs } from "@parallel/components/common/dialogs/DialogProvider";
import { IconButtonWithTooltip } from "@parallel/components/common/IconButtonWithTooltip";
import { NormalLink } from "@parallel/components/common/Link";
import { OverflownText } from "@parallel/components/common/OverflownText";
import { SmallPopover } from "@parallel/components/common/SmallPopover";
import { Spacer } from "@parallel/components/common/Spacer";
import { Table, TableColumn } from "@parallel/components/common/Table";
import { withApolloData, WithApolloDataContext } from "@parallel/components/common/withApolloData";
import { withFeatureFlag } from "@parallel/components/common/withFeatureFlag";
import { SettingsLayout } from "@parallel/components/layout/SettingsLayout";
import {
  CreateOrUpdateEventSubscriptionDialog,
  useCreateOrUpdateEventSubscriptionDialog,
} from "@parallel/components/settings/dialogs/CreateOrUpdateEventSubscriptionDialog";
import { useDeleteAccessTokenDialog } from "@parallel/components/settings/dialogs/DeleteAccessTokenDialog";
import { useDeleteSubscriptionDialog } from "@parallel/components/settings/dialogs/DeleteSubscriptionDialog";
import { useGenerateNewTokenDialog } from "@parallel/components/settings/dialogs/GenerateNewTokenDialog";
import {
  Developers_createEventSubscriptionDocument,
  Developers_deleteEventSubscriptionsDocument,
  Developers_PetitionEventSubscriptionFragment,
  Developers_revokeUserAuthTokenDocument,
  Developers_subscriptionsDocument,
  Developers_tokensDocument,
  Developers_updateEventSubscriptionDocument,
  Developers_UserAuthenticationTokenFragment,
  Developers_userDocument,
} from "@parallel/graphql/__types";
import { useAssertQuery } from "@parallel/utils/apollo/useAssertQuery";
import { compose } from "@parallel/utils/compose";
import { FORMATS } from "@parallel/utils/dates";
import { useSettingsSections } from "@parallel/utils/useSettingsSections";
import { useMemo, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { isDefined } from "remeda";

function Developers() {
  const intl = useIntl();

  const {
    data: { me },
  } = useAssertQuery(Developers_userDocument);
  const {
    data: {
      me: { tokens },
    },
    refetch: refetchTokens,
  } = useAssertQuery(Developers_tokensDocument);
  const {
    data: { subscriptions },
    refetch: refetchSubscriptions,
  } = useAssertQuery(Developers_subscriptionsDocument);

  const sections = useSettingsSections(me);

  const [selectedTokens, setSelectedTokens] = useState<string[]>([]);
  const [selectedSubscriptions, setSelectedSubscriptions] = useState<string[]>([]);

  const showGenerateNewTokenDialog = useGenerateNewTokenDialog();
  const handleGenerateNewToken = async () => {
    try {
      await showGenerateNewTokenDialog({});
      await refetchTokens();
    } catch {}
  };

  const showRevokeAccessTokenDialog = useDeleteAccessTokenDialog();
  const [revokeTokens] = useMutation(Developers_revokeUserAuthTokenDocument);
  const handleRevokeTokens = async () => {
    try {
      await showRevokeAccessTokenDialog({ selectedCount: selectedTokens.length });
      await revokeTokens({ variables: { authTokenIds: selectedTokens } });
      await refetchTokens();
      setSelectedTokens([]);
    } catch {}
  };

  const apiTokensColumns = useApiTokensColumns();
  const subscriptionsColumns = useSubscriptionsColumns();

  const showCreateOrUpdateEventSubscriptionDialog = useCreateOrUpdateEventSubscriptionDialog();
  const [createEventSubscription] = useMutation(Developers_createEventSubscriptionDocument);
  const handleCreateEventSubscription = async () => {
    try {
      await showCreateOrUpdateEventSubscriptionDialog({
        onCreateEventSubscription: async (data) => {
          await createEventSubscription({ variables: data });
          await refetchSubscriptions();
        },
      });
    } catch {}
  };

  const showDeleteSubscriptionDialog = useDeleteSubscriptionDialog();
  const [deleteEventSubscriptions] = useMutation(Developers_deleteEventSubscriptionsDocument);
  const handleDeleteEventSubscriptions = async () => {
    try {
      await showDeleteSubscriptionDialog({ selectedCount: selectedSubscriptions.length });
      await deleteEventSubscriptions({
        variables: {
          ids: selectedSubscriptions,
        },
      });
      await refetchSubscriptions();
      setSelectedSubscriptions([]);
    } catch {}
  };

  const [updateEventSubscription] = useMutation(Developers_updateEventSubscriptionDocument);
  const handleUpdateEventSubscription = async () => {
    const id = selectedSubscriptions[0];
    try {
      await showCreateOrUpdateEventSubscriptionDialog({
        eventSubscription: subscriptions.find((x) => id === selectedSubscriptions[0]),
        onUpdateEventSubscription: async (data) => {
          await updateEventSubscription({ variables: { id: selectedSubscriptions[0], data } });
          await refetchSubscriptions();
        },
      });
    } catch {}
  };
  const subscriptionsTableContext = useMemo<SubscriptionsTableContext>(
    () => ({
      onToggleEnabled: async (id: string, isEnabled: boolean) => {
        await updateEventSubscription({
          variables: { id, data: { isEnabled } },
        });
      },
    }),
    [updateEventSubscription]
  );

  return (
    <SettingsLayout
      title={intl.formatMessage({
        id: "settings.developers",
        defaultMessage: "Developers",
      })}
      basePath="/app/settings"
      sections={sections}
      user={me}
      sectionsHeader={<FormattedMessage id="settings.title" defaultMessage="Settings" />}
      header={
        <Heading as="h2" size="md">
          <FormattedMessage id="settings.developers" defaultMessage="Developers" />
        </Heading>
      }
    >
      <Stack padding={6} spacing={4} width="100%">
        <Stack>
          <Heading as="h4" size="md">
            <FormattedMessage
              id="settings.developers.api-tokens-title"
              defaultMessage="API Tokens"
            />
          </Heading>
          <Text>
            <FormattedMessage
              id="settings.developers.api-tokens-explanation"
              defaultMessage="Personal Access Tokens can be used to access the <a>Parallel API</a>."
              values={{
                a: (chunks: any) => (
                  <NormalLink href="/developers/api" target="_blank">
                    {chunks}
                  </NormalLink>
                ),
              }}
            />
          </Text>
          <Card display="flex" flexDirection="column" overflow="hidden">
            <Stack direction="row" padding={2}>
              <IconButtonWithTooltip
                onClick={() => refetchTokens()}
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
              <Button colorScheme="purple" onClick={handleGenerateNewToken}>
                <FormattedMessage
                  id="settings.developers.create-token"
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
                    id="settings.developers.no-tokens-message"
                    defaultMessage="You haven't created any API tokens yet"
                  />
                </Center>
              </>
            )}
          </Card>
        </Stack>
        <Divider borderColor="gray.300" />
        <Stack>
          <Heading as="h4" size="md">
            <FormattedMessage
              id="settings.developers.subscriptions-title"
              defaultMessage="Subscriptions"
            />
          </Heading>
          <Text>
            <FormattedMessage
              id="settings.developers.subscriptions-explanation"
              defaultMessage="Here you can register webhooks to get notified when anything happens in one of your petitions (e.g. when a recipients adds a comment or when the petition is completed)"
            />
          </Text>
          <Card display="flex" flexDirection="column" overflow="hidden">
            <Stack direction="row" padding={2}>
              <IconButtonWithTooltip
                onClick={() => refetchSubscriptions()}
                icon={<RepeatIcon />}
                placement="bottom"
                variant="outline"
                label={intl.formatMessage({
                  id: "generic.reload-data",
                  defaultMessage: "Reload",
                })}
              />
              <Spacer />
              {selectedSubscriptions.length ? (
                <Button colorScheme="red" variant="ghost" onClick={handleDeleteEventSubscriptions}>
                  <FormattedMessage id="generic.delete" defaultMessage="Delete" />
                </Button>
              ) : null}
              {selectedSubscriptions.length === 1 ? (
                <Button leftIcon={<EditIcon />} onClick={handleUpdateEventSubscription}>
                  <FormattedMessage id="generic.edit" defaultMessage="Edit" />
                </Button>
              ) : null}
              <Button colorScheme="purple" onClick={handleCreateEventSubscription}>
                <FormattedMessage
                  id="settings.developers.create-subscription"
                  defaultMessage="Create subscription"
                />
              </Button>
            </Stack>
            {subscriptions.length ? (
              <Table
                context={subscriptionsTableContext}
                flex="0 1 auto"
                minHeight={0}
                isSelectable
                isHighlightable
                columns={subscriptionsColumns}
                rows={subscriptions}
                rowKeyProp="id"
                onSelectionChange={setSelectedSubscriptions}
              />
            ) : (
              <>
                <Divider />
                <Center textStyle="hint" minHeight="60px">
                  <FormattedMessage
                    id="settings.developers.no-subscriptions-message"
                    defaultMessage="You haven't created any subscriptions yet"
                  />
                </Center>
              </>
            )}
          </Card>
        </Stack>
      </Stack>
    </SettingsLayout>
  );
}

function useApiTokensColumns(): TableColumn<Developers_UserAuthenticationTokenFragment>[] {
  const intl = useIntl();
  return useMemo(
    () => [
      {
        key: "tokenName",
        header: intl.formatMessage({
          id: "settings.developers.api-tokens.header.token-name",
          defaultMessage: "Name",
        }),
        CellContent: ({ row }) => {
          return <>{row.tokenName}</>;
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
    [intl.locale]
  );
}

interface SubscriptionsTableContext {
  onToggleEnabled: (id: string, isEnabled: boolean) => void;
}

function useSubscriptionsColumns(): TableColumn<
  Developers_PetitionEventSubscriptionFragment,
  SubscriptionsTableContext
>[] {
  const intl = useIntl();
  return useMemo(
    () => [
      {
        key: "eventsUrl",
        header: intl.formatMessage({
          id: "settings.developers.subscriptions.header.events-url",
          defaultMessage: "Events URL",
        }),
        cellProps: {
          userSelect: "auto",
          fontSize: "sm",
          paddingY: 0,
          sx: {
            "&:hover .copy-to-clipboard": {
              display: "inline-block",
            },
          },
        },
        CellContent: ({ row }) => {
          return (
            <Box position="relative" height="40px">
              <OverflownText paddingY={2} fontSize="sm" position="absolute" maxWidth="100%">
                {row.eventsUrl}
                <CopyToClipboardButton
                  position="relative"
                  top="-2px"
                  marginLeft={2}
                  marginRight={1}
                  display="none"
                  className="copy-to-clipboard"
                  size="xs"
                  text={row.eventsUrl}
                />
              </OverflownText>
            </Box>
          );
        },
      },
      {
        key: "eventTypes",
        header: intl.formatMessage({
          id: "settings.developers.subscriptions.header.event-types",
          defaultMessage: "Event types",
        }),
        align: "center",
        cellProps: { width: "1%", whiteSpace: "nowrap" },
        CellContent: ({ row }) => {
          return !isDefined(row.eventTypes) ? (
            <Text fontSize="sm">
              <FormattedMessage id="generic.all-event-types" defaultMessage="All events" />
            </Text>
          ) : row.eventTypes.length === 1 ? (
            <Badge>{row.eventTypes[0]}</Badge>
          ) : (
            <SmallPopover
              width="min-content"
              placement="bottom-end"
              content={
                <Stack as={List} alignItems="flex-start">
                  {row.eventTypes!.map((type) => (
                    <Badge as={ListItem} key={type}>
                      {type}
                    </Badge>
                  ))}
                </Stack>
              }
            >
              <Text color="purple.500" fontSize="sm">
                <FormattedMessage
                  id="settings.developers.subscriptions.n-events"
                  defaultMessage="{count} events"
                  values={{ count: row.eventTypes.length }}
                />
              </Text>
            </SmallPopover>
          );
        },
      },
      {
        key: "isEnabled",
        header: intl.formatMessage({
          id: "settings.developers.subscriptions.header.is-enabled",
          defaultMessage: "Enabled",
        }),
        align: "center",
        cellProps: { width: "1%" },
        CellContent: ({ row, context: { onToggleEnabled } }) => {
          return (
            <Switch
              isChecked={row.isEnabled}
              onChange={(e) => onToggleEnabled(row.id, e.target.checked)}
            />
          );
        },
      },
    ],
    [intl.locale]
  );
}

Developers.fragments = {
  UserAuthenticationToken: gql`
    fragment Developers_UserAuthenticationToken on UserAuthenticationToken {
      id
      tokenName
      createdAt
      lastUsedAt
    }
  `,
  PetitionEventSubscription: gql`
    fragment Developers_PetitionEventSubscription on PetitionEventSubscription {
      id
      eventsUrl
      eventTypes
      isEnabled
      ...CreateOrUpdateEventSubscriptionDialog_PetitionEventSubscription
    }
    ${CreateOrUpdateEventSubscriptionDialog.fragments.PetitionEventSubscription}
  `,
};

Developers.mutations = [
  gql`
    mutation Developers_revokeUserAuthToken($authTokenIds: [GID!]!) {
      revokeUserAuthToken(authTokenIds: $authTokenIds)
    }
  `,
  gql`
    mutation Developers_createEventSubscription(
      $eventsUrl: String!
      $eventTypes: [PetitionEventType!]
    ) {
      createEventSubscription(eventsUrl: $eventsUrl, eventTypes: $eventTypes) {
        ...Developers_PetitionEventSubscription
      }
    }
    ${Developers.fragments.PetitionEventSubscription}
  `,
  gql`
    mutation Developers_updateEventSubscription($id: GID!, $data: UpdateEventSubscriptionInput!) {
      updateEventSubscription(id: $id, data: $data) {
        ...Developers_PetitionEventSubscription
      }
    }
    ${Developers.fragments.PetitionEventSubscription}
  `,
  gql`
    mutation Developers_deleteEventSubscriptions($ids: [GID!]!) {
      deleteEventSubscriptions(ids: $ids)
    }
  `,
];

Developers.queries = [
  gql`
    query Developers_tokens {
      me {
        id
        tokens {
          ...Developers_UserAuthenticationToken
        }
      }
    }
    ${Developers.fragments.UserAuthenticationToken}
  `,
  gql`
    query Developers_subscriptions {
      subscriptions {
        ...Developers_PetitionEventSubscription
      }
    }
    ${Developers.fragments.PetitionEventSubscription}
  `,
  gql`
    query Developers_user {
      me {
        id
        ...SettingsLayout_User
        ...useSettingsSections_User
      }
    }
    ${SettingsLayout.fragments.User}
    ${useSettingsSections.fragments.User}
  `,
];

Developers.getInitialProps = async ({ fetchQuery }: WithApolloDataContext) => {
  await Promise.all([
    fetchQuery(Developers_userDocument),
    fetchQuery(Developers_tokensDocument),
    fetchQuery(Developers_subscriptionsDocument),
  ]);
};

export default compose(
  withDialogs,
  withFeatureFlag("DEVELOPER_ACCESS"),
  withApolloData
)(Developers);
