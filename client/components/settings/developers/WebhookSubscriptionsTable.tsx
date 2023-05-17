import { gql, useMutation } from "@apollo/client";
import {
  Badge,
  Button,
  Center,
  HStack,
  Heading,
  List,
  ListItem,
  Stack,
  Switch,
  Text,
  Tooltip,
} from "@chakra-ui/react";
import { AlertCircleFilledIcon, RepeatIcon } from "@parallel/chakra/icons";
import { Card } from "@parallel/components/common/Card";
import { Divider } from "@parallel/components/common/Divider";
import { IconButtonWithTooltip } from "@parallel/components/common/IconButtonWithTooltip";
import { Link } from "@parallel/components/common/Link";
import { OverflownText } from "@parallel/components/common/OverflownText";
import { SmallPopover } from "@parallel/components/common/SmallPopover";
import { Spacer } from "@parallel/components/common/Spacer";
import { Table, TableColumn } from "@parallel/components/common/Table";
import { useConfirmDeleteDialog } from "@parallel/components/common/dialogs/ConfirmDeleteDialog";
import {
  PetitionEventType,
  WebhookSubscriptionsTable_PetitionEventSubscriptionFragment,
  WebhookSubscriptionsTable_createEventSubscriptionDocument,
  WebhookSubscriptionsTable_createEventSubscriptionSignatureKeyDocument,
  WebhookSubscriptionsTable_deleteEventSubscriptionSignatureKeysDocument,
  WebhookSubscriptionsTable_deleteEventSubscriptionsDocument,
  WebhookSubscriptionsTable_updateEventSubscriptionDocument,
} from "@parallel/graphql/__types";
import { Maybe } from "@parallel/utils/types";
import { useCallback, useMemo, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { isDefined } from "remeda";
import { useConfirmDeactivateEventSubscriptionDialog } from "../dialogs/ConfirmDeactivateEventSubscriptionDialog";
import {
  CreateOrUpdateEventSubscriptionDialog,
  useCreateOrUpdateEventSubscriptionDialog,
} from "../dialogs/CreateOrUpdateEventSubscriptionDialog";

interface WebhookSubscriptionsTableProps {
  subscriptions: WebhookSubscriptionsTable_PetitionEventSubscriptionFragment[];
  onRefetch?: () => void;
}

export function WebhookSubscriptionsTable({
  subscriptions,
  onRefetch,
}: WebhookSubscriptionsTableProps) {
  const intl = useIntl();

  const [selectedSubscriptions, setSelectedSubscriptions] = useState<string[]>([]);

  const [updateEventSubscription] = useMutation(
    WebhookSubscriptionsTable_updateEventSubscriptionDocument
  );
  const [deleteEventSubscriptions] = useMutation(
    WebhookSubscriptionsTable_deleteEventSubscriptionsDocument
  );
  const [createEventSubscription] = useMutation(
    WebhookSubscriptionsTable_createEventSubscriptionDocument
  );

  const [createEventSubscriptionSignatureKey] = useMutation(
    WebhookSubscriptionsTable_createEventSubscriptionSignatureKeyDocument
  );

  const [deleteEventSubscriptionSignatureKeys] = useMutation(
    WebhookSubscriptionsTable_deleteEventSubscriptionSignatureKeysDocument
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
      }
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

      onRefetch?.();
      return subscriptionId!;
    },
    onAddSignatureKey: async (subscriptionId: string) => {
      const response = await createEventSubscriptionSignatureKey({
        variables: { subscriptionId },
      });
      onRefetch?.();
      return response.data!.createEventSubscriptionSignatureKey;
    },
    onDeleteSignatureKey: async (signatureKeyId: string) => {
      await deleteEventSubscriptionSignatureKeys({ variables: { ids: [signatureKeyId] } });
      onRefetch?.();
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
      onRefetch?.();
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
    } catch (e) {
      console.log(e);
    }
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
    ]
  );

  const subscriptionsColumns = useSubscriptionsColumns();

  return (
    <Stack>
      <Heading as="h4" size="md">
        <FormattedMessage
          id="component.webhook-subscriptions-table.subscriptions-title"
          defaultMessage="Subscriptions"
        />
      </Heading>
      <Text>
        <FormattedMessage
          id="component.webhook-subscriptions-table.subscriptions-explanation"
          defaultMessage="Here you can register webhooks to get notified when anything happens in one of your parallels (e.g. when a recipients adds a comment or when the parallel is completed)"
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
          {selectedSubscriptions.length ? (
            <HStack>
              <Button
                isDisabled={selectedSubscriptions.length > 1}
                onClick={handleEditEventSubscription}
              >
                <FormattedMessage id="generic.edit" defaultMessage="Edit" />
              </Button>
              <Button colorScheme="red" variant="ghost" onClick={handleDeleteEventSubscriptions}>
                <FormattedMessage id="generic.delete" defaultMessage="Delete" />
              </Button>
            </HStack>
          ) : null}
          <Button colorScheme="primary" onClick={handleCreateEventSubscription}>
            <FormattedMessage
              id="component.webhook-subscriptions-table.create-subscription"
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
                id="component.webhook-subscriptions-table.no-subscriptions-message"
                defaultMessage="You haven't created any subscriptions yet"
              />
            </Center>
          </>
        )}
      </Card>
    </Stack>
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
  WebhookSubscriptionsTable_PetitionEventSubscriptionFragment,
  SubscriptionsTableContext
