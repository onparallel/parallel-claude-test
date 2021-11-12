import { Img, Stack, Text } from "@chakra-ui/react";
import { Logo } from "@parallel/components/common/Logo";
import { PublicPetitionLinkOwnerOrganization } from "@parallel/graphql/__types";
import { FormattedMessage } from "react-intl";

type PublicPetitionEmailSentProps = {
  organization: PublicPetitionLinkOwnerOrganization;
  email: string;
};

export function PublicPetitionEmailSent({ organization, email }: PublicPetitionEmailSentProps) {
  return (
    <Stack
      spacing={{ base: 6, md: 8 }}
      maxWidth="container.sm"
      width="100%"
      margin="0 auto"
      alignItems="flex-start"
    >
      {organization.logoUrl ? (
        <Img
          src={organization.logoUrl}
          aria-label={organization.name}
          width="auto"
          height="40px"
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
            <FormattedMessage
              id="public-petition-email-sent.body.explanation-1"
              defaultMessage="We have sent an email to <b>{email}</b> with access to complete the information. This will help us verify your email and ensure your privacy and security."
              values={{ email }}
            />
          </Text>
          <Text>
            <FormattedMessage
              id="public-petition-email-sent.body.explanation-2"
              defaultMessage="Can’t find our email? Check your spam folder and if you don’t find it contact with the person who shared you the link."
            />
          </Text>
        </Stack>
      </Stack>
    </Stack>
  );
}
