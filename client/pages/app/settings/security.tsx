import { gql } from "@apollo/client";
import { useMutation } from "@apollo/client/react";
import {
  Alert,
  AlertDescription,
  AlertIcon,
  Button,
  Divider,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Heading,
  Stack,
  useToast,
} from "@chakra-ui/react";
import { withDialogs } from "@parallel/components/common/dialogs/DialogProvider";
import { PasswordInput } from "@parallel/components/common/PasswordInput";
import { withApolloData, WithApolloDataContext } from "@parallel/components/common/withApolloData";
import { UserSettingsLayout } from "@parallel/components/layout/UserSettingsLayout";
import { Security_updatePasswordDocument, Security_userDocument } from "@parallel/graphql/__types";
import { useAssertQuery } from "@parallel/utils/apollo/useAssertQuery";
import { compose } from "@parallel/utils/compose";
import { useForm } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";

interface PasswordChangeFormData {
  password: string;
  newPassword: string;
  newPassword2: string;
}

function Security() {
  const toast = useToast();
  const intl = useIntl();
  const { data: queryObject } = useAssertQuery(Security_userDocument);
  const { me } = queryObject;
  const [updatePassword] = useMutation(Security_updatePasswordDocument);
  const {
    handleSubmit,
    register,
    formState: { errors },
    getValues,
    setError,
    reset,
  } = useForm<PasswordChangeFormData>({
    defaultValues: {
      password: "",
      newPassword: "",
      newPassword2: "",
    },
  });

  async function onChangePassword({ password, newPassword }: PasswordChangeFormData) {
    const { data } = await updatePassword({
      variables: { password, newPassword },
    });
    if (data) {
      switch (data.changePassword) {
        case "INVALID_NEW_PASSWORD":
          setError("newPassword", { type: "invalid" });
          break;
        case "INCORRECT_PASSWORD":
          setError("password", { type: "validate" });
          break;
        case "LIMIT_EXCEEDED":
          setError("password", { type: "limit-exceeded" });
          break;
        case "SUCCESS":
          reset();
          toast({
            title: intl.formatMessage({
              id: "page.security.password-change-toast-title",
              defaultMessage: "Password changed",
            }),
            description: intl.formatMessage({
              id: "page.security.password-change-toast-description",
              defaultMessage: "Your password has been successfully changed.",
            }),
            status: "success",
            isClosable: true,
          });
      }
    }
  }

  return (
    <UserSettingsLayout queryObject={queryObject}>
      <Stack padding={6} spacing={8} maxWidth="container.2xs" width="100%" paddingBottom={16}>
        <Stack spacing={4}>
          <Heading as="h4" size="md" fontWeight="semibold">
            <FormattedMessage id="page.security.password-header" defaultMessage="Change password" />
          </Heading>
          {me.isSsoUser ? (
            <Alert status="info" rounded="md">
              <AlertIcon />
              <AlertDescription>
                <FormattedMessage
                  id="page.security.sso-user-explanation"
                  defaultMessage="SSO users are not able to change passwords"
                />
              </AlertDescription>
            </Alert>
          ) : null}
          <Stack as="form" onSubmit={handleSubmit(onChangePassword)} spacing={4}>
            <FormControl id="password" isInvalid={!!errors.password} isDisabled={me.isSsoUser}>
              <FormLabel fontWeight="semibold">
                <FormattedMessage id="generic.old-password-label" defaultMessage="Old password" />
              </FormLabel>
              <PasswordInput
                backgroundColor="white"
                {...register("password", { required: true })}
              />
              <FormErrorMessage>
                {errors.password?.type === "required" ? (
                  <FormattedMessage
                    id="page.security.old-password-required-error"
                    defaultMessage="Old password is required"
                  />
                ) : errors.password?.type === "validate" ? (
                  <FormattedMessage
                    id="page.security.old-password-incorrect-error"
                    defaultMessage="Old password is incorrect"
                  />
                ) : errors.password?.type === "limit-exceeded" ? (
                  <FormattedMessage
                    id="page.security.attempt-limit-exceeded-error"
                    defaultMessage="You have exceeded the number of attempts. Please try again later."
                  />
                ) : null}
              </FormErrorMessage>
            </FormControl>
            <FormControl
              id="new-password"
              isInvalid={!!errors.newPassword}
              isDisabled={me.isSsoUser}
            >
              <FormLabel fontWeight="semibold">
                <FormattedMessage id="generic.new-password-label" defaultMessage="New password" />
              </FormLabel>
              <PasswordInput
                backgroundColor="white"
                {...register("newPassword", {
                  required: true,
                  validate: (value) => value.length >= 8,
                })}
              />
              <FormErrorMessage>
                {errors.newPassword?.type === "invalid" ? (
                  <FormattedMessage
                    id="generic.invalid-password-policy-error"
                    defaultMessage="Please choose a stronger password"
                  />
                ) : (
                  <FormattedMessage
                    id="generic.password-length-error"
                    defaultMessage="The password must have a least 8 characters"
                  />
                )}
              </FormErrorMessage>
            </FormControl>
            <FormControl
              id="new-password2"
              isInvalid={!!errors.newPassword2}
              isDisabled={me.isSsoUser}
              mb={2}
            >
              <FormLabel fontWeight="semibold">
                <FormattedMessage
                  id="generic.confirm-password-label"
                  defaultMessage="Confirm password"
                />
              </FormLabel>
              <PasswordInput
                backgroundColor="white"
                {...register("newPassword2", {
                  required: true,
                  validate: (value) => value === getValues().newPassword,
                })}
              />
              <FormErrorMessage>
                <FormattedMessage
                  id="generic.passwords-must-match-error"
                  defaultMessage="Passwords must match"
                />
              </FormErrorMessage>
            </FormControl>
            <Button type="submit" colorScheme="primary" isDisabled={me.isSsoUser}>
              <FormattedMessage
                id="page.account.change-password-button"
                defaultMessage="Change password"
              />
            </Button>
          </Stack>
        </Stack>
        <Divider borderColor="gray.300" />
      </Stack>
    </UserSettingsLayout>
  );
}

Security.mutations = [
  gql`
    mutation Security_updatePassword($password: String!, $newPassword: String!) {
      changePassword(password: $password, newPassword: $newPassword)
    }
  `,
];

Security.queries = [
  gql`
    query Security_user {
      ...UserSettingsLayout_Query
      me {
        id
        isSsoUser
      }
    }
  `,
];

Security.getInitialProps = async ({ fetchQuery }: WithApolloDataContext) => {
  await fetchQuery(Security_userDocument);
};

export default compose(withDialogs, withApolloData)(Security);
