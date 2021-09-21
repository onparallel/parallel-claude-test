import { Heading, Text } from "@chakra-ui/react";
import { PublicContainer } from "@parallel/components/public/layout/PublicContainer";
import { PublicLayout } from "@parallel/components/public/layout/PublicLayout";
import { PublicDemoCta } from "@parallel/components/public/PublicDemoCta";
import { PublicShowcase } from "@parallel/components/public/PublicShowcase";
import { PublicVideoShowcase } from "@parallel/components/public/PublicVideoShowcase";
import { useRouter } from "next/router";
import { FormattedMessage, useIntl } from "react-intl";

export default function Request() {
  const { locale } = useRouter();
  const intl = useIntl();
  return (
    <PublicLayout
      title={intl.formatMessage({
        id: "public.product.request",
        defaultMessage: "Simple and professional information request",
      })}
      description={intl.formatMessage({
        id: "public.product.request-information.meta-description",
        defaultMessage: "Request professionally and efficiently documents and information.",
      })}
    >
      <PublicContainer textAlign="center" wrapper={{ paddingY: 16 }}>
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
              src: `${process.env.NEXT_PUBLIC_ASSETS_URL}/static/videos/request-information-${locale}.mp4`,
            },
          ]}
          videoSize="300px"
        >
          <Heading as="h3" size="lg" color="gray.800" marginBottom={4}>
            <FormattedMessage
              id="public.product.request-information.list"
              defaultMessage="List the information quickly"
            />
          </Heading>
          <Text marginBottom={2}>
            <FormattedMessage
              id="public.product.request-information.create"
              defaultMessage="It’s very simple, you can use different types of fields to prepare the list of information that you need."
            />
          </Text>
        </PublicVideoShowcase>
      </PublicContainer>
      <PublicContainer paddingY={8} maxWidth="container.lg" wrapper={{ paddingY: 16 }}>
        <PublicShowcase
          imageUrl={`${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/product/request-information/parallel_template_${locale}.png`}
          imageSize="300px"
          isReversed
        >
          <Heading as="h3" size="lg" color="gray.800" marginBottom={4}>
            <FormattedMessage
              id="public.product.request-information.templates"
              defaultMessage="Use templates to save time"
            />
          </Heading>
          <Text marginBottom={2}>
            <FormattedMessage
              id="public.product.request-information.create-templates"
              defaultMessage="You can create your own templates with your daily processes and use them as many times as you need or use one of our templates organized by sector."
            />
          </Text>
        </PublicShowcase>
      </PublicContainer>
      <PublicContainer paddingY={8} maxWidth="container.lg" wrapper={{ paddingY: 16 }}>
        <PublicShowcase
          imageUrl={`${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/product/request-information/parallel_conditions_${locale}.png`}
          imageSize="300px"
        >
          <Heading as="h3" size="lg" color="gray.800" marginBottom={4}>
            <FormattedMessage
              id="public.product.request-information.smart-forms"
              defaultMessage="Create smart forms"
            />
          </Heading>
          <Text marginBottom={2}>
            <FormattedMessage
              id="public.product.request-information.decisions-processes"
              defaultMessage="Through conditions, you can easily set up decisions in your processes to ensure that your recipient only respond to what is needed."
            />
          </Text>
        </PublicShowcase>
      </PublicContainer>
      <PublicContainer paddingY={8} maxWidth="container.lg" wrapper={{ paddingY: 16 }}>
        <PublicShowcase
          isReversed
          imageUrl={`${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/product/request-information/parallel-branding.png`}
          imageSize="300px"
        >
          <Heading as="h3" size="lg" color="gray.800" marginBottom={4}>
            <FormattedMessage
              id="public.product.request-information.customize"
              defaultMessage="A portal with your branding"
            />
          </Heading>
          <Text marginBottom={2}>
            <FormattedMessage
              id="public.product.request-information.include-branding"
              defaultMessage="We create a secure portal with your corporate branding where your clients will be able to upload the information."
            />{" "}
            <br />{" "}
          </Text>
          <Text marginBottom={2}>
            <FormattedMessage
              id="public.product.request-information.include-branding2"
              defaultMessage="In addition, you can include your brand in your communications and forms and show your clients your professionalism."
            />{" "}
          </Text>
        </PublicShowcase>
      </PublicContainer>
      <PublicDemoCta>
        <FormattedMessage
          id="public.request-information.cta-title"
          defaultMessage="Start streamlining your petitions for information"
        />
      </PublicDemoCta>
    </PublicLayout>
  );
}
