import { gql } from "@apollo/client";
import { Box, Container } from "@chakra-ui/react";
import { withDialogs } from "@parallel/components/common/dialogs/DialogProvider";
import {
  OrganizationBrandTheme,
  OverrideWithOrganizationTheme,
} from "@parallel/components/common/OverrideWithOrganizationTheme";
import { ToneProvider } from "@parallel/components/common/ToneProvider";
import { withApolloData } from "@parallel/components/common/withApolloData";
import { RecipientViewContactlessForm } from "@parallel/components/recipient-view/RecipientViewContactlessForm";
import { RecipientViewNewDevice } from "@parallel/components/recipient-view/RecipientViewNewDevice";
import { RecipientViewVerify_verifyPublicAccessDocument, Tone } from "@parallel/graphql/__types";
import { createApolloClient } from "@parallel/utils/apollo/client";
import { compose } from "@parallel/utils/compose";
import { serialize as serializeCookie } from "cookie";
import { GetServerSidePropsContext, GetServerSidePropsResult } from "next";
import Head from "next/head";
import { getClientIp } from "request-ip";

interface RecipientViewVerifyProps {
  email: string;
  orgName: string;
  orgLogoUrl: string;
  tone: Tone;
  brandTheme?: OrganizationBrandTheme | null;
  ownerName: string;
  isContactlessAccess?: boolean;
}

function RecipientViewVerify({
  email,
  orgName,
  orgLogoUrl,
  tone,
  brandTheme,
  ownerName,
  isContactlessAccess,
}: RecipientViewVerifyProps) {
  return (
    <ToneProvider value={tone}>
      <OverrideWithOrganizationTheme cssVarsRoot="body" brandTheme={brandTheme}>
        <Head>
          <title>Parallel</title>
        </Head>
        <Box backgroundColor="primary.50" minHeight="100vh">
          <Container
            display="flex"
            flexDirection="column"
            justifyContent="center"
            minHeight="100vh"
            maxW="container.sm"
          >
            {isContactlessAccess ? (
              <RecipientViewContactlessForm
                ownerName={ownerName}
                orgName={orgName}
                orgLogoUrl={orgLogoUrl}
              />
            ) : (
              <RecipientViewNewDevice email={email} orgName={orgName} orgLogoUrl={orgLogoUrl} />
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
}: GetServerSidePropsContext): Promise<GetServerSidePropsResult<RecipientViewVerifyProps>> {
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
  return { props: data.verifyPublicAccess as any };
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
        orgName
        orgLogoUrl
        tone
        brandTheme
      }
    }
  `,
];

export default compose(withDialogs, withApolloData)(RecipientViewVerify);
