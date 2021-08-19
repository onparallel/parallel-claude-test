import { Img, Stack, Text } from "@chakra-ui/react";
import { Logo } from "@parallel/components/common/Logo";
import { PublicPetitionLinkOwnerOrganization } from "@parallel/graphql/__types";
import { FormattedMessage } from "react-intl";

export type PublicPetitionEmailSendedProps = {
  organization: PublicPetitionLinkOwnerOrganization;
  email: string;
};

export function PublicPetitionEmailSended({ organization, email }: PublicPetitionEmailSendedProps) {
  return (
    <Stack spacing={{ base: 6, md: 8 }} maxWidth="container.sm" width="100%" margin="0 auto">
      {organization.logoUrl ? (
        <Img src={organization.logoUrl} aria-label={organization.name} width="auto" height="40px" />
      ) : (
        <Logo width="152px" height="40px" />
      )}

      <Stack spacing={4} width="100%">
        <Text fontSize="2xl" fontWeight="bold">
          <FormattedMessage
            id="public-petition-email-sended.title"
            defaultMessage="Check your inbox"
          />
        </Text>
        <Stack spacing={4}>
          <Text>
            <FormattedMessage
              id="public-petition-email-sended.body.parraf-1"
              defaultMessage="We have sent an email to <b>{email}</b> with access to complete the information. This will help us verify your email and ensure the privacy and security of your data"
              values={{
                email,
                b: (chunks: any[]) => <Text as="b">{chunks}</Text>,
              }}
            />
          </Text>
          <Text>
            <FormattedMessage
              id="public-petition-email-sended.body.parraf-2"
              defaultMessage="Can't find our email? Check the spam tray and if it is not, contact the person who shared the link with you."
            />
          </Text>
        </Stack>
      </Stack>
    </Stack>
  );
}