>[] {
  const intl = useIntl();
  return useMemo(
    () => [
      {
        key: "name",
        header: intl.formatMessage({
          id: "component.webhook-subscriptions-table.header.name",
          defaultMessage: "Name",
        }),
        CellContent: ({ row }) => (
          <HStack>
            {row.isFailing ? (
              <Tooltip
                label={intl.formatMessage({
                  id: "component.webhook-subscriptions-table.webhook-is-failing",
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
                  id="component.webhook-subscriptions-table.unnamed-subscription"
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
          id: "component.webhook-subscriptions-table.header.events-url",
          defaultMessage: "Events URL",
        }),
        cellProps: {
          width: "30%",
          maxWidth: 0,
          fontSize: "sm",
        },
        CellContent: ({ row }) => {
          return <OverflownText>{row.eventsUrl}</OverflownText>;
        },
      },
      {
        key: "fromTemplate",
        header: intl.formatMessage({
          id: "component.webhook-subscriptions-table.header.from-template",
          defaultMessage: "From template",
        }),
        cellProps: {
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
                    id="component.webhook-subscriptions-table.header.from-any-petition"
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
          id: "component.webhook-subscriptions-table.header.event-types",
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
              <Text color="primary.500" fontSize="sm">
                <FormattedMessage
                  id="component.webhook-subscriptions-table.n-events"
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
          id: "component.webhook-subscriptions-table.header.signature-keys",
          defaultMessage: "Keys",
        }),
        align: "center",
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
                id="component.webhook-subscriptions-table.n-keys"
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
          id: "component.webhook-subscriptions-table.header.is-enabled",
          defaultMessage: "Enabled",
        }),
        align: "center",
        cellProps: { width: "1%" },
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
    [intl.locale]
  );
}

WebhookSubscriptionsTable.fragments = {
  PetitionEventSubscription: gql`
    fragment WebhookSubscriptionsTable_PetitionEventSubscription on PetitionEventSubscription {
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
    mutation WebhookSubscriptionsTable_createEventSubscription(
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
        ...WebhookSubscriptionsTable_PetitionEventSubscription
      }
    }
    ${WebhookSubscriptionsTable.fragments.PetitionEventSubscription}
  `,
  gql`
    mutation WebhookSubscriptionsTable_updateEventSubscription(
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
        ...WebhookSubscriptionsTable_PetitionEventSubscription
        ...CreateOrUpdateEventSubscriptionDialog_PetitionEventSubscription
      }
    }
    ${WebhookSubscriptionsTable.fragments.PetitionEventSubscription}
    ${CreateOrUpdateEventSubscriptionDialog.fragments.PetitionEventSubscription}
  `,
  gql`
    mutation WebhookSubscriptionsTable_deleteEventSubscriptions($ids: [GID!]!) {
      deleteEventSubscriptions(ids: $ids)
    }
  `,
  gql`
    mutation WebhookSubscriptionsTable_createEventSubscriptionSignatureKey($subscriptionId: GID!) {
      createEventSubscriptionSignatureKey(subscriptionId: $subscriptionId) {
        id
        publicKey
      }
    }
  `,
  gql`
    mutation WebhookSubscriptionsTable_deleteEventSubscriptionSignatureKeys($ids: [GID!]!) {
      deleteEventSubscriptionSignatureKeys(ids: $ids)
    }
  `,
];

function useConfirmDeleteSubscriptionDialog() {
  const showDialog = useConfirmDeleteDialog();
  return useCallback(async ({ count }: { count: number }) => {
    return await showDialog({
      header: (
        <FormattedMessage
          id="component.webhook-subscriptions-table.confirm-delete-header"
          defaultMessage="Delete event {count, plural, =1 {subscription} other {subscriptions}}"
          values={{ count }}
        />
      ),
      description: (
        <Stack>
          <Text>
            <FormattedMessage
              id="component.webhook-subscriptions-table.confirm-delete-body"
              defaultMessage="Are you sure you want to delete the {count, plural, =1 {selected event subscription} other {# selected event subscriptions}}?"
              values={{ count }}
            />
          </Text>
          <Text>
            <FormattedMessage
              id="component.webhook-subscriptions-table.confirm-delete-warning"
              defaultMessage="Any applications or scripts using this event {count, plural, =1 {subscription} other {subscriptions}} will no longer receive event notifications from Parallel."
              values={{ count }}
            />
          </Text>
        </Stack>
      ),
    });
  }, []);
}
