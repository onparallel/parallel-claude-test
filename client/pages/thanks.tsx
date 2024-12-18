import { gql, useQuery } from "@apollo/client";
import { Box, Center, Divider, Flex, Heading, Image, Stack, Text } from "@chakra-ui/react";
import { CheckIcon, LinkedInSimpleIcon, TwitterIcon } from "@parallel/chakra/icons";
import { Card } from "@parallel/components/common/Card";
import { Link, NormalLink } from "@parallel/components/common/Link";
import { Logo } from "@parallel/components/common/Logo";
import { OverrideWithOrganizationTheme } from "@parallel/components/common/OverrideWithOrganizationTheme";
import {
  RedirectError,
  withApolloData,
  WithApolloDataContext,
} from "@parallel/components/common/withApolloData";
import { Thanks_publicOrganizationDocument } from "@parallel/graphql/__types";
import { untranslated } from "@parallel/utils/untranslated";
import Head from "next/head";
import { useRouter } from "next/router";
import { FormattedMessage, useIntl } from "react-intl";
import { isNonNullish, isNullish } from "remeda";

function ThanksForSigning() {
  const { query } = useRouter();
  const intl = useIntl();

  const { data } = useQuery(Thanks_publicOrganizationDocument, {
    variables: { id: query.o as string },
  });

  const organization = data!.publicOrg!;

  return (
    <>
      <Head>
        <title>
          {`${intl.formatMessage({
            id: "generic.thanks",
            defaultMessage: "Thanks",
          })} | ${organization.hasRemoveParallelBranding ? organization.name : "Parallel"}`}
        </title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
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
            {isNonNullish(organization.logoUrl400) ? (
              <Image src={organization.logoUrl400} maxWidth="200px" maxHeight="200px" />
            ) : (
              <Logo width="200px" />
            )}
          </Center>
          <OverrideWithOrganizationTheme
            cssVarsRoot="#thanks-card"
            brandTheme={organization.brandTheme}
          >
            <Card id="thanks-card" paddingY={8} paddingX={10} textAlign="center">
              <Stack spacing={4}>
                <Center margin="auto" borderRadius="full" background="primary.500" boxSize={10}>
                  <CheckIcon color="white" role="presentation" boxSize={6} />
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
          </OverrideWithOrganizationTheme>
          {organization.hasRemoveParallelBranding ? null : <ThanksFooter />}
        </Stack>
      </Flex>
    </>
  );
}

function ThanksFooter() {
  return (
    <Flex flexDirection="column" alignItems="center">
      <Divider borderColor="#A0AEC0" />
      <Text align="center" marginTop={5}>
        <FormattedMessage id="footer.slogan" defaultMessage="Work better with" />
      </Text>
      <Box as="a" href="/">
        <Logo width="120px" marginTop={1} />
      </Box>
      <Stack direction="row" marginTop={2}>
        <NormalLink
          href="https://www.linkedin.com/company/onparallel"
          aria-label={untranslated("LinkedIn")}
          isExternal
        >
          <Center boxSize="24px" backgroundColor="primary.500" borderRadius="md">
            <LinkedInSimpleIcon color="white" role="presentation" />
          </Center>
        </NormalLink>
        <NormalLink
          href="https://twitter.com/onparallelHQ"
          aria-label={untranslated("Twitter")}
          isExternal
        >
          <Center boxSize="24px" backgroundColor="primary.500" borderRadius="md">
            <TwitterIcon color="white" role="presentation" />
          </Center>
        </NormalLink>
      </Stack>
      <Flex alignItems="center" marginTop={2}>
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
            <FormattedMessage id="layout.privacy-link" defaultMessage="Privacy" />
          </Text>
        </Link>
      </Flex>
    </Flex>
  );
}

ThanksForSigning.fragments = {
  PublicOrganization: gql`
    fragment ThanksForSigning_PublicOrganization on PublicOrganization {
      name
      logoUrl400: logoUrl(options: { resize: { width: 400, height: 400, fit: inside } })
      hasRemoveParallelBranding
      brandTheme {
        ...OverrideWithOrganizationTheme_OrganizationBrandThemeData
      }
    }
    ${OverrideWithOrganizationTheme.fragments.OrganizationBrandThemeData}
  `,
};

ThanksForSigning.queries = [
  gql`
    query Thanks_publicOrganization($id: GID!) {
      publicOrg(id: $id) {
        ...ThanksForSigning_PublicOrganization
      }
    }
    ${ThanksForSigning.fragments.PublicOrganization}
  `,
];

ThanksForSigning.getInitialProps = async ({ query, fetchQuery }: WithApolloDataContext) => {
  if (query.o) {
    const { data } = await fetchQuery(Thanks_publicOrganizationDocument, {
      variables: { id: query.o as string },
    });
    if (isNullish(data?.publicOrg)) {
      throw new RedirectError("/");
    }
  } else {
    throw new RedirectError("/");
  }
};

export default withApolloData(ThanksForSigning);
