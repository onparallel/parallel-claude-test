import {
  Box,
  BoxProps,
  Flex,
  Heading,
  Image,
  Stack,
  Text,
} from "@chakra-ui/core";
import { Title } from "@parallel/components/common/Title";
import { PublicContainer } from "@parallel/components/public/layout/PublicContainer";
import { PublicLayout } from "@parallel/components/public/layout/PublicLayout";
import languages from "@parallel/lang/languages.json";
import { ReactNode } from "react";
import { FormattedMessage, useIntl } from "react-intl";

function Security() {
  const intl = useIntl();
  return (
    <>
      <Title>
        {intl.formatMessage({
          id: "public.security.title",
          defaultMessage: "Security",
        })}
      </Title>
      <PublicLayout>
        <PublicContainer
          textAlign="center"
          wrapper={{ paddingY: 16, backgroundColor: "gray.50" }}
        >
          <Heading as="h1" fontSize="3xl" fontWeight="bold" color="purple.600">
            <FormattedMessage
              id="public.security.hero-title"
              defaultMessage="Your information is safe with Parallel"
            ></FormattedMessage>
          </Heading>
          <Text marginTop={12} marginBottom={2} fontSize="lg">
            <FormattedMessage
              id="public.security.trust-our-security"
              defaultMessage="Trust Parallel to keep all your information safe and confidential."
            ></FormattedMessage>
          </Text>
          <Text fontSize="lg">
            <FormattedMessage
              id="public.security.system-security-layers"
              defaultMessage="To achieve this, our system has multiple layers of protection and is secure by design."
            ></FormattedMessage>
          </Text>
        </PublicContainer>
        <PublicContainer paddingY={16} maxWidth="containers.md">
          <Stack spacing={{ base: 4, sm: 8, md: 12 }}>
            <SecurityClaim image="/static/images/undraw_safe.svg">
              <Heading
                as="h4"
                fontSize="xl"
                color="purple.500"
                marginBottom={4}
              >
                <FormattedMessage
                  id="public.security.how-we-protect"
                  defaultMessage="How do we protect your data and information?"
                ></FormattedMessage>
              </Heading>
              <Text marginBottom={2}>
                <FormattedMessage
                  id="public.security.secure-access"
                  defaultMessage="You can safely access your files from any computer, and all communications and requests for information will be kept safe from third parties."
                ></FormattedMessage>
              </Text>
              <Text>
                <FormattedMessage
                  id="public.security.data-at-rest"
                  defaultMessage="Your data at rest is encrypted using the 256-bit AES-256 (Advanced Encryption Standard)."
                ></FormattedMessage>
              </Text>
            </SecurityClaim>
            <SecurityClaim
              reverse
              image="/static/images/undraw_secure_server.svg"
            >
              <Heading
                as="h4"
                fontSize="xl"
                color="purple.500"
                marginBottom={4}
              >
                <FormattedMessage
                  id="public.security.your-connection"
                  defaultMessage="How do we protect your connection?"
                ></FormattedMessage>
              </Heading>
              <Text>
                <FormattedMessage
                  id="public.security.ssl-connection"
                  defaultMessage="We use SSL (Secure Sockets Layer) to protect data in transit between the Parallel application in your browser and our servers."
                ></FormattedMessage>
              </Text>
            </SecurityClaim>
            <SecurityClaim image="/static/images/undraw_personal_information.svg">
              <Heading
                as="h4"
                fontSize="xl"
                color="purple.500"
                marginBottom={4}
              >
                <FormattedMessage
                  id="public.security.protect-your-customer"
                  defaultMessage="How do we protect your clients' information?"
                ></FormattedMessage>
              </Heading>
              <Text marginBottom={2}>
                <FormattedMessage
                  id="public.security.pass-storage"
                  defaultMessage="We will never store your passwords as you type them, you can only reset them by means that allow us to verify your credentials."
                ></FormattedMessage>
              </Text>
              <Text>
                <FormattedMessage
                  id="public.security.verify-identity"
                  defaultMessage="In addition, no one will be able to access upload pages to download or view information without first identifying themselves."
                ></FormattedMessage>
              </Text>
            </SecurityClaim>
          </Stack>
          <Box marginTop={20} textAlign="center">
            <Text>
              <FormattedMessage
                id="public.security.pillar"
                defaultMessage="At Parallel we maintain security as one of our fundamental pillars. We know that trust is the foundation of any relationship. For this reason, we protect you and the people with whom you interact."
              ></FormattedMessage>
            </Text>
          </Box>
        </PublicContainer>
      </PublicLayout>
    </>
  );
}

function SecurityClaim({
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
        <Image src={image} height="150px" role="presentation" />
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

export default Security;
