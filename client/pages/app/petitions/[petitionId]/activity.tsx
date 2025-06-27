import { gql, useMutation } from "@apollo/client";
import { Box, Center, Spinner, Stack, useToast } from "@chakra-ui/react";
import { ProfileReference } from "@parallel/components/common/ProfileReference";
import { ShareButton } from "@parallel/components/common/ShareButton";
import { SupportButton } from "@parallel/components/common/SupportButton";
import { withDialogs } from "@parallel/components/common/dialogs/DialogProvider";
import { useErrorDialog } from "@parallel/components/common/dialogs/ErrorDialog";
import {
  FieldErrorDialog,
  useFieldErrorDialog,
} from "@parallel/components/common/dialogs/FieldErrorDialog";
import { WithApolloDataContext, withApolloData } from "@parallel/components/common/withApolloData";
import {
  PetitionLayout,
  usePetitionStateWrapper,
  withPetitionLayoutContext,
} from "@parallel/components/layout/PetitionLayout";
import { PetitionAccessesTable } from "@parallel/components/petition-activity/PetitionAccessesTable";
import { PetitionActivityTimeline } from "@parallel/components/petition-activity/PetitionActivityTimeline";
import { PetitionProfilesTable } from "@parallel/components/petition-activity/PetitionProfilesTable";
import { AddPetitionAccessDialog } from "@parallel/components/petition-activity/dialogs/AddPetitionAccessDialog";
import { useConfigureRemindersDialog } from "@parallel/components/petition-activity/dialogs/ConfigureRemindersDialog";
import {
  ConfirmDeactivateAccessDialog,
  useConfirmDeactivateAccessDialog,
} from "@parallel/components/petition-activity/dialogs/ConfirmDeactivateAccessDialog";
import { useConfirmDisassociateProfileDialog } from "@parallel/components/petition-activity/dialogs/ConfirmDisassociateProfileDialog";
import {
  ConfirmReactivateAccessDialog,
  useConfirmReactivateAccessDialog,
} from "@parallel/components/petition-activity/dialogs/ConfirmReactivateAccessDialog";
import { useConfirmSendReminderDialog } from "@parallel/components/petition-activity/dialogs/ConfirmSendReminderDialog";
import { useAssociateProfileToPetitionDialog } from "@parallel/components/petition-common/dialogs/AssociateProfileToPetitionDialog";
import { usePetitionSharingDialog } from "@parallel/components/petition-common/dialogs/PetitionSharingDialog";
import { useSendPetitionHandler } from "@parallel/components/petition-common/useSendPetitionHandler";
import { PetitionLimitReachedAlert } from "@parallel/components/petition-compose/PetitionLimitReachedAlert";
import {
  PetitionAccessTable_PetitionAccessFragment,
  PetitionActivity_associateProfileToPetitionDocument,
  PetitionActivity_deactivateAccessesDocument,
  PetitionActivity_disassociateProfilesFromPetitionsDocument,
  PetitionActivity_eventsDocument,
  PetitionActivity_petitionDocument,
  PetitionActivity_reactivateAccessesDocument,
  PetitionActivity_sendRemindersDocument,
  PetitionActivity_switchAutomaticRemindersDocument,
  PetitionActivity_updatePetitionDocument,
  PetitionActivity_userDocument,
  UpdatePetitionInput,
} from "@parallel/graphql/__types";
import { isApolloError } from "@parallel/utils/apollo/isApolloError";
import { assertTypename } from "@parallel/utils/apollo/typename";
import { useAssertQuery } from "@parallel/utils/apollo/useAssertQuery";
import { compose } from "@parallel/utils/compose";
import { useAllFieldsWithIndices } from "@parallel/utils/fieldIndices";
import { useGoToPetitionSection } from "@parallel/utils/goToPetition";
import { useUpdateIsReadNotification } from "@parallel/utils/mutations/useUpdateIsReadNotification";
import { withError } from "@parallel/utils/promises/withError";
import { UnwrapPromise } from "@parallel/utils/types";
import { validatePetitionFields } from "@parallel/utils/validatePetitionFields";
import { useRouter } from "next/router";
import { useCallback, useEffect } from "react";
import InfiniteScroll from "react-infinite-scroll-component";
import { FormattedMessage, useIntl } from "react-intl";
import { isNonNullish, omit } from "remeda";
import { assert } from "ts-essentials";

