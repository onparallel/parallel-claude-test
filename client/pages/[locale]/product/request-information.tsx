import { Heading, Text } from "@chakra-ui/react";
import { PublicContainer } from "@parallel/components/public/layout/PublicContainer";
import { PublicLayout } from "@parallel/components/public/layout/PublicLayout";
import { PublicShowcase } from "@parallel/components/public/PublicShowcase";
import { PublicVideoShowcase } from "@parallel/components/public/PublicVideoShowcase";
import languages from "@parallel/lang/languages.json";
import { useRouter } from "next/router";
import { FormattedMessage, useIntl } from "react-intl";

function Request() {
  const { query } = useRouter();
  const intl = useIntl();
  return (
    <PublicLayout
      title={intl.formatMessage({
        id: "public.product.request",
        defaultMessage: "Simple and professional information request",
      })}
      description={intl.formatMessage({
        id: "public.product.request-information.meta-description",
        defaultMessage:
          "Request professionally and efficiently documents and information.",
      })}
    >
      <PublicContainer
        textAlign="center"
        wrapper={{ paddingY: 16, backgroundColor: "gray.50" }}
      >
        <Heading as="h1" size="2xl" fontFamily="hero">
          <FormattedMessage
            id="public.product.request-information.hero-title"
            defaultMessage="Make your information requests efficient and professional"
          />
        </Heading>
        <Text marginTop={8} fontSize="lg">
          <FormattedMessage
            id="public.product.request-information.we-help-you"
            defaultMessage="We help you manage efficiently the documents you need."
          />
        </Text>
      </PublicContainer>
      <PublicContainer paddingY={8} maxWidth="container.lg">
        <PublicVideoShowcase
          videoSources={[
            {
              type: "video/mp4",
              src: `${process.env.NEXT_PUBLIC_ASSETS_URL}/static/videos/request-information-${query.locale}.mp4`,
            },
          ]}
          videoSize="350px"
        >
          <Heading as="h3" size="lg" color="purple.500" marginBottom={4}>
            <FormattedMessage
              id="public.product.request-information.list"
              defaultMessage="List the information quickly"
            />
          </Heading>
          <Text marginBottom={2}>
            <FormattedMessage
              id="public.product.request-information.create"
              defaultMessage="From scratch or a template, you can prepare a list of information for your clients or third parties."
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
          imageUrl={`${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/parallel-template-${query.locale}.svg`}
          imageSize="350px"
          isReversed
        >
          <Heading as="h3" size="lg" color="purple.500" marginBottom={4}>
            <FormattedMessage
              id="public.product.request-information.templates"
              defaultMessage="Use templates to save time"
            />
          </Heading>
          <Text marginBottom={2}>
            <FormattedMessage
              id="public.product.request-information.create-templates"
              defaultMessage="Create templates for your daily processes and use them as many times as you need."
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
          imageUrl={`${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/parallel-branding.svg`}
          imageSize="350px"
        >
          <Heading as="h3" size="lg" color="purple.500" marginBottom={4}>
            <FormattedMessage
              id="public.product.request-information.customize"
              defaultMessage="Customize with your branding"
            />
          </Heading>
          <Text marginBottom={2}>
            <FormattedMessage
              id="public.product.request-information.include-branding"
              defaultMessage="Include in your communications and forms your corporate branding and show your clients your professionalism."
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

export default Request;
