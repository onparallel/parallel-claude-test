import { Box, Stack, Heading, Image, Text } from "@chakra-ui/react";
import { Card } from "@parallel/components/common/Card";
import { Link } from "@parallel/components/common/Link";
import { PublicContainer } from "@parallel/components/public/layout/PublicContainer";
import { PublicLayout } from "@parallel/components/public/layout/PublicLayout";
import languages from "@parallel/lang/languages.json";
import { useHubspotForm } from "@parallel/utils/useHubspotForm";
import { useRouter } from "next/router";
import { FormattedMessage, useIntl } from "react-intl";
import ReactGA from "react-ga";

function Invite() {
  const intl = useIntl();
  const { query } = useRouter();
  useHubspotForm(
    query.locale
      ? {
          target: "#form-container",
          onFormSubmit: function () {
            ReactGA.event({
              action: "HS-invite-submit",
              category: "HS-form-submit",
              label: "new-invite",
            });
          },
          ...({
            es: {
              portalId: "6692004",
              formId: "73fd2c48-757b-41d3-929b-f25877bea367",
            },
            en: {
              portalId: "6692004",
              formId: "a7de80c6-c2a2-4ebd-9e98-864e6de48766",
            },
          } as any)[query.locale as string],
        }
      : null
  );
  return (
    <PublicLayout
      title={intl.formatMessage({
        id: "public.invite.title",
        defaultMessage: "Request an invite",
      })}
      description={intl.formatMessage({
        id: "public.invite.meta-description",
        defaultMessage: "Request an invite to start using Parallel",
      })}
    >
      <PublicContainer paddingY={{ base: 8, md: 16 }}>
        <Stack spacing={8} direction={{ base: "column", md: "row" }}>
          <Box flex="1" textAlign="left">
            <Heading as="h1" size="2xl">
              <FormattedMessage
                id="public.invite.request-invite"
                defaultMessage="Request your invite!"
              />
            </Heading>
            <Text marginTop={8}>
              <FormattedMessage
                id="public.invite.tell-us-about-yourself"
                defaultMessage="Leave us your email. We will send you the <a>invitation</a> as soon as possible."
                values={{
                  a: (chunks: any[]) => (
                    <Text
                      as="em"
                      fontStyle="normal"
                      fontWeight="bold"
                      color="purple.500"
                    >
                      {chunks}
                    </Text>
                  ),
                }}
              />
            </Text>

            <Image
              src={`${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/undraw_setup.svg`}
              width="350px"
              marginX="auto"
              marginY={8}
            />
            <Text marginTop={8}>
              <FormattedMessage
                id="public.invite.consent"
                defaultMessage="Parallel needs the contact information you provide to us to contact you about our products. You may unsubscribe from these communications at any time."
              />
            </Text>
            <Text marginTop={4}>
              <FormattedMessage
                id="public.invite.review-privacy"
                defaultMessage="For more information, please review our <a>Privacy Policy</a>."
                values={{
                  a: (chunks: any[]) => (
                    <Link href="/legal/privacy">{chunks}</Link>
                  ),
                }}
              />
            </Text>
          </Box>
          <Box flex="1">
            <Card
              id="form-container"
              maxWidth={{ base: "auto", lg: "500px" }}
              marginX="auto"
              borderColor="purple.100"
              padding={8}
            />
          </Box>
        </Stack>
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

export default Invite;
