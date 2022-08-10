import { gql, useMutation } from "@apollo/client";
import { Box, useToast } from "@chakra-ui/react";
import { withDialogs } from "@parallel/components/common/dialogs/DialogProvider";
import { useErrorDialog } from "@parallel/components/common/dialogs/ErrorDialog";
import {
  FieldErrorDialog,
  useFieldErrorDialog,
} from "@parallel/components/common/dialogs/FieldErrorDialog";
import { ShareButton } from "@parallel/components/common/ShareButton";
import { withApolloData, WithApolloDataContext } from "@parallel/components/common/withApolloData";
import { PetitionLayout } from "@parallel/components/layout/PetitionLayout";
import { AddPetitionAccessDialog } from "@parallel/components/petition-activity/dialogs/AddPetitionAccessDialog";
import { useConfigureRemindersDialog } from "@parallel/components/petition-activity/dialogs/ConfigureRemindersDialog";
import { useConfirmCancelScheduledMessageDialog } from "@parallel/components/petition-activity/dialogs/ConfirmCancelScheduledMessageDialog";
import { useConfirmDeactivateAccessDialog } from "@parallel/components/petition-activity/dialogs/ConfirmDeactivateAccessDialog";
import { useConfirmReactivateAccessDialog } from "@parallel/components/petition-activity/dialogs/ConfirmReactivateAccessDialog";
import { useConfirmSendReminderDialog } from "@parallel/components/petition-activity/dialogs/ConfirmSendReminderDialog";
import { PetitionAccessesTable } from "@parallel/components/petition-activity/PetitionAccessesTable";
import { PetitionActivityTimeline } from "@parallel/components/petition-activity/PetitionActivityTimeline";
import { usePetitionSharingDialog } from "@parallel/components/petition-common/dialogs/PetitionSharingDialog";
import { useSendPetitionHandler } from "@parallel/components/petition-common/useSendPetitionHandler";
import { PetitionLimitReachedAlert } from "@parallel/components/petition-compose/PetitionLimitReachedAlert";
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
  UpdatePetitionInput,
} from "@parallel/graphql/__types";
import { isApolloError } from "@parallel/utils/apollo/isApolloError";
import { useAssertQuery } from "@parallel/utils/apollo/useAssertQuery";
import { compose } from "@parallel/utils/compose";
import { isUsageLimitsReached } from "@parallel/utils/isUsageLimitsReached";
import { useUpdateIsReadNotification } from "@parallel/utils/mutations/useUpdateIsReadNotification";
import { withError } from "@parallel/utils/promises/withError";
import { UnwrapPromise } from "@parallel/utils/types";
import { usePetitionStateWrapper, withPetitionState } from "@parallel/utils/usePetitionState";
import { validatePetitionFields } from "@parallel/utils/validatePetitionFields";
import { useRouter } from "next/router";
import { useCallback, useEffect } from "react";
import { useIntl } from "react-intl";
import { isDefined, omit } from "remeda";

type PetitionActivityProps = UnwrapPromise<ReturnType<typeof PetitionActivity.getInitialProps>>;

