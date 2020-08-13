import { gql } from "@apollo/client";
import { Box, List, ListItem, Text, useToast } from "@chakra-ui/core";
import { withOnboarding } from "@parallel/components/common/OnboardingTour";
import {
  withApolloData,
  WithApolloDataContext,
} from "@parallel/components/common/withApolloData";
import { PetitionLayout } from "@parallel/components/layout/PetitionLayout";
import { useAddPetitionAccessDialog } from "@parallel/components/petition-activity/AddPetitionAccessDialog";
import { useConfigureRemindersDialog } from "@parallel/components/petition-activity/ConfigureRemindersDialog";
import { useConfirmCancelScheduledMessageDialog } from "@parallel/components/petition-activity/ConfirmCancelScheduledMessageDialog";
import { useConfirmDeactivateAccessDialog } from "@parallel/components/petition-activity/ConfirmDeactivateAccessDialog";
import { useConfirmReactivateAccessDialog } from "@parallel/components/petition-activity/ConfirmReactivateAccessDialog";
import { useConfirmSendReminderDialog } from "@parallel/components/petition-activity/ConfirmSendReminderDialog";
import { PetitionAccessesTable } from "@parallel/components/petition-activity/PetitionAccessesTable";
import { PetitionActivityTimeline } from "@parallel/components/petition-activity/PetitionActivityTimeline";
import { useSendMessageDialogDialog } from "@parallel/components/petition-activity/SendMessageDialog";
import {
  PetitionActivityQuery,
  PetitionActivityQueryVariables,
  PetitionActivityUserQuery,
  UpdatePetitionInput,
  usePetitionActivityQuery,
  usePetitionActivityUserQuery,
  usePetitionActivity_cancelScheduledMessageMutation,
  usePetitionActivity_deactivateAccessesMutation,
  usePetitionActivity_reactivateAccessesMutation,
  usePetitionActivity_sendMessagesMutation,
  usePetitionActivity_sendRemindersMutation,
  usePetitionActivity_switchAutomaticRemindersMutation,
  usePetitionActivity_updatePetitionMutation,
  usePetitionsActivity_sendPetitionMutation,
} from "@parallel/graphql/__types";
import { assertQuery } from "@parallel/utils/apollo";
import { compose } from "@parallel/utils/compose";
import { FORMATS } from "@parallel/utils/dates";
import { UnwrapArray, UnwrapPromise } from "@parallel/utils/types";
import { useCreateContact } from "@parallel/utils/mutations/useCreateContact";
import { usePetitionState } from "@parallel/utils/usePetitionState";
import { useSearchContacts } from "@parallel/utils/useSearchContacts";
import { differenceInMinutes } from "date-fns";
import { useCallback, useMemo } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { omit } from "remeda";

type PetitionProps = UnwrapPromise<
  ReturnType<typeof PetitionActivity.getInitialProps>
>;

