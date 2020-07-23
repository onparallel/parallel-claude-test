import { gql, useMutation } from "@apollo/client";
import {
  Box,
  Button,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Heading,
  Stack,
  useToast,
} from "@chakra-ui/core";
import { PasswordInput } from "@parallel/components/common/PasswordInput";
import {
  withApolloData,
  WithApolloDataContext,
} from "@parallel/components/common/withApolloData";
import { AppLayout } from "@parallel/components/layout/AppLayout";
import { SettingsLayout } from "@parallel/components/layout/SettingsLayout";
import {
  SecurityQuery,
  Security_updatePasswordMutation,
  Security_updatePasswordMutationVariables,
  useSecurityQuery,
} from "@parallel/graphql/__types";
import { assertQuery } from "@parallel/utils/apollo";
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
  const {
    data: { me },
  } = assertQuery(useSecurityQuery());
  const [updatePassword] = useUpdatePassword();
  const { handleSubmit, register, errors, getValues, setError } = useForm<
    PasswordChangeFormData
  >();

  async function onChangePassword({
    password,
    newPassword,
  }: PasswordChangeFormData) {
    const { data } = await updatePassword({
      variables: { password, newPassword },
    });
    if (data) {
      switch (data.changePassword) {
        case "INCORRECT_PASSWORD":
          setError("password", { type: "validate" });
          break;
        case "SUCCESS":
          toast({
            title: intl.formatMessage({
              id: "settings.security.password-change-toast-title",
              defaultMessage: "Password changed",
            }),
            description: intl.formatMessage({
              id: "settings.security.password-change-toast-description",
              defaultMessage: "Your password has been successfully changed.",
            }),
            status: "success",
            isClosable: true,
          });
      }
    }
  }

  return (
    <AppLayout
      title={intl.formatMessage({
        id: "settings.security",
        defaultMessage: "Security",
      })}
      user={me}
    >
      <SettingsLayout
        header={
          <FormattedMessage id="settings.security" defaultMessage="Security" />
        }
      >
        <Box padding={4}>
          <Heading as="h4" size="md" fontWeight="normal" marginBottom={2}>
            <FormattedMessage
              id="settings.security.password-header"
              defaultMessage="Change password"
            />
          </Heading>
          <Stack
            as="form"
            maxWidth="containers.xs"
            onSubmit={handleSubmit(onChangePassword)}
          >
            <FormControl isInvalid={!!errors.password}>
              <FormLabel htmlFor="password">
                <FormattedMessage
                  id="generic.forms.old-password-label"
                  defaultMessage="Old password"
                />
              </FormLabel>
              <PasswordInput
                id="password"
                name="password"
                ref={register({ required: true })}
              />
              {errors.password?.type === "required" && (
                <FormErrorMessage>
                  <FormattedMessage
                    id="generic.forms.required-old-password-error"
                    defaultMessage="Old password is required"
                  />
                </FormErrorMessage>
              )}
              {errors.password?.type === "validate" && (
                <FormErrorMessage>
                  <FormattedMessage
                    id="generic.forms.invalid-old-password-error"
                    defaultMessage="Old password is incorrect"
                  />
                </FormErrorMessage>
              )}
            </FormControl>
            <FormControl isInvalid={!!errors.newPassword}>
              <FormLabel htmlFor="new-password">
                <FormattedMessage
                  id="generic.forms.new-password-label"
                  defaultMessage="New password"
                />
              </FormLabel>
              <PasswordInput
                id="new-password"
                name="newPassword"
                ref={register({
                  required: true,
                  validate: (value) => value.length >= 8,
                })}
              />
              {errors.newPassword && (
                <FormErrorMessage>
                  <FormattedMessage
                    id="generic.forms.password-policy-error"
                    defaultMessage="The password must have a least 8 characters"
                  />
                </FormErrorMessage>
              )}
            </FormControl>
            <FormControl isInvalid={!!errors.newPassword2}>
              <FormLabel htmlFor="new-password2">
                <FormattedMessage
                  id="generic.forms.confirm-password-label"
                  defaultMessage="Confirm password"
                />
              </FormLabel>
              <PasswordInput
                id="new-password2"
                name="newPassword2"
                ref={register({
                  required: true,
                  validate: (value) => value === getValues().newPassword,
                })}
              />
              {errors.newPassword2 && (
                <FormErrorMessage>
                  <FormattedMessage
                    id="generic.forms.passwords-must-match"
                    defaultMessage="Passwords must match"
                  />
                </FormErrorMessage>
              )}
            </FormControl>
            <Box>
              <Button type="submit" variantColor="purple" mt="2">
                <FormattedMessage
                  id="settings.account.change-password-button"
                  defaultMessage="Change password"
                />
              </Button>
            </Box>
          </Stack>
        </Box>
      </SettingsLayout>
    </AppLayout>
  );
}

function useUpdatePassword() {
  return useMutation<
    Security_updatePasswordMutation,
    Security_updatePasswordMutationVariables
  >(gql`
    mutation Security_updatePassword(
      $password: String!
      $newPassword: String!
    ) {
      changePassword(password: $password, newPassword: $newPassword)
    }
  `);
}

Security.getInitialProps = async ({ fetchQuery }: WithApolloDataContext) => {
  await fetchQuery<SecurityQuery>(gql`
    query Security {
      me {
        id
        ...AppLayout_User
      }
    }
    ${AppLayout.fragments.User}
  `);
};

export default withApolloData(Security);
