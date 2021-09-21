import { gql, useMutation } from "@apollo/client";
import {
  Alert,
  AlertIcon,
  Button,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Heading,
  Stack,
  useToast,
} from "@chakra-ui/react";
import { Card } from "@parallel/components/common/Card";
import { withDialogs } from "@parallel/components/common/DialogProvider";
import { PasswordInput } from "@parallel/components/common/PasswordInput";
import { withApolloData, WithApolloDataContext } from "@parallel/components/common/withApolloData";
import { SettingsLayout } from "@parallel/components/layout/SettingsLayout";
import {
  SecurityQuery,
  Security_updatePasswordMutation,
  Security_updatePasswordMutationVariables,
  useSecurityQuery,
} from "@parallel/graphql/__types";
import { assertQuery } from "@parallel/utils/apollo/assertQuery";
import { compose } from "@parallel/utils/compose";
import { useSettingsSections } from "@parallel/utils/useSettingsSections";
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
  const sections = useSettingsSections(me);

  const [updatePassword] = useUpdatePassword();
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
        case "SUCCESS":
          reset();
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
    <SettingsLayout
      title={intl.formatMessage({
        id: "settings.security",
        defaultMessage: "Security",
      })}
      basePath="/app/settings"
      sections={sections}
      user={me}
      sectionsHeader={<FormattedMessage id="settings.title" defaultMessage="Settings" />}
      header={
        <Heading as="h3" size="md">
          <FormattedMessage id="settings.security" defaultMessage="Security" />
        </Heading>
      }
    >
      <Card margin={4} height="fit-content">
        <Stack padding={4} alignItems="stretch" flex="1" maxWidth="container.2xs" spacing={4}>
          <Heading as="h4" size="md" fontWeight="normal">
            <FormattedMessage
              id="settings.security.password-header"
              defaultMessage="Change password"
            />
          </Heading>
          {me.isSsoUser ? (
            <Alert>
              <AlertIcon />
              <FormattedMessage
                id="settings.security.sso-user-explanation"
                defaultMessage="SSO users are not able to change passwords"
              />
            </Alert>
          ) : null}
          <Stack as="form" onSubmit={handleSubmit(onChangePassword)}>
            <FormControl id="password" isInvalid={!!errors.password} isDisabled={me.isSsoUser}>
              <FormLabel>
                <FormattedMessage
                  id="generic.forms.old-password-label"
                  defaultMessage="Old password"
                />
              </FormLabel>
              <PasswordInput {...register("password", { required: true })} />
              <FormErrorMessage>
                {errors.password?.type === "required" ? (
                  <FormattedMessage
                    id="generic.forms.required-old-password-error"
                    defaultMessage="Old password is required"
                  />
                ) : errors.password?.type === "validate" ? (
                  <FormattedMessage
                    id="generic.forms.invalid-old-password-error"
                    defaultMessage="Old password is incorrect"
                  />
                ) : null}
              </FormErrorMessage>
            </FormControl>
            <FormControl
              id="new-password"
              isInvalid={!!errors.newPassword}
              isDisabled={me.isSsoUser}
            >
              <FormLabel>
                <FormattedMessage
                  id="generic.forms.new-password-label"
                  defaultMessage="New password"
                />
              </FormLabel>
              <PasswordInput
                {...register("newPassword", {
                  required: true,
                  validate: (value) => value.length >= 8,
                })}
              />
              <FormErrorMessage>
                {errors.newPassword?.type === "invalid" ? (
                  <FormattedMessage
                    id="generic.forms.invalid-password-policy-error"
                    defaultMessage="Please choose a stronger password"
                  />
                ) : (
                  <FormattedMessage
                    id="generic.forms.password-policy-error"
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
              <FormLabel>
                <FormattedMessage
                  id="generic.forms.confirm-password-label"
                  defaultMessage="Confirm password"
                />
              </FormLabel>
              <PasswordInput
                {...register("newPassword2", {
                  required: true,
                  validate: (value) => value === getValues().newPassword,
                })}
              />
              <FormErrorMessage>
                <FormattedMessage
                  id="generic.forms.passwords-must-match"
                  defaultMessage="Passwords must match"
                />
              </FormErrorMessage>
            </FormControl>
            <Button type="submit" colorScheme="purple" isDisabled={me.isSsoUser}>
              <FormattedMessage
                id="settings.account.change-password-button"
                defaultMessage="Change password"
              />
            </Button>
          </Stack>
        </Stack>
      </Card>
    </SettingsLayout>
  );
}

function useUpdatePassword() {
  return useMutation<Security_updatePasswordMutation, Security_updatePasswordMutationVariables>(gql`
    mutation Security_updatePassword($password: String!, $newPassword: String!) {
      changePassword(password: $password, newPassword: $newPassword)
    }
  `);
}

Security.getInitialProps = async ({ fetchQuery }: WithApolloDataContext) => {
  await fetchQuery<SecurityQuery>(gql`
    query Security {
      me {
        isSsoUser
        ...SettingsLayout_User
        ...useSettingsSections_User
      }
    }
    ${SettingsLayout.fragments.User}
    ${useSettingsSections.fragments.User}
  `);
};

export default compose(withDialogs, withApolloData)(Security);
