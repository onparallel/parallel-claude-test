import {
  Box,
  BoxProps,
  Flex,
  Heading,
  Image,
  List,
  ListIcon,
  ListItem,
  Text,
  useTheme,
} from "@chakra-ui/core";
import { NormalLink, Link } from "@parallel/components/common/Link";
import { Title } from "@parallel/components/common/Title";
import { PublicContainer } from "@parallel/components/public/layout/PublicContainer";
import { PublicLayout } from "@parallel/components/public/layout/PublicLayout";
import languages from "@parallel/lang/languages.json";
import { ReactNode } from "react";
import { FormattedMessage, useIntl } from "react-intl";

function People() {
  const intl = useIntl();
  return (
    <>
      <Title>
        {intl.formatMessage({
          id: "public.people.title",
          defaultMessage: "For whom",
        })}
      </Title>
      <PublicLayout>
        <PublicContainer
          textAlign="center"
          wrapper={{ paddingY: 16, backgroundColor: "gray.50" }}
        >
          <Heading as="h1" fontSize="3xl" fontWeight="bold" color="purple.600">
            <FormattedMessage
              id="public.people.hero-title"
              defaultMessage="Laura now has much more time available"
            ></FormattedMessage>
          </Heading>
          <Text marginTop={12} fontSize="lg">
            <FormattedMessage
              id="public.people.routine-change"
              defaultMessage="Let us tell you how his routine has changed since he discovered Parallel."
            ></FormattedMessage>
          </Text>
        </PublicContainer>
        <PublicContainer maxWidth="containers.md">
          <Flex display="column">
            <Separator minHeight="60px" />
            <OneColumnTimeline>
              <Heading
                as="h4"
                fontSize="3xl"
                fontWeight="light"
                color="purple.500"
              >
                <FormattedMessage
                  id="public.case.laura.without-parallel"
                  defaultMessage="Without Parallel"
                ></FormattedMessage>
              </Heading>
            </OneColumnTimeline>
            <TwoColumnsTimeline
              left={
                <Flex direction="column">
                  <Text>
                    <FormattedMessage
                      id="public.case.laura.time-spent"
                      defaultMessage="Laura spends <a>1 hour each day</a> reviewing the emails and the information attached to it to make sure she has all the information:"
                      values={{
                        a: (...chunks: any[]) => (
                          <Text as="em" fontStyle="normal" color="purple.500">
                            {chunks}
                          </Text>
                        ),
                      }}
                    ></FormattedMessage>
                  </Text>
                  <List
                    listStylePosition="inside"
                    listStyleType="-"
                    marginTop={2}
                    spacing={2}
                    textAlign="left"
                    alignSelf={{ base: "center", sm: "stretch" }}
                  >
                    <ListItem>
                      <FormattedMessage
                        id="public.case.laura.requests-information"
                        defaultMessage="Requests for information"
                      ></FormattedMessage>
                    </ListItem>
                    <ListItem>
                      <FormattedMessage
                        id="public.case.laura.reviews-emails"
                        defaultMessage="Reviews emails"
                      ></FormattedMessage>
                    </ListItem>
                  </List>
                </Flex>
              }
              right={
                <Image
                  margin="auto"
                  src="/static/images/undraw_working_remotely.svg"
                  width="250px"
                  role="presentation"
                />
              }
            ></TwoColumnsTimeline>
            <TwoColumnsTimeline
              right={
                <Text>
                  <FormattedMessage
                    id="public.case.laura.non-billable"
                    defaultMessage="All this tasks that she has to do involves <a>20 hours of work</a> that Laura cannot bill the client."
                    values={{
                      a: (chunks: any[]) => (
                        <Text as="em" fontStyle="normal" color="purple.500">
                          {chunks}
                        </Text>
                      ),
                    }}
                  ></FormattedMessage>
                </Text>
              }
            ></TwoColumnsTimeline>
            <OneColumnTimeline>
              <Heading
                as="h4"
                fontSize="3xl"
                fontWeight="light"
                color="purple.500"
              >
                <FormattedMessage
                  id="public.case.laura.with-parallel"
                  defaultMessage="With Parallel"
                ></FormattedMessage>
              </Heading>
            </OneColumnTimeline>
            <Separator flex="1" minHeight="40px" />
            <OneColumnTimeline>
              <Text>
                <FormattedMessage
                  id="public.case.laura.recently-discovered"
                  defaultMessage="Laura has recently discovered the Parallel platform and is <a>saving more than half an hour a day</a>."
                  values={{
                    a: (chunks: any[]) => (
                      <Text as="em" fontStyle="normal" color="purple.500">
                        {chunks}
                      </Text>
                    ),
                  }}
                ></FormattedMessage>
              </Text>
            </OneColumnTimeline>
            <TwoColumnsTimeline
              left={
                <Image
                  margin="auto"
                  src="/static/images/undraw_freelancer.svg"
                  width="250px"
                  role="presentation"
                />
              }
              right={
                <Text>
                  <FormattedMessage
                    id="public.case.laura.increased-billing"
                    defaultMessage="In just one month, Laura has managed to increase the hours billed and an <a>additional net income of € 1,500 per month</a>."
                    values={{
                      a: (chunks: any[]) => (
                        <Text as="em" fontStyle="normal" color="purple.500">
                          {chunks}
                        </Text>
                      ),
                    }}
                  ></FormattedMessage>
                </Text>
              }
            ></TwoColumnsTimeline>
            <OneColumnTimeline>
              <Text>
                <FormattedMessage
                  id="public.case.laura.now-has"
                  defaultMessage="Laura now has:"
                ></FormattedMessage>
              </Text>
            </OneColumnTimeline>
            <Separator flex="1" minHeight="20px" />
          </Flex>
          <Box textAlign="left" maxWidth="500px" margin="auto" marginTop={4}>
            <List stylePos="outside" spacing={4}>
              <ListItem display="flex">
                <ListIcon
                  icon="check"
                  color="purple.500"
                  marginTop={1}
                  marginRight={2}
                />
                <FormattedMessage
                  id="public.case.laura.centralized-information"
                  defaultMessage="All information centralized in a single space per case."
                ></FormattedMessage>
              </ListItem>
              <ListItem display="flex">
                <ListIcon
                  icon="check"
                  color="purple.500"
                  marginTop={1}
                  marginRight={2}
                />
                <FormattedMessage
                  id="public.case.laura.reminders"
                  defaultMessage="She forgets to send reminders, because Parallel does it for her."
                ></FormattedMessage>
              </ListItem>
              <ListItem display="flex">
                <ListIcon
                  icon="check"
                  color="purple.500"
                  marginTop={1}
                  marginRight={2}
                />
                <FormattedMessage
                  id="public.case.laura.cloud"
                  defaultMessage="Information always available in the cloud."
                ></FormattedMessage>
              </ListItem>
              <ListItem display="flex">
                <ListIcon
                  icon="check"
                  color="purple.500"
                  marginTop={1}
                  marginRight={2}
                />
                <FormattedMessage
                  id="public.case.laura.client-anywhere"
                  defaultMessage="The security of her clients, who can upload the files, either from the computer, mobile or tablet, without having to download any app."
                ></FormattedMessage>
              </ListItem>
            </List>
          </Box>
          <Text paddingY={20} textAlign="center">
            <FormattedMessage
              id="public.case.laura.register"
              defaultMessage="If you want to start using Parallel, <a>register for free here</a>."
              values={{
                a: (...chunks: any[]) => <Link href="/invite">{chunks}</Link>,
              }}
            ></FormattedMessage>
          </Text>
        </PublicContainer>
      </PublicLayout>
    </>
  );
}

