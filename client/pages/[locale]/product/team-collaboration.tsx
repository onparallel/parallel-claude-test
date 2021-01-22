import { Heading, Text } from "@chakra-ui/react";
import { PublicContainer } from "@parallel/components/public/layout/PublicContainer";
import { PublicLayout } from "@parallel/components/public/layout/PublicLayout";
import { PublicShowcase } from "@parallel/components/public/PublicShowcase";
import { PublicVideoShowcase } from "@parallel/components/public/PublicVideoShowcase";
import languages from "@parallel/lang/languages.json";
import { useRouter } from "next/router";
import { FormattedMessage, useIntl } from "react-intl";

function Collaborate() {
  const { query } = useRouter();
  const intl = useIntl();
  return (
    <PublicLayout
      title={intl.formatMessage({
        id: "public.product.team-collaboration.title",
        defaultMessage: "Collaboration around document workflows with Parallel",
      })}
      description={intl.formatMessage({
        id: "public.product.team-collaboration.meta-description",
        defaultMessage:
          "Parallel fosters and makes collaboration possible around document workflows and processes.",
      })}
    >
      <PublicContainer
        textAlign="center"
        wrapper={{ paddingY: 16, backgroundColor: "gray.50" }}
      >
        <Heading as="h1" size="2xl" fontFamily="hero">
          <FormattedMessage
            id="public.product.team-collaboration.hero-title"
            defaultMessage="A collaborative environment to scale your processes"
          />
        </Heading>
        <Text marginTop={8} fontSize="lg">
          <FormattedMessage
            id="public.product.team-collaboration.unify"
            defaultMessage="Unify communication with workflows and improve your team's productivity."
          />
        </Text>
      </PublicContainer>
      <PublicContainer paddingY={8} maxWidth="container.lg">
        <PublicVideoShowcase
          videoSources={[
            {
              type: "video/mp4",
              src: `${process.env.NEXT_PUBLIC_ASSETS_URL}/static/videos/team-collaboration-${query.locale}.mp4`,
            },
          ]}
          videoSize="350px"
        >
          <Heading as="h3" size="lg" color="purple.500" marginBottom={4}>
            <FormattedMessage
              id="public.product.team-collaboration.share"
              defaultMessage="Share templates to standardize workflows"
            />
          </Heading>
          <Text marginBottom={2}>
            <FormattedMessage
              id="public.product.team-collaboration.transform"
              defaultMessage="Transform repetitive and tedious processes into something simple and easy to manage."
            />
          </Text>
          <Text marginBottom={2}>
            <FormattedMessage
              id="public.product.team-collaboration.flexible"
              defaultMessage="With a flexible tool such as Parallel, you can adapt every case as needed before launching a process."
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
          imageUrl={`${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/parallel-share-${query.locale}.png`}
          imageSize="350px"
          isReversed
        >
          <Heading as="h3" size="lg" color="purple.500" marginBottom={4}>
            <FormattedMessage
              id="public.product.team-collaboration.team"
              defaultMessage="Include your team to the ongoing processes"
            />
          </Heading>
          <Text marginBottom={2}>
            <FormattedMessage
              id="public.product.team-collaboration.share-petition"
              defaultMessage="Share a petition with your team to work together on it at any time."
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
          imageUrl={`${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/parallel-internal-comments-${query.locale}.svg`}
          imageSize="350px"
        >
          <Heading as="h3" size="lg" color="purple.500" marginBottom={4}>
            <FormattedMessage
              id="public.product.team-collaboration.centralize"
              defaultMessage="Centralize the revision and internal communication"
            />
          </Heading>
          <Text marginBottom={2}>
            <FormattedMessage
              id="public.product.team-collaboration.client-communication"
              defaultMessage="Allow your team to stay up to date with the communications with your client."
            />
          </Text>
          <Text marginBottom={2}>
            <FormattedMessage
              id="public.product.team-collaboration.work-effectively"
              defaultMessage="Help them work more effectively, allowing them to review and sharing their thought around the information received."
            />
          </Text>
        </PublicShowcase>
      </PublicContainer>
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

export default Collaborate;