const PAGE_SIZE = 100;

type PetitionActivityProps = UnwrapPromise<ReturnType<typeof PetitionActivity.getInitialProps>>;

function PetitionActivity({ petitionId }: PetitionActivityProps) {
  const intl = useIntl();
  const toast = useToast();
  const router = useRouter();
  const { query } = router;

  const goToSection = useGoToPetitionSection();
  const { data: queryObject } = useAssertQuery(PetitionActivity_userDocument);
  const { me } = queryObject;

  const { data: petitionData, refetch: petitionRefetch } = useAssertQuery(
    PetitionActivity_petitionDocument,
    { variables: { id: petitionId } },
  );
  const {
    data: eventsData,
    refetch: eventsRefetch,
    fetchMore: eventsFetchMore,
  } = useAssertQuery(PetitionActivity_eventsDocument, {
    variables: { id: petitionId, offset: 0, limit: PAGE_SIZE },
  });
  const refetch = useCallback(
    () => Promise.all([petitionRefetch(), eventsRefetch()]),
    [petitionRefetch, eventsRefetch],
  );

  const updateIsReadNotification = useUpdateIsReadNotification();
  useEffect(() => {
    updateIsReadNotification({ isRead: true, filter: "OTHER", petitionIds: [petitionId] });
  }, [petitionId]);

  assert(isNonNullish(petitionData.petition));
  assertTypename(petitionData.petition, "Petition");
  const petition = petitionData.petition;

  assert(isNonNullish(eventsData.petition));
  assertTypename(eventsData.petition, "Petition");
  const events = eventsData.petition.events;

  const wrapper = usePetitionStateWrapper();

  const [updatePetition] = useMutation(PetitionActivity_updatePetitionDocument);
  const handleUpdatePetition = useCallback(
    wrapper(async (data: UpdatePetitionInput) => {
      return await updatePetition({ variables: { petitionId, data } });
    }),
    [petitionId],
  );

  const showErrorDialog = useErrorDialog();
  const showFieldErrorDialog = useFieldErrorDialog();
  const allFieldsWithIndices = useAllFieldsWithIndices(petition);
  const _validatePetitionFields = async () => {
    const { error, message, footer, fieldsWithIndices } = validatePetitionFields(
      allFieldsWithIndices,
      petition,
    );
    if (error) {
      if (fieldsWithIndices && fieldsWithIndices.length > 0) {
        if (error === "PAID_FIELDS_BLOCKED") {
          await withError(
            showFieldErrorDialog({
              header: (
                <FormattedMessage
                  id="generic.fields-not-available"
                  defaultMessage="Fields not available"
                />
              ),
              message,
              footer,
              fieldsWithIndices,
              cancel: (
                <SupportButton
                  variant="outline"
                  colorScheme="primary"
                  message={intl.formatMessage({
                    id: "generic.upgrade-plan-support-message",
                    defaultMessage:
                      "Hi, I would like to get more information about how to upgrade my plan.",
                  })}
                >
                  <FormattedMessage id="generic.contact" defaultMessage="Contact" />
                </SupportButton>
              ),
              confirmText: <FormattedMessage id="generic.continue" defaultMessage="Continue" />,
            }),
          );
          return true;
        } else {
          await withError(showFieldErrorDialog({ message, fieldsWithIndices }));
          const firstId = fieldsWithIndices[0][0].id;
          router.push(`/app/petitions/${query.petitionId}/compose#field-${firstId}`);
        }
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
      opts,
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
            },
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
        const { message } = await confirmSendReminder({ petition });
        try {
          const accessIds = accesses.map((selected) => selected.id);
          await sendReminders({
            variables: { petitionId, accessIds, body: message },
          });
        } catch (error) {
          if (isApolloError(error, "NO_REMINDERS_LEFT")) {
            showNoRemindersLeftToast(
              error.graphQLErrors[0]!.extensions!.petitionAccessId as string,
            );
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
    [petitionId, petition.accesses],
  );

  const confirmReactivateAccess = useConfirmReactivateAccessDialog();
  const [reactivateAccess] = useMutation(PetitionActivity_reactivateAccessesDocument);
  const handleReactivateAccess = useCallback(
    async (accessId: string) => {
      const access = petition.accesses.find((a) => a.id === accessId)!;
      try {
        await confirmReactivateAccess({ access });
      } catch {
        return;
      }
      await reactivateAccess({
        variables: { petitionId, accessIds: [accessId] },
      });
      await refetch();
    },
    [petitionId, petition.accesses],
  );

  const confirmDeactivateAccess = useConfirmDeactivateAccessDialog();
  const [deactivateAccess] = useMutation(PetitionActivity_deactivateAccessesDocument);
  const handleDeactivateAccess = useCallback(
    async (accessId: string) => {
      const access = petition.accesses.find((a) => a.id === accessId)!;
      try {
        await confirmDeactivateAccess({ access });
      } catch {
        return;
      }
      await deactivateAccess({
        variables: { petitionId, accessIds: [accessId] },
      });
      await refetch();
    },
    [petitionId, petition.accesses],
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
          }),
        );
        if (error) {
          return;
        }

        const start = isNonNullish(remindersConfig);
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
    [petitionId, petition.accesses],
  );

  const showPetitionSharingDialog = usePetitionSharingDialog();
  const handlePetitionSharingClick = async function () {
    try {
      const res = await showPetitionSharingDialog({
        userId: me.id,
        petitionIds: [petition.id],
        type: "PETITION",
      });
      if (res?.close) {
        router.push("/app/petitions");
      }
    } catch {}
  };

  const displayPetitionLimitReachedAlert =
    me.organization.isPetitionUsageLimitReached &&
    petition.__typename === "Petition" &&
    petition.status === "DRAFT";

  const [associateProfileToPetition] = useMutation(
    PetitionActivity_associateProfileToPetitionDocument,
  );
  const showAssociateProfileToPetitionDialog = useAssociateProfileToPetitionDialog();
  const handleAddProfileToPetition = async () => {
    try {
      const profileId = await showAssociateProfileToPetitionDialog({
        excludeProfiles: petition.profiles?.map((p) => p.id),
      });

      await associateProfileToPetition({
        variables: { petitionId, profileId },
      });

      toast({
        isClosable: true,
        status: "success",
        title: intl.formatMessage({
          id: "component.petition-header.profile-asociated-toast-title",
          defaultMessage: "Profile associated",
        }),
        description: intl.formatMessage({
          id: "component.petition-header.profile-asociated-toast-description",
          defaultMessage: "You can include the information you need",
        }),
      });
      goToSection("replies", { query: { profile: profileId } });
    } catch {}
  };

  const showConfirmDisassociateProfileDialog = useConfirmDisassociateProfileDialog();
  const [disassociateProfilesFromPetitions] = useMutation(
    PetitionActivity_disassociateProfilesFromPetitionsDocument,
  );
  const handleDisassociateProfileFromPetition = async (profileIds: string[]) => {
    try {
      const profile = petition.profiles.find((p) => p.id === profileIds[0]);

      await showConfirmDisassociateProfileDialog({
        petitionName: petition.name,
        profileName:
          profileIds.length === 1 && isNonNullish(profile) ? (
            <ProfileReference profile={profile} />
          ) : (
            ""
          ),
        selectedProfiles: profileIds.length,
      });
      await disassociateProfilesFromPetitions({
        variables: { petitionIds: [petitionId], profileIds },
      });
      refetch();
    } catch {}
  };

  const handleLoadMore = useCallback(async () => {
    await eventsFetchMore({
      variables: { id: petitionId, offset: events.items.length, limit: PAGE_SIZE },
    });
  }, [petitionId, eventsFetchMore, events.items.length]);

  return (
    <PetitionLayout
      key={petition.id}
      queryObject={queryObject}
      petition={petition}
      onUpdatePetition={handleUpdatePetition}
      onRefetch={() => refetch()}
      section="activity"
      headerActions={
        <Box display={{ base: "none", lg: "block" }} className="no-print">
          <ShareButton petition={petition} userId={me.id} onClick={handlePetitionSharingClick} />
        </Box>
      }
    >
      <Box position="sticky" top={0} zIndex={2} className="no-print">
        {displayPetitionLimitReachedAlert ? (
          <PetitionLimitReachedAlert limit={me.organization.petitionsPeriod?.limit ?? 0} />
        ) : null}
      </Box>
      <Stack padding={4} spacing={4} zIndex={1}>
        {petition.isInteractionWithRecipientsEnabled ? (
          <PetitionAccessesTable
            id="petition-accesses"
            petition={petition}
            onSendReminders={handleSendReminders}
            onAddPetitionAccess={handleNextClick({ redirect: false })}
            onReactivateAccess={handleReactivateAccess}
            onDeactivateAccess={handleDeactivateAccess}
            onConfigureReminders={handleConfigureReminders}
            onPetitionSend={handleNextClick({ redirect: true })}
          />
        ) : null}

        {me.hasProfilesAccess ? (
          <Box>
            <PetitionProfilesTable
              petition={petition}
              onAddProfile={handleAddProfileToPetition}
              onRemoveProfile={handleDisassociateProfileFromPetition}
            />
          </Box>
        ) : null}
        <Box>
          <InfiniteScroll
            dataLength={events.items.length}
            next={handleLoadMore}
            hasMore={events.items.length < events.totalCount}
            loader={
              <Center height="100px" width="100%" zIndex="1" className="no-print">
                <Spinner
                  thickness="2px"
                  speed="0.65s"
                  emptyColor="gray.200"
                  color="gray.600"
                  size="xl"
                />
              </Center>
            }
            scrollableTarget="petition-layout-body"
          >
            <PetitionActivityTimeline events={events.items} />
          </InfiniteScroll>
        </Box>
      </Stack>
    </PetitionLayout>
  );
}

