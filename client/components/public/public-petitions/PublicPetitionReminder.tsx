import { Img, Stack, Text } from "@chakra-ui/react";
import { Logo } from "@parallel/components/common/Logo";
import { PublicPetitionLinkOwnerOrganization } from "@parallel/graphql/__types";
import { FormattedMessage } from "react-intl";

export type PublicPetitionReminderProps = {
  organization: PublicPetitionLinkOwnerOrganization;
  email: string;
};

export function PublicPetitionReminder({ organization, email }: PublicPetitionReminderProps) {
  return (
    <Stack spacing={{ base: 6, md: 8 }} maxWidth="container.sm" width="100%" margin="0 auto">
      {organization.logoUrl ? (
        <Img src={organization.logoUrl} aria-label={organization.name} width="auto" height="40px" />
      ) : (
        <Logo width="152px" height="40px" />
      )}

      <Stack spacing={4} width="100%">
        <Text fontSize="2xl" fontWeight="bold">
          <FormattedMessage id="public-petition-reminder.title" defaultMessage="Reminder sent" />
        </Text>
        <Stack spacing={4}>
          <Text>
            <FormattedMessage
              id="public-petition-reminder.body.parraf-1"
              defaultMessage="We have sent a reminder to <b>{email}</b> with access to your request so that you can access it again and continue completing it."
              values={{
                email,
                b: (chunks: any[]) => <Text as="b">{chunks}</Text>,
              }}
            />
          </Text>
          <Text>
            <FormattedMessage
              id="public-petition-reminder.body.parraf-2"
              defaultMessage="Can't find our email? Check the spam tray and if it is not, contact the person who shared the link with you."
            />
          </Text>
        </Stack>
      </Stack>
    </Stack>
  );
}
