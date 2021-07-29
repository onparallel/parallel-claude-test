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
import { NakedLink } from "@parallel/components/common/Link";
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
import Head from "next/head";
import { FormEvent, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";

type OptOutProps = UnwrapPromise<ReturnType<typeof OptOut.getInitialProps>>;

function OptOut({ keycode, access }: OptOutProps) {
  const intl = useIntl();

  const granter = access!.granter!;

  const [optedOut, setOptedOut] = useState(false);
  const [reason, setReason] = useState("");
  const [other, setother] = useState("");

  const answers = useReminderOptOutReasons();

  const [optOut] = useOptOut_publicOptOutRemindersMutation();

  const handleOptOut = async (event: FormEvent) => {
    event.preventDefault();
    await optOut({ variables: { keycode, reason, other } });
    setOptedOut(true);
  };

  return (
    <>
      <Head>
        <title>
          {"Parallel | "}
          {intl.formatMessage({
            id: "public.opt-out.title",
            defaultMessage: "Opt out from reminders",
          })}
        </title>
      </Head>
      <Grid
        gridTemplateRows="auto 1fr auto"
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
                  defaultMessage="We have informed the sender and you will not receive reminders anymore from this request."
                />
              </Text>
            </Stack>
          ) : (
            <form onSubmit={handleOptOut}>
              <Stack spacing={6} maxWidth={"container.sm"}>
                <Heading>
                  <FormattedMessage
                    id="public.opt-out.feedback-title"
                    defaultMessage="Please, let us know why you want to stop receiving reminders? *"
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
                        onChange={(event) => setother(event.target.value)}
                        value={other}
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
        <Flex justifyContent="center" backgroundColor="gray.100" width="100%">
          <Stack
            direction={{ base: "column", md: "row" }}
            alignItems="center"
            spacing={{ base: 4, md: 6 }}
            padding={4}
          >
            <Text as="div">
              <FormattedMessage
                id="public.opt-out.review-before-opt-out"
                defaultMessage="Before opting out from receiving reminders, check the requested information."
              />
            </Text>
            <NakedLink href={`/petition/${keycode}`}>
              <Button variant="outline" as="a" backgroundColor="white">
                <FormattedMessage
                  id="public.opt-out.review-button"
                  defaultMessage="Review the information"
                />
              </Button>
            </NakedLink>
          </Stack>
        </Flex>
      </Grid>
    </>
  );
}

OptOut.mutations = [
  gql`
    mutation OptOut_publicOptOutReminders(
      $keycode: ID!
      $reason: String!
      $other: String!
    ) {
      publicOptOutReminders(keycode: $keycode, reason: $reason, other: $other) {
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
