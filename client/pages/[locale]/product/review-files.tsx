import { Heading, Text } from "@chakra-ui/react";
import { PublicContainer } from "@parallel/components/public/layout/PublicContainer";
import { PublicLayout } from "@parallel/components/public/layout/PublicLayout";
import { PublicDemoCta } from "@parallel/components/public/PublicDemoCta";
import { PublicShowcase } from "@parallel/components/public/PublicShowcase";
import { PublicVideoShowcase } from "@parallel/components/public/PublicVideoShowcase";
import languages from "@parallel/lang/languages.json";
import { useRouter } from "next/router";
import { FormattedMessage, useIntl } from "react-intl";

function Review() {
  const { query } = useRouter();
  const intl = useIntl();
  return (
    <PublicLayout
      title={intl.formatMessage({
        id: "public.product.review-files.title",
        defaultMessage: "Get control and order with Parallel",
      })}
      description={intl.formatMessage({
        id: "public.product.review-files.meta-description",
        defaultMessage:
          "Parallel simplifies the information review process while giving you control and order over your document workflows.",
      })}
    >
      <PublicContainer textAlign="center" wrapper={{ paddingY: 16 }}>
        <Heading as="h1" size="2xl" fontFamily="hero">
          <FormattedMessage
            id="public.product.review-files.hero-title"
            defaultMessage="Control the information received effortlessly and with an order never seen before"
          />
        </Heading>
        <Text marginTop={8} fontSize="lg">
          <FormattedMessage
            id="public.product.review-files.simplify"
            defaultMessage="Simplify the review processes in your workflows and prepare the files in a few steps."
          />
        </Text>
      </PublicContainer>
      <PublicContainer paddingY={8} maxWidth="container.lg" marginBottom={16}>
        <PublicVideoShowcase
          videoSources={[
            {
              type: "video/mp4",
              src: `${process.env.NEXT_PUBLIC_ASSETS_URL}/static/videos/review-files-${query.locale}.mp4`,
            },
          ]}
          videoSize="300px"
        >
          <Heading as="h3" size="lg" color="gray.800" marginBottom={4}>
            <FormattedMessage
              id="public.product.review-files.approve"
              defaultMessage="Approve or reject the documents or the answers"
            />
          </Heading>
          <Text marginBottom={2}>
            <FormattedMessage
              id="public.product.review-files.obtain-control"
              defaultMessage="Obtain control over what you have already reviewed to avoid double work, and keep your client informed after checking the information."
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
          imageUrl={`${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/product/review-files/parallel-export-${query.locale}.svg`}
          imageSize="350px"
          isReversed
        >
          <Heading as="h3" size="lg" color="gray.800" marginBottom={4}>
            <FormattedMessage
              id="public.product.review-files.rename"
              defaultMessage="Forget about renaming files one by one manually"
            />
          </Heading>
          <Text marginBottom={2}>
            <FormattedMessage
              id="public.product.review-files.organize-rename"
              defaultMessage="Get all your documents organized and choose how you need to rename them in bulk so that you can store or work with them efficiently."
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
          imageUrl={`${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/product/review-files/parallel-activity-${query.locale}.svg`}
          imageSize="350px"
        >
          <Heading as="h3" size="lg" color="gray.800" marginBottom={4}>
            <FormattedMessage
              id="public.product.review-files.activity-log"
              defaultMessage="Control better the timings with an activity log"
            />
          </Heading>
          <Text marginBottom={2}>
            <FormattedMessage
              id="public.product.review-files.improve-services"
              defaultMessage="See when things were delivered or done to improve the rendering of your services."
            />
          </Text>
        </PublicShowcase>
      </PublicContainer>
      <PublicDemoCta>
        <FormattedMessage
          id="public.review-files.cta-title"
          defaultMessage="Do you want to see how it works? Try it now!"
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

export default Review;
