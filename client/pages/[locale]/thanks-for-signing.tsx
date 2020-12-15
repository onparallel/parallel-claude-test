import { gql } from "@apollo/client";
import {
  Box,
  Center,
  Divider,
  Flex,
  Heading,
  Image,
  Stack,
  Text,
} from "@chakra-ui/core";
import {
  CheckIcon,
  LinkedInSimpleIcon,
  TwitterIcon,
} from "@parallel/chakra/icons";
import { Card } from "@parallel/components/common/Card";
import { Link, NakedLink, NormalLink } from "@parallel/components/common/Link";
import { Logo } from "@parallel/components/common/Logo";
import {
  withApolloData,
  WithApolloDataContext,
} from "@parallel/components/common/withApolloData";
import { PublicLayout } from "@parallel/components/public/layout/PublicLayout";
import { useThanks_PetitionLogoQuery } from "@parallel/graphql/__types";
import { useRouter } from "next/router";
import { FormattedMessage, useIntl } from "react-intl";

function ThanksForSigning() {
  const router = useRouter();
  const intl = useIntl();

  const { data } = useThanks_PetitionLogoQuery({
    variables: {
      id: router.query.o as string,
    },
    skip: !router.query.o,
  });
  const logoUrl = data?.publicOrgLogoUrl;

  return (
    <PublicLayout
      hideHeader
      hideFooter
      title={intl.formatMessage({
        id: "generic.thanks",
        defaultMessage: "Thanks",
      })}
    >
      <Flex flex="1" paddingX={4} justifyContent="center">
        <Stack
          spacing={8}
          minHeight="100vh"
          alignItems="stretch"
          maxWidth="container.xs"
          paddingY={8}
          justifyContent="center"
        >
          <Center>
            {logoUrl ? (
              <Image src={logoUrl} width="200px" />
            ) : (
              <Logo width="200px" />
            )}
          </Center>
          <Card paddingY={8} paddingX={4} textAlign="center">
            <Stack spacing={4}>
              <Center
                margin="auto"
                borderRadius="full"
                background="purple.500"
                boxSize={8}
              >
                <CheckIcon color="white" role="presentation" />
              </Center>
              <Heading size="md">
                <FormattedMessage
                  id="petition.signature-successful.title"
                  defaultMessage="Document signed successfully"
                />
              </Heading>
              <Text>
                <FormattedMessage
                  id="petition.signature-successful.subtitle"
                  defaultMessage="We have sent a signed copy of the document to your email."
                />
              </Text>
            </Stack>
          </Card>
          <ThanksFooter />
        </Stack>
      </Flex>
    </PublicLayout>
  );
}

function ThanksFooter() {
  return (
    <Flex flexDirection="column" alignItems="center">
      <Divider borderColor="#A0AEC0" />
      <Text align="center" marginTop={5}>
        <FormattedMessage
          id="footer.slogan"
          defaultMessage="Work better with"
        />
      </Text>
      <NakedLink href="/">
        <Box as="a">
          <Logo width="120px" marginTop={1} />
        </Box>
      </NakedLink>
      <Stack direction="row" marginTop={2}>
        <NormalLink
          href="https://www.linkedin.com/company/parallel-so"
          aria-label="LinkedIn"
          isExternal
        >
          <Center boxSize="24px" backgroundColor="purple.500" borderRadius="md">
            <LinkedInSimpleIcon color="white" role="presentation" />
          </Center>
        </NormalLink>
        <NormalLink
          href="https://twitter.com/Parallel_SO"
          aria-label="Twitter"
          isExternal
        >
          <Center boxSize="24px" backgroundColor="purple.500" borderRadius="md">
            <TwitterIcon color="white" role="presentation" />
          </Center>
        </NormalLink>
      </Stack>
      <Text align="center" fontSize="12px" marginTop={2}>
        {`Parallel Solutions, S.L. - C/Almogàvers 165, 59.203, 08018 Barcelona, Spain`}
      </Text>
      <Flex alignItems="center" marginTop={1}>
        <Link href={`/legal/terms`}>
          <Text align="center" fontSize="12px">
            <FormattedMessage
              id="layout.terms-and-conditions-link"
              defaultMessage="Terms and conditions"
            />
          </Text>
        </Link>
        <span>&nbsp;|&nbsp;</span>
        <Link href={`/legal/privacy`}>
          <Text align="center" fontSize="12px">
            <FormattedMessage
              id="layout.privacy-link"
              defaultMessage="Privacy"
            />
          </Text>
        </Link>
      </Flex>
    </Flex>
  );
}

ThanksForSigning.getInitialProps = async ({
  query,
  fetchQuery,
}: WithApolloDataContext) => {
  try {
    if (query.o) {
      await fetchQuery(
        gql`
          query Thanks_PetitionLogo($id: GID!) {
            publicOrgLogoUrl(id: $id)
          }
        `,
        {
          variables: {
            id: query.o,
          },
        }
      );
    }
  } catch (error) {
    return {};
  }
};

export default withApolloData(ThanksForSigning);
