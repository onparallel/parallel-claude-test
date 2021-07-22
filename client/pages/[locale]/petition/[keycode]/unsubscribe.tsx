import { gql } from "@apollo/client";
import {
  Avatar,
  Button,
  Center,
  Flex,
  FormControl,
  FormErrorMessage,
  Grid,
  Heading,
  Img,
  Input,
  Radio,
  RadioGroup,
  Stack,
  Text,
} from "@chakra-ui/react";
import { CheckIcon } from "@parallel/chakra/icons";
import { Logo } from "@parallel/components/common/Logo";
import {
  withApolloData,
  WithApolloDataContext,
} from "@parallel/components/common/withApolloData";
import {
  UnsubscribePublicPetitionQuery,
  UnsubscribePublicPetitionQueryVariables,
  useUnsubscribeView_publicCancelReminderMutation,
} from "@parallel/graphql/__types";
import { UnwrapPromise } from "@parallel/utils/types";
import { useUnsubscribeAnswers } from "@parallel/utils/useUnsubscribeAnswers";
import { FormEvent, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";

type UnsubscribeViewProps = UnwrapPromise<
  ReturnType<typeof UnsubscribeView.getInitialProps>
>;

function UnsubscribeView({ keycode, access }: UnsubscribeViewProps) {
  const intl = useIntl();

  const granter = access!.granter!;

  const [unsubscribed, setUnsubscribed] = useState(false);
  const [reason, setReason] = useState("");
  const [otherReason, setOtherReason] = useState("");

  const answers = useUnsubscribeAnswers();

  const [unsubscribe] = useUnsubscribeView_publicCancelReminderMutation();

  const handleUnsuscribe = async (event: FormEvent) => {
    event.preventDefault();
    await unsubscribe({ variables: { keycode, reason, otherReason } });
    setUnsubscribed(true);
  };

  return (
    <Grid
      gridTemplateRows="auto 1fr"
      height="100vh"
      backgroundColor="gray.50"
      justifyItems="center"
    >
      <Flex
        maxWidth="container.lg"
        width="100%"
        paddingY={{ base: 2, md: 3 }}
        paddingX={2.5}
        justifyContent="left"
      >
        {granter.organization.logoUrl ? (
          <Img
            src={granter.organization.logoUrl}
            aria-label={granter.organization.name}
            width="auto"
            height="40px"
          />
        ) : (
          <Logo width="152px" height="40px" />
        )}
      </Flex>
      <Center padding={6}>
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
          <form onSubmit={handleUnsuscribe}>
            <Stack spacing={6} maxWidth={"container.sm"}>
              <Heading>
                <FormattedMessage
                  id="public.unsubscribe.feedback-title"
                  defaultMessage="Please, ¿can you indicate why you do not want to receive more automatic reminders? *"
                />
              </Heading>
              <RadioGroup name="unsubscribe-reason" onChange={setReason}>
                <Stack>
                  {Object.entries(answers).map(([key, value]) => {
                    return (
                      <Radio key={key} value={key} isRequired>
                        {value}
                      </Radio>
                    );
                  })}
                </Stack>
                {reason === "OTHER" ? (
                  <FormControl
                    id="other-reason"
                    paddingLeft={6}
                    paddingTop={2}
                    isRequired
                  >
                    <Input
                      type="text"
                      placeholder={intl.formatMessage({
                        id: "public.unsubscribe.other-placeholder",
                        defaultMessage: "Indicate other reasons",
                      })}
                      onChange={(event) => setOtherReason(event.target.value)}
                      value={otherReason}
                    />
                    <FormErrorMessage>
                      <FormattedMessage
                        id="public.unsubscribe.other-error-message"
                        defaultMessage="Please, enter a reason"
                      />
                    </FormErrorMessage>
                  </FormControl>
                ) : (
                  false
                )}
              </RadioGroup>
              <Button
                fontWeight="500"
                width="min-content"
                colorScheme="purple"
                variant="solid"
                type="submit"
              >
                <FormattedMessage
                  id="public.unsubscribe.send-reply-button"
                  defaultMessage="Send reply"
                />
              </Button>
            </Stack>
          </form>
        )}
      </Center>
    </Grid>
  );
}

UnsubscribeView.mutations = [
  gql`
    mutation UnsubscribeView_publicCancelReminder(
      $keycode: ID!
      $reason: String!
      $otherReason: String!
    ) {
      publicCancelReminder(
        keycode: $keycode
        reason: $reason
        otherReason: $otherReason
      ) {
        petition {
          id
        }
      }
    }
  `,
];

UnsubscribeView.fragments = {
  get PublicPetitionAccess() {
    return gql`
      fragment UnsubscribeView_PublicPetitionAccess on PublicPetitionAccess {
        granter {
          ...UnsubscribeView_PublicUser
        }
      }
      ${this.PublicUser}
    `;
  },
  get PublicUser() {
    return gql`
      fragment UnsubscribeView_PublicUser on PublicUser {
        id
        organization {
          name
          identifier
          logoUrl
        }
      }
    `;
  },
};

UnsubscribeView.getInitialProps = async ({
  query,
  fetchQuery,
}: WithApolloDataContext) => {
  const keycode = query.keycode as string;

  const result = await fetchQuery<
    UnsubscribePublicPetitionQuery,
    UnsubscribePublicPetitionQueryVariables
  >(
    gql`
      query UnsubscribePublicPetition($keycode: ID!) {
        access(keycode: $keycode) {
          ...UnsubscribeView_PublicPetitionAccess
        }
      }
      ${UnsubscribeView.fragments.PublicPetitionAccess}
    `,
    { variables: { keycode } }
  );
  if (!result.data?.access) {
    throw new Error();
  }

  const {
    data: { access },
  } = result;

  return { keycode, access };
};

export default withApolloData(UnsubscribeView);
