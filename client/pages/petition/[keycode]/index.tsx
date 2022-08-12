import { gql } from "@apollo/client";
import { Box, Container } from "@chakra-ui/react";
import { withDialogs } from "@parallel/components/common/dialogs/DialogProvider";
import { OverrideWithOrganizationTheme } from "@parallel/components/common/OverrideWithOrganizationTheme";
import { ToneProvider } from "@parallel/components/common/ToneProvider";
import { withApolloData } from "@parallel/components/common/withApolloData";
import { RecipientViewContactlessForm } from "@parallel/components/recipient-view/RecipientViewContactlessForm";
import { RecipientViewNewDevice } from "@parallel/components/recipient-view/RecipientViewNewDevice";
import {
  RecipientViewVerify_verifyPublicAccessDocument,
  RecipientViewVerify_verifyPublicAccessMutation,
} from "@parallel/graphql/__types";
import { createApolloClient } from "@parallel/utils/apollo/client";
import { compose } from "@parallel/utils/compose";
import { serialize as serializeCookie } from "cookie";
import { GetServerSidePropsContext, GetServerSidePropsResult } from "next";
import Head from "next/head";
import { getClientIp } from "request-ip";

function RecipientViewVerify({
  email,
  ownerName,
  isContactlessAccess,
  organization,
}: RecipientViewVerify_verifyPublicAccessMutation["verifyPublicAccess"]) {
  return (
    <ToneProvider value={organization!.tone}>
      <OverrideWithOrganizationTheme cssVarsRoot="body" brandTheme={organization!.brandTheme}>
        <Head>
          <title>{organization!.name}</title>
        </Head>
        <Box backgroundColor="primary.50" minHeight="100vh">
          <Container
            display="flex"
            flexDirection="column"
            justifyContent="center"
            minHeight="100vh"
            maxW="container.sm"
            paddingY={4}
          >
            {isContactlessAccess ? (
              <RecipientViewContactlessForm ownerName={ownerName!} organization={organization!} />
            ) : (
              <RecipientViewNewDevice email={email!} organization={organization!} />
            )}
          </Container>
        </Box>
      </OverrideWithOrganizationTheme>
    </ToneProvider>
  );
}

export async function getServerSideProps({
  query: { keycode },
  locale,
  req,
  res,
}: GetServerSidePropsContext): Promise<
  GetServerSidePropsResult<RecipientViewVerify_verifyPublicAccessMutation["verifyPublicAccess"]>
> {
  const client = createApolloClient({}, { req });
  const { data } = await client.mutate({
    mutation: RecipientViewVerify_verifyPublicAccessDocument,
    variables: {
      keycode: keycode as string,
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
      })
    );
  }
  if (isAllowed) {
    return {
      redirect: {
        destination: `/${locale}/petition/${keycode}/1`,
        permanent: false,
      },
    };
  }
  return { props: data.verifyPublicAccess };
}

RecipientViewVerify.mutations = [
  gql`
    mutation RecipientViewVerify_verifyPublicAccess(
      $token: ID!
      $keycode: ID!
      $ip: String
      $userAgent: String
    ) {
      verifyPublicAccess(token: $token, keycode: $keycode, ip: $ip, userAgent: $userAgent) {
        isAllowed
        isContactlessAccess
        ownerName
        cookieName
        cookieValue
        email
        organization {
          ...RecipientViewContactlessForm_PublicOrganization
          ...RecipientViewNewDevice_PublicOrganization
          tone
          brandTheme
        }
      }
    }
    ${RecipientViewContactlessForm.fragments.PublicOrganization}
    ${RecipientViewNewDevice.fragments.PublicOrganization}
  `,
];

export default compose(withDialogs, withApolloData)(RecipientViewVerify);
