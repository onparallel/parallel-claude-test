import { gql } from "@apollo/client";
import { Avatar, Button, Center, Heading, Stack, Text } from "@chakra-ui/react";
import { CheckIcon } from "@parallel/chakra/icons";
import {
  withApolloData,
  WithApolloDataContext,
} from "@parallel/components/common/withApolloData";
import { useUnsubscribeView_publicCancelReminderMutation } from "@parallel/graphql/__types";
import { UnwrapPromise } from "@parallel/utils/types";
import { useState } from "react";
import { FormattedMessage } from "react-intl";

type UnsubscribeViewProps = UnwrapPromise<
  ReturnType<typeof UnsubscribeView.getInitialProps>
>;

function UnsubscribeView({ keycode }: UnsubscribeViewProps) {
  // const {
  //   data: { access },
  // } = assertQuery(usePublicPetitionQuery({ variables: { keycode } }));

  const [unsubscribed, setUnsubscribed] = useState(false);

  // const petition = access!.petition!;
  // const granter = access!.granter!;
  // const contact = access!.contact!;
  // const signers = petition!.signature?.signers ?? [];
  // const recipients = petition!.recipients;
  // const message = access!.message;

  const [unsubscribe] = useUnsubscribeView_publicCancelReminderMutation();

  const feedback = "some feedback";

  const handleUnsuscribe = async () => {
    await unsubscribe({ variables: { keycode, feedback } });
    setUnsubscribed(true);
  };

  return (
    <Center height="100vh" backgroundColor="gray.50">
      {unsubscribed ? (
        <Stack
          textAlign="center"
          justifyContent="center"
          alignItems="center"
          spacing={6}
          maxWidth={"container.xs"}
        >
          <Avatar
            boxSize="88px"
            background="green.500"
            icon={<CheckIcon color="white" fontSize="2.5rem" />}
          />
          <Heading>
            <FormattedMessage
              id="public.unsubscribe.done-title"
              defaultMessage="Done!"
            />
          </Heading>
          <Text>
            <FormattedMessage
              id="public.unsubscribe.done-body"
              defaultMessage="We have informed the sender and you won’t receive more automatic reminders from this petition."
            />
          </Text>
        </Stack>
      ) : (
        <Button
          onClick={handleUnsuscribe}
          variant="outline"
          backgroundColor="white"
          fontWeight="500"
        >
          <FormattedMessage
            id="public.unsubscribe.unsubscribe-button"
            defaultMessage="Unsubscribe"
          />
        </Button>
      )}
    </Center>
  );
}

UnsubscribeView.mutations = [
  gql`
    mutation UnsubscribeView_publicCancelReminder(
      $keycode: ID!
      $feedback: String!
    ) {
      publicCancelReminder(keycode: $keycode, feedback: $feedback) {
        petition {
          id
        }
      }
    }
  `,
];

UnsubscribeView.getInitialProps = async ({ query }: WithApolloDataContext) => {
  const keycode = query.keycode as string;
  return { keycode };
};

export default withApolloData(UnsubscribeView);
