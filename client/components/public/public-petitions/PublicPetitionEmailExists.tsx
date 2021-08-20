import { Button, Img, Stack, Text } from "@chakra-ui/react";
import { Logo } from "@parallel/components/common/Logo";
import { PublicPetitionLinkOwnerOrganization } from "@parallel/graphql/__types";
import { HandleNewPublicPetitionProps } from "@parallel/pages/[locale]/pp/[linkId]";
import { FormattedMessage } from "react-intl";

export type PublicPetitionEmailSendedProps = {
  organization: PublicPetitionLinkOwnerOrganization;
  onNewPetition: ({ formData, force }: HandleNewPublicPetitionProps) => void;
  onContinue: () => void;
  isNewRequestLoading: boolean;
  isReminderLoading: boolean;
};

export function PublicPetitionEmailExists({
  organization,
  onNewPetition,
  onContinue,
  isNewRequestLoading,
  isReminderLoading,
}: PublicPetitionEmailSendedProps) {
  return (
    <Stack spacing={{ base: 6, md: 8 }} maxWidth="container.sm" width="100%" margin="0 auto">
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
            id="public-petition-email-exists.title"
            defaultMessage="Existing mail"
          />
        </Text>
        <Text>
          <FormattedMessage
            id="public-petition-email-exists.body"
            defaultMessage="There is already an access associated to this contact. If you start a new petition, new access will be created to complete the information afresh. What do you want to do?"
          />
        </Text>

        <Stack spacing={4} paddingTop={4} direction={{ base: "column", md: "row" }}>
          <Button
            width="100%"
            variant="outline"
            size="md"
            fontSize="md"
            onClick={() => onNewPetition({ force: true })}
            isLoading={isNewRequestLoading}
          >
            <FormattedMessage
              id="public-petition-email-exists.new-petition-button"
              defaultMessage="Start new petition"
            />
          </Button>
          <Button
            width="100%"
            colorScheme="purple"
            size="md"
            fontSize="md"
            onClick={onContinue}
            isLoading={isReminderLoading}
          >
            <FormattedMessage
              id="public-petition-email-exists.continue-existing-button"
              defaultMessage="Continue the existing"
            />
          </Button>
        </Stack>
      </Stack>
    </Stack>
  );
}
