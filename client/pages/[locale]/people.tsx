import {
  Box,
  BoxProps,
  Button,
  Flex,
  Heading,
  Image,
  List,
  ListIcon,
  ListItem,
  Text,
  useTheme,
} from "@chakra-ui/core";
import { CheckIcon } from "@parallel/chakra/icons";
import { NakedLink } from "@parallel/components/common/Link";
import { PublicContainer } from "@parallel/components/public/layout/PublicContainer";
import { PublicLayout } from "@parallel/components/public/layout/PublicLayout";
import languages from "@parallel/lang/languages.json";
import { ReactNode } from "react";
import { FormattedMessage, useIntl } from "react-intl";

function People() {
  const intl = useIntl();
  return (
    <PublicLayout
      title={intl.formatMessage({
        id: "public.people.title",
        defaultMessage: "For whom",
      })}
    >
      <PublicContainer
        textAlign="center"
        wrapper={{ paddingY: 16, backgroundColor: "gray.50" }}
      >
        <Heading as="h1" fontSize="3xl" fontWeight="bold" color="purple.600">
          <FormattedMessage
            id="public.people.hero-title"
            defaultMessage="Laura now has more time to focus on the important work"
          />
        </Heading>
        <Text marginTop={8} fontSize="lg">
          <FormattedMessage
            id="public.people.routine-change"
            defaultMessage="Let us tell you how her routine has changed since she discovered Parallel."
          />
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
              />
            </Heading>
          </OneColumnTimeline>
          <TwoColumnsTimeline
            left={
              <Flex direction="column">
                <Text>
                  <FormattedMessage
                    id="public.case.laura.time-spent"
                    defaultMessage="Laura spends <a>more than an hour everyday</a> requesting information and reviewing emails to make sure she has all the documents she needs to start her work."
                    values={{
                      a: (chunks: any[]) => (
                        <Text as="em" fontStyle="normal" color="purple.500">
                          {chunks}
                        </Text>
                      ),
                    }}
                  />
                </Text>
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
          />
          <TwoColumnsTimeline
            right={
              <Text>
                <FormattedMessage
                  id="public.case.laura.non-billable"
                  defaultMessage="All these tasks add up to more than <a>20 hours a month</a> that Laura cannot bill to her clients."
                  values={{
                    a: (chunks: any[]) => (
                      <Text as="em" fontStyle="normal" color="purple.500">
                        {chunks}
                      </Text>
                    ),
                  }}
                />
              </Text>
            }
          />
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
              />
            </Heading>
          </OneColumnTimeline>
          <Separator flex="1" minHeight="40px" />
          <OneColumnTimeline>
            <Text>
              <FormattedMessage
                id="public.case.laura.recently-discovered"
                defaultMessage="Laura has recently discovered Parallel and is <a>regaining almost an hour a day</a>."
                values={{
                  a: (chunks: any[]) => (
                    <Text as="em" fontStyle="normal" color="purple.500">
                      {chunks}
                    </Text>
                  ),
                }}
              />
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
                  defaultMessage="In just one month, Laura has managed to increase her billable hours and an <a>additional net income of € 1,500 per month</a>."
                  values={{
                    a: (chunks: any[]) => (
                      <Text as="em" fontStyle="normal" color="purple.500">
                        {chunks}
                      </Text>
                    ),
                  }}
                />
              </Text>
            }
          />
          <OneColumnTimeline>
            <Text>
              <FormattedMessage
                id="public.case.laura.now-has"
                defaultMessage="Laura now has:"
              />
            </Text>
          </OneColumnTimeline>
          <Separator flex="1" minHeight="20px" />
        </Flex>
        <Box textAlign="left" maxWidth="520px" margin="auto" marginTop={4}>
          <List stylePos="outside" spacing={4}>
            <ListItem display="flex">
              <ListIcon
                as={CheckIcon}
                color="purple.500"
                marginTop={1}
                marginRight={2}
              />
              <FormattedMessage
                id="public.case.laura.centralized-information"
                defaultMessage="All the information always available in a single place on the cloud."
              />
            </ListItem>
            <ListItem display="flex">
              <ListIcon
                as={CheckIcon}
                color="purple.500"
                marginTop={1}
                marginRight={2}
              />
              <FormattedMessage
                id="public.case.laura.reminders"
                defaultMessage="The peace of mind about not having to chase clients, because Parallel does it for her."
              />
            </ListItem>
            <ListItem display="flex">
              <ListIcon
                as={CheckIcon}
                color="purple.500"
                marginTop={1}
                marginRight={2}
              />
              <FormattedMessage
                id="public.case.laura.client-anywhere"
                defaultMessage="The convenience for her clients, who now can upload their files at any time and from any device."
              />
            </ListItem>
          </List>
        </Box>
        <Box textAlign="center" paddingY={20}>
          <Text>
            <FormattedMessage
              id="public.case.laura.register"
              defaultMessage="If you want to start using Parallel for free, register here."
            />
          </Text>
          <NakedLink href="/invite">
            <Button as="a" colorScheme="purple" marginTop={8}>
              <FormattedMessage
                id="public.invite-button"
                defaultMessage="Request an invite"
              />
            </Button>
          </NakedLink>
        </Box>
      </PublicContainer>
    </PublicLayout>
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
          border="2px solid"
          borderColor="white"
          background="white"
          src="/static/images/logo-lila.svg"
          role="presentation"
          width="36px"
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