const _fragments = {
  Petition: gql`
    fragment PetitionActivity_Petition on Petition {
      id
      isInteractionWithRecipientsEnabled
      accesses {
        id
        ...ConfirmDeactivateAccessDialog_PetitionAccess
        ...ConfirmReactivateAccessDialog_PetitionAccess
        ...useConfigureRemindersDialog_PetitionAccess
      }
      ...PetitionLayout_PetitionBase
      ...PetitionAccessTable_Petition
      ...ShareButton_PetitionBase
      ...AddPetitionAccessDialog_Petition
      ...useSendPetitionHandler_Petition
      fields {
        id
        ...validatePetitionFields_PetitionField
        ...FieldErrorDialog_PetitionField
        children {
          id
          ...validatePetitionFields_PetitionField
          ...FieldErrorDialog_PetitionField
        }
      }
      ...useAllFieldsWithIndices_PetitionBase
      ...useConfirmSendReminderDialog_Petition
      ...PetitionProfilesTable_Petition
      ...validatePetitionFields_PetitionBase
    }
    ${PetitionLayout.fragments.PetitionBase}
    ${PetitionAccessesTable.fragments.Petition}
    ${PetitionProfilesTable.fragments.Petition}
    ${ShareButton.fragments.PetitionBase}
    ${AddPetitionAccessDialog.fragments.Petition}
    ${useSendPetitionHandler.fragments.Petition}
    ${useAllFieldsWithIndices.fragments.PetitionBase}
    ${validatePetitionFields.fragments.PetitionField}
    ${validatePetitionFields.fragments.PetitionBase}
    ${FieldErrorDialog.fragments.PetitionField}
    ${ConfirmDeactivateAccessDialog.fragments.PetitionAccess}
    ${ConfirmReactivateAccessDialog.fragments.PetitionAccess}
    ${useConfirmSendReminderDialog.fragments.Petition}
    ${useConfigureRemindersDialog.fragments.PetitionAccess}
  `,
  Query: gql`
    fragment PetitionActivity_Query on Query {
      ...PetitionLayout_Query
      me {
        id
        organization {
          id
          isPetitionUsageLimitReached: isUsageLimitReached(limitName: PETITION_SEND)
          petitionsPeriod: currentUsagePeriod(limitName: PETITION_SEND) {
            limit
          }
        }
        ...useUpdateIsReadNotification_User
        ...useSendPetitionHandler_User
      }
    }
    ${PetitionLayout.fragments.Query}
    ${useUpdateIsReadNotification.fragments.User}
    ${useSendPetitionHandler.fragments.User}
  `,
};

