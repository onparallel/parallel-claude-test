import { gql, useMutation } from "@apollo/client";
import { Box, Button, Center, Heading, Image, ScaleFade, Stack, Text } from "@chakra-ui/react";
import { CheckIcon } from "@parallel/chakra/icons";
import { Card } from "@parallel/components/common/Card";
import { Logo } from "@parallel/components/common/Logo";
import { RecipientViewPinForm } from "@parallel/components/recipient-view/RecipientViewPinForm";
import {
  RecipientViewNewDevice_publicCheckVerificationCodeDocument,
  RecipientViewNewDevice_PublicOrganizationFragment,
  RecipientViewNewDevice_publicSendVerificationCodeDocument,
} from "@parallel/graphql/__types";
import { resolveUrl } from "@parallel/utils/next";
import { useCodeExpiredToast } from "@parallel/utils/useCodeExpiredToast";
import { isPast } from "date-fns";
import { useRouter } from "next/router";
import { useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { omit } from "remeda";
import { useTone } from "../common/ToneProvider";

type RecipientViewNewDeviceState =
  | { step: "REQUEST" }
  | {
      step: "VERIFY";
      isInvalid?: boolean;
      token: string;
      expiresAt: string;
      remainingAttempts: number;
    }
  | { step: "VERIFIED" };

interface RecipientViewNewDeviceProps {
  email: string;
  organization: RecipientViewNewDevice_PublicOrganizationFragment;
}

export function RecipientViewNewDevice({ organization, email }: RecipientViewNewDeviceProps) {
  const intl = useIntl();
  const codeExpiredToast = useCodeExpiredToast();
  const router = useRouter();
  const { query } = router;
  const tone = useTone();
  const keycode = query.keycode as string;

  const [state, setState] = useState<RecipientViewNewDeviceState>({
    step: "REQUEST",
  });

  const [sendVerificationCode, { loading: isSendingCode }] = useMutation(
    RecipientViewNewDevice_publicSendVerificationCodeDocument
  );

  const [publicCheckVerificationCode, { loading: isVerifyingCode }] = useMutation(
    RecipientViewNewDevice_publicCheckVerificationCodeDocument
  );

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

  function codeExpired() {
    codeExpiredToast();
    setState({ step: "REQUEST" });
  }

  async function handleSubmitCode(code: string) {
    if (state.step !== "VERIFY") {
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
          setState({ step: "VERIFIED" });
          router.replace(resolveUrl(`${router.pathname}/1`, router.query));
        } else {
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
    <Card
      padding={{ base: 6, sm: 8 }}
      paddingBottom={organization.hasRemoveParallelBranding ? undefined : { base: 12, sm: 12 }}
      position="relative"
    >
      <Stack spacing={8}>
        <Box>
          {organization.logoUrl340 ? (
            <Image
              alt={organization.name}
              src={organization.logoUrl340}
              objectFit="contain"
              width="170px"
              height="60px"
            />
          ) : (
            <Logo width="170px" />
          )}
        </Box>
        <Stack spacing={4}>
          <Heading fontSize="2xl">
            <FormattedMessage
              id="recipient-view.verify-title"
              defaultMessage="Enter verification code"
              values={{ tone }}
            />
          </Heading>
          <Text>
            <FormattedMessage
              id="recipient-view.verify-1"
              defaultMessage="It looks like you are trying to access this page from a new device."
              values={{ tone }}
            />
          </Text>
          <Text>
            <FormattedMessage
              id="recipient-view.verify-2"
              defaultMessage="To ensure the privacy of your data, we need to verify your identity with a code you will receive on your email {email}."
              values={{
                tone,
                email: (
                  <Text as="span" fontWeight="bold">
                    {email && email.replace(/\*/g, "\u25CF")}
                  </Text>
                ),
              }}
            />
          </Text>
        </Stack>
        {state.step === "REQUEST" ? (
          <Center>
            <Button
              colorScheme="primary"
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
          <RecipientViewPinForm
            onSubmit={handleSubmitCode}
            isInvalid={state.isInvalid}
            isLoading={isVerifyingCode}
            remainingAttempts={state.remainingAttempts}
          />
        ) : state.step === "VERIFIED" ? (
          <Center height="96px">
            <ScaleFade initialScale={0} in={true}>
              <Center backgroundColor="green.500" borderRadius="full" boxSize="96px">
                <CheckIcon color="white" boxSize="64px" />
              </Center>
            </ScaleFade>
          </Center>
        ) : null}
      </Stack>
      {organization.hasRemoveParallelBranding ? null : (
        <Box
          position="absolute"
          right={0}
          bottom={0}
          as="a"
          href={`https://www.onparallel.com/${intl.locale}?ref=parallel_public_link`}
          target="_blank"
          backgroundColor="gray.200"
          borderTopLeftRadius="xl"
          paddingX={4}
          paddingY={1.5}
          fontSize="sm"
          whiteSpace="nowrap"
        >
          <FormattedMessage
            id="recipient-view.created-with"
            defaultMessage="Created with {parallel}"
            values={{ parallel: <Text as="b">Parallel</Text> }}
          />
        </Box>
      )}
    </Card>
  );
}

RecipientViewNewDevice.fragments = {
  PublicOrganization: gql`
    fragment RecipientViewNewDevice_PublicOrganization on PublicOrganization {
      name
      logoUrl340: logoUrl(options: { resize: { width: 340, height: 120, fit: inside } })
      hasRemoveParallelBranding
    }
  `,
};

const _mutations = [
  gql`
    mutation RecipientViewNewDevice_publicSendVerificationCode($keycode: ID!) {
      publicSendVerificationCode(keycode: $keycode) {
        token
        remainingAttempts
        expiresAt
      }
    }
  `,
  gql`
    mutation RecipientViewNewDevice_publicCheckVerificationCode(
      $keycode: ID!
      $token: ID!
      $code: String!
    ) {
      publicCheckVerificationCode(keycode: $keycode, token: $token, code: $code) {
        result
        remainingAttempts
      }
    }
  `,
];
