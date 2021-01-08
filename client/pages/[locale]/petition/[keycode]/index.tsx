import { gql } from "@apollo/client";
import {
  Box,
  Button,
  Center,
  Container,
  Flex,
  HStack,
  Image,
  PinInput,
  PinInputField,
  ScaleFade,
  Stack,
  Text,
  useToast,
} from "@chakra-ui/react";
import { CheckIcon } from "@parallel/chakra/icons";
import { Card } from "@parallel/components/common/Card";
import { Logo } from "@parallel/components/common/Logo";
import { withApolloData } from "@parallel/components/common/withApolloData";
import {
  RecipientView_verifyPublicAccessMutation,
  RecipientView_verifyPublicAccessMutationVariables,
  usepublicCheckVerificationCodeMutation,
  usepublicSendVerificationCodeMutation,
} from "@parallel/graphql/__types";
import { createApolloClient } from "@parallel/utils/apollo/client";
import { resolveUrl } from "@parallel/utils/next";
import { serialize as serializeCookie } from "cookie";
import { isPast } from "date-fns";
import { GetServerSidePropsContext, GetServerSidePropsResult } from "next";
import Head from "next/head";
import { useRouter } from "next/router";
import { FormEvent, useRef, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { omit } from "remeda";
import { getClientIp } from "request-ip";

interface RecipientViewVerifyProps {
  email: string;
  orgName: string;
  orgLogoUrl: string;
}

type RecipientViewVerifyState =
  | { step: "REQUEST" }
  | {
      step: "VERIFY";
      isInvalid?: boolean;
      token: string;
      expiresAt: string;
      remainingAttempts: number;
    }
  | { step: "VERIFIED" };

function RecipientViewVerify({
  email,
  orgName,
  orgLogoUrl,
}: RecipientViewVerifyProps) {
  const { query } = useRouter();
  const toast = useToast();
  const intl = useIntl();
  const router = useRouter();
  const keycode = query.keycode as string;

  const [state, setState] = useState<RecipientViewVerifyState>({
    step: "REQUEST",
  });

  const [
    sendVerificationCode,
    { loading: isSendingCode },
  ] = usepublicSendVerificationCodeMutation();

  const [
    publicCheckVerificationCode,
    { loading: isVerifyingCode },
  ] = usepublicCheckVerificationCodeMutation({});

  async function handleSendVerificationCode() {
    const { data } = await sendVerificationCode({
      variables: { keycode },
    });
    if (!data) {
      return;
    }
    setState({
      step: "VERIFY",
      ...omit(data.publicSendVerificationCode, ["__typename"]),
    });
  }

  const [code, setCode] = useState("");
  const firstInputRef = useRef<HTMLInputElement>(null);

  function codeExpired() {
    toast({
      title: intl.formatMessage({
        id: "recipient-view.expired-code-title",
        defaultMessage: "Expired code",
      }),
      description: intl.formatMessage({
        id: "recipient-view.expired-code-description",
        defaultMessage: "The code has expired. Please try again.",
      }),
      status: "error",
      duration: 3000,
      isClosable: true,
    });
    setState({ step: "REQUEST" });
  }

  async function handleSubmitCode(event: FormEvent) {
    event.preventDefault();
    if (state.step === "REQUEST" || state.step === "VERIFIED") {
      return;
    }
    if (isPast(new Date(state.expiresAt))) {
      codeExpired();
    }
    if (state.token && code.length === 6) {
      try {
        const { data } = await publicCheckVerificationCode({
          variables: { keycode, token: state.token, code },
        });
        if (!data) {
          return;
        }
        const { result, remainingAttempts } = data.publicCheckVerificationCode;
        if (result === "SUCCESS") {
          setCode("");
          setState({ step: "VERIFIED" });
          router.replace(resolveUrl(`${router.pathname}/1`, router.query));
        } else {
          setCode("");
          firstInputRef.current!.focus();
          setState({
            ...state,
            remainingAttempts: remainingAttempts!,
            isInvalid: true,
          });
          if (remainingAttempts === 0) {
            codeExpired();
          }
        }
      } catch {
        codeExpired();
      }
    }
  }
  return (
    <>
      <Head>
        <title>Parallel</title>
      </Head>
      <Box backgroundColor="gray.50" minHeight="100vh">
        <Container
          display="flex"
          flexDirection="column"
          justifyContent="center"
          minHeight="100vh"
        >
          <Card padding={{ base: 4, sm: 8 }} marginY={4}>
            <Stack spacing={8}>
              <Center>
                {orgLogoUrl ? (
                  <Box
                    role="img"
                    aria-label={orgName}
                    width="200px"
                    margin="auto"
                    height="60px"
                    backgroundImage={`url("${orgLogoUrl}")`}
                    backgroundSize="contain"
                    backgroundPosition="center"
                    backgroundRepeat="no-repeat"
                  />
                ) : (
                  <Logo width="200px" />
                )}
              </Center>
              <Center>
                <Image
                  maxWidth="320px"
                  role="presentation"
                  src={`${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/undraw_mobile_devices.svg`}
                />
              </Center>
              <Text>
                <FormattedMessage
                  id="recipient-view.verify-1"
                  defaultMessage="It looks like you are trying to access this page from a new device."
                />
              </Text>
              <Text>
                <FormattedMessage
                  id="recipient-view.verify-2"
                  defaultMessage="To ensure the privacy of your data, we need to verify your identity with a code you will receive on your email {email}."
                  values={{
                    email: (
                      <Text as="span" fontWeight="bold">
                        {email.replace(/\*/g, "\u25CF")}
                      </Text>
                    ),
                  }}
                />
              </Text>
              {state.step === "REQUEST" ? (
                <Center>
                  <Button
                    colorScheme="purple"
                    isLoading={isSendingCode}
                    onClick={handleSendVerificationCode}
                  >
                    <FormattedMessage
                      id="recipient-view.send-code"
                      defaultMessage="Send verification code"
                    />
                  </Button>
                </Center>
              ) : state.step === "VERIFY" ? (
                <Flex
                  flexDirection="column"
                  alignItems="center"
                  as="form"
                  onSubmit={handleSubmitCode}
                >
                  <HStack
                    sx={{
                      "> :not(style) ~ :not(style):nth-of-type(4)": {
                        marginLeft: 8,
                      },
                    }}
                  >
                    <PinInput
                      autoFocus
                      value={code}
                      onChange={setCode}
                      isInvalid={state.isInvalid}
                    >
                      <PinInputField ref={firstInputRef} />
                      <PinInputField />
                      <PinInputField />
                      <PinInputField />
                      <PinInputField />
                      <PinInputField />
                    </PinInput>
                  </HStack>
                  {state.isInvalid ? (
                    <Text color="red.500" fontSize="sm" marginTop={2}>
                      <FormattedMessage
                        id="recipient-view.remaining-attempts"
                        defaultMessage="You have {attempts, plural, =1{one more attempt} other{# more attempts}}"
                        values={{ attempts: state.remainingAttempts }}
                      />
                    </Text>
                  ) : null}
                  <Button
                    type="submit"
                    colorScheme="purple"
                    isLoading={isVerifyingCode}
                    isDisabled={code.length < 6}
                    marginTop={4}
                  >
                    <FormattedMessage
                      id="recipient-view.verify-button"
                      defaultMessage="Verify code"
                    />
                  </Button>
                </Flex>
              ) : state.step === "VERIFIED" ? (
                <Center height="96px">
                  <ScaleFade initialScale={0} in={true}>
                    <Center
                      backgroundColor="green.500"
                      borderRadius="full"
                      boxSize="96px"
                    >
                      <CheckIcon color="white" boxSize="64px" />
                    </Center>
                  </ScaleFade>
                </Center>
              ) : null}
            </Stack>
          </Card>
        </Container>
      </Box>
    </>
  );
}

export async function getServerSideProps({
  query: { locale, keycode },
  req,
  res,
}: GetServerSidePropsContext): Promise<
  GetServerSidePropsResult<RecipientViewVerifyProps>
> {
  const client = createApolloClient({}, { req });
  const { data } = await client.mutate<
    RecipientView_verifyPublicAccessMutation,
    RecipientView_verifyPublicAccessMutationVariables
  >({
    mutation: gql`
      mutation RecipientView_verifyPublicAccess(
        $token: ID!
        $keycode: ID!
        $ip: String
        $userAgent: String
      ) {
        verifyPublicAccess(
          token: $token
          keycode: $keycode
          ip: $ip
          userAgent: $userAgent
        ) {
          isAllowed
          cookieName
          cookieValue
          email
          orgName
          orgLogoUrl
        }
      }
    `,
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
    mutation publicSendVerificationCode($keycode: ID!) {
      publicSendVerificationCode(keycode: $keycode) {
        token
        remainingAttempts
        expiresAt
      }
    }
  `,
  gql`
    mutation publicCheckVerificationCode(
      $keycode: ID!
      $token: ID!
      $code: String!
    ) {
      publicCheckVerificationCode(
        keycode: $keycode
        token: $token
        code: $code
      ) {
        result
        remainingAttempts
      }
    }
  `,
];

export default withApolloData(RecipientViewVerify);