PetitionActivity.mutations = [
  gql`
    mutation PetitionActivity_updatePetition($petitionId: GID!, $data: UpdatePetitionInput!) {
      updatePetition(petitionId: $petitionId, data: $data) {
        ...PetitionActivity_Petition
      }
    }
    ${_fragments.Petition}
  `,
  gql`
    mutation PetitionActivity_sendReminders($petitionId: GID!, $accessIds: [GID!]!, $body: JSON) {
      sendReminders(petitionId: $petitionId, accessIds: $accessIds, body: $body) {
        id
      }
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
  gql`
    mutation PetitionActivity_associateProfileToPetition($petitionId: GID!, $profileId: GID!) {
      associateProfileToPetition(petitionId: $petitionId, profileId: $profileId) {
        petition {
          id
          profiles {
            id
          }
        }
      }
    }
    mutation PetitionActivity_disassociateProfilesFromPetitions(
      $petitionIds: [GID!]!
      $profileIds: [GID!]!
    ) {
      disassociateProfilesFromPetitions(petitionIds: $petitionIds, profileIds: $profileIds)
    }
  `,
];

const _queries = [
  gql`
    query PetitionActivity_events($id: GID!, $offset: Int!, $limit: Int!) {
      petition(id: $id) {
        id
        ... on Petition {
          events(offset: $offset, limit: $limit) {
            items {
              id
              ...PetitionActivityTimeline_PetitionEvent
            }
            totalCount
          }
        }
      }
    }
    ${PetitionActivityTimeline.fragments.PetitionEvent}
  `,
  gql`
    query PetitionActivity_petition($id: GID!) {
      petition(id: $id) {
        ...PetitionActivity_Petition
      }
    }
    ${_fragments.Petition}
  `,
  gql`
    query PetitionActivity_user {
      ...PetitionActivity_Query
      me {
        id
        hasProfilesAccess: hasFeatureFlag(featureFlag: PROFILES)
      }
    }
    ${_fragments.Query}
  `,
];

PetitionActivity.getInitialProps = async ({ query, fetchQuery }: WithApolloDataContext) => {
  const petitionId = query.petitionId as string;
  await Promise.all([
    fetchQuery(PetitionActivity_eventsDocument, {
      variables: { id: petitionId, offset: 0, limit: PAGE_SIZE },
    }),
    fetchQuery(PetitionActivity_petitionDocument, {
      variables: { id: petitionId },
    }),
    fetchQuery(PetitionActivity_userDocument),
  ]);
  return { petitionId };
};

export default compose(withPetitionLayoutContext, withDialogs, withApolloData)(PetitionActivity);