function Separator({
  hasLogo,
  ...props
}: { hasLogo?: boolean } & Omit<BoxProps, "children">) {
  const { colors } = useTheme();
  return (
    <Flex
      justifyContent="center"
      alignItems="center"
      background={`linear-gradient(${colors.purple[600]}, ${colors.purple[600]}) no-repeat center/2px 100%`}
      {...props}
    >
      {hasLogo ? (
        <Image
          background="white"
          src="/static/images/logo-lila.svg"
          role="presentation"
          width="30px"
        />
      ) : null}
    </Flex>
  );
}

function OneColumnTimeline({ children }: { children?: ReactNode }) {
  return (
    <Box
      marginX="auto"
      textAlign="center"
      paddingY={4}
      maxWidth={{ base: "auto", sm: "300px" }}
    >
      {children}
    </Box>
  );
}

function TwoColumnsTimeline({
  left,
  right,
}: {
  left?: ReactNode;
  right?: ReactNode;
}) {
  return (
    <Flex direction={{ base: "column", sm: "row" }}>
      <Flex
        flex="1"
        alignItems="center"
        justifyContent="center"
        paddingY={left ? 4 : 0}
        textAlign={{ base: "center", sm: "left" }}
      >
        <Box>{left}</Box>
      </Flex>
      <Separator
        flex="1"
        hasLogo
        minHeight="60px"
        maxWidth={{ base: "auto", sm: "90px", md: "150px" }}
      />
      <Flex
        flex="1"
        alignItems="center"
        justifyContent="center"
        paddingY={right ? 4 : 0}
        textAlign={{ base: "center", sm: "left" }}
      >
        <Box>{right}</Box>
      </Flex>
    </Flex>
  );
}

export function getStaticProps() {
  return { props: {} };
}

export function getStaticPaths() {
  return {
    paths: languages.map(({ locale }) => ({ params: { locale } })),
    fallback: false,
  };
}

export default People;
