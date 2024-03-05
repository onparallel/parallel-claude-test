import { gql } from "@apollo/client";
import { Heading, Stack } from "@chakra-ui/react";
import { withDialogs } from "@parallel/components/common/dialogs/DialogProvider";
import { WithApolloDataContext, withApolloData } from "@parallel/components/common/withApolloData";
import { withPermission } from "@parallel/components/common/withPermission";
import { DevelopersLayout } from "@parallel/components/layout/DevelopersLayout";
import {
  ProfileEventType,
  Subscriptions_PetitionEventSubscriptionFragment,
  Subscriptions_ProfileEventSubscriptionFragment,
  Subscriptions_createEventSubscriptionSignatureKeyDocument,
  Subscriptions_createPetitionEventSubscriptionDocument,
  Subscriptions_createProfileEventSubscriptionDocument,
  Subscriptions_deleteEventSubscriptionsDocument,
  Subscriptions_subscriptionsDocument,
  Subscriptions_updatePetitionEventSubscriptionDocument,
  Subscriptions_updateProfileEventSubscriptionDocument,
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
import { LocalizableUserTextRender } from "@parallel/components/common/LocalizableUserTextRender";
import { OverflownText } from "@parallel/components/common/OverflownText";
import { SmallPopover } from "@parallel/components/common/SmallPopover";
import { Spacer } from "@parallel/components/common/Spacer";
import { Table, TableColumn } from "@parallel/components/common/Table";
import { useConfirmDeleteDialog } from "@parallel/components/common/dialogs/ConfirmDeleteDialog";
import { useConfirmDeactivateEventSubscriptionDialog } from "@parallel/components/settings/dialogs/ConfirmDeactivateEventSubscriptionDialog";
import {
  CreateOrUpdatePetitionEventSubscriptionDialog,
  useCreateOrUpdatePetitionEventSubscriptionDialog,
} from "@parallel/components/settings/dialogs/CreateOrUpdatePetitionEventSubscriptionDialog";
import {
  CreateOrUpdateProfileEventSubscriptionDialog,
  useCreateOrUpdateProfileEventSubscriptionDialog,
} from "@parallel/components/settings/dialogs/CreateOrUpdateProfileEventSubscriptionDialog";
import {
  PetitionEventType,
  Subscriptions_deleteEventSubscriptionSignatureKeysDocument,
} from "@parallel/graphql/__types";
import { assertTypename, assertTypenameArray } from "@parallel/utils/apollo/typename";
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

  const templateSubscriptions = subscriptions.filter(
    (s) => s.__typename === "PetitionEventSubscription",
  );
  assertTypenameArray(templateSubscriptions, "PetitionEventSubscription");

  const profileSubscriptions = subscriptions.filter(
    (s) => s.__typename === "ProfileEventSubscription",
  );
  assertTypenameArray(profileSubscriptions, "ProfileEventSubscription");

  const [selectedTemplateSubscriptions, setSelectedTemplateSubscriptions] = useState<string[]>([]);
  const [selectedProfileSubscriptions, setSelectedProfileSubscriptions] = useState<string[]>([]);

  const [deleteEventSubscriptionSignatureKeys] = useMutation(
    Subscriptions_deleteEventSubscriptionSignatureKeysDocument,
  );
  const [deleteEventSubscriptions] = useMutation(Subscriptions_deleteEventSubscriptionsDocument);
  const [createEventSubscriptionSignatureKey] = useMutation(
    Subscriptions_createEventSubscriptionSignatureKeyDocument,
  );

  // Petition Events Mutations
  const [updatePetitionEventSubscription] = useMutation(
    Subscriptions_updatePetitionEventSubscriptionDocument,
  );
  const [createPetitionEventSubscription] = useMutation(
    Subscriptions_createPetitionEventSubscriptionDocument,
  );
  const createOrUpdatePetitionSubscriptionHandlers = {
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
        await updatePetitionEventSubscription({
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
        const result = await createPetitionEventSubscription({ variables: data });
        subscriptionId = result.data!.createPetitionEventSubscription.id;
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

  // Profile Events Mutations
  const [updateProfileEventSubscription] = useMutation(
    Subscriptions_updateProfileEventSubscriptionDocument,
  );
  const [createProfileEventSubscription] = useMutation(
    Subscriptions_createProfileEventSubscriptionDocument,
  );

  const createOrUpdateProfileSubscriptionHandlers = {
    onSubscriptionSubmit: async (
      id: Maybe<string>,
      data: {
        eventsUrl: string;
        eventTypes: ProfileEventType[] | null;
        name: string | null;
        fromProfileTypeId: string | null;
        fromProfileTypeFieldIds: string[] | null;
      },
    ) => {
      let subscriptionId = id;
      if (isDefined(id)) {
        await updateProfileEventSubscription({
          variables: {
            id,
            name: data.name,
            eventsUrl: data.eventsUrl,
            eventTypes: data.eventTypes,
            fromProfileTypeId: data.fromProfileTypeId,
            fromProfileTypeFieldIds: data.fromProfileTypeFieldIds,
          },
        });
      } else {
        const result = await createProfileEventSubscription({ variables: data });
        subscriptionId = result.data!.createProfileEventSubscription.id;
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

  const showCreateOrUpdatePetitionEventSubscriptionDialog =
    useCreateOrUpdatePetitionEventSubscriptionDialog();
  const showCreateOrUpdateProfileEventSubscriptionDialog =
    useCreateOrUpdateProfileEventSubscriptionDialog();
  const handleCreateEventSubscription = async (type: "TEMPLATE" | "PROFILE") => {
    try {
      if (type === "TEMPLATE") {
        await showCreateOrUpdatePetitionEventSubscriptionDialog({
          ...createOrUpdatePetitionSubscriptionHandlers,
        });
      } else {
        await showCreateOrUpdateProfileEventSubscriptionDialog({
          ...createOrUpdateProfileSubscriptionHandlers,
        });
      }
    } catch {}
  };

  const showDeleteSubscriptionDialog = useConfirmDeleteSubscriptionDialog();
  const handleDeleteEventSubscriptions = async (type: "TEMPLATE" | "PROFILE") => {
    try {
      const selectedSubscriptions =
        type === "TEMPLATE" ? selectedTemplateSubscriptions : selectedProfileSubscriptions;
      await showDeleteSubscriptionDialog({ count: selectedSubscriptions.length });

      await deleteEventSubscriptions({
        variables: {
          ids: selectedSubscriptions,
        },
      });

      await refetchSubscriptions();
      if (type === "TEMPLATE") {
        setSelectedTemplateSubscriptions([]);
      } else {
        setSelectedProfileSubscriptions([]);
      }
    } catch {}
  };

  const handleEditEventSubscription = async (type: "TEMPLATE" | "PROFILE") => {
    try {
      const subscriptions = type === "TEMPLATE" ? templateSubscriptions : profileSubscriptions;
      const selectedSubscriptions =
        type === "TEMPLATE" ? selectedTemplateSubscriptions : selectedProfileSubscriptions;

      const eventSubscription = subscriptions.find((s) => s.id === selectedSubscriptions[0])!;

      if (type === "TEMPLATE") {
        if (eventSubscription) {
          assertTypename(eventSubscription, "PetitionEventSubscription");
        }
        await showCreateOrUpdatePetitionEventSubscriptionDialog({
          eventSubscription,
          ...createOrUpdatePetitionSubscriptionHandlers,
        });
      } else {
        if (eventSubscription) {
          assertTypename(eventSubscription, "ProfileEventSubscription");
        }
        await showCreateOrUpdateProfileEventSubscriptionDialog({
          eventSubscription,
          ...createOrUpdateProfileSubscriptionHandlers,
        });
      }
    } catch {}
  };

  const handleEditSubscriptionSignatureKeys = async (
    subscriptionId: string,
    type: "TEMPLATE" | "PROFILE",
  ) => {
    try {
      const subscriptions = type === "TEMPLATE" ? templateSubscriptions : profileSubscriptions;
      const eventSubscription = subscriptions.find((s) => s.id === subscriptionId)!;

      if (type === "TEMPLATE") {
        assertTypename(eventSubscription, "PetitionEventSubscription");
        await showCreateOrUpdatePetitionEventSubscriptionDialog({
          eventSubscription,
          initialStep: 1,
          ...createOrUpdatePetitionSubscriptionHandlers,
        });
      } else {
        assertTypename(eventSubscription, "ProfileEventSubscription");
        await showCreateOrUpdateProfileEventSubscriptionDialog({
          eventSubscription,
          initialStep: 1,
          ...createOrUpdateProfileSubscriptionHandlers,
        });
      }
    } catch {}
  };

  const showConfirmDeactivateEventSubscriptionDialog =
    useConfirmDeactivateEventSubscriptionDialog();

  const templateSubscriptionsTableContext = useMemo<TemplateSubscriptionsTableContext>(
    () => ({
      onToggleEnabled: async (id: string, isEnabled: boolean) => {
        await updatePetitionEventSubscription({
          variables: { id, isEnabled },
        });
      },
      showConfirmDeactivateEventSubscriptionDialog,
      onSignatureKeysClick: async (subscriptionId: string) => {
        handleEditSubscriptionSignatureKeys(subscriptionId, "TEMPLATE");
      },
    }),
    [
      updatePetitionEventSubscription,
      showConfirmDeactivateEventSubscriptionDialog,
      handleEditSubscriptionSignatureKeys,
    ],
  );

  const templateSubscriptionsColumns = useTemplateSubscriptionsColumns();
  const actionsTemplateSubscriptions = [
    {
      key: "edit",
      onClick: () => handleEditEventSubscription("TEMPLATE"),
      leftIcon: <EditIcon />,
      children: <FormattedMessage id="generic.edit" defaultMessage="Edit" />,
      isDisabled: selectedTemplateSubscriptions.length !== 1,
    },
    {
      key: "delete",
      onClick: () => handleDeleteEventSubscriptions("TEMPLATE"),
      leftIcon: <DeleteIcon />,
      children: <FormattedMessage id="generic.delete" defaultMessage="Delete" />,
      colorScheme: "red",
    },
  ];

  const profileSubscriptionsTableContext = useMemo<ProfileSubscriptionsTableContext>(
    () => ({
      onToggleEnabled: async (id: string, isEnabled: boolean) => {
        await updateProfileEventSubscription({
          variables: { id, isEnabled },
        });
      },
      showConfirmDeactivateEventSubscriptionDialog,
      onSignatureKeysClick: async (subscriptionId: string) => {
        handleEditSubscriptionSignatureKeys(subscriptionId, "PROFILE");
      },
    }),
    [
      updateProfileEventSubscription,
      showConfirmDeactivateEventSubscriptionDialog,
      handleEditSubscriptionSignatureKeys,
    ],
  );

  const profileSubscriptionsColumns = useProfileSubscriptionsColumns();
  const actionsProfileSubscriptions = [
    {
      key: "edit",
      onClick: () => handleEditEventSubscription("PROFILE"),
      leftIcon: <EditIcon />,
      children: <FormattedMessage id="generic.edit" defaultMessage="Edit" />,
      isDisabled: selectedProfileSubscriptions.length !== 1,
    },
    {
      key: "delete",
      onClick: () => handleDeleteEventSubscriptions("PROFILE"),
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
        <Stack spacing={4}>
          <Heading as="h3" size="md">
            <FormattedMessage
              id="page.subscriptions.template-subscriptions-title"
              defaultMessage="Template subscriptions"
            />
          </Heading>

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
              <Button
                colorScheme="primary"
                onClick={() => handleCreateEventSubscription("TEMPLATE")}
              >
                <FormattedMessage
                  id="page.subscriptions.create-subscription"
                  defaultMessage="Create subscription"
                />
              </Button>
            </Stack>
            <Box overflowX="auto">
              {templateSubscriptions.length ? (
                <Table
                  context={templateSubscriptionsTableContext}
                  flex="0 1 auto"
                  minHeight={0}
                  isSelectable
                  isHighlightable
                  columns={templateSubscriptionsColumns}
                  rows={templateSubscriptions}
                  rowKeyProp="id"
                  onSelectionChange={setSelectedTemplateSubscriptions}
                  actions={actionsTemplateSubscriptions}
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
        <Stack spacing={4}>
          <Heading as="h3" size="md">
            <FormattedMessage
              id="page.subscriptions.profiles-subscriptions-title"
              defaultMessage="Profile subscriptions"
            />
          </Heading>

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
              <Button
                colorScheme="primary"
                onClick={() => handleCreateEventSubscription("PROFILE")}
              >
                <FormattedMessage
                  id="page.subscriptions.create-subscription"
                  defaultMessage="Create subscription"
                />
              </Button>
            </Stack>
            <Box overflowX="auto">
              {profileSubscriptions.length ? (
                <Table
                  context={profileSubscriptionsTableContext}
                  flex="0 1 auto"
                  minHeight={0}
                  isSelectable
                  isHighlightable
                  columns={profileSubscriptionsColumns}
                  rows={profileSubscriptions}
                  rowKeyProp="id"
                  onSelectionChange={setSelectedProfileSubscriptions}
                  actions={actionsProfileSubscriptions}
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
      </Stack>
    </DevelopersLayout>
  );
}

interface TemplateSubscriptionsTableContext {
  onToggleEnabled: (id: string, isEnabled: boolean) => void;
  showConfirmDeactivateEventSubscriptionDialog: ReturnType<
    typeof useConfirmDeactivateEventSubscriptionDialog
  >;
  onSignatureKeysClick: (subscriptionId: string) => Promise<void>;
}

function useTemplateSubscriptionsColumns(): TableColumn<
  Subscriptions_PetitionEventSubscriptionFragment,
  TemplateSubscriptionsTableContext
>[] {
  const intl = useIntl();
  return useMemo(
    () => [
      {
        key: "name",
        label: intl.formatMessage({
          id: "page.subscriptions.column-header-name",
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
        label: intl.formatMessage({
          id: "page.subscriptions.column-header-events-url",
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
        label: intl.formatMessage({
          id: "page.subscriptions.column-header-from-template",
          defaultMessage: "From template",
        }),
        cellProps: {
          width: "30%",
          minWidth: "200px",
          fontSize: "sm",
          maxWidth: 0,
        },
        CellContent: ({ row }) => {
          assertTypename(row, "PetitionEventSubscription");
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
                    id="page.subscriptions.column-header-from-any-petition"
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
        label: intl.formatMessage({
          id: "page.subscriptions.column-header-event-types",
          defaultMessage: "Event types",
        }),
        align: "center",
        cellProps: { minWidth: "170px", width: "10%", whiteSpace: "nowrap" },
        CellContent: ({ row }) => {
          assertTypename(row, "PetitionEventSubscription");
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
        label: intl.formatMessage({
          id: "page.subscriptions.column-header-signature-keys",
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
        label: intl.formatMessage({
          id: "page.subscriptions.column-header-is-enabled",
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

interface ProfileSubscriptionsTableContext {
  onToggleEnabled: (id: string, isEnabled: boolean) => void;
  showConfirmDeactivateEventSubscriptionDialog: ReturnType<
    typeof useConfirmDeactivateEventSubscriptionDialog
  >;
  onSignatureKeysClick: (subscriptionId: string) => Promise<void>;
}

function useProfileSubscriptionsColumns(): TableColumn<
  Subscriptions_ProfileEventSubscriptionFragment,
  ProfileSubscriptionsTableContext
>[] {
  const intl = useIntl();
  return useMemo(
    () => [
      {
        key: "name",
        label: intl.formatMessage({
          id: "page.subscriptions.column-header-name",
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
        label: intl.formatMessage({
          id: "page.subscriptions.column-header-events-url",
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
        key: "fromProfileType",
        label: intl.formatMessage({
          id: "page.subscriptions.column-header-from-profile-type",
          defaultMessage: "From profile type",
        }),
        cellProps: {
          width: "30%",
          minWidth: "200px",
          fontSize: "sm",
          maxWidth: 0,
        },
        CellContent: ({ row }) => {
          if (!isDefined(row.fromProfileType)) {
            return (
              <Text textStyle="hint">
                <FormattedMessage
                  id="page.subscriptions.column-header-from-any-profile"
                  defaultMessage="Any profile"
                />
              </Text>
            );
          }
          return (
            <OverflownText>
              <Link href={`/app/organization/profiles/types/${row.fromProfileType.id}`}>
                <LocalizableUserTextRender
                  value={row.fromProfileType.name}
                  default={
                    <Text as="span" fontStyle="italic">
                      <FormattedMessage
                        id="generic.unnamed-profile-type"
                        defaultMessage="Unnamed profile type"
                      />
                    </Text>
                  }
                />
              </Link>
            </OverflownText>
          );
        },
      },
      {
        key: "profileEventTypes",
        label: intl.formatMessage({
          id: "page.subscriptions.column-header-event-types",
          defaultMessage: "Event types",
        }),
        align: "center",
        cellProps: { minWidth: "170px", width: "10%", whiteSpace: "nowrap" },
        CellContent: ({ row }) => {
          assertTypename(row, "ProfileEventSubscription");
          return !isDefined(row.profileEventTypes) ? (
            <Text fontSize="sm">
              <FormattedMessage id="generic.all-event-types" defaultMessage="All events" />
            </Text>
          ) : row.profileEventTypes.length === 1 ? (
            <Badge>{row.profileEventTypes[0]}</Badge>
          ) : (
            <SmallPopover
              width="min-content"
              placement="bottom-end"
              content={
                <Stack as={List} alignItems="flex-start">
                  {row.profileEventTypes!.map((type) => (
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
                  values={{ count: row.profileEventTypes.length }}
                />
              </Text>
            </SmallPopover>
          );
        },
      },
      {
        key: "signatureKeys",
        label: intl.formatMessage({
          id: "page.subscriptions.column-header-signature-keys",
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
        label: intl.formatMessage({
          id: "page.subscriptions.column-header-is-enabled",
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
      isEnabled
      eventTypes
      fromTemplate {
        id
        name
      }
      ...CreateOrUpdatePetitionEventSubscriptionDialog_PetitionEventSubscription
    }
    ${CreateOrUpdatePetitionEventSubscriptionDialog.fragments.PetitionEventSubscription}
  `,
  ProfileEventSubscription: gql`
    fragment Subscriptions_ProfileEventSubscription on ProfileEventSubscription {
      id
      isEnabled
      profileEventTypes: eventTypes
      fromProfileType {
        id
        name
      }
      ...CreateOrUpdateProfileEventSubscriptionDialog_ProfileEventSubscription
    }
    ${CreateOrUpdateProfileEventSubscriptionDialog.fragments.ProfileEventSubscription}
  `,
  EventSubscription: gql`
    fragment Subscriptions_EventSubscription on EventSubscription {
      id
      eventsUrl
      isEnabled
      isFailing
      name
      signatureKeys {
        id
      }
      ... on PetitionEventSubscription {
        ...Subscriptions_PetitionEventSubscription
      }
      ... on ProfileEventSubscription {
        ...Subscriptions_ProfileEventSubscription
      }
    }
  `,
};

const _mutations = [
  gql`
    mutation Subscriptions_createPetitionEventSubscription(
      $eventsUrl: String!
      $eventTypes: [PetitionEventType!]
      $name: String
      $fromTemplateId: GID
      $fromTemplateFieldIds: [GID!]
    ) {
      createPetitionEventSubscription(
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
    mutation Subscriptions_updatePetitionEventSubscription(
      $id: GID!
      $isEnabled: Boolean
      $eventsUrl: String
      $eventTypes: [PetitionEventType!]
      $name: String
      $fromTemplateId: GID
      $fromTemplateFieldIds: [GID!]
    ) {
      updatePetitionEventSubscription(
        id: $id
        isEnabled: $isEnabled
        eventsUrl: $eventsUrl
        eventTypes: $eventTypes
        name: $name
        fromTemplateId: $fromTemplateId
        fromTemplateFieldIds: $fromTemplateFieldIds
      ) {
        ...Subscriptions_PetitionEventSubscription
        ...CreateOrUpdatePetitionEventSubscriptionDialog_PetitionEventSubscription
      }
    }
    ${_fragments.PetitionEventSubscription}
    ${CreateOrUpdatePetitionEventSubscriptionDialog.fragments.PetitionEventSubscription}
  `,
  gql`
    mutation Subscriptions_createProfileEventSubscription(
      $eventsUrl: String!
      $eventTypes: [ProfileEventType!]
      $name: String
      $fromProfileTypeId: GID
      $fromProfileTypeFieldIds: [GID!]
    ) {
      createProfileEventSubscription(
        eventsUrl: $eventsUrl
        eventTypes: $eventTypes
        name: $name
        fromProfileTypeId: $fromProfileTypeId
        fromProfileTypeFieldIds: $fromProfileTypeFieldIds
      ) {
        ...Subscriptions_ProfileEventSubscription
      }
    }
    ${_fragments.ProfileEventSubscription}
  `,
  gql`
    mutation Subscriptions_updateProfileEventSubscription(
      $id: GID!
      $isEnabled: Boolean
      $eventsUrl: String
      $eventTypes: [ProfileEventType!]
      $name: String
      $fromProfileTypeId: GID
      $fromProfileTypeFieldIds: [GID!]
    ) {
      updateProfileEventSubscription(
        id: $id
        isEnabled: $isEnabled
        eventsUrl: $eventsUrl
        eventTypes: $eventTypes
        name: $name
        fromProfileTypeId: $fromProfileTypeId
        fromProfileTypeFieldIds: $fromProfileTypeFieldIds
      ) {
        ...Subscriptions_ProfileEventSubscription
        ...CreateOrUpdateProfileEventSubscriptionDialog_ProfileEventSubscription
      }
    }
    ${_fragments.ProfileEventSubscription}
    ${CreateOrUpdateProfileEventSubscriptionDialog.fragments.ProfileEventSubscription}
  `,
  gql`
    mutation Subscriptions_deleteEventSubscriptions($ids: [GID!]!) {
      deleteEventSubscriptions(ids: $ids)
    }
  `,
  gql`
    mutation Subscriptions_createEventSubscriptionSignatureKey($subscriptionId: GID!) {
      createEventSubscriptionSignatureKey(subscriptionId: $subscriptionId) {
        ...CreateOrUpdatePetitionEventSubscriptionDialog_EventSubscriptionSignatureKey
        ...CreateOrUpdateProfileEventSubscriptionDialog_EventSubscriptionSignatureKey
      }
    }
    ${CreateOrUpdatePetitionEventSubscriptionDialog.fragments.EventSubscriptionSignatureKey}
    ${CreateOrUpdateProfileEventSubscriptionDialog.fragments.EventSubscriptionSignatureKey}
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
        ...Subscriptions_EventSubscription
      }
    }
    ${_fragments.EventSubscription}
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
  withApolloData,
)(Subscriptions);
