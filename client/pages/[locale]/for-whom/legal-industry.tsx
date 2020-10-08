import {
  Box,
  BoxProps,
  Flex,
  Heading,
  Image,
  Stack,
  Text,
} from "@chakra-ui/core";
import { PublicContainer } from "@parallel/components/public/layout/PublicContainer";
import { PublicLayout } from "@parallel/components/public/layout/PublicLayout";
import languages from "@parallel/lang/languages.json";
import { ReactNode } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { ClaimsList } from "../../../components/public/ClaimsList";

function LegalIndustry() {
  const intl = useIntl();
  return (
    <PublicLayout
      title={intl.formatMessage({
        id: "public.for-legal.title",
        defaultMessage: "Legal industry",
      })}
      description={intl.formatMessage({
        id: "public.for-legal.meta-description",
        defaultMessage:
          "Manage documents and information checklists efficiently and improve collaboration with your clients and colleagues.",
      })}
    >
      <PublicContainer
        textAlign="center"
        wrapper={{ paddingY: 16, backgroundColor: "gray.50" }}
      >
        <Heading as="h1" size="xl" fontWeight="bold" color="purple.600">
          <FormattedMessage
            id="public.for-legal.hero-title"
            defaultMessage="Made by lawyers for lawyers"
          />
        </Heading>
        <Text marginTop={8} fontSize="lg">
          <FormattedMessage
            id="public.for-legal.obtain-documents"
            defaultMessage="Efficiently obtain the documents from your clients, from the beginning of the relationship."
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
            id="public.for-legal.checklists"
            defaultMessage="Documents checklists to work more effectively"
          />
        </Heading>
        <Stack spacing={{ base: 4, sm: 8, md: 12 }}></Stack>
      </PublicContainer>
      <PublicContainer paddingBottom={16} maxWidth="container.lg">
        <Stack spacing={{ base: 4, sm: 8, md: 12 }}>
          <BenefitClaim image="/static/images/undraw_product_iteration.svg">
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
          </BenefitClaim>
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
          <BenefitClaim
            reverse
            image="/static/images/undraw_document_collaboration.svg"
          >
            <Stack spacing={4}>
              <Text fontWeight="bold">
                <FormattedMessage
                  id="public.services.collaboration.between-professionals"
                  defaultMessage="Between your profesionals:"
                />
              </Text>
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
              <Text fontWeight="bold">
                <FormattedMessage
                  id="public.services.collaboration.with-clients"
                  defaultMessage="With your clients:"
                />
              </Text>
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
          </BenefitClaim>
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
            id="public.for-legal.knowledge"
            defaultMessage="Manage better the knowledge for your organization"
          />
        </Heading>
        <Stack spacing={{ base: 4, sm: 8, md: 12 }}></Stack>
      </PublicContainer>
      <PublicContainer paddingBottom={16} maxWidth="container.lg">
        <Stack spacing={{ base: 4, sm: 8, md: 12 }}>
          <BenefitClaim image="/static/images/undraw_fast_loading.svg">
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
          </BenefitClaim>
        </Stack>
      </PublicContainer>
    </PublicLayout>
  );
}

function BenefitClaim({
  reverse,
  image,
  children,
  ...props
}: {
  reverse?: boolean;
  image: string;
  children: ReactNode;
} & BoxProps) {
  return (
    <Flex
      {...props}
      alignItems="center"
      direction={{ base: "column", md: reverse ? "row" : "row-reverse" }}
    >
      <Flex flex="1" justifyContent="center">
        <Image src={image} height="250px" role="presentation" />
      </Flex>
      <Box
        flex="1"
        justifyContent="center"
        marginTop={{ base: 8, md: 0 }}
        {...(reverse
          ? { marginLeft: { base: 0, md: 8 } }
          : { marginRight: { base: 0, md: 8 } })}
      >
        {children}
      </Box>
    </Flex>
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

export default LegalIndustry;
