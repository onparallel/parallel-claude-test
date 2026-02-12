import { Img } from "@chakra-ui/react";
import { Logo } from "@parallel/components/common/Logo";
import { Button, Stack, Text } from "@parallel/components/ui";
import { FormattedMessage } from "react-intl";

interface PublicPetitionEmailExistsProps {
  organizationName: string;
  logoUrl?: string | null;
  onNewPetition: (props: { force: boolean }) => void;
  onContinue: () => void;
  isNewRequestLoading: boolean;
  isReminderLoading: boolean;
}

export function PublicPetitionEmailExists({
  organizationName,
  logoUrl,
  onNewPetition,
  onContinue,
  isNewRequestLoading,
  isReminderLoading,
}: PublicPetitionEmailExistsProps) {
  return (
    <Stack
      gap={{ base: 6, md: 8 }}
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

      <Stack gap={4} width="100%">
        <Text fontSize="2xl" fontWeight="bold">
          <FormattedMessage
            id="public-petition-email-exists.title"
            defaultMessage="Existing email"
          />
        </Text>
        <Text>
          <FormattedMessage
            id="public-petition-email-exists.body"
            defaultMessage="There is already an ongoing process associated to this email. If you start a new process, you will have to fill the information from scratch. What would you like to do?"
          />
        </Text>

        <Stack gap={4} paddingTop={4} direction={{ base: "column", md: "row" }}>
          <Button
            width="100%"
            variant="outline"
            size="md"
            fontSize="md"
            onClick={() => onNewPetition({ force: true })}
            loading={isNewRequestLoading}
          >
            <FormattedMessage
              id="public-petition-email-exists.new-petition-button"
              defaultMessage="Start again"
            />
          </Button>
          <Button
            width="100%"
            colorPalette="primary"
            size="md"
            fontSize="md"
            onClick={onContinue}
            loading={isReminderLoading}
          >
            <FormattedMessage
              id="public-petition-email-exists.continue-existing-button"
              defaultMessage="Continue existing process"
            />
          </Button>
        </Stack>
      </Stack>
    </Stack>
  );
}
