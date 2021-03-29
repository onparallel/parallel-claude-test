import { gql, useMutation } from "@apollo/client";
import {
  Alert,
  AlertIcon,
  Box,
  Button,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Heading,
  Stack,
  Text,
  useToast,
} from "@chakra-ui/react";
import { withDialogs } from "@parallel/components/common/DialogProvider";
import { PasswordInput } from "@parallel/components/common/PasswordInput";
import {
  withApolloData,
  WithApolloDataContext,
} from "@parallel/components/common/withApolloData";
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
  } = useForm<PasswordChangeFormData>();

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
    <SettingsLayout
      title={intl.formatMessage({
        id: "settings.security",
        defaultMessage: "Security",
      })}
      basePath="/app/settings"
      sections={sections}
      user={me}
      sectionsHeader={
        <FormattedMessage id="settings.title" defaultMessage="Settings" />
      }
      header={
        <FormattedMessage id="settings.security" defaultMessage="Security" />
      }
    >
      <Stack padding={4} alignItems="stretch" flex="1" maxWidth="container.2xs">
        <Heading as="h4" size="md" fontWeight="normal">
          <FormattedMessage
            id="settings.security.password-header"
            defaultMessage="Change password"
          />
        </Heading>
        <Alert>
          <AlertIcon />
          <FormattedMessage
            id="settings.security.sso-user-explanation"
            defaultMessage="SSO users are not able to change passwords"
          />
        </Alert>
        <Stack as="form" onSubmit={handleSubmit(onChangePassword)}>
          <FormControl
            id="password"
            isInvalid={!!errors.password}
            isDisabled={me.isSsoUser}
          >
            <FormLabel>
              <FormattedMessage
                id="generic.forms.old-password-label"
                defaultMessage="Old password"
              />
            </FormLabel>
            <PasswordInput {...register("password", { required: true })} />
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
            {errors.newPassword && (
              <FormErrorMessage>
                <FormattedMessage
                  id="generic.forms.password-policy-error"
                  defaultMessage="The password must have a least 8 characters"
                />
              </FormErrorMessage>
            )}
          </FormControl>
          <FormControl
            id="new-password2"
            isInvalid={!!errors.newPassword2}
            isDisabled={me.isSsoUser}
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
            {errors.newPassword2 && (
              <FormErrorMessage>
                <FormattedMessage
                  id="generic.forms.passwords-must-match"
                  defaultMessage="Passwords must match"
                />
              </FormErrorMessage>
            )}
          </FormControl>
          <Button type="submit" colorScheme="purple" isDisabled={me.isSsoUser}>
            <FormattedMessage
              id="settings.account.change-password-button"
              defaultMessage="Change password"
            />
          </Button>
        </Stack>
      </Stack>
    </SettingsLayout>
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
