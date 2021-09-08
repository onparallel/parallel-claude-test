import {
  Box,
  Button,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Input,
  Stack,
  Text,
} from "@chakra-ui/react";
import { useForm } from "react-hook-form";
import { FormattedMessage } from "react-intl";

type PublicSignupFormNameData = {
  firstName: string;
  lastName: string;
};

type PublicSignupFormNameProps = {
  onNext: (data: PublicSignupFormNameData) => void;
};

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
    <form
      onSubmit={handleSubmit(({ firstName, lastName }) => {
        onNext({ firstName, lastName });
      })}
    >
      <Text as="span" color="gray.500" fontSize="sm">
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
            })}
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
        <Box>
          <Button
            width="100%"
            colorScheme="purple"
            size="md"
            fontSize="md"
            marginTop={4}
            type="submit"
          >
            <FormattedMessage
              id="component.public-signup-form-name.continue-button"
              defaultMessage="Continue"
            />
          </Button>
        </Box>
      </Stack>
    </form>
  );
}
