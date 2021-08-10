import { Box, Button, FormControl, FormLabel, Input, Stack, Text } from "@chakra-ui/react";
import { FormattedMessage } from "react-intl";

export type PublicSignupFormNameProps = {
  onNext: () => void;
};

export function PublicSignupFormName({ onNext }: PublicSignupFormNameProps) {
  return (
    <>
      <Text as="span" textStyle="muted" fontSize="sm">
        1/3
      </Text>
      <Stack spacing={4}>
        <Text as="h1" fontSize="2xl" fontWeight="bold" marginTop={0}>
          <FormattedMessage
            id="component.public-signup-form-name.heading"
            defaultMessage="What’s your name?"
          />
        </Text>
        <Text marginBottom={2}>
          <FormattedMessage
            id="component.public-signup-form-name.description"
            defaultMessage="To start with, a couple of quick facts so we know how to address you."
          />
        </Text>
        <FormControl id="first-name">
          <FormLabel>
            <FormattedMessage
              id="component.public-signup-form-name.first-name-label"
              defaultMessage="First name*"
            />
          </FormLabel>
          <Input name="first-name" type="first-name" autoComplete="first-name" required />
        </FormControl>
        <FormControl id="last-name">
          <FormLabel>
            <FormattedMessage
              id="component.public-signup-form-name.last-name-label"
              defaultMessage="Last name*"
            />
          </FormLabel>
          <Input name="last-name" type="last-name" autoComplete="last-name" required />
        </FormControl>
        <Box>
          <Button
            type="submit"
            width="100%"
            colorScheme="purple"
            size="md"
            fontSize="md"
            marginTop={4}
            onClick={onNext}
          >
            <FormattedMessage
              id="component.public-signup-form-name.continue-button"
              defaultMessage="Continue"
            />
          </Button>
        </Box>
      </Stack>
    </>
  );
}
