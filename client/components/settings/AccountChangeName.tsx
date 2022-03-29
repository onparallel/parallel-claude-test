import { gql } from "@apollo/client";
import {
  Alert,
  AlertIcon,
  Button,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Heading,
  Input,
  Stack,
  StackProps,
} from "@chakra-ui/react";
import { AccountChangeName_UserFragment } from "@parallel/graphql/__types";
import { useForm } from "react-hook-form";
import { FormattedMessage } from "react-intl";

export interface AccountChangeNameData {
  firstName: string;
  lastName: string;
}

interface AccountChangeNameProps extends Omit<StackProps, "onSubmit"> {
  user: AccountChangeName_UserFragment;
  onSubmit: (args: AccountChangeNameData) => void;
}

export function AccountChangeName({ user, onSubmit, ...props }: AccountChangeNameProps) {
  const {
    handleSubmit,
    register,
    reset,
    formState: { errors, isDirty },
  } = useForm<AccountChangeNameData>({
    defaultValues: {
      firstName: user.firstName ?? undefined,
      lastName: user.lastName ?? undefined,
    },
  });

  return (
    <Stack {...props}>
      <Heading as="h4" size="md" marginBottom={2}>
        <FormattedMessage id="settings.account.name-header" defaultMessage="Name" />
      </Heading>
      {user.isSsoUser ? (
        <Alert borderRadius="md">
          <AlertIcon />
          <FormattedMessage
            id="settings.account.sso-user-explanation"
            defaultMessage="SSO users are not able to change their name"
          />
        </Alert>
      ) : null}
      <Stack
        as="form"
        onSubmit={handleSubmit((values) => {
          onSubmit(values);
          reset(values);
        })}
        spacing={4}
      >
        <FormControl id="first-name" isInvalid={!!errors.firstName} isDisabled={user.isSsoUser}>
          <FormLabel fontWeight="semibold">
            <FormattedMessage id="generic.forms.first-name-label" defaultMessage="First name" />
          </FormLabel>
          <Input
            backgroundColor="white"
            {...register("firstName", { required: true, maxLength: 255 })}
          />
          <FormErrorMessage>
            <FormattedMessage
              id="generic.forms.required-first-name-error"
              defaultMessage="First name is required"
            />
          </FormErrorMessage>
        </FormControl>
        <FormControl
          id="last-name"
          isInvalid={!!errors.lastName}
          isDisabled={user.isSsoUser}
          mb={2}
        >
          <FormLabel fontWeight="semibold">
            <FormattedMessage id="generic.forms.last-name-label" defaultMessage="Last name" />
          </FormLabel>
          <Input
            backgroundColor="white"
            {...register("lastName", { required: true, maxLength: 255 })}
          />
          <FormErrorMessage>
            <FormattedMessage
              id="generic.forms.required-last-name-error"
              defaultMessage="Last name is required"
            />
          </FormErrorMessage>
        </FormControl>
        <Button
          type="submit"
          colorScheme="purple"
          isDisabled={user.isSsoUser || !isDirty}
          width="min-content"
        >
          <FormattedMessage id="generic.save" defaultMessage="Save" />
        </Button>
      </Stack>
    </Stack>
  );
}

AccountChangeName.fragments = {
  User: gql`
    fragment AccountChangeName_User on User {
      firstName
      lastName
      isSsoUser
    }
  `,
};
