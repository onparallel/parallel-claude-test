import { Box, Flex, List, ListItem, Text, useToast } from "@chakra-ui/core";
import { withOnboarding } from "@parallel/components/common/OnboardingTour";
import { Spacer } from "@parallel/components/common/Spacer";
import { Title } from "@parallel/components/common/Title";
import {
  withData,
  WithDataContext,
} from "@parallel/components/common/withData";
import { PetitionLayout } from "@parallel/components/layout/PetitionLayout";
import { PetitionAccessesTable } from "@parallel/components/petition-activity/PetitionAccessesTable";
import { PetitionActivityTimeline } from "@parallel/components/petition-activity/PetitionActivityTimeline";
import {
  PetitionActivityQuery,
  PetitionActivityQueryVariables,
  PetitionActivityUserQuery,
  UpdatePetitionInput,
  usePetitionActivityQuery,
  usePetitionActivityUserQuery,
  usePetitionActivity_sendRemindersMutation,
  usePetitionActivity_updatePetitionMutation,
  usePetitionActivity_cancelScheduledMessageMutation,
} from "@parallel/graphql/__types";
import { assertQuery } from "@parallel/utils/apollo";
import { compose } from "@parallel/utils/compose";
import {
  usePetitionState,
  useWrapPetitionUpdater,
} from "@parallel/utils/petitions";
import { UnwrapPromise, UnwrapArray, Assert } from "@parallel/utils/types";
import { gql } from "apollo-boost";
import { useCallback, useMemo } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { useConfirmCancelScheduledMessageDialog } from "@parallel/components/petition-activity/ConfirmCancelScheduledMessageDialog";
import { useConfirmSendReminderDialog } from "@parallel/components/petition-activity/ConfirmSendReminderDialog";
import { differenceInMinutes } from "date-fns";
import { useSendMessageDialogDialog } from "@parallel/components/petition-activity/SendMessageDialog";

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

  const [state, setState] = usePetitionState();
  const wrapper = useWrapPetitionUpdater(setState);

  const [updatePetition] = usePetitionActivity_updatePetitionMutation();
  const handleOnUpdatePetition = useCallback(
    wrapper(async (data: UpdatePetitionInput) => {
      return await updatePetition({ variables: { petitionId, data } });
    }),
    [petitionId]
  );

  const showSendMessageDialog = useSendMessageDialogDialog();
  const handleSendMessage = useCallback(
    async (accessId: string[]) => {
      try {
        await showSendMessageDialog({});
      } catch {
        return;
      }
    },
    [petitionId]
  );

  const confirmSendReminder = useConfirmSendReminderDialog();
  const [sendReminders] = usePetitionActivity_sendRemindersMutation();
  const handleSendReminders = useCallback(
    async (accessIds: string[]) => {
      try {
        await confirmSendReminder({});
      } catch {
        return;
      }
      await sendReminders({
        variables: { petitionId, accessIds: accessIds },
      });
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
    },
    [petitionId]
  );

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
    [petitionId, refetch]
  );

  // process events
  const events = useMemo(() => {
    const original = petition!.events.items;
    const result: typeof original = [];
    let last: UnwrapArray<typeof original> | null = null;
    for (const event of original) {
      switch (event.__typename) {
        case "AccessOpenedEvent": {
          // Omit too consecutive open events
          if (last && last.__typename === "AccessOpenedEvent") {
            const difference = differenceInMinutes(
              new Date(event.createdAt),
              new Date(last.createdAt)
            );
            if (difference <= 5) {
              continue;
            }
          }
        }
      }
      result.push(event);
      last = event;
    }
    return result;
  }, [petition!.events.items]);

  return (
    <>
      <Title>
        {petition!.name ||
          intl.formatMessage({
            id: "generic.untitled-petition",
            defaultMessage: "Untitled petition",
          })}
      </Title>
      <PetitionLayout
        user={me}
        petition={petition!}
        onUpdatePetition={handleOnUpdatePetition}
        section="activity"
        scrollBody
        state={state}
      >
        <Flex>
          <Box flex="2">
            <PetitionAccessesTable
              id="petition-accesses"
              margin={4}
              petition={petition!}
              onSendMessage={handleSendMessage}
              onSendReminders={handleSendReminders}
              onActivateAccess={() => {}}
              onDeactivateAccess={() => {}}
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
          <Spacer display={{ base: "none", md: "block" }} />
        </Flex>
      </PetitionLayout>
    </>
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
    mutation PetitionActivity_sendReminders(
      $petitionId: ID!
      $accessIds: [ID!]!
    ) {
      sendReminders(petitionId: $petitionId, accessIds: $accessIds)
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
];

PetitionActivity.getInitialProps = async ({
  apollo,
  query,
}: WithDataContext) => {
  await Promise.all([
    apollo.query<PetitionActivityQuery, PetitionActivityQueryVariables>({
      query: gql`
        query PetitionActivity($id: ID!) {
          petition(id: $id) {
            ...PetitionActivity_Petition
          }
        }
        ${PetitionActivity.fragments.Petition}
      `,
      variables: { id: query.petitionId as string },
    }),
    apollo.query<PetitionActivityUserQuery>({
      query: gql`
        query PetitionActivityUser {
          me {
            ...PetitionActivity_User
          }
        }
        ${PetitionActivity.fragments.User}
      `,
    }),
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
            id="tour.petition-activity.monitor-requests"
            defaultMessage="Monitor your requests"
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
              styleType="disc"
              stylePos="outside"
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
                  defaultMessage="Send a <b>follow-up</b> message to a recipients."
                  values={{
                    b: (chunks: any[]) => <Text as="strong">{chunks}</Text>,
                  }}
                />
              </ListItem>
              <ListItem>
                <FormattedMessage
                  id="tour.petition-activity.next-reminder"
                  defaultMessage="See when will the <b>next reminder</b> be sent."
                  values={{
                    b: (chunks: any[]) => <Text as="strong">{chunks}</Text>,
                  }}
                />
              </ListItem>
              <ListItem>
                <FormattedMessage
                  id="tour.petition-activity.send-manual-reminder"
                  defaultMessage="<b>Send reminders</b> manually to the recipients."
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
    ],
  }),
  withData
)(PetitionActivity);
