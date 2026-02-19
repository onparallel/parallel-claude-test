import { FormControl, FormErrorMessage, FormLabel, Input } from "@chakra-ui/react";
import { Box, Button, Stack, Text } from "@parallel/components/ui";
import { useForm } from "react-hook-form";
import { FormattedMessage } from "react-intl";

interface PublicSignupFormNameData {
  firstName: string;
  lastName: string;
}

interface PublicSignupFormNameProps {
  onNext: (data: PublicSignupFormNameData) => void;
}

export function PublicSignupFormName({ onNext }: PublicSignupFormNameProps) {
  const {
    handleSubmit,
    register,
    formState: { errors },
  } = useForm<PublicSignupFormNameData>({
    defaultValues: {
      firstName: "",
      lastName: "",
    },
  });

  return (
    <Box
      as="form"
      onSubmit={handleSubmit(({ firstName, lastName }) => {
        onNext({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
        });
      })}
    >
      <Text color="gray.500" fontSize="sm">
        1/3
      </Text>
      <Stack gap={4}>
        <Text as="h1" fontSize="2xl" fontWeight="bold" marginTop={0}>
          <FormattedMessage
            id="component.public-signup-form-name.heading"
            defaultMessage="What's your name?"
          />
        </Text>
        <Text marginBottom={2}>
          <FormattedMessage
            id="component.public-signup-form-name.description"
            defaultMessage="To start with, a couple of quick facts so we know how to address you."
          />
        </Text>
        <FormControl id="first-name" isInvalid={!!errors.firstName}>
          <FormLabel>
            <FormattedMessage
              id="component.public-signup-form-name.first-name-label"
              defaultMessage="First name*"
            />
          </FormLabel>
          <Input
            {...register("firstName", {
              required: true,
              validate: (v) => v.trim().length > 0,
            })}
            autoFocus
            autoComplete="given-name"
          />

          <FormErrorMessage>
            <FormattedMessage
              id="component.public-signup-form-name.invalid-first-name-error"
              defaultMessage="Please, enter a name"
            />
          </FormErrorMessage>
        </FormControl>
        <FormControl id="last-name" isInvalid={!!errors.lastName}>
          <FormLabel>
            <FormattedMessage
              id="component.public-signup-form-name.last-name-label"
              defaultMessage="Last name*"
            />
          </FormLabel>
          <Input
            {...register("lastName", {
              required: true,
              validate: (v) => v.trim().length > 0,
            })}
            autoComplete="family-name"
          />

          <FormErrorMessage>
            <FormattedMessage
              id="component.public-signup-form-name.invalid-last-name-error"
              defaultMessage="Please, enter a last name"
            />
          </FormErrorMessage>
        </FormControl>
      </Stack>
      <Box marginTop={8}>
        <Button width="100%" colorPalette="primary" type="submit">
          <FormattedMessage id="generic.continue" defaultMessage="Continue" />
        </Button>
      </Box>
    </Box>
  );
}
