import { Heading, Text } from "@chakra-ui/react";
import { PublicContainer } from "@parallel/components/public/layout/PublicContainer";
import { PublicLayout } from "@parallel/components/public/layout/PublicLayout";
import { PublicDemoCta } from "@parallel/components/public/PublicDemoCta";
import { PublicShowcase } from "@parallel/components/public/PublicShowcase";
import { PublicVideoShowcase } from "@parallel/components/public/PublicVideoShowcase";
import { useRouter } from "next/router";
import { FormattedMessage, useIntl } from "react-intl";

export default function Collaborate() {
  const { locale } = useRouter();
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
      <PublicContainer textAlign="center" paddingY={16}>
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
      <PublicContainer paddingY={8} maxWidth="container.lg" marginBottom={16}>
        <PublicVideoShowcase
          videoSources={[
            {
              type: "video/mp4",
              src: `${process.env.NEXT_PUBLIC_ASSETS_URL}/static/videos/team-collaboration-${locale}.mp4`,
            },
          ]}
          videoSize="300px"
        >
          <Heading as="h3" size="lg" color="gray.800" marginBottom={4}>
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
      <PublicContainer paddingY={16} maxWidth="container.lg" wrapper={{ background: "purple.50" }}>
        <PublicShowcase
          imageUrl={`${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/product/team-collaboration/parallel-share-${locale}.png`}
          imageSize="350px"
          isReversed
        >
          <Heading as="h3" size="lg" color="gray.800" marginBottom={4}>
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
      <PublicContainer paddingY={8} maxWidth="container.lg" wrapper={{ paddingY: 16 }}>
        <PublicShowcase
          imageUrl={`${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/product/team-collaboration/parallel-internal-comments-${locale}.svg`}
          imageSize="350px"
        >
          <Heading as="h3" size="lg" color="gray.800" marginBottom={4}>
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
      <PublicDemoCta>
        <FormattedMessage
          id="public.team-collaboration.cta-title"
          defaultMessage="Do you want to see how it works? Try it now!"
        />
      </PublicDemoCta>
    </PublicLayout>
  );
}
