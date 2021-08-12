import { Box, Button, FormControl, FormLabel, Input, Stack, Text } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { FormattedMessage } from "react-intl";

export type PublicSignupFormNameProps = {
  onNext: ({ firstName, lastName }: { firstName: string; lastName: string }) => void;
};

export function PublicSignupFormName({ onNext }: PublicSignupFormNameProps) {
  const [firstName, setFirstName] = useState("");
  const [isInvalidFirstName, setIsInvalidFirstName] = useState(false);
  const [lastName, setLastName] = useState("");
  const [isInvalidLastName, setIsInvalidLastName] = useState(false);

  const handleNext = () => {
    if (!firstName) setIsInvalidFirstName(true);
    if (!lastName) setIsInvalidLastName(true);
    if (firstName && lastName) {
      onNext({ firstName, lastName });
    }
  };

  useEffect(() => {
    if (isInvalidFirstName) setIsInvalidFirstName(false);
  }, [firstName]);

  useEffect(() => {
    if (isInvalidLastName) setIsInvalidLastName(false);
  }, [lastName]);

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
          <Input
            name="first-name"
            type="text"
            autoComplete="given-name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            isInvalid={isInvalidFirstName}
          />
          {isInvalidFirstName && (
            <Text fontSize="sm" color="red.600" paddingTop={1}>
              <FormattedMessage
                id="component.public-signup-form-name.invalid-first-name-error"
                defaultMessage="Please, enter a name"
              />
            </Text>
          )}
        </FormControl>
        <FormControl id="last-name">
          <FormLabel>
            <FormattedMessage
              id="component.public-signup-form-name.last-name-label"
              defaultMessage="Last name*"
            />
          </FormLabel>
          <Input
            name="last-name"
            type="text"
            autoComplete="family-name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            isInvalid={isInvalidLastName}
          />
          {isInvalidLastName && (
            <Text fontSize="sm" color="red.600" paddingTop={1}>
              <FormattedMessage
                id="component.public-signup-form-name.invalid-last-name-error"
                defaultMessage="Please, enter a last name"
              />
            </Text>
          )}
        </FormControl>
        <Box>
          <Button
            width="100%"
            colorScheme="purple"
            size="md"
            fontSize="md"
            marginTop={4}
            onClick={handleNext}
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
