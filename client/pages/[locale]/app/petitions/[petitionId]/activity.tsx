import { gql } from "@apollo/client";
import {
  Box,
  ListItem,
  Stack,
  Text,
  UnorderedList,
  useToast,
} from "@chakra-ui/react";
import { withDialogs } from "@parallel/components/common/DialogProvider";
import { withOnboarding } from "@parallel/components/common/OnboardingTour";
import { ShareButton } from "@parallel/components/common/ShareButton";
import {
  withApolloData,
  WithApolloDataContext,
} from "@parallel/components/common/withApolloData";
import { PetitionLayout } from "@parallel/components/layout/PetitionLayout";
import {
  AddPetitionAccessDialog,
  useAddPetitionAccessDialog,
} from "@parallel/components/petition-activity/AddPetitionAccessDialog";
import { useConfigureRemindersDialog } from "@parallel/components/petition-activity/ConfigureRemindersDialog";
import { useConfirmCancelScheduledMessageDialog } from "@parallel/components/petition-activity/ConfirmCancelScheduledMessageDialog";
import { useConfirmDeactivateAccessDialog } from "@parallel/components/petition-activity/ConfirmDeactivateAccessDialog";
import { useConfirmReactivateAccessDialog } from "@parallel/components/petition-activity/ConfirmReactivateAccessDialog";
import { useConfirmSendReminderDialog } from "@parallel/components/petition-activity/ConfirmSendReminderDialog";
import { PetitionAccessesTable } from "@parallel/components/petition-activity/PetitionAccessesTable";
import { PetitionActivityTimeline } from "@parallel/components/petition-activity/PetitionActivityTimeline";
import { usePetitionSharingDialog } from "@parallel/components/petition-common/PetitionSharingDialog";
import {
  PetitionActivityQuery,
  PetitionActivityQueryVariables,
  PetitionActivityUserQuery,
  PetitionActivity_PetitionFragment,
  UpdatePetitionInput,
  usePetitionActivityQuery,
  usePetitionActivityUserQuery,
  usePetitionActivity_cancelScheduledMessageMutation,
  usePetitionActivity_deactivateAccessesMutation,
  usePetitionActivity_reactivateAccessesMutation,
  usePetitionActivity_sendRemindersMutation,
  usePetitionActivity_switchAutomaticRemindersMutation,
  usePetitionActivity_updatePetitionMutation,
  usePetitionsActivity_sendPetitionMutation,
} from "@parallel/graphql/__types";
import { assertQuery } from "@parallel/utils/apollo/assertQuery";
import { compose } from "@parallel/utils/compose";
import { useUpdateIsReadNotification } from "@parallel/utils/mutations/useUpdateIsReadNotification";
import { UnwrapPromise } from "@parallel/utils/types";
import { usePetitionState } from "@parallel/utils/usePetitionState";
import { useSearchContacts } from "@parallel/utils/useSearchContacts";
import { useEffect } from "react";
import { useCallback } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { omit } from "remeda";

type PetitionActivityProps = UnwrapPromise<
  ReturnType<typeof PetitionActivity.getInitialProps>
>;

