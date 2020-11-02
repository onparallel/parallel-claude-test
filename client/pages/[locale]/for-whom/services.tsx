import { Heading, Stack, Text } from "@chakra-ui/core";
import { ClaimsList } from "@parallel/components/public/ClaimsList";
import { PublicContainer } from "@parallel/components/public/layout/PublicContainer";
import { PublicLayout } from "@parallel/components/public/layout/PublicLayout";
import { PublicShowcase } from "@parallel/components/public/PublicShowcase";
import languages from "@parallel/lang/languages.json";
import { FormattedMessage, useIntl } from "react-intl";

function Services() {
  const intl = useIntl();
  return (
    <PublicLayout
      title={intl.formatMessage({
        id: "public.services.title",
        defaultMessage: "Professional Services",
      })}
      description={intl.formatMessage({
        id: "public.services.meta-description",
        defaultMessage:
          "Increase your firm efficiency. Manage documents and information checklists efficiently and improve collaboration with your clients and colleagues.",
      })}
    >
      <PublicContainer
        textAlign="center"
        wrapper={{ paddingY: 16, backgroundColor: "gray.50" }}
      >
        <Heading as="h1" size="xl" fontWeight="bold" color="purple.600">
          <FormattedMessage
            id="public.services.hero-title"
            defaultMessage="Increase the efficiency of your firm with Parallel"
          />
        </Heading>
        <Text marginTop={8} fontSize="lg">
          <FormattedMessage
            id="public.services.checklists-collaboration"
            defaultMessage="Manage documents and information checklists efficiently and improve collaboration with your clients and between your colleagues."
          />
        </Text>
      </PublicContainer>
      <PublicContainer
        paddingY={16}
        wrapper={{
          textAlign: "center",
        }}
      >
        <Heading as="h2" size="lg" fontWeight="bold">
          <FormattedMessage
            id="public.services.automate"
            defaultMessage="Automate the collection of information checklists"
          />
        </Heading>
        <Stack spacing={{ base: 4, sm: 8, md: 12 }}></Stack>
      </PublicContainer>
      <PublicContainer paddingBottom={16} maxWidth="container.lg">
        <Stack spacing={{ base: 4, sm: 8, md: 12 }}>
          <PublicShowcase
            imageUrl={`${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/undraw_product_iteration.svg`}
          >
            <ClaimsList
              claims={[
                intl.formatMessage({
                  id: "public.services.automation.templates",
                  defaultMessage: "Use templates to work fast and comfortably.",
                }),
                intl.formatMessage({
                  id: "public.services.automation.control",
                  defaultMessage:
                    "Review the uploaded information automatically.",
                }),
                intl.formatMessage({
                  id: "public.services.automation.reminders",
                  defaultMessage:
                    "Set up reminders or send them manually with one click.",
                }),
                intl.formatMessage({
                  id: "public.services.automation.activity",
                  defaultMessage: "Control deadlines and keep an audit log.",
                }),
              ]}
            />
          </PublicShowcase>
        </Stack>
      </PublicContainer>
      <PublicContainer
        paddingY={16}
        wrapper={{
          textAlign: "center",
        }}
      >
        <Heading as="h2" size="lg" fontWeight="bold">
          <FormattedMessage
            id="public.services.collaboration"
            defaultMessage="Boost collaboration"
          />
        </Heading>
        <Stack spacing={{ base: 4, sm: 8, md: 12 }}></Stack>
      </PublicContainer>
      <PublicContainer paddingBottom={16} maxWidth="container.lg">
        <Stack spacing={{ base: 4, sm: 8, md: 12 }}>
          <PublicShowcase
            isReversed
            imageUrl={`${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/undraw_document_collaboration.svg`}
          >
            <Stack spacing={4}>
              <Heading size="sm" as="h3">
                <FormattedMessage
                  id="public.services.collaboration.between-professionals"
                  defaultMessage="Between your profesionals:"
                />
              </Heading>
              <ClaimsList
                claims={[
                  intl.formatMessage({
                    id: "public.services.collaboration.avoid-repeated",
                    defaultMessage:
                      "Avoid requesting the same information more than once.",
                  }),
                  intl.formatMessage({
                    id: "public.services.collaboration.see-reviewed",
                    defaultMessage:
                      "Track what documents have already been reviewed.",
                  }),
                ]}
              />
              <Heading size="sm" as="h3">
                <FormattedMessage
                  id="public.services.collaboration.with-clients"
                  defaultMessage="With your clients:"
                />
              </Heading>
              <ClaimsList
                claims={[
                  intl.formatMessage({
                    id: "public.services.collaboration.no-install",
                    defaultMessage:
                      "Always accessible, no downloads or installs needed.",
                  }),
                  intl.formatMessage({
                    id:
                      "public.services.collaboration.centralize-conversations",
                    defaultMessage:
                      "Centralize conversations in a single place.",
                  }),
                  intl.formatMessage({
                    id: "public.services.collaboration.anywhere",
                    defaultMessage: "Work from a computer or a mobile device.",
                  }),
                ]}
              />
            </Stack>
          </PublicShowcase>
        </Stack>
      </PublicContainer>
      <PublicContainer
        paddingY={16}
        wrapper={{
          textAlign: "center",
        }}
      >
        <Heading as="h2" size="lg" fontWeight="bold">
          <FormattedMessage
            id="public.services.knowledge"
            defaultMessage="Reuse knowledge"
          />
        </Heading>
        <Stack spacing={{ base: 4, sm: 8, md: 12 }}></Stack>
      </PublicContainer>
      <PublicContainer paddingBottom={16} maxWidth="container.lg">
        <Stack spacing={{ base: 4, sm: 8, md: 12 }}>
          <PublicShowcase
            imageUrl={`${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/undraw_fast_loading.svg`}
          >
            <ClaimsList
              claims={[
                intl.formatMessage({
                  id: "public.services.knowledge.templates",
                  defaultMessage:
                    "Transform your document and information checklists into reusable templates.",
                }),
                intl.formatMessage({
                  id: "public.services.knowledge.share",
                  defaultMessage:
                    "Share and distribute templates with specific people, teams, or the entire organization.",
                }),
                intl.formatMessage({
                  id: "public.services.knowledge.scale",
                  defaultMessage: "Standarize projects to scale the business.",
                }),
              ]}
            />
          </PublicShowcase>
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

export default Services;
