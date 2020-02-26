import { useMutation, useQuery } from "@apollo/react-hooks";
import {
  Box,
  Button,
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Heading,
  useToast
} from "@chakra-ui/core";
import { PasswordInput } from "@parallel/components/common/PasswordInput";
import { AppLayout } from "@parallel/components/layout/AppLayout";
import { SettingsLayout } from "@parallel/components/layout/SettingsLayout";
import { withData, WithDataContext } from "@parallel/components/withData";
import {
  SecurityQuery,
  updatePasswordMutation,
  updatePasswordMutationVariables
} from "@parallel/graphql/__types";
import { gql } from "apollo-boost";
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
  const { data } = useQuery<SecurityQuery>(GET_SECURITY_DATA);
  const { me } = data!;
  const [updatePassword] = useMutation<
    updatePasswordMutation,
    updatePasswordMutationVariables
  >(UPDATE_PASSWORD);
  const { handleSubmit, register, errors, getValues, setError } = useForm<
    PasswordChangeFormData
  >();
  async function onChangePassword({
    password,
    newPassword
  }: PasswordChangeFormData) {
    const { data } = await updatePassword({
      variables: { password, newPassword }
    });
    if (data) {
      switch (data.changePassword) {
        case "INCORRECT_PASSWORD":
          setError("password", "validate");
          break;
        case "SUCCESS":
          toast({
            title: intl.formatMessage({
              id: "settings.security.password-change-toast-title",
              defaultMessage: "Password changed"
            }),
            description: intl.formatMessage({
              id: "settings.security.password-change-toast-description",
              defaultMessage: "Your password has been successfully changed."
            }),
            status: "success",
            isClosable: true
          });
      }
    }
  }

  return (
    <AppLayout user={me}>
      <SettingsLayout
        header={
          <FormattedMessage id="settings.security" defaultMessage="Security" />
        }
      >
        <Box padding={4}>
          <Heading as="h4" size="sm" marginBottom={2}>
            <FormattedMessage
              id="settings.security.password-header"
              defaultMessage="Password"
            />
          </Heading>
          <form onSubmit={handleSubmit(onChangePassword)}>
            <Flex flexWrap="wrap" marginX={-2} direction="column">
              <Box
                flex="1"
                maxWidth="300px"
                minWidth="200px"
                paddingX={2}
                marginBottom={2}
              >
                <FormControl isInvalid={!!errors.password}>
                  <FormLabel htmlFor="password">
                    <FormattedMessage
                      id="generic.forms.password-label"
                      defaultMessage="Old password"
                    ></FormattedMessage>
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
                      ></FormattedMessage>
                    </FormErrorMessage>
                  )}
                  {errors.password?.type === "validate" && (
                    <FormErrorMessage>
                      <FormattedMessage
                        id="generic.forms.invalid-old-password-error"
                        defaultMessage="Old password is incorrect"
                      ></FormattedMessage>
                    </FormErrorMessage>
                  )}
                </FormControl>
              </Box>
              <Box
                flex="1"
                maxWidth="300px"
                minWidth="200px"
                paddingX={2}
                marginBottom={2}
              >
                <FormControl isInvalid={!!errors.newPassword}>
                  <FormLabel htmlFor="new-password">
                    <FormattedMessage
                      id="generic.forms.new-password-label"
                      defaultMessage="New password"
                    ></FormattedMessage>
                  </FormLabel>
                  <PasswordInput
                    id="new-password"
                    name="newPassword"
                    ref={register({
                      required: true,
                      validate: value => value.length >= 8
                    })}
                  />
                  {errors.newPassword && (
                    <FormErrorMessage>
                      <FormattedMessage
                        id="generic.forms.password-policy-error"
                        defaultMessage="The password must have a least 8 characters"
                      ></FormattedMessage>
                    </FormErrorMessage>
                  )}
                </FormControl>
              </Box>
              <Box
                flex="1"
                maxWidth="300px"
                minWidth="200px"
                paddingX={2}
                marginBottom={2}
              >
                <FormControl isInvalid={!!errors.newPassword2}>
                  <FormLabel htmlFor="new-password2">
                    <FormattedMessage
                      id="generic.forms.confirm-password-label"
                      defaultMessage="Confirm password"
                    ></FormattedMessage>
                  </FormLabel>
                  <PasswordInput
                    id="new-password2"
                    name="newPassword2"
                    ref={register({
                      required: true,
                      validate: value => value === getValues().newPassword
                    })}
                  />
                  {errors.newPassword2 && (
                    <FormErrorMessage>
                      <FormattedMessage
                        id="generic.forms.passwords-must-match"
                        defaultMessage="Passwords must match"
                      ></FormattedMessage>
                    </FormErrorMessage>
                  )}
                </FormControl>
              </Box>
            </Flex>
            <Button type="submit" variantColor="purple" mt="2">
              <FormattedMessage
                id="settings.account.change-password-button"
                defaultMessage="Change password"
              />
            </Button>
          </form>
        </Box>
      </SettingsLayout>
    </AppLayout>
  );
}

const UPDATE_PASSWORD = gql`
  mutation updatePassword($password: String!, $newPassword: String!) {
    changePassword(password: $password, newPassword: $newPassword)
  }
`;

const GET_SECURITY_DATA = gql`
  query Security {
    me {
      id
      ...AppLayout_User
    }
  }
  ${AppLayout.fragments.user}
`;

Security.getInitialProps = async ({ apollo }: WithDataContext) => {
  await apollo.query<SecurityQuery>({ query: GET_SECURITY_DATA });
};

export default withData(Security);
