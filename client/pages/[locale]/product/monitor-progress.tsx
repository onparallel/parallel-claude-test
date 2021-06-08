import { Heading, Text } from "@chakra-ui/react";
import { PublicContainer } from "@parallel/components/public/layout/PublicContainer";
import { PublicLayout } from "@parallel/components/public/layout/PublicLayout";
import { PublicShowcase } from "@parallel/components/public/PublicShowcase";
import { PublicVideoShowcase } from "@parallel/components/public/PublicVideoShowcase";
import languages from "@parallel/lang/languages.json";
import { useRouter } from "next/router";
import { FormattedMessage, useIntl } from "react-intl";
import { PublicDemoCta } from "@parallel/components/public/PublicDemoCta";

function Follow() {
  const { query } = useRouter();
  const intl = useIntl();
  return (
    <PublicLayout
      title={intl.formatMessage({
        id: "public.product.follow",
        defaultMessage: "Follow-ups made easy",
      })}
      description={intl.formatMessage({
        id: "public.product.monitor-progress.meta-description",
        defaultMessage:
          "Parallel gives you a simple way to follow-up with your information requests so that you can focus on important tasks.",
      })}
    >
      <PublicContainer textAlign="center" wrapper={{ paddingY: 16 }}>
        <Heading as="h1" size="2xl" fontFamily="hero">
          <FormattedMessage
            id="public.product.monitor-progress.hero-title"
            defaultMessage="Following-up on your requests has never been so easy"
          />
        </Heading>
        <Text marginTop={8} fontSize="lg">
          <FormattedMessage
            id="public.product.monitor-progress.space"
            defaultMessage="Parallel gives you a space to have everything under control and to follow-up with your recipients in a simple way."
          />
        </Text>
      </PublicContainer>
      <PublicContainer paddingY={8} maxWidth="container.lg" marginBottom={16}>
        <PublicVideoShowcase
          videoSources={[
            {
              type: "video/mp4",
              src: `${process.env.NEXT_PUBLIC_ASSETS_URL}/static/videos/monitor-progress-${query.locale}.mp4`,
            },
          ]}
          videoSize="300px"
        >
          <Heading as="h3" size="lg" color="gray.800" marginBottom={4}>
            <FormattedMessage
              id="public.product.monitor-progress.control"
              defaultMessage="Control and follow your petitions in a simple and visual way"
            />
          </Heading>
          <Text marginBottom={2}>
            <FormattedMessage
              id="public.product.monitor-progress.interface"
              defaultMessage="Parallel's interface helps you keep all the information under control and organized. You will know the status of your processes at a glance."
            />
          </Text>
        </PublicVideoShowcase>
      </PublicContainer>
      <PublicContainer
        paddingY={8}
        maxWidth="container.lg"
        wrapper={{ paddingY: 16, backgroundColor: "purple.50" }}
      >
        <PublicShowcase
          imageUrl={`${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/parallel-reminder-${query.locale}.svg`}
          imageSize="350px"
          isReversed
        >
          <Heading as="h3" size="lg" color="gray.800" marginBottom={4}>
            <FormattedMessage
              id="public.product.monitor-progress.reminders"
              defaultMessage="Set up intelligent reminders"
            />
          </Heading>
          <Text marginBottom={2}>
            <FormattedMessage
              id="public.product.monitor-progress.missing"
              defaultMessage="Remind your recipients of the missing information and avoid checking, again and again, your checklists manually."
            />
          </Text>
        </PublicShowcase>
      </PublicContainer>
      <PublicContainer
        paddingY={8}
        maxWidth="container.lg"
        wrapper={{ paddingY: 16 }}
      >
        <PublicShowcase
          imageUrl={`${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/parallel-conversation-${query.locale}.svg`}
          imageSize="350px"
        >
          <Heading as="h3" size="lg" color="gray.800" marginBottom={4}>
            <FormattedMessage
              id="public.product.monitor-progress.stress"
              defaultMessage="Reduce the stress of the emails and simplify the conversation"
            />
          </Heading>
          <Text marginBottom={2}>
            <FormattedMessage
              id="public.product.monitor-progress.email-threads"
              defaultMessage="Avoid endless email threads that difficult the conversation around questions and answers."
            />
          </Text>
          <Text marginBottom={2}>
            <FormattedMessage
              id="public.product.monitor-progress.conversations"
              defaultMessage="Parallel centralizes and contextualizes all conversations around the information that you request."
            />
          </Text>
        </PublicShowcase>
      </PublicContainer>
      <PublicDemoCta>
        <FormattedMessage
          id="public.monitor-progress.cta-title"
          defaultMessage="All your requests in a single place"
        />
      </PublicDemoCta>
    </PublicLayout>
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

export default Follow;
