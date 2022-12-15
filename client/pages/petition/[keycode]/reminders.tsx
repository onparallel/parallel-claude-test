import { gql, useMutation } from "@apollo/client";
import {
  Button,
  Center,
  Circle,
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
import { withApolloData } from "@parallel/components/common/withApolloData";
import { RecipientViewPageNotAvailableError } from "@parallel/components/recipient-view/RecipientViewPageNotAvailableError";
import {
  OptOut_accessDocument,
  OptOut_publicOptOutRemindersDocument,
  OptOut_PublicPetitionAccessFragment,
} from "@parallel/graphql/__types";
import { createApolloClient } from "@parallel/utils/apollo/client";
import { isApolloError } from "@parallel/utils/apollo/isApolloError";
import { useReminderOptOutReasons } from "@parallel/utils/useReminderOptOutReasons";
import { GetServerSidePropsContext } from "next";
import Head from "next/head";
import { useRouter } from "next/router";
import { FormEvent, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { isDefined } from "remeda";

type OptOutProps =
  | { keycode: string; access: OptOut_PublicPetitionAccessFragment }
  | { errorCode: "PUBLIC_PETITION_NOT_AVAILABLE" };

function OptOut(props: OptOutProps) {
  if ("errorCode" in props) {
    return <RecipientViewPageNotAvailableError />;
  }
  const intl = useIntl();

  const {
    query: { ref },
  } = useRouter();

  const { keycode, access } = props;
  const granter = access.granter!;

  const [optedOut, setOptedOut] = useState(false);
  const [reason, setReason] = useState("");
  const [other, setother] = useState("");

  const answers = useReminderOptOutReasons();

  const [optOut] = useMutation(OptOut_publicOptOutRemindersDocument);

  const handleOptOut = async (event: FormEvent) => {
    event.preventDefault();
    await optOut({ variables: { keycode, reason, other, referer: ref as string } });
    setOptedOut(true);
  };

  return (
    <>
      <Head>
        <title>
          {"Parallel | "}
          {intl.formatMessage({
            id: "public.opt-out.title",
            defaultMessage: "Opt out from emails",
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
              <Circle size="88px" background="green.500">
                <CheckIcon color="white" fontSize="2.5rem" />
              </Circle>
              <Heading>
                <FormattedMessage id="public.opt-out.done-title" defaultMessage="Done!" />
              </Heading>
              <Text>
                <FormattedMessage
                  id="public.opt-out.done-body"
                  defaultMessage="We have informed the sender and you will not receive any more reminders related with this process."
                />
              </Text>
            </Stack>
          ) : (
            <form onSubmit={handleOptOut}>
              <Stack spacing={6} maxWidth={"container.sm"}>
                <Heading>
                  <FormattedMessage
                    id="public.opt-out.feedback-title"
                    defaultMessage="Please let us know why you would like to stop receiving reminders related with this process."
                  />
                  {" *"}
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
                    <FormControl id="other-reason" paddingLeft={6} paddingTop={2} isRequired>
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
                  colorScheme="primary"
                  variant="solid"
                  type="submit"
                >
                  <FormattedMessage id="public.opt-out.opt-out-button" defaultMessage="Confirm" />
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
      $referer: String
    ) {
      publicOptOutReminders(keycode: $keycode, reason: $reason, other: $other, referer: $referer) {
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
          logoUrl
        }
      }
    `;
  },
};

OptOut.queries = [
  gql`
    query OptOut_access($keycode: ID!) {
      access(keycode: $keycode) {
        ...OptOut_PublicPetitionAccess
      }
    }
    ${OptOut.fragments.PublicPetitionAccess}
  `,
];

export async function getServerSideProps({
  params,
  req,
  locale,
}: GetServerSidePropsContext<{ keycode: string }>) {
  try {
    const client = createApolloClient({}, { req });
    const { data } = await client.query({
      query: OptOut_accessDocument,
      variables: { keycode: params!.keycode },
    });
    if (!isDefined(data?.access)) {
      throw new Error();
    }
    return { props: { keycode: params!.keycode, access: data.access } };
  } catch (error) {
    if (isApolloError(error, "PUBLIC_PETITION_NOT_AVAILABLE")) {
      return { props: { errorCode: "PUBLIC_PETITION_NOT_AVAILABLE" } };
    } else if (isApolloError(error, "CONTACT_NOT_VERIFIED")) {
      return {
        redirect: {
          destination: `/${locale}/petition/${params!.keycode}`,
          permanent: false,
        },
      };
    }
    throw error;
  }
}

export default withApolloData(OptOut);
