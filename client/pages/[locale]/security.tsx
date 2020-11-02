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
import { PublicShowcase } from "@parallel/components/public/PublicShowcase";
import languages from "@parallel/lang/languages.json";
import { ReactNode } from "react";
import { FormattedMessage, useIntl } from "react-intl";

function Security() {
  const intl = useIntl();

  return (
    <PublicLayout
      title={intl.formatMessage({
        id: "public.security.title",
        defaultMessage: "Security",
      })}
      description={intl.formatMessage({
        id: "public.security.meta-description",
        defaultMessage: "Learn more about security at Parallel",
      })}
    >
      <PublicContainer
        textAlign="center"
        wrapper={{ paddingY: 16, backgroundColor: "gray.50" }}
      >
        <Heading as="h1" size="xl" fontWeight="bold" color="purple.600">
          <FormattedMessage
            id="public.security.hero-title"
            defaultMessage="Your information is safe with Parallel"
          />
        </Heading>
        <Text marginTop={12} marginBottom={2} fontSize="lg">
          <FormattedMessage
            id="public.security.trust-our-security"
            defaultMessage="Trust Parallel to keep all your information safe and confidential."
          />
        </Text>
        <Text fontSize="lg">
          <FormattedMessage
            id="public.security.system-security-layers"
            defaultMessage="To achieve this, our system has multiple layers of protection and is secure by design."
          />
        </Text>
      </PublicContainer>
      <PublicContainer paddingY={16} maxWidth="container.md">
        <Stack spacing={{ base: 4, sm: 8, md: 12 }}>
          <PublicShowcase
            imageUrl={`${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/undraw_safe.svg`}
            imageSize="150px"
          >
            <Heading as="h4" size="md" color="purple.500" marginBottom={4}>
              <FormattedMessage
                id="public.security.how-we-protect"
                defaultMessage="How do we protect your data and information?"
              />
            </Heading>
            <Text marginBottom={2}>
              <FormattedMessage
                id="public.security.secure-access"
                defaultMessage="You can safely access your files from any computer, and all communications and requests for information will be kept safe from third parties."
              />
            </Text>
            <Text>
              <FormattedMessage
                id="public.security.data-at-rest"
                defaultMessage="Your data at rest is encrypted using the 256-bit AES-256 (Advanced Encryption Standard)."
              />
            </Text>
          </PublicShowcase>
          <PublicShowcase
            isReversed
            imageUrl={`${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/undraw_secure_server.svg`}
            imageSize="150px"
          >
            <Heading as="h4" size="md" color="purple.500" marginBottom={4}>
              <FormattedMessage
                id="public.security.your-connection"
                defaultMessage="How do we protect your connection?"
              />
            </Heading>
            <Text>
              <FormattedMessage
                id="public.security.ssl-connection"
                defaultMessage="We use SSL (Secure Sockets Layer) to protect data in transit between the Parallel application in your browser and our servers."
              />
            </Text>
          </PublicShowcase>
          <PublicShowcase
            imageUrl={`${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/undraw_personal_information.svg`}
            imageSize="150px"
          >
            <Heading as="h4" size="md" color="purple.500" marginBottom={4}>
              <FormattedMessage
                id="public.security.protect-your-customer"
                defaultMessage="How do we protect your clients' information?"
              />
            </Heading>
            <Text marginBottom={2}>
              <FormattedMessage
                id="public.security.pass-storage"
                defaultMessage="We will never store your passwords as you type them, you can only reset them by means that allow us to verify your credentials."
              />
            </Text>
            <Text>
              <FormattedMessage
                id="public.security.verify-identity"
                defaultMessage="In addition, no one will be able to access upload pages to download or view information without first identifying themselves."
              />
            </Text>
          </PublicShowcase>
        </Stack>
        <Box marginTop={20} textAlign="center">
          <Text>
            <FormattedMessage
              id="public.security.pillar"
              defaultMessage="At Parallel we maintain security as one of our fundamental pillars. We know that trust is the foundation of any relationship. For this reason, we protect you and the people with whom you interact."
            />
          </Text>
        </Box>
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

export default Security;
