import { Box, Flex, Heading, Text, Image } from "@chakra-ui/core";
import { Card } from "@parallel/components/common/Card";
import { Link } from "@parallel/components/common/Link";
import { Title } from "@parallel/components/common/Title";
import { PublicContainer } from "@parallel/components/public/layout/PublicContainer";
import { PublicLayout } from "@parallel/components/public/layout/PublicLayout";
import languages from "@parallel/lang/languages.json";
import { useHubspotForm } from "@parallel/utils/useHubspotForm";
import { useRouter } from "next/router";
import { FormattedMessage, useIntl } from "react-intl";

function Invite() {
  const intl = useIntl();
  const { query } = useRouter();
  useHubspotForm(
    query.locale
      ? {
          target: "#form-container",
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
    <>
      <Title>
        {intl.formatMessage({
          id: "public.invite.title",
          defaultMessage: "Request an invite",
        })}
      </Title>
      <PublicLayout>
        <PublicContainer
          paddingY={{ base: 8, md: 16 }}
          wrapper={{
            textAlign: "center",
            backgroundColor: "purple.50",
            marginBottom: -8,
          }}
        >
          <Flex flexDirection={{ base: "column", md: "row" }}>
            <Box
              flex="1"
              textAlign="left"
              padding={8}
              paddingTop={{ base: 0, md: 8 }}
            >
              <Heading as="h1">
                <FormattedMessage
                  id="public.invite.request-invite"
                  defaultMessage="Request your invite today!"
                />
              </Heading>
              <Text marginTop={8}>
                <FormattedMessage
                  id="public.invite.tell-us-about-yourself"
                  defaultMessage="Tell us a bit about yourself, and we will send you a <a>free access</a>."
                  values={{
                    a: (...chunks: any[]) => (
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
                ></FormattedMessage>
              </Text>

              <Image
                src="/static/images/undraw_setup.svg"
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
                    a: (...chunks: any[]) => (
                      <Link href="/legal/[doc]" as="/legal/privacy">
                        {chunks}
                      </Link>
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
              ></Card>
            </Box>
          </Flex>
        </PublicContainer>
      </PublicLayout>
    </>
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
