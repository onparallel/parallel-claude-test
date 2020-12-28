import { Heading, Text } from "@chakra-ui/react";
import { PublicContainer } from "@parallel/components/public/layout/PublicContainer";
import { PublicLayout } from "@parallel/components/public/layout/PublicLayout";
import { PublicShowcase } from "@parallel/components/public/PublicShowcase";
import languages from "@parallel/lang/languages.json";
import { useRouter } from "next/router";
import { FormattedMessage, useIntl } from "react-intl";

function Review() {
  const { query } = useRouter();
  const intl = useIntl();
  return (
    <PublicLayout
      title={intl.formatMessage({
        id: "public.product.review.title",
        defaultMessage: "Get control and order with Parallel",
      })}
      description={intl.formatMessage({
        id: "public.product.review.meta-description",
        defaultMessage:
          "Parallel simplifies the information review process while giving you control and order over your document workflows.",
      })}
    >
      <PublicContainer
        textAlign="center"
        wrapper={{ paddingY: 16, backgroundColor: "gray.50" }}
      >
        <Heading as="h1" size="xl" fontWeight="bold" color="purple.600">
          <FormattedMessage
            id="public.product.review.hero-title"
            defaultMessage="Control the information received effortlessly and with an order never seen before"
          />
        </Heading>
        <Text marginTop={8} fontSize="lg">
          <FormattedMessage
            id="public.product.review.simplify"
            defaultMessage="Simplify the review processes in your workflows and prepare the files in a few steps."
          />
        </Text>
      </PublicContainer>
      <PublicContainer paddingY={8} maxWidth="container.lg">
        <PublicShowcase
          imageUrl={`${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/parallel-review-${query.locale}.svg`}
          imageSize="350px"
          maxWidth="container.lg"
        >
          <Heading as="h3" size="lg" color="purple.500" marginBottom={4}>
            <FormattedMessage
              id="public.product.review.approve"
              defaultMessage="Approve or reject the documents or the answers"
            />
          </Heading>
          <Text marginBottom={2}>
            <FormattedMessage
              id="public.product.review.obtain-control"
              defaultMessage="Obtain control over what you have already reviewed to avoid double work, and keep your client informed after checking the information."
            />
          </Text>
        </PublicShowcase>
      </PublicContainer>
      <PublicContainer
        paddingY={8}
        maxWidth="container.lg"
        wrapper={{ paddingY: 16, backgroundColor: "purple.50" }}
      >
        <PublicShowcase
          imageUrl={`${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/parallel-export-${query.locale}.svg`}
          imageSize="350px"
          maxWidth="container.lg"
          isReversed
        >
          <Heading as="h3" size="lg" color="purple.500" marginBottom={4}>
            <FormattedMessage
              id="public.product.review.rename"
              defaultMessage="Forget about renaming files one by one manually"
            />
          </Heading>
          <Text marginBottom={2}>
            <FormattedMessage
              id="public.product.review.organize-rename"
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
          imageUrl={`${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/parallel-activity-${query.locale}.svg`}
          imageSize="350px"
          maxWidth="container.lg"
        >
          <Heading as="h3" size="lg" color="purple.500" marginBottom={4}>
            <FormattedMessage
              id="public.product.review.activity-log"
              defaultMessage="Control better the timings with an activity log"
            />
          </Heading>
          <Text marginBottom={2}>
            <FormattedMessage
              id="public.product.review.improve-services"
              defaultMessage="Control when things were delivered or done to improve the rendering of your services."
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

export default Review;
