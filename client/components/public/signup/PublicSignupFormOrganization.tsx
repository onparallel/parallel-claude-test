import { Button, FormControl, FormLabel, Input, Stack, Text } from "@chakra-ui/react";
import { FormattedMessage } from "react-intl";

export type PublicSignupFormOrganizationProps = {
  onBack: () => void;
  onNext: () => void;
};

export function PublicSignupFormOrganization({
  onBack,
  onNext,
}: PublicSignupFormOrganizationProps) {
  return (
    <>
      <Text as="span" textStyle="muted" fontSize="sm">
        2/3
      </Text>
      <Stack spacing={4}>
        <Text as="h1" fontSize="2xl" fontWeight="bold" marginTop={0}>
          <FormattedMessage
            id="component.public-signup-form-organization.heading"
            defaultMessage="Set up your organization"
          />
        </Text>
        <Text marginBottom={2}>
          <FormattedMessage
            id="component.public-signup-form-organization.description"
            defaultMessage="Fill out your organization’s profile that your customers will see in your communications."
          />
        </Text>
        <FormControl id="company-name">
          <FormLabel>
            <FormattedMessage
              id="component.public-signup-form-organization.company-name-label"
              defaultMessage="Company name*"
            />
          </FormLabel>
          <Input name="company-name" type="text" required />
        </FormControl>

        <Stack spacing={4} paddingTop={4} direction={{ base: "column", md: "row" }}>
          <Button width="100%" variant="outline" size="md" fontSize="md" onClick={onBack}>
            <FormattedMessage
              id="component.public-signup-form-organization.go-back-button"
              defaultMessage="Go back"
            />
          </Button>
          <Button width="100%" colorScheme="purple" size="md" fontSize="md" onClick={onNext}>
            <FormattedMessage
              id="component.public-signup-form-organization.continue-button"
              defaultMessage="Continue"
            />
          </Button>
        </Stack>
      </Stack>
    </>
  );
}
