import { Img, Stack, Text } from "@chakra-ui/react";
import { Logo } from "@parallel/components/common/Logo";
import { FormattedMessage } from "react-intl";

interface PublicPetitionReminderProps {
  organizationName: string;
  logoUrl?: string | null;
  email: string;
}

export function PublicPetitionReminder({
  organizationName,
  logoUrl,
  email,
}: PublicPetitionReminderProps) {
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
          height="40px"
          objectFit="contain"
        />
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
              id="public-petition-reminder.body.explanation-1"
              defaultMessage="We have sent a reminder to <b>{email}</b> with a link to your ongoing process so you can get back and continue completing it."
              values={{ email }}
            />
          </Text>
          <Text>
            <FormattedMessage
              id="public-petition-reminder.body.explanation-2"
              defaultMessage="Can’t find our email? Check your spam folder and if you still can't find it contact with the person who shared you the link."
            />
          </Text>
        </Stack>
      </Stack>
    </Stack>
  );
}
