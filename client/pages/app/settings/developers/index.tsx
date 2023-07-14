import { gql } from "@apollo/client";
import { Stack } from "@chakra-ui/react";
import { withDialogs } from "@parallel/components/common/dialogs/DialogProvider";
import { WithApolloDataContext, withApolloData } from "@parallel/components/common/withApolloData";
import { withFeatureFlag } from "@parallel/components/common/withFeatureFlag";
import { withPermission } from "@parallel/components/common/withPermission";
import { DevelopersLayout } from "@parallel/components/layout/DevelopersLayout";
import {
  Subscriptions_subscriptionsDocument,
  Subscriptions_userDocument,
} from "@parallel/graphql/__types";
import { useAssertQuery } from "@parallel/utils/apollo/useAssertQuery";
import { compose } from "@parallel/utils/compose";

import { useMutation } from "@apollo/client";
import {
  Badge,
  Box,
  Button,
  Center,
  HStack,
  List,
  ListItem,
  Switch,
  Text,
  Tooltip,
} from "@chakra-ui/react";
import { AlertCircleFilledIcon, DeleteIcon, EditIcon, RepeatIcon } from "@parallel/chakra/icons";
import { Card } from "@parallel/components/common/Card";
import { Divider } from "@parallel/components/common/Divider";
import { IconButtonWithTooltip } from "@parallel/components/common/IconButtonWithTooltip";
import { Link } from "@parallel/components/common/Link";
import { OverflownText } from "@parallel/components/common/OverflownText";
import { SmallPopover } from "@parallel/components/common/SmallPopover";
import { Spacer } from "@parallel/components/common/Spacer";
import { Table, TableColumn } from "@parallel/components/common/Table";
import { useConfirmDeleteDialog } from "@parallel/components/common/dialogs/ConfirmDeleteDialog";
import { useConfirmDeactivateEventSubscriptionDialog } from "@parallel/components/settings/dialogs/ConfirmDeactivateEventSubscriptionDialog";
import {
  CreateOrUpdateEventSubscriptionDialog,
  useCreateOrUpdateEventSubscriptionDialog,
} from "@parallel/components/settings/dialogs/CreateOrUpdateEventSubscriptionDialog";
import {
  PetitionEventType,
  Subscriptions_PetitionEventSubscriptionFragment,
  Subscriptions_createEventSubscriptionDocument,
  Subscriptions_createEventSubscriptionSignatureKeyDocument,
  Subscriptions_deleteEventSubscriptionSignatureKeysDocument,
  Subscriptions_deleteEventSubscriptionsDocument,
  Subscriptions_updateEventSubscriptionDocument,
} from "@parallel/graphql/__types";
import { Maybe } from "@parallel/utils/types";
import { useCallback, useMemo, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { isDefined } from "remeda";

function Subscriptions() {
  const intl = useIntl();
  const {
    data: { me, realMe },
  } = useAssertQuery(Subscriptions_userDocument);

  const {
    data: { subscriptions },
    refetch: refetchSubscriptions,
  } = useAssertQuery(Subscriptions_subscriptionsDocument);

  const [selectedSubscriptions, setSelectedSubscriptions] = useState<string[]>([]);

  const [updateEventSubscription] = useMutation(Subscriptions_updateEventSubscriptionDocument);
  const [deleteEventSubscriptions] = useMutation(Subscriptions_deleteEventSubscriptionsDocument);
  const [createEventSubscription] = useMutation(Subscriptions_createEventSubscriptionDocument);

  const [createEventSubscriptionSignatureKey] = useMutation(
    Subscriptions_createEventSubscriptionSignatureKeyDocument,
  );

  const [deleteEventSubscriptionSignatureKeys] = useMutation(
    Subscriptions_deleteEventSubscriptionSignatureKeysDocument,
  );

  const createOrUpdateSubscriptionHandlers = {
    onSubscriptionSubmit: async (
      id: Maybe<string>,
      data: {
        eventsUrl: string;
        eventTypes: PetitionEventType[] | null;
        name: string | null;
        fromTemplateId: string | null;
        fromTemplateFieldIds: string[] | null;
      },
    ) => {
      let subscriptionId = id;
      if (isDefined(id)) {
        await updateEventSubscription({
          variables: {
            id,
            name: data.name,
            eventsUrl: data.eventsUrl,
            eventTypes: data.eventTypes,
            fromTemplateId: data.fromTemplateId,
            fromTemplateFieldIds: data.fromTemplateFieldIds,
          },
        });
      } else {
        const result = await createEventSubscription({ variables: data });
        subscriptionId = result.data!.createEventSubscription.id;
      }

      await refetchSubscriptions();
      return subscriptionId!;
    },
    onAddSignatureKey: async (subscriptionId: string) => {
      const response = await createEventSubscriptionSignatureKey({
        variables: { subscriptionId },
      });
      await refetchSubscriptions();
      return response.data!.createEventSubscriptionSignatureKey;
    },
    onDeleteSignatureKey: async (signatureKeyId: string) => {
      await deleteEventSubscriptionSignatureKeys({ variables: { ids: [signatureKeyId] } });
      await refetchSubscriptions();
    },
  };

  const showCreateOrUpdateEventSubscriptionDialog = useCreateOrUpdateEventSubscriptionDialog();
  const handleCreateEventSubscription = async () => {
    try {
      await showCreateOrUpdateEventSubscriptionDialog({
        ...createOrUpdateSubscriptionHandlers,
      });
    } catch {}
  };

  const showDeleteSubscriptionDialog = useConfirmDeleteSubscriptionDialog();
  const handleDeleteEventSubscriptions = async () => {
    try {
      await showDeleteSubscriptionDialog({ count: selectedSubscriptions.length });
      await deleteEventSubscriptions({
        variables: {
          ids: selectedSubscriptions,
        },
      });
      await refetchSubscriptions();
      setSelectedSubscriptions([]);
    } catch {}
  };

  const handleEditEventSubscription = async () => {
    try {
      const eventSubscription = subscriptions.find((s) => s.id === selectedSubscriptions[0])!;
      await showCreateOrUpdateEventSubscriptionDialog({
        eventSubscription,
        ...createOrUpdateSubscriptionHandlers,
      });
    } catch {}
  };
  const handleEditSubscriptionSignatureKeys = async (subscriptionId: string) => {
    try {
      const eventSubscription = subscriptions.find((s) => s.id === subscriptionId)!;
      await showCreateOrUpdateEventSubscriptionDialog({
        eventSubscription,
        initialStep: 1,
        ...createOrUpdateSubscriptionHandlers,
      });
    } catch {}
  };

  const showConfirmDeactivateEventSubscriptionDialog =
    useConfirmDeactivateEventSubscriptionDialog();

  const subscriptionsTableContext = useMemo<SubscriptionsTableContext>(
    () => ({
      onToggleEnabled: async (id: string, isEnabled: boolean) => {
        await updateEventSubscription({
          variables: { id, isEnabled },
        });
      },
      showConfirmDeactivateEventSubscriptionDialog,
      onSignatureKeysClick: handleEditSubscriptionSignatureKeys,
    }),
    [
      updateEventSubscription,
      showConfirmDeactivateEventSubscriptionDialog,
      handleEditSubscriptionSignatureKeys,
    ],
  );

  const subscriptionsColumns = useSubscriptionsColumns();

  const actions = [
    {
      key: "edit",
      onClick: () => handleEditEventSubscription(),
      leftIcon: <EditIcon />,
      children: <FormattedMessage id="generic.edit" defaultMessage="Edit" />,
      isDisabled: selectedSubscriptions.length !== 1,
    },
    {
      key: "delete",
      onClick: () => handleDeleteEventSubscriptions(),
      leftIcon: <DeleteIcon />,
      children: <FormattedMessage id="generic.delete" defaultMessage="Delete" />,
      colorScheme: "red",
    },
  ];

  return (
    <DevelopersLayout currentTabKey="subscriptions" me={me} realMe={realMe}>
      <Stack padding={6} spacing={6} paddingBottom={24}>
        <Text>
          <FormattedMessage
            id="page.subscriptions.subscriptions-explanation"
            defaultMessage="Here you can register webhooks to get notified when anything happens in one of your parallels (e.g. when a recipients adds a comment or when the parallel is completed)"
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
            <Button colorScheme="primary" onClick={handleCreateEventSubscription}>
              <FormattedMessage
                id="page.subscriptions.create-subscription"
                defaultMessage="Create subscription"
              />
            </Button>
          </Stack>
          <Box overflowX="auto">
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
                actions={actions}
              />
            ) : (
              <>
                <Divider />
                <Center textStyle="hint" minHeight="60px">
                  <FormattedMessage
                    id="page.subscriptions.no-subscriptions-message"
                    defaultMessage="You haven't created any subscriptions yet"
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

interface SubscriptionsTableContext {
  onToggleEnabled: (id: string, isEnabled: boolean) => void;
  showConfirmDeactivateEventSubscriptionDialog: ReturnType<
    typeof useConfirmDeactivateEventSubscriptionDialog
  >;
  onSignatureKeysClick: (subscriptionId: string) => Promise<void>;
}

function useSubscriptionsColumns(): TableColumn<
  Subscriptions_PetitionEventSubscriptionFragment,
  SubscriptionsTableContext
>[] {
  const intl = useIntl();
  return useMemo(
    () => [
      {
        key: "name",
        header: intl.formatMessage({
          id: "page.subscriptions.header.name",
          defaultMessage: "Name",
        }),
        cellProps: {
          width: "20%",
        },
        CellContent: ({ row }) => (
          <HStack>
            {row.isFailing ? (
              <Tooltip
                label={intl.formatMessage({
                  id: "page.subscriptions.webhook-is-failing",
                  defaultMessage:
                    "The events could not be sent to the URL, if the error persists check the webhook",
                })}
              >
                <AlertCircleFilledIcon color="red.500" />
              </Tooltip>
            ) : null}
            <Text textStyle={row.name ? undefined : "hint"}>
              {row.name ?? (
                <FormattedMessage
                  id="page.subscriptions.unnamed-subscription"
                  defaultMessage="Unnamed subscription"
                />
              )}
            </Text>
          </HStack>
        ),
      },
      {
        key: "eventsUrl",
        header: intl.formatMessage({
          id: "page.subscriptions.header.events-url",
          defaultMessage: "Events URL",
        }),
        cellProps: {
          width: "30%",
          minWidth: "200px",
          fontSize: "sm",
          maxWidth: 0,
        },
        CellContent: ({ row }) => {
          return <OverflownText>{row.eventsUrl}</OverflownText>;
        },
      },
      {
        key: "fromTemplate",
        header: intl.formatMessage({
          id: "page.subscriptions.header.from-template",
          defaultMessage: "From template",
        }),
        cellProps: {
          width: "30%",
          minWidth: "200px",
          fontSize: "sm",
          maxWidth: 0,
        },
        CellContent: ({ row }) => {
          return (
            <OverflownText>
              {row.fromTemplate ? (
                <Link href={`/app/petitions/${row.fromTemplate.id}`}>
                  {row.fromTemplate.name ?? (
                    <Text as="span" fontStyle="italic">
                      <FormattedMessage
                        id="generic.unnamed-template"
                        defaultMessage="Unnamed template"
                      />
                    </Text>
                  )}
                </Link>
              ) : (
                <Text textStyle="hint">
                  <FormattedMessage
                    id="page.subscriptions.header.from-any-petition"
                    defaultMessage="Any parallel"
                  />
                </Text>
              )}
            </OverflownText>
          );
        },
      },
      {
        key: "eventTypes",
        header: intl.formatMessage({
          id: "page.subscriptions.header.event-types",
          defaultMessage: "Event types",
        }),
        align: "center",
        cellProps: { minWidth: "170px", width: "10%", whiteSpace: "nowrap" },
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
              <Text color="primary.500" fontSize="sm">
                <FormattedMessage
                  id="page.subscriptions.n-events"
                  defaultMessage="{count} events"
                  values={{ count: row.eventTypes.length }}
                />
              </Text>
            </SmallPopover>
          );
        },
      },
      {
        key: "signatureKeys",
        header: intl.formatMessage({
          id: "page.subscriptions.header.signature-keys",
          defaultMessage: "Keys",
        }),
        align: "center",
        cellProps: { minWidth: "100px", width: "5%" },
        CellContent: ({ row, context: { onSignatureKeysClick } }) => {
          return (
            <Button
              size="xs"
              variant="ghost"
              color="primary.500"
              fontSize="sm"
              onClick={() => onSignatureKeysClick(row.id)}
            >
              <FormattedMessage
                id="page.subscriptions.n-keys"
                defaultMessage="{count, plural, =1{# key} other {# keys}}"
                values={{ count: row.signatureKeys.length }}
              />
            </Button>
          );
        },
      },
      {
        key: "isEnabled",
        header: intl.formatMessage({
          id: "page.subscriptions.header.is-enabled",
          defaultMessage: "Enabled",
        }),
        align: "center",
        cellProps: { minWidth: "100px", width: "5%" },
        CellContent: ({
          row,
          context: { onToggleEnabled, showConfirmDeactivateEventSubscriptionDialog },
        }) => {
          async function handleToggleChange(e: any) {
            try {
              if (!e.target.checked) {
                await showConfirmDeactivateEventSubscriptionDialog();
                onToggleEnabled(row.id, false);
              } else {
                onToggleEnabled(row.id, true);
              }
            } catch {}
          }
          return <Switch isChecked={row.isEnabled} onChange={handleToggleChange} />;
        },
      },
    ],
    [intl.locale],
  );
}

function useConfirmDeleteSubscriptionDialog() {
  const showDialog = useConfirmDeleteDialog();
  return useCallback(async ({ count }: { count: number }) => {
    return await showDialog({
      header: (
        <FormattedMessage
          id="page.subscriptions.confirm-delete-header"
          defaultMessage="Delete event {count, plural, =1 {subscription} other {subscriptions}}"
          values={{ count }}
        />
      ),
      description: (
        <Stack>
          <Text>
            <FormattedMessage
              id="page.subscriptions.confirm-delete-body"
              defaultMessage="Are you sure you want to delete the {count, plural, =1 {selected event subscription} other {# selected event subscriptions}}?"
              values={{ count }}
            />
          </Text>
          <Text>
            <FormattedMessage
              id="page.subscriptions.confirm-delete-warning"
              defaultMessage="Any applications or scripts using this event {count, plural, =1 {subscription} other {subscriptions}} will no longer receive event notifications from Parallel."
              values={{ count }}
            />
          </Text>
        </Stack>
      ),
    });
  }, []);
}

const _fragments = {
  PetitionEventSubscription: gql`
    fragment Subscriptions_PetitionEventSubscription on PetitionEventSubscription {
      id
      eventsUrl
      eventTypes
      isEnabled
      isFailing
      name
      fromTemplate {
        id
        name
      }
      signatureKeys {
        id
      }
      ...CreateOrUpdateEventSubscriptionDialog_PetitionEventSubscription
    }
    ${CreateOrUpdateEventSubscriptionDialog.fragments.PetitionEventSubscription}
  `,
};

const _mutations = [
  gql`
    mutation Subscriptions_createEventSubscription(
      $eventsUrl: String!
      $eventTypes: [PetitionEventType!]
      $name: String
      $fromTemplateId: GID
      $fromTemplateFieldIds: [GID!]
    ) {
      createEventSubscription(
        eventsUrl: $eventsUrl
        eventTypes: $eventTypes
        name: $name
        fromTemplateId: $fromTemplateId
        fromTemplateFieldIds: $fromTemplateFieldIds
      ) {
        ...Subscriptions_PetitionEventSubscription
      }
    }
    ${_fragments.PetitionEventSubscription}
  `,
  gql`
    mutation Subscriptions_updateEventSubscription(
      $id: GID!
      $isEnabled: Boolean
      $eventsUrl: String
      $eventTypes: [PetitionEventType!]
      $name: String
      $fromTemplateId: GID
      $fromTemplateFieldIds: [GID!]
    ) {
      updateEventSubscription(
        id: $id
        isEnabled: $isEnabled
        eventsUrl: $eventsUrl
        eventTypes: $eventTypes
        name: $name
        fromTemplateId: $fromTemplateId
        fromTemplateFieldIds: $fromTemplateFieldIds
      ) {
        ...Subscriptions_PetitionEventSubscription
        ...CreateOrUpdateEventSubscriptionDialog_PetitionEventSubscription
      }
    }
    ${_fragments.PetitionEventSubscription}
    ${CreateOrUpdateEventSubscriptionDialog.fragments.PetitionEventSubscription}
  `,
  gql`
    mutation Subscriptions_deleteEventSubscriptions($ids: [GID!]!) {
      deleteEventSubscriptions(ids: $ids)
    }
  `,
  gql`
    mutation Subscriptions_createEventSubscriptionSignatureKey($subscriptionId: GID!) {
      createEventSubscriptionSignatureKey(subscriptionId: $subscriptionId) {
        id
        publicKey
      }
    }
  `,
  gql`
    mutation Subscriptions_deleteEventSubscriptionSignatureKeys($ids: [GID!]!) {
      deleteEventSubscriptionSignatureKeys(ids: $ids)
    }
  `,
];

const _queries = [
  gql`
    query Subscriptions_subscriptions {
      subscriptions {
        ...Subscriptions_PetitionEventSubscription
      }
    }
    ${_fragments.PetitionEventSubscription}
  `,
  gql`
    query Subscriptions_user {
      ...DevelopersLayout_Query
    }
    ${DevelopersLayout.fragments.Query}
  `,
];

Subscriptions.getInitialProps = async ({ fetchQuery }: WithApolloDataContext) => {
  await Promise.all([
    fetchQuery(Subscriptions_userDocument),
    fetchQuery(Subscriptions_subscriptionsDocument),
  ]);
};

export default compose(
  withDialogs,
  withPermission("INTEGRATIONS:CRUD_API"),
  withFeatureFlag("DEVELOPER_ACCESS", "/app/organization"),
  withApolloData,
)(Subscriptions);
