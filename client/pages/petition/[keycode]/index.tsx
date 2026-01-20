import { gql } from "@apollo/client";
import { Container, Flex } from "@chakra-ui/react";
import { withDialogs } from "@parallel/components/common/dialogs/DialogProvider";
import { OverrideWithOrganizationTheme } from "@parallel/components/common/OverrideWithOrganizationTheme";
import { ToneProvider } from "@parallel/components/common/ToneProvider";
import { withApolloData } from "@parallel/components/common/withApolloData";
import { RecipientViewContactlessForm } from "@parallel/components/recipient-view/RecipientViewContactlessForm";
import { RecipientViewNewDevice } from "@parallel/components/recipient-view/RecipientViewNewDevice";
import { RecipientViewPageNotAvailableError } from "@parallel/components/recipient-view/RecipientViewPageNotAvailableError";
import {
  RecipientViewVerify_PublicAccessVerificationFragment,
  RecipientViewVerify_verifyPublicAccessDocument,
} from "@parallel/graphql/__types";
import { createApolloClient } from "@parallel/utils/apollo/client";
import { isApolloError } from "@parallel/utils/apollo/isApolloError";
import { compose } from "@parallel/utils/compose";
import { serialize as serializeCookie } from "cookie";
import { GetServerSidePropsContext } from "next";
import Head from "next/head";
import { getClientIp } from "request-ip";

type RecipientViewVerifyProps =
  | RecipientViewVerify_PublicAccessVerificationFragment
  | { errorCode: "PUBLIC_PETITION_NOT_AVAILABLE" };

function RecipientViewVerify(props: RecipientViewVerifyProps) {
  if ("errorCode" in props) {
    return <RecipientViewPageNotAvailableError />;
  }
  const { email, ownerName, isContactlessAccess, organization } = props;
  return (
    <ToneProvider value={organization!.brandTheme.preferredTone}>
      <OverrideWithOrganizationTheme cssVarsRoot="body" brandTheme={organization!.brandTheme}>
        <Head>
          <title>{organization!.hasRemoveParallelBranding ? organization!.name : "Parallel"}</title>
        </Head>
        <Flex backgroundColor="primary.50" minHeight="100vh" alignItems="center">
          <Container paddingY={4} maxWidth="34rem">
            {isContactlessAccess ? (
              <RecipientViewContactlessForm ownerName={ownerName!} organization={organization!} />
            ) : (
              <RecipientViewNewDevice email={email!} organization={organization!} />
            )}
          </Container>
        </Flex>
      </OverrideWithOrganizationTheme>
    </ToneProvider>
  );
}

export async function getServerSideProps({
  params,
  locale,
  req,
  res,
}: GetServerSidePropsContext<{ keycode: string }>) {
  try {
    const client = createApolloClient({}, { req });
    const keycode = params!.keycode;
    const { data } = await client.mutate({
      mutation: RecipientViewVerify_verifyPublicAccessDocument,
      variables: {
        keycode,
        token: process.env.CLIENT_SERVER_TOKEN,
        ip: getClientIp(req),
        userAgent: req.headers["user-agent"] ?? null,
      },
    });
    if (!data) {
      return { notFound: true };
    }

    const { isAllowed, cookieName, cookieValue } = data.verifyPublicAccess;

    if (cookieName && cookieValue) {
      res.setHeader(
        "set-cookie",
        serializeCookie(cookieName, cookieValue, {
          path: "/",
          httpOnly: true,
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
          maxAge: 60 * 60 * 24 * 365 * 10,
        }),
      );
    }
    if (isAllowed) {
      return {
        redirect: {
          destination: `/${locale}/petition/${keycode}/1` + (req.url!.match(/\?.*$/)?.[0] ?? ""),
          permanent: false,
        },
      };
    }
    return { props: data.verifyPublicAccess };
  } catch (error) {
    if (isApolloError(error, "PUBLIC_PETITION_NOT_AVAILABLE")) {
      return { props: { errorCode: "PUBLIC_PETITION_NOT_AVAILABLE" } };
    }
    throw error;
  }
}

const _fragments = {
  PublicAccessVerification: gql`
    fragment RecipientViewVerify_PublicAccessVerification on PublicAccessVerification {
      isAllowed
      isContactlessAccess
      ownerName
      cookieName
      cookieValue
      email
      organization {
        id
        hasRemoveParallelBranding
        ...RecipientViewContactlessForm_PublicOrganization
        ...RecipientViewNewDevice_PublicOrganization
        brandTheme {
          preferredTone
          ...OverrideWithOrganizationTheme_OrganizationBrandThemeData
        }
      }
    }
  `,
};

RecipientViewVerify.mutations = [
  gql`
    mutation RecipientViewVerify_verifyPublicAccess(
      $token: ID!
      $keycode: ID!
      $ip: String
      $userAgent: String
    ) {
      verifyPublicAccess(token: $token, keycode: $keycode, ip: $ip, userAgent: $userAgent) {
        ...RecipientViewVerify_PublicAccessVerification
      }
    }
  `,
];

export default compose(withDialogs, withApolloData)(RecipientViewVerify);