function PetitionActivity({ petitionId }: PetitionActivityProps) {
  const intl = useIntl();
  const toast = useToast();
  const router = useRouter();
  const { query } = router;

  const {
    data: { me, realMe },
  } = useAssertQuery(PetitionActivity_userDocument);
  const { data, refetch } = useAssertQuery(PetitionActivity_petitionDocument, {
    variables: { id: petitionId },
  });

  const updateIsReadNotification = useUpdateIsReadNotification();
  useEffect(() => {
    updateIsReadNotification({ isRead: true, filter: "OTHER", petitionIds: [petitionId] });
  }, []);

  const petition = data!.petition as PetitionActivity_PetitionFragment;

  const wrapper = usePetitionStateWrapper();

  const [updatePetition] = useMutation(PetitionActivity_updatePetitionDocument);
  const handleUpdatePetition = useCallback(
    wrapper(async (data: UpdatePetitionInput) => {
      return await updatePetition({ variables: { petitionId, data } });
    }),
    [petitionId]
  );

  const showErrorDialog = useErrorDialog();
  const showFieldErrorDialog = useFieldErrorDialog();
  const _validatePetitionFields = async () => {
    const { error, message, fieldsWithIndices } = validatePetitionFields(petition.fields);
    if (error) {
      if (fieldsWithIndices && fieldsWithIndices.length > 0) {
        await withError(showFieldErrorDialog({ message, fieldsWithIndices }));
        const firstId = fieldsWithIndices[0].field.id;
        router.push(`/app/petitions/${query.petitionId}/compose#field-${firstId}`);
      } else {
        await withError(showErrorDialog({ message }));
        router.push(`/app/petitions/${query.petitionId}/compose`);
      }
      return false;
    }
    return true;
  };

  const handleNextClick = (opts: { redirect: boolean }) =>
    useSendPetitionHandler(
      me,
      petition,
      handleUpdatePetition,
      _validatePetitionFields,
      refetch,
      opts
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
          if (isApolloError(error, "NO_REMINDERS_LEFT")) {
            showNoRemindersLeftToast(error.graphQLErrors[0]!.extensions.petitionAccessId as string);
          }
          return;
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

  const confirmReactivateAccess = useConfirmReactivateAccessDialog();
  const [reactivateAccess] = useMutation(PetitionActivity_reactivateAccessesDocument);
  const handleReactivateAccess = useCallback(
    async (accessId: string) => {
      const { contact } = petition.accesses.find((a) => a.id === accessId)!;
      try {
        await confirmReactivateAccess({
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
      try {
        const accessIds = accesses
          .filter((access) => !access.remindersOptOut)
          .map((access) => access.id);

        const firstAccess = petition.accesses.find((a) => a.id === accessIds[0])!;
        const [error, remindersConfig] = await withError(
          configureRemindersDialog({
            accesses,
            remindersActive: firstAccess.remindersActive,
            defaultRemindersConfig: firstAccess.remindersConfig || null,
          })
        );
        if (error) {
          return;
        }

        const start = isDefined(remindersConfig);
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
        if (isApolloError(e, "NO_REMINDERS_LEFT")) {
          showNoRemindersLeftToast();
        } else {
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
      }
    },
    [petitionId, petition.accesses]
  );

  const showPetitionSharingDialog = usePetitionSharingDialog();
  const handlePetitionSharingClick = async function () {
    try {
      const res = await showPetitionSharingDialog({
        userId: me.id,
        petitionIds: [petition.id],
      });
      if (res?.close) {
        router.push("/app/petitions");
      }
    } catch {}
  };

  const displayPetitionLimitReachedAlert =
    isUsageLimitsReached(me.organization) &&
    petition.__typename === "Petition" &&
    petition.status === "DRAFT";

  return (
    <PetitionLayout
      key={petition.id}
      me={me}
      realMe={realMe}
      petition={petition}
      onUpdatePetition={handleUpdatePetition}
      section="activity"
      headerActions={
        <Box display={{ base: "none", lg: "block" }}>
          <ShareButton petition={petition} userId={me.id} onClick={handlePetitionSharingClick} />
        </Box>
      }
      subHeader={
        displayPetitionLimitReachedAlert ? (
          <PetitionLimitReachedAlert limit={me.organization.usageLimits.petitions.limit} />
        ) : null
      }
    >
      <PetitionAccessesTable
        id="petition-accesses"
        margin={4}
        petition={petition}
        onSendReminders={handleSendReminders}
        onAddPetitionAccess={handleNextClick({ redirect: false })}
        onReactivateAccess={handleReactivateAccess}
        onDeactivateAccess={handleDeactivateAccess}
        onConfigureReminders={handleConfigureReminders}
        onPetitionSend={handleNextClick({ redirect: true })}
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
      accesses {
        id
        status
      }
      ...PetitionLayout_PetitionBase
      ...PetitionAccessTable_Petition
      ...PetitionActivityTimeline_Petition
      ...ShareButton_PetitionBase
      ...AddPetitionAccessDialog_Petition
      ...useSendPetitionHandler_Petition
      fields {
        ...validatePetitionFields_PetitionField
        ...FieldErrorDialog_PetitionField
      }
    }
    ${PetitionLayout.fragments.PetitionBase}
    ${PetitionAccessesTable.fragments.Petition}
    ${PetitionActivityTimeline.fragments.Petition}
    ${ShareButton.fragments.PetitionBase}
    ${AddPetitionAccessDialog.fragments.Petition}
    ${useSendPetitionHandler.fragments.Petition}
    ${validatePetitionFields.fragments.PetitionField}
    ${FieldErrorDialog.fragments.PetitionField}
  `,
  Query: gql`
    fragment PetitionActivity_Query on Query {
      ...PetitionLayout_Query
      me {
        organization {
          name
          ...isUsageLimitsReached_Organization
        }
        ...useUpdateIsReadNotification_User
        ...useSendPetitionHandler_User
      }
    }
    ${PetitionLayout.fragments.Query}
    ${useUpdateIsReadNotification.fragments.User}
    ${useSendPetitionHandler.fragments.User}
    ${isUsageLimitsReached.fragments.Organization}
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
      ...PetitionActivity_Query
    }
    ${PetitionActivity.fragments.Query}
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
