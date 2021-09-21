import { Button, Flex, Heading, Stack, Text } from "@chakra-ui/react";
import { PublicContainer } from "@parallel/components/public/layout/PublicContainer";
import { PublicLayout } from "@parallel/components/public/layout/PublicLayout";
import { PublicShowcase } from "@parallel/components/public/PublicShowcase";
import { FormattedMessage, useIntl } from "react-intl";

export default function Career() {
  const intl = useIntl();
  return (
    <PublicLayout
      title={intl.formatMessage({
        id: "public.careers.title",
        defaultMessage: "Careers",
      })}
      description={intl.formatMessage({
        id: "public.careers.meta-description",
        defaultMessage:
          "Join our team at Parallel on our mission to give professionals their time back",
      })}
    >
      <PublicContainer textAlign="center" wrapper={{ paddingY: 16, backgroundColor: "gray.50" }}>
        <Heading as="h1" size="xl" color="purple.600">
          <FormattedMessage
            id="public.careers.hero-title"
            defaultMessage="Join us in our mission to give professionals their time back"
          />
        </Heading>
      </PublicContainer>
      <PublicContainer
        paddingY={16}
        wrapper={{
          textAlign: "center",
        }}
      >
        <Heading as="h2" size="lg">
          <FormattedMessage
            id="public.careers.join-us"
            defaultMessage="Would you like to join our team?"
          />
        </Heading>
      </PublicContainer>
      <PublicContainer paddingBottom={16} maxWidth="container.md">
        <PublicShowcase
          imageUrl={`${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/undraw_team.svg`}
        >
          <Stack spacing={8}>
            <Text>
              <FormattedMessage
                id="public.careers.disrupt"
                defaultMessage="We are disrupting the way people exchange and work with documents or other information."
              />
            </Text>
            <Text>
              <FormattedMessage
                id="public.careers.we-want"
                defaultMessage="We want to make life easier for our users so they have more time for the important things."
              />
            </Text>
            <Flex>
              <Button
                as="a"
                colorScheme="purple"
                target="_blank"
                rel="noopener noreferrer"
                href="https://forms.office.com/Pages/ResponsePage.aspx?id=EZYeioEzRUSW-C7eU9f048XajsMdglZKnEBUYUgWpBhURTdWUk03R0xQQk0wQUw5RVk4MDlQRzc4WC4u"
              >
                <FormattedMessage id="public.careers.apply-here" defaultMessage="Apply here" />
              </Button>
            </Flex>
          </Stack>
        </PublicShowcase>
      </PublicContainer>
      <PublicContainer
        paddingY={16}
        wrapper={{
          textAlign: "center",
        }}
      >
        <Heading as="h2" size="lg">
          <FormattedMessage
            id="public.careers.internship"
            defaultMessage="Are you looking for an internship?"
          />
        </Heading>
      </PublicContainer>
      <PublicContainer paddingBottom={16} maxWidth="container.md">
        <PublicShowcase
          isReversed
          imageUrl={`${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/undraw_whiteboard.svg`}
        >
          <Stack spacing={8}>
            <Text>
              <FormattedMessage
                id="public.careers.finish-studies"
                defaultMessage="Have you finished or are you finishing your studies?"
              />
            </Text>
            <Text>
              <FormattedMessage
                id="public.careers.practice"
                defaultMessage="Are you looking for a place to put into practice the knowledge you have acquired or learn even more?"
              />
            </Text>
            <Flex>
              <Button
                as="a"
                colorScheme="purple"
                target="_blank"
                rel="noopener noreferrer"
                href="https://forms.office.com/Pages/ResponsePage.aspx?id=EZYeioEzRUSW-C7eU9f048XajsMdglZKnEBUYUgWpBhUMFhaRjZEN083U1k1OVJNUllOR1ZOU1hRQi4u"
              >
                <FormattedMessage id="public.careers.apply-here" defaultMessage="Apply here" />
              </Button>
            </Flex>
          </Stack>
        </PublicShowcase>
      </PublicContainer>
    </PublicLayout>
  );
}