function PetitionActivity({ petitionId }: PetitionActivityProps) {
  const intl = useIntl();
  const toast = useToast();
  const {
    data: { me },
  } = assertQuery(usePetitionActivityUserQuery());
  const { data, refetch } = assertQuery(
    usePetitionActivityQuery({ variables: { id: petitionId } })
  );

  const updateIsReadNotification = useUpdateIsReadNotification();
  useEffect(() => {
    updateIsReadNotification({ isRead: true, filter: "OTHER" });
  }, []);

  const petition = data!.petition as PetitionActivity_PetitionFragment;

  const [state, wrapper] = usePetitionState();

  const [updatePetition] = usePetitionActivity_updatePetitionMutation();
  const handleOnUpdatePetition = useCallback(
    wrapper(async (data: UpdatePetitionInput) => {
      return await updatePetition({ variables: { petitionId, data } });
    }),
    [petitionId]
  );

  const showNoRemindersLeftToast = (petitionAccessId?: string) => {
    const access = petition.accesses.find((a) => a.id === petitionAccessId)!;
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
        const { message } = await confirmSendReminder({});
        try {
          await sendReminders({
            variables: { petitionId, accessIds, body: message },
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
      } catch {
        return;
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
    [petitionId, petition.accesses]
  );

  const addPetitionAccessDialog = useAddPetitionAccessDialog();
  const handleSearchContacts = useSearchContacts();
  const [sendPetition] = usePetitionsActivity_sendPetitionMutation();
  const handleAddPetitionAccess = useCallback(async () => {
    try {
      const currentRecipientIds = petition.accesses
        .filter((a) => a.contact)
        .map((a) => a.contact!.id);
      const {
        recipientIdGroups: [contactIds],
        subject,
        body,
        scheduledAt,
        remindersConfig,
      } = await addPetitionAccessDialog({
        petition,
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
          contactIds,
          subject,
          body,
          scheduledAt: scheduledAt?.toISOString() ?? null,
          remindersConfig,
        },
      });
      await refetch();
    } catch {}
  }, [petitionId, petition.accesses]);

  const confirmCancelScheduledMessage =
    useConfirmCancelScheduledMessageDialog();
  const [cancelScheduledMessage] =
    usePetitionActivity_cancelScheduledMessageMutation();
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
      const { contact } = petition.accesses.find((a) => a.id === accessId)!;
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
    [petitionId, petition.accesses]
  );

  const confirmDeactivateAccess = useConfirmDeactivateAccessDialog();
  const [deactivateAccess] = usePetitionActivity_deactivateAccessesMutation();
  const handleDeactivateAccess = useCallback(
    async (accessId) => {
      const { contact } = petition.accesses.find((a) => a.id === accessId)!;
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
    [petitionId, petition.accesses]
  );

  const [switchReminders] =
    usePetitionActivity_switchAutomaticRemindersMutation();
  const configureRemindersDialog = useConfigureRemindersDialog();
  const handleConfigureReminders = useCallback(
    async (accessIds: string[]) => {
      let start = false;
      try {
        const firstAccess = petition.accesses.find(
          (a) => a.id === accessIds[0]
        )!;
        const remindersConfig = await configureRemindersDialog({
          remindersActive: firstAccess.remindersActive,
          defaultRemindersConfig: firstAccess.remindersConfig || null,
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
    [petitionId, petition.accesses]
  );

  const showPetitionSharingDialog = usePetitionSharingDialog();
  const handlePetitionSharingClick = async function () {
    try {
      await showPetitionSharingDialog({
        userId: me.id,
        petitionIds: [petition.id],
      });
    } catch {}
  };

  return (
    <PetitionLayout
      key={petition.id}
      user={me}
      petition={petition}
      onUpdatePetition={handleOnUpdatePetition}
      section="activity"
      scrollBody
      state={state}
      headerActions={
        <Box display={{ base: "none", lg: "block" }}>
          <ShareButton
            petition={petition}
            userId={me.id}
            onClick={handlePetitionSharingClick}
          />
        </Box>
      }
    >
      <PetitionAccessesTable
        id="petition-accesses"
        margin={4}
        petition={petition}
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
          events={petition.events.items}
          onCancelScheduledMessage={handleCancelScheduledMessage}
        />
      </Box>
    </PetitionLayout>
  );
}

PetitionActivity.fragments = {
  Petition: gql`
    fragment PetitionActivity_Petition on Petition {
      id
      ...PetitionLayout_PetitionBase
      ...PetitionAccessTable_Petition
      ...PetitionActivityTimeline_Petition
      ...ShareButton_PetitionBase
      ...AddPetitionAccessDialog_Petition
    }
    ${PetitionLayout.fragments.PetitionBase}
    ${PetitionAccessesTable.fragments.Petition}
    ${PetitionActivityTimeline.fragments.Petition}
    ${ShareButton.fragments.PetitionBase}
    ${AddPetitionAccessDialog.fragments.Petition}
  `,
  User: gql`
    fragment PetitionActivity_User on User {
      ...PetitionLayout_User
      ...useUpdateIsReadNotification_User
    }
    ${PetitionLayout.fragments.User}
    ${useUpdateIsReadNotification.fragments.User}
  `,
};

PetitionActivity.mutations = [
  gql`
    mutation PetitionActivity_updatePetition(
      $petitionId: GID!
      $data: UpdatePetitionInput!
    ) {
      updatePetition(petitionId: $petitionId, data: $data) {
        ...PetitionActivity_Petition
      }
    }
    ${PetitionActivity.fragments.Petition}
  `,
  gql`
    mutation PetitionActivity_sendReminders(
      $petitionId: GID!
      $accessIds: [GID!]!
      $body: JSON
    ) {
      sendReminders(petitionId: $petitionId, accessIds: $accessIds, body: $body)
    }
  `,
  gql`
    mutation PetitionActivity_deactivateAccesses(
      $petitionId: GID!
      $accessIds: [GID!]!
    ) {
      deactivateAccesses(petitionId: $petitionId, accessIds: $accessIds) {
        id
        status
      }
    }
  `,
  gql`
    mutation PetitionActivity_reactivateAccesses(
      $petitionId: GID!
      $accessIds: [GID!]!
    ) {
      reactivateAccesses(petitionId: $petitionId, accessIds: $accessIds) {
        id
        status
      }
    }
  `,
  gql`
    mutation PetitionActivity_cancelScheduledMessage(
      $petitionId: GID!
      $messageId: GID!
    ) {
      cancelScheduledMessage(petitionId: $petitionId, messageId: $messageId) {
        id
        status
      }
    }
  `,
  gql`
    mutation PetitionsActivity_sendPetition(
      $petitionId: GID!
      $contactIds: [GID!]!
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
      $petitionId: GID!
      $accessIds: [GID!]!
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
        query PetitionActivity($id: GID!) {
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
            id="tour.petition-activity.page-title"
            defaultMessage="Activity"
          />
        ),
        content: (
          <FormattedMessage
            id="tour.petition-activity.page-content"
            defaultMessage="Here you can view and manage your petitions' access, messages, follow-ups, and event history."
          />
        ),
        placement: "center",
        target: "#__next",
      },
      {
        title: (
          <FormattedMessage
            id="tour.petition-activity.access-and-reminders-title"
            defaultMessage="Access and reminders"
          />
        ),
        content: (
          <Stack>
            <Text>
              <FormattedMessage
                id="tour.petition-activity.access-and-reminders-content-1"
                defaultMessage="In this section, you will be able to:"
              />
            </Text>
            <Stack as={UnorderedList} paddingLeft={5}>
              <ListItem>
                <FormattedMessage
                  id="tour.petition-activity.access-and-reminders-content-2"
                  defaultMessage="Manage who can <b>access</b> this petition."
                  values={{
                    b: (chunks: any[]) => <Text as="strong">{chunks}</Text>,
                  }}
                />
              </ListItem>
              <ListItem>
                <FormattedMessage
                  id="tour.petition-activity.access-and-reminders-content-3"
                  defaultMessage="Send an automatic or custom <b>reminder message</b> to your recipients."
                  values={{
                    b: (chunks: any[]) => <Text as="strong">{chunks}</Text>,
                  }}
                />
              </ListItem>
              <ListItem>
                <FormattedMessage
                  id="tour.petition-activity.access-and-reminders-content-4"
                  defaultMessage="Change <b>reminders settings</b>."
                  values={{
                    b: (chunks: any[]) => <Text as="strong">{chunks}</Text>,
                  }}
                />
              </ListItem>
            </Stack>
          </Stack>
        ),
        placement: "right",
        target: "#petition-accesses",
      },
      {
        title: (
          <FormattedMessage
            id="tour.petition-activity.events-title"
            defaultMessage="Monitor your requests"
          />
        ),
        content: (
          <Stack>
            <Text>
              <FormattedMessage
                id="tour.petition-activity.events-content-1"
                defaultMessage="Are you wondering if your recipients read the emails or opened the recipient replies page?"
              />
            </Text>
            <Text>
              <FormattedMessage
                id="tour.petition-activity.events-content-2"
                defaultMessage="Have a better overview of what is happening around your petition with the activity timeline."
              />
            </Text>
          </Stack>
        ),
        placement: "top-end",
        target: "#petition-activity-timeline",
      },
    ],
  }),
  withDialogs,
  withApolloData
)(PetitionActivity);
