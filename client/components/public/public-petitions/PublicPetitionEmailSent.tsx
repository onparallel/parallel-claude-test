import { Img, Stack } from "@chakra-ui/react";
import { Logo } from "@parallel/components/common/Logo";
import { FormattedMessage } from "react-intl";
import { Text } from "@parallel/components/ui";

interface PublicPetitionEmailSentProps {
  organizationName: string;
  logoUrl?: string | null;
  email: string;
  hasExistingProcess?: boolean;
}

export function PublicPetitionEmailSent({
  organizationName,
  logoUrl,
  email,
  hasExistingProcess,
}: PublicPetitionEmailSentProps) {
  return (
    <Stack
      spacing={{ base: 6, md: 8 }}
      maxWidth="container.sm"
      width="100%"
      margin="0 auto"
      alignItems="flex-start"
    >
      {logoUrl ? (
        <Img
          src={logoUrl}
          aria-label={organizationName}
          width="auto"
          maxWidth="170px"
          height="auto"
          maxHeight="80px"
          objectFit="contain"
        />
      ) : (
        <Logo width="152px" height="40px" />
      )}

      <Stack spacing={4} width="100%">
        <Text fontSize="2xl" fontWeight="bold">
          <FormattedMessage
            id="public-petition-email-sent.title"
            defaultMessage="Check your inbox"
          />
        </Text>
        <Stack spacing={4}>
          <Text>
            {hasExistingProcess ? (
              <FormattedMessage
                id="public-petition-email-sent.body.explanation-existing-process"
                defaultMessage="You have an existing process with this email ({email}). We have resent you the access so you can continue with it."
                values={{ email: <Text as="b">{email}</Text> }}
              />
            ) : (
              <FormattedMessage
                id="public-petition-email-sent.body.explanation-1"
                defaultMessage="We have sent an email to {email} with access to complete the information. This will help us verify your email and ensure your privacy and security."
                values={{ email: <Text as="b">{email}</Text> }}
              />
            )}
          </Text>
          <Text>
            <FormattedMessage
              id="public-petition-email-sent.body.explanation-2"
              defaultMessage="Can't find our email? Check your spam folder and if you don't find it contact with the person who shared you the link."
            />
          </Text>
        </Stack>
      </Stack>
    </Stack>
  );
}