function PetitionActivity({ petitionId }: PetitionProps) {
  const intl = useIntl();
  const toast = useToast();
  const {
    data: { me },
  } = assertQuery(usePetitionActivityUserQuery());
  const {
    data: { petition },
    refetch,
  } = assertQuery(usePetitionActivityQuery({ variables: { id: petitionId } }));

  const [state, wrapper] = usePetitionState();

  const [updatePetition] = usePetitionActivity_updatePetitionMutation();
  const handleOnUpdatePetition = useCallback(
    wrapper(async (data: UpdatePetitionInput) => {
      return await updatePetition({ variables: { petitionId, data } });
    }),
    [petitionId]
  );

  const [sendMessages] = usePetitionActivity_sendMessagesMutation();
  const sendMessageDialog = useSendMessageDialogDialog();
  const handleSendMessage = useCallback(
    async (accessIds: string[]) => {
      try {
        const { subject, body, scheduledAt } = await sendMessageDialog({});
        await sendMessages({
          variables: {
            petitionId,
            accessIds,
            subject,
            body,
            scheduledAt: scheduledAt?.toISOString() ?? null,
          },
        });
        toast({
          title: scheduledAt
            ? intl.formatMessage({
                id: "petition.message-scheduled.toast-header",
                defaultMessage: "Message scheduled",
              })
            : intl.formatMessage({
                id: "petition.message-sent.toast-header",
                defaultMessage: "Message sent",
              }),
          description: scheduledAt
            ? intl.formatMessage(
                {
                  id: "petition.message-scheduled.toast-description",
                  defaultMessage: "The message will be sent on {date}",
                },
                { date: intl.formatDate(scheduledAt, FORMATS.LL) }
              )
            : intl.formatMessage({
                id: "petition.message-sent.toast-description",
                defaultMessage: "The message is on it's way",
              }),
          status: "success",
          duration: 3000,
          isClosable: true,
        });
        await refetch();
      } catch {}
    },
    [petitionId]
  );

  const showNoRemindersLeftToast = (petitionAccessId?: string) => {
    const access = petition!.accesses.find((a) => a.id === petitionAccessId)!;
    toast({
      title: intl.formatMessage({
        id: "petition.no-reminders-left.toast-header",
        defaultMessage: "No reminders left",
      }),
      description: petitionAccessId
        ? intl.formatMessage(
            {
              id: "petition.no-reminders-left.toast-description",
              defaultMessage:
                "You have sent the maximum number of reminders to {nameOrEmail}",
            },
            {
              nameOrEmail: access.contact!.fullName || access.contact!.email,
            }
          )
        : intl.formatMessage({
            id: "petition.no-reminders-left-generic.toast-description",
            defaultMessage:
              "You have sent the maximum number of reminders to some of the selected contacts",
          }),
      status: "error",
      duration: 5000,
      isClosable: true,
    });
  };
  const confirmSendReminder = useConfirmSendReminderDialog();
  const [sendReminders] = usePetitionActivity_sendRemindersMutation();
  const handleSendReminders = useCallback(
    async (accessIds: string[]) => {
      try {
        await confirmSendReminder({});
      } catch {
        return;
      }
      try {
        await sendReminders({
          variables: { petitionId, accessIds: accessIds },
        });
      } catch (error) {
        const extra = error?.graphQLErrors?.[0]?.extensions?.extra;
        switch (extra?.errorCode) {
          case "NO_REMINDERS_LEFT": {
            showNoRemindersLeftToast(extra.petitionAccessId);
            return;
          }
        }
      }
      toast({
        title: intl.formatMessage({
          id: "petition.reminder-sent.toast-header",
          defaultMessage: "Reminder sent",
        }),
        description: intl.formatMessage({
          id: "petition.reminder-sent.toast-description",
          defaultMessage: "The reminder is on it's way",
        }),
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      await refetch();
    },
    [petitionId, petition!.accesses]
  );

  const addPetitionAccessDialog = useAddPetitionAccessDialog();
  const handleSearchContacts = useSearchContacts();
  const handleCreateContact = useCreateContact();
  const [sendPetition] = usePetitionsActivity_sendPetitionMutation();
  const handleAddPetitionAccess = useCallback(async () => {
    try {
      const currentRecipientIds = petition!.accesses
        .filter((a) => a.contact)
        .map((a) => a.contact!.id);
      const {
        recipientIds,
        subject,
        body,
        scheduledAt,
        remindersConfig,
      } = await addPetitionAccessDialog({
        onCreateContact: handleCreateContact,
        onSearchContacts: async (search: string, exclude: string[]) => {
          return await handleSearchContacts(search, [
            ...exclude,
            ...currentRecipientIds,
          ]);
        },
      });
      await sendPetition({
        variables: {
          petitionId,
          contactIds: recipientIds,
          subject,
          body,
          scheduledAt: scheduledAt?.toISOString() ?? null,
          remindersConfig,
        },
      });
      await refetch();
    } catch {}
  }, [petitionId, petition!.accesses]);

  const confirmCancelScheduledMessage = useConfirmCancelScheduledMessageDialog();
  const [
    cancelScheduledMessage,
  ] = usePetitionActivity_cancelScheduledMessageMutation();
  const handleCancelScheduledMessage = useCallback(
    async (messageId: string) => {
      try {
        await confirmCancelScheduledMessage({});
      } catch {
        return;
      }
      await cancelScheduledMessage({ variables: { petitionId, messageId } });
      await refetch();
    },
    [petitionId]
  );

  const confirmRectivateAccess = useConfirmReactivateAccessDialog();
  const [reactivateAccess] = usePetitionActivity_reactivateAccessesMutation();
  const handleReactivateAccess = useCallback(
    async (accessId: string) => {
      const { contact } = petition!.accesses.find((a) => a.id === accessId)!;
      try {
        await confirmRectivateAccess({
          nameOrEmail: contact?.fullName ?? contact?.email ?? "",
        });
      } catch {
        return;
      }
      await reactivateAccess({
        variables: { petitionId, accessIds: [accessId] },
      });
      await refetch();
    },
    [petitionId, petition!.accesses]
  );

  const confirmDeactivateAccess = useConfirmDeactivateAccessDialog();
  const [deactivateAccess] = usePetitionActivity_deactivateAccessesMutation();
  const handleDeactivateAccess = useCallback(
    async (accessId) => {
      const { contact } = petition!.accesses.find((a) => a.id === accessId)!;
      try {
        await confirmDeactivateAccess({
          nameOrEmail: contact?.fullName ?? contact?.email ?? "",
        });
      } catch {
        return;
      }
      await deactivateAccess({
        variables: { petitionId, accessIds: [accessId] },
      });
      await refetch();
    },
    [petitionId, petition!.accesses]
  );

  const [
    switchReminders,
  ] = usePetitionActivity_switchAutomaticRemindersMutation();
  const configureRemindersDialog = useConfigureRemindersDialog();
  const handleConfigureReminders = useCallback(
    async (accessIds: string[]) => {
      let start = false;
      try {
        const firstAccess = petition!.accesses.find(
          (a) => a.id === accessIds[0]
        );
        const { remindersConfig } = await configureRemindersDialog({
          enabled: !!(firstAccess && firstAccess!.remindersActive),
          defaultConfig: firstAccess!.remindersConfig || null,
        });

        start = !!remindersConfig;
        await switchReminders({
          variables: {
            start,
            accessIds,
            petitionId,
            remindersConfig: start
              ? omit(remindersConfig!, ["__typename"])
              : null,
          },
        });
        await refetch();
        toast({
          title: start
            ? intl.formatMessage({
                id: "petition.reminder-settings-started.toast-header",
                defaultMessage: "Reminders started",
              })
            : intl.formatMessage({
                id: "petition.reminder-settings-stopped.toast-header",
                defaultMessage: "Reminders stopped",
              }),
          description: intl.formatMessage({
            id: "petition.reminder-settings-success.toast-body",
            defaultMessage: "Reminders have been successfully configured.",
          }),
          duration: 5000,
          isClosable: true,
          status: "success",
        });
      } catch (e) {
        const extra = e?.graphQLErrors?.[0]?.extensions?.extra;
        if (e && !["CLOSE", "CANCEL"].includes(e.reason)) {
          switch (extra?.errorCode) {
            case "NO_REMINDERS_LEFT":
              showNoRemindersLeftToast();
              break;
            default:
              toast({
                title: intl.formatMessage({
                  id: "petition.reminder-settings-error.toast-header",
                  defaultMessage: "Error",
                }),
                description: intl.formatMessage({
                  id: "petition.reminder-settings-error.toast-body",
                  defaultMessage:
                    "There was an error setting the reminders. Please try again.",
                }),
                duration: 5000,
                isClosable: true,
                status: "error",
              });
          }
          return;
        }
      }
    },
    [petitionId, petition!.accesses]
  );

  // process events
  const events = useMemo(() => {
    const original = petition!.events.items;
    const result: typeof original = [];
    let lastOpen: UnwrapArray<typeof original> | null = null;
    for (const event of original) {
      switch (event.__typename) {
        case "AccessOpenedEvent": {
          // Omit too consecutive open events
          if (lastOpen) {
            const difference = differenceInMinutes(
              new Date(event.createdAt),
              new Date(lastOpen.createdAt)
            );
            if (difference <= 30) {
              continue;
            }
          }
          lastOpen = event;
        }
      }
      result.push(event);
    }
    return result;
  }, [petition!.events.items]);

  return (
    <PetitionLayout
      key={petition!.id}
      user={me}
      petition={petition!}
      onUpdatePetition={handleOnUpdatePetition}
      section="activity"
      scrollBody
      state={state}
    >
      <Box minWidth="container.lg">
        <PetitionAccessesTable
          id="petition-accesses"
          margin={4}
          petition={petition!}
          onSendMessage={handleSendMessage}
          onSendReminders={handleSendReminders}
          onAddPetitionAccess={handleAddPetitionAccess}
          onReactivateAccess={handleReactivateAccess}
          onDeactivateAccess={handleDeactivateAccess}
          onConfigureReminders={handleConfigureReminders}
        />
        <Box margin={4}>
          <PetitionActivityTimeline
            id="petition-activity-timeline"
            userId={me.id}
            events={events}
            onCancelScheduledMessage={handleCancelScheduledMessage}
          />
        </Box>
      </Box>
    </PetitionLayout>
  );
}

PetitionActivity.fragments = {
  Petition: gql`
    fragment PetitionActivity_Petition on Petition {
      id
      ...PetitionLayout_Petition
      ...PetitionAccessTable_Petition
      ...PetitionActivityTimeline_Petition
    }
    ${PetitionLayout.fragments.Petition}
    ${PetitionAccessesTable.fragments.Petition}
    ${PetitionActivityTimeline.fragments.Petition}
  `,
  User: gql`
    fragment PetitionActivity_User on User {
      ...PetitionLayout_User
    }
    ${PetitionLayout.fragments.User}
  `,
};

PetitionActivity.mutations = [
  gql`
    mutation PetitionActivity_updatePetition(
      $petitionId: ID!
      $data: UpdatePetitionInput!
    ) {
      updatePetition(petitionId: $petitionId, data: $data) {
        ...PetitionActivity_Petition
      }
    }
    ${PetitionActivity.fragments.Petition}
  `,
  gql`
    mutation PetitionActivity_sendMessages(
      $petitionId: ID!
      $accessIds: [ID!]!
      $subject: String!
      $body: JSON!
      $scheduledAt: DateTime
    ) {
      sendMessages(
        petitionId: $petitionId
        accessIds: $accessIds
        subject: $subject
        body: $body
        scheduledAt: $scheduledAt
      )
    }
  `,
  gql`
    mutation PetitionActivity_sendReminders(
      $petitionId: ID!
      $accessIds: [ID!]!
    ) {
      sendReminders(petitionId: $petitionId, accessIds: $accessIds)
    }
  `,
  gql`
    mutation PetitionActivity_deactivateAccesses(
      $petitionId: ID!
      $accessIds: [ID!]!
    ) {
      deactivateAccesses(petitionId: $petitionId, accessIds: $accessIds) {
        id
        status
      }
    }
  `,
  gql`
    mutation PetitionActivity_reactivateAccesses(
      $petitionId: ID!
      $accessIds: [ID!]!
    ) {
      reactivateAccesses(petitionId: $petitionId, accessIds: $accessIds) {
        id
        status
      }
    }
  `,
  gql`
    mutation PetitionActivity_cancelScheduledMessage(
      $petitionId: ID!
      $messageId: ID!
    ) {
      cancelScheduledMessage(petitionId: $petitionId, messageId: $messageId) {
        id
        status
      }
    }
  `,
  gql`
    mutation PetitionsActivity_sendPetition(
      $petitionId: ID!
      $contactIds: [ID!]!
      $subject: String!
      $body: JSON!
      $remindersConfig: RemindersConfigInput
      $scheduledAt: DateTime
    ) {
      sendPetition(
        petitionId: $petitionId
        contactIds: $contactIds
        subject: $subject
        body: $body
        remindersConfig: $remindersConfig
        scheduledAt: $scheduledAt
      ) {
        result
      }
    }
  `,
  gql`
    mutation PetitionActivity_switchAutomaticReminders(
      $start: Boolean!
      $petitionId: ID!
      $accessIds: [ID!]!
      $remindersConfig: RemindersConfigInput
    ) {
      switchAutomaticReminders(
        start: $start
        petitionId: $petitionId
        accessIds: $accessIds
        remindersConfig: $remindersConfig
      ) {
        id
      }
    }
  `,
];

PetitionActivity.getInitialProps = async ({
  query,
  fetchQuery,
}: WithApolloDataContext) => {
  await Promise.all([
    fetchQuery<PetitionActivityQuery, PetitionActivityQueryVariables>(
      gql`
        query PetitionActivity($id: ID!) {
          petition(id: $id) {
            ...PetitionActivity_Petition
          }
        }
        ${PetitionActivity.fragments.Petition}
      `,
      {
        variables: { id: query.petitionId as string },
      }
    ),
    fetchQuery<PetitionActivityUserQuery>(
      gql`
        query PetitionActivityUser {
          me {
            ...PetitionActivity_User
          }
        }
        ${PetitionActivity.fragments.User}
      `
    ),
  ]);
  return {
    petitionId: query.petitionId as string,
  };
};

export default compose(
  withOnboarding({
    key: "PETITION_ACTIVITY",
    steps: [
      {
        title: (
          <FormattedMessage
            id="tour.petition-activity.main"
            defaultMessage="Activity"
          />
        ),
        content: (
          <FormattedMessage
            id="tour.petition-activity.items"
            defaultMessage="Here you can view and manage your petitions' access, messages, follow-ups, and event history."
          />
        ),
        placement: "center",
        target: "#__next",
      },
      {
        title: (
          <FormattedMessage
            id="tour.petition-activity.access-and-reminders"
            defaultMessage="Access and reminders"
          />
        ),
        content: (
          <>
            <Text>
              <FormattedMessage
                id="tour.petition-activity.you-can"
                defaultMessage="In this section, you will be able to:"
              />
            </Text>
            <List
              listStyleType="disc"
              listStylePosition="outside"
              paddingLeft={5}
              marginTop={4}
              spacing={3}
            >
              <ListItem>
                <FormattedMessage
                  id="tour.petition-activity.track"
                  defaultMessage="Manage who can <b>access</b> this petition."
                  values={{
                    b: (chunks: any[]) => <Text as="strong">{chunks}</Text>,
                  }}
                />
              </ListItem>
              <ListItem>
                <FormattedMessage
                  id="tour.petition-activity.send-message"
                  defaultMessage="Send an automatic or custom <b>reminder message</b> to your recipients."
                  values={{
                    b: (chunks: any[]) => <Text as="strong">{chunks}</Text>,
                  }}
                />
              </ListItem>
              <ListItem>
                <FormattedMessage
                  id="tour.petition-activity.change-reminder"
                  defaultMessage="Change <b>reminders settings</b>."
                  values={{
                    b: (chunks: any[]) => <Text as="strong">{chunks}</Text>,
                  }}
                />
              </ListItem>
            </List>
          </>
        ),
        placement: "right",
        target: "#petition-accesses",
      },
      {
        title: (
          <FormattedMessage
            id="tour.petition-activity.monitor-requests"
            defaultMessage="Monitor your requests"
          />
        ),
        content: (
          <>
            <Text>
              <FormattedMessage
                id="tour.petition-activity.open"
                defaultMessage="Are you wondering if your recipients read the emails or opened the recipient replies page?"
              />
            </Text>
            <Text marginTop={4}>
              <FormattedMessage
                id="tour.petition-activity.overview"
                defaultMessage="Have a better overview of what is happening around your petition with the activity timeline."
              />
            </Text>
          </>
        ),
        placement: "top-end",
        target: "#petition-activity-timeline",
      },
    ],
  }),
  withApolloData
)(PetitionActivity);
