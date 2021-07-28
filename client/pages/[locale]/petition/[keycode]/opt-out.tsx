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
  PublicOptOutQuery,
  PublicOptOutQueryVariables,
  useOptOut_publicOptOutRemindersMutation,
} from "@parallel/graphql/__types";
import { UnwrapPromise } from "@parallel/utils/types";
import { useReminderOptOutReasons } from "@parallel/utils/useReminderOptOutReasons";
import { FormEvent, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";

type OptOutProps = UnwrapPromise<ReturnType<typeof OptOut.getInitialProps>>;

function OptOut({ keycode, access }: OptOutProps) {
  const intl = useIntl();

  const granter = access!.granter!;

  const [optedOut, setOptedOut] = useState(false);
  const [reason, setReason] = useState("");
  const [otherReason, setOtherReason] = useState("");

  const answers = useReminderOptOutReasons();

  const [optOut] = useOptOut_publicOptOutRemindersMutation();

  const handleOptOut = async (event: FormEvent) => {
    event.preventDefault();
    await optOut({ variables: { keycode, reason, otherReason } });
    setOptedOut(true);
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
        {optedOut ? (
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
                id="public.opt-out.done-title"
                defaultMessage="Done!"
              />
            </Heading>
            <Text>
              <FormattedMessage
                id="public.opt-out.done-body"
                defaultMessage="We have informed the sender and you won’t receive more reminders from this petition."
              />
            </Text>
          </Stack>
        ) : (
          <form onSubmit={handleOptOut}>
            <Stack spacing={6} maxWidth={"container.sm"}>
              <Heading>
                <FormattedMessage
                  id="public.opt-out.feedback-title"
                  defaultMessage="Please, would you let us know why you don't want to receive reminders? *"
                />
              </Heading>
              <RadioGroup name="opt-out-reason" onChange={setReason}>
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
                        id: "public.opt-out.other-placeholder",
                        defaultMessage: "Indicate other reasons",
                      })}
                      onChange={(event) => setOtherReason(event.target.value)}
                      value={otherReason}
                    />
                    <FormErrorMessage>
                      <FormattedMessage
                        id="public.opt-out.other-error-message"
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
                  id="public.opt-out.opt-out-button"
                  defaultMessage="Opt out"
                />
              </Button>
            </Stack>
          </form>
        )}
      </Center>
    </Grid>
  );
}

OptOut.mutations = [
  gql`
    mutation OptOut_publicOptOutReminders(
      $keycode: ID!
      $reason: String!
      $otherReason: String!
    ) {
      publicOptOutReminders(
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

OptOut.fragments = {
  get PublicPetitionAccess() {
    return gql`
      fragment OptOut_PublicPetitionAccess on PublicPetitionAccess {
        granter {
          ...OptOut_PublicUser
        }
      }
      ${this.PublicUser}
    `;
  },
  get PublicUser() {
    return gql`
      fragment OptOut_PublicUser on PublicUser {
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

OptOut.getInitialProps = async ({
  query,
  fetchQuery,
}: WithApolloDataContext) => {
  const keycode = query.keycode as string;

  const result = await fetchQuery<
    PublicOptOutQuery,
    PublicOptOutQueryVariables
  >(
    gql`
      query PublicOptOut($keycode: ID!) {
        access(keycode: $keycode) {
          ...OptOut_PublicPetitionAccess
        }
      }
      ${OptOut.fragments.PublicPetitionAccess}
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

export default withApolloData(OptOut);
