import { gql, useMutation } from "@apollo/client";
import { Box, useToast } from "@chakra-ui/react";
import { withDialogs } from "@parallel/components/common/dialogs/DialogProvider";
import { ShareButton } from "@parallel/components/common/ShareButton";
import { withApolloData, WithApolloDataContext } from "@parallel/components/common/withApolloData";
import { PetitionLayout } from "@parallel/components/layout/PetitionLayout";
import {
  AddPetitionAccessDialog,
  useAddPetitionAccessDialog,
} from "@parallel/components/petition-activity/dialogs/AddPetitionAccessDialog";
import { useConfigureRemindersDialog } from "@parallel/components/petition-activity/dialogs/ConfigureRemindersDialog";
import { useConfirmCancelScheduledMessageDialog } from "@parallel/components/petition-activity/dialogs/ConfirmCancelScheduledMessageDialog";
import { useConfirmDeactivateAccessDialog } from "@parallel/components/petition-activity/dialogs/ConfirmDeactivateAccessDialog";
import { useConfirmReactivateAccessDialog } from "@parallel/components/petition-activity/dialogs/ConfirmReactivateAccessDialog";
import { useConfirmSendReminderDialog } from "@parallel/components/petition-activity/dialogs/ConfirmSendReminderDialog";
import { PetitionAccessesTable } from "@parallel/components/petition-activity/PetitionAccessesTable";
import { PetitionActivityTimeline } from "@parallel/components/petition-activity/PetitionActivityTimeline";
import { usePetitionSharingDialog } from "@parallel/components/petition-common/dialogs/PetitionSharingDialog";
import {
  PetitionAccessTable_PetitionAccessFragment,
  PetitionActivity_cancelScheduledMessageDocument,
  PetitionActivity_deactivateAccessesDocument,
  PetitionActivity_petitionDocument,
  PetitionActivity_PetitionFragment,
  PetitionActivity_reactivateAccessesDocument,
  PetitionActivity_sendRemindersDocument,
  PetitionActivity_switchAutomaticRemindersDocument,
  PetitionActivity_updatePetitionDocument,
  PetitionActivity_userDocument,
  PetitionsActivity_sendPetitionDocument,
  UpdatePetitionInput,
} from "@parallel/graphql/__types";
import { useAssertQuery } from "@parallel/utils/apollo/useAssertQuery";
import { isApolloError } from "@parallel/utils/apollo/isApolloError";
import { compose } from "@parallel/utils/compose";
import { useUpdateIsReadNotification } from "@parallel/utils/mutations/useUpdateIsReadNotification";
import { withError } from "@parallel/utils/promises/withError";
import { UnwrapPromise } from "@parallel/utils/types";
import { usePetitionLimitReachedErrorDialog } from "@parallel/utils/usePetitionLimitReachedErrorDialog";
import { usePetitionStateWrapper, withPetitionState } from "@parallel/utils/usePetitionState";
import { useSearchContacts } from "@parallel/utils/useSearchContacts";
import { useCallback, useEffect } from "react";
import { useIntl } from "react-intl";
import { omit } from "remeda";

type PetitionActivityProps = UnwrapPromise<ReturnType<typeof PetitionActivity.getInitialProps>>;

