import { gql } from "@apollo/client";
import { Divider, Flex, FlexProps, Image, Text } from "@chakra-ui/core";
import {
  CheckIcon,
  LinkedInSimpleIcon,
  TwitterIcon,
} from "@parallel/chakra/icons";
import { Card } from "@parallel/components/common/Card";
import { Link } from "@parallel/components/common/Link";
import { Logo } from "@parallel/components/common/Logo";
import {
  withApolloData,
  WithApolloDataContext,
} from "@parallel/components/common/withApolloData";

import { PublicLayout } from "@parallel/components/public/layout/PublicLayout";
import { useThanks_PetitionLogoQuery } from "@parallel/graphql/__types";
import { assertQuery } from "@parallel/utils/apollo/assertQuery";
import { useRouter } from "next/router";
import { FormattedMessage, useIntl } from "react-intl";

function ThanksForSigning() {
  const router = useRouter();
  const intl = useIntl();

  let logoUrl = null;
  if (router.query.o) {
    try {
      const { data } = assertQuery(
        useThanks_PetitionLogoQuery({
          variables: {
            id: router.query.o as string,
          },
        })
      );

      logoUrl = data.publicOrgLogoUrl;
    } catch {}
  }

  return (
    <PublicLayout
      hideHeader
      hideFooter
      title={intl.formatMessage({
        id: "generic.thanks",
        defaultMessage: "Thanks",
      })}
    >
      <Flex
        minHeight="100vh"
        width="90%"
        margin="auto"
        verticalAlign="middle"
        display="flex"
        alignItems="center"
        flexDirection="column"
        justifyContent="center"
      >
        {logoUrl ? (
          <Image src={logoUrl} width="200px" />
        ) : (
          <Logo width="200px" />
        )}
        <Card padding={5} marginTop={5}>
          <Flex
            margin="auto"
            borderRadius="100%"
            background="purple.500"
            padding={2}
            width={8}
            height={8}
          >
            <CheckIcon color="white" />
          </Flex>

          <Flex
            fontWeight="bold"
            justifyContent="center"
            fontSize="lg"
            margin="10px auto 10px auto"
          >
            <FormattedMessage
              id="petition.signature-successful.title"
              defaultMessage="Document signed successfully"
            />
          </Flex>

          <Flex justifyContent="center">
            <FormattedMessage
              id="petition.signature-successful.subtitle"
              defaultMessage="We have sent a signed copy of the document to your email."
            />
          </Flex>
        </Card>

        <ThanksFooter
          marginTop={5}
          display="flex"
          flexDirection="column"
          alignItems="center"
        />
      </Flex>
    </PublicLayout>
  );
}

function ThanksFooter(props: FlexProps) {
  return (
    <Flex {...props}>
      <Divider borderColor="#A0AEC0" />
      <Text color="#2D3748" align="center" marginTop={5}>
        <FormattedMessage
          id="footer.slogan"
          defaultMessage="Work better with"
        />
      </Text>
      <Logo width="120px" marginTop={1} />
      <Flex marginTop={2}>
        <Flex
          as="a"
          href="https://www.linkedin.com/company/parallel-so"
          target="_blank"
          background="purple.500"
          borderRadius={5}
          margin={1}
        >
          <LinkedInSimpleIcon color="white" margin={1} />
        </Flex>
        <Flex
          as="a"
          href="https://twitter.com/Parallel_SO"
          target="_blank"
          background="purple.500"
          borderRadius={5}
          margin={1}
        >
          <TwitterIcon color="white" margin={1} />
        </Flex>
      </Flex>
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
