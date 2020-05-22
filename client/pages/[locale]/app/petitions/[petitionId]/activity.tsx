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
} from "@parallel/graphql/__types";
import { assertQuery } from "@parallel/utils/apollo";
import { compose } from "@parallel/utils/compose";
import {
  usePetitionState,
  useWrapPetitionUpdater,
} from "@parallel/utils/petitions";
import { UnwrapPromise } from "@parallel/utils/types";
import { gql } from "apollo-boost";
import { useCallback } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { useConfirmCancelScheduledMessageDialog } from "@parallel/components/petition-activity/ConfirmCancelScheduledMessageDialog";

type PetitionProps = UnwrapPromise<
  ReturnType<typeof PetitionActivity.getInitialProps>
>;

function PetitionActivity({ petitionId }: PetitionProps) {
  const intl = useIntl();
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

  const sendReminder = useSendReminder();

  const handleCancelScheduledMessage = useCancelScheduledMessage(refetch);

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
              onSendReminder={() => {}}
            />
            <Box margin={4}>
              <PetitionActivityTimeline
                id="petition-activity-timeline"
                userId={me.id}
                events={petition!.events.items}
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
];

function useSendReminder() {
  const intl = useIntl();
  const toast = useToast();
  const [sendReminders] = usePetitionActivity_sendRemindersMutation();
  return useCallback(async (petitionId: string, accessId: string) => {
    await sendReminders({
      variables: { petitionId, accessIds: [accessId] },
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
  }, []);
}

function useCancelScheduledMessage(refetch: () => void) {
  const confirm = useConfirmCancelScheduledMessageDialog();
  return useCallback(async (messageId: string) => {
    try {
      await confirm({});
    } catch {}
  }, []);
}

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
                  defaultMessage="Manually <b>send reminders</b> to your recipients."
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