function PetitionActivity({ petitionId }: PetitionActivityProps) {
  const intl = useIntl();
  const toast = useToast();
  const {
    data: { me },
  } = useAssertQuery(PetitionActivity_userDocument);
  const { data, refetch } = useAssertQuery(PetitionActivity_petitionDocument, {
    variables: { id: petitionId },
  });

  const updateIsReadNotification = useUpdateIsReadNotification();
  useEffect(() => {
    updateIsReadNotification({ isRead: true, filter: "OTHER" });
  }, []);

  const petition = data!.petition as PetitionActivity_PetitionFragment;

  const wrapper = usePetitionStateWrapper();

  const [updatePetition] = useMutation(PetitionActivity_updatePetitionDocument);
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
              defaultMessage: "You have sent the maximum number of reminders to {nameOrEmail}",
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
  const [sendReminders] = useMutation(PetitionActivity_sendRemindersDocument);
  const handleSendReminders = useCallback(
    async (accesses: PetitionAccessTable_PetitionAccessFragment[]) => {
      try {
        const { message } = await confirmSendReminder({ accesses });
        try {
          const accessIds = accesses.map((selected) => selected.id);
          await sendReminders({
            variables: { petitionId, accessIds, body: message },
          });
        } catch (error) {
          if (isApolloError(error)) {
            const extra = error.graphQLErrors[0]?.extensions?.extra as any;
            switch (extra?.errorCode) {
              case "NO_REMINDERS_LEFT": {
                showNoRemindersLeftToast(extra.petitionAccessId);
                return;
              }
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
  const [sendPetition] = useMutation(PetitionsActivity_sendPetitionDocument);
  const showPetitionLimitReachedErrorDialog = usePetitionLimitReachedErrorDialog();

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
          return await handleSearchContacts(search, [...exclude, ...currentRecipientIds]);
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
    } catch (e) {
      if (
        isApolloError(e) &&
        e.graphQLErrors[0]?.extensions?.code === "PETITION_SEND_CREDITS_ERROR"
      ) {
        await withError(showPetitionLimitReachedErrorDialog());
      }
    }
  }, [petitionId, petition.accesses, showPetitionLimitReachedErrorDialog]);

  const confirmCancelScheduledMessage = useConfirmCancelScheduledMessageDialog();
  const [cancelScheduledMessage] = useMutation(PetitionActivity_cancelScheduledMessageDocument);
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
  const [reactivateAccess] = useMutation(PetitionActivity_reactivateAccessesDocument);
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
  const [deactivateAccess] = useMutation(PetitionActivity_deactivateAccessesDocument);
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

  const [switchReminders] = useMutation(PetitionActivity_switchAutomaticRemindersDocument);
  const configureRemindersDialog = useConfigureRemindersDialog();
  const handleConfigureReminders = useCallback(
    async (accesses: PetitionAccessTable_PetitionAccessFragment[]) => {
      let start = false;
      try {
        const accessIds = accesses
          .filter((access) => !access.remindersOptOut)
          .map((access) => access.id);

        const firstAccess = petition.accesses.find((a) => a.id === accessIds[0])!;
        const remindersConfig = await configureRemindersDialog({
          accesses,
          remindersActive: firstAccess.remindersActive,
          defaultRemindersConfig: firstAccess.remindersConfig || null,
        });

        start = !!remindersConfig;
        await switchReminders({
          variables: {
            start,
            accessIds,
            petitionId,
            remindersConfig: start ? omit(remindersConfig!, ["__typename"]) : null,
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
        if (isApolloError(e)) {
          const extra = e.graphQLErrors[0]?.extensions?.extra as any;
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
                  defaultMessage: "There was an error setting the reminders. Please try again.",
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
      headerActions={
        <Box display={{ base: "none", lg: "block" }}>
          <ShareButton petition={petition} userId={me.id} onClick={handlePetitionSharingClick} />
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
    mutation PetitionActivity_updatePetition($petitionId: GID!, $data: UpdatePetitionInput!) {
      updatePetition(petitionId: $petitionId, data: $data) {
        ...PetitionActivity_Petition
      }
    }
    ${PetitionActivity.fragments.Petition}
  `,
  gql`
    mutation PetitionActivity_sendReminders($petitionId: GID!, $accessIds: [GID!]!, $body: JSON) {
      sendReminders(petitionId: $petitionId, accessIds: $accessIds, body: $body)
    }
  `,
  gql`
    mutation PetitionActivity_deactivateAccesses($petitionId: GID!, $accessIds: [GID!]!) {
      deactivateAccesses(petitionId: $petitionId, accessIds: $accessIds) {
        id
        status
      }
    }
  `,
  gql`
    mutation PetitionActivity_reactivateAccesses($petitionId: GID!, $accessIds: [GID!]!) {
      reactivateAccesses(petitionId: $petitionId, accessIds: $accessIds) {
        id
        status
      }
    }
  `,
  gql`
    mutation PetitionActivity_cancelScheduledMessage($petitionId: GID!, $messageId: GID!) {
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

PetitionActivity.queries = [
  gql`
    query PetitionActivity_petition($id: GID!) {
      petition(id: $id) {
        ...PetitionActivity_Petition
      }
    }
    ${PetitionActivity.fragments.Petition}
  `,
  gql`
    query PetitionActivity_user {
      me {
        ...PetitionActivity_User
      }
    }
    ${PetitionActivity.fragments.User}
  `,
];

PetitionActivity.getInitialProps = async ({ query, fetchQuery }: WithApolloDataContext) => {
  const petitionId = query.petitionId as string;
  await Promise.all([
    fetchQuery(PetitionActivity_petitionDocument, {
      variables: { id: petitionId },
    }),
    fetchQuery(PetitionActivity_userDocument),
  ]);
  return { petitionId };
};

export default compose(withPetitionState, withDialogs, withApolloData)(PetitionActivity);
