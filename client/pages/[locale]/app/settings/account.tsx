import { gql, useMutation } from "@apollo/client";
import {
  Box,
  Button,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Heading,
  Input,
  Stack,
} from "@chakra-ui/core";
import {
  withApolloData,
  WithApolloDataContext,
} from "@parallel/components/common/withApolloData";
import { AppLayout } from "@parallel/components/layout/AppLayout";
import { SettingsLayout } from "@parallel/components/layout/SettingsLayout";
import {
  AccountQuery,
  Account_updateAccountMutation,
  Account_updateAccountMutationVariables,
  useAccountQuery,
} from "@parallel/graphql/__types";
import { assertQuery } from "@parallel/utils/apollo";
import { useForm } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";

interface NameChangeFormData {
  firstName: string;
  lastName: string;
}

function Account() {
  const intl = useIntl();
  const {
    data: { me },
  } = assertQuery(useAccountQuery());
  const { handleSubmit, register, errors } = useForm<NameChangeFormData>({
    defaultValues: {
      firstName: me.firstName ?? undefined,
      lastName: me.lastName ?? undefined,
    },
  });
  const [updateAccount] = useUpdateAccount();

  function onSaveName({ firstName, lastName }: NameChangeFormData) {
    updateAccount({ variables: { id: me.id, data: { firstName, lastName } } });
  }

  return (
    <AppLayout
      title={intl.formatMessage({
        id: "settings.account",
        defaultMessage: "Account",
      })}
      user={me}
    >
      <SettingsLayout
        header={
          <FormattedMessage id="settings.account" defaultMessage="Account" />
        }
      >
        <Box padding={4}>
          <Heading as="h4" size="md" fontWeight="normal" marginBottom={2}>
            <FormattedMessage
              id="settings.account.name-header"
              defaultMessage="Name"
            />
          </Heading>
          <Stack
            maxWidth="container.xs"
            as="form"
            onSubmit={handleSubmit(onSaveName)}
          >
            <FormControl isInvalid={!!errors.firstName}>
              <FormLabel htmlFor="first-name">
                <FormattedMessage
                  id="generic.forms.first-name-label"
                  defaultMessage="First name"
                />
              </FormLabel>
              <Input
                id="first-name"
                name="firstName"
                maxLength={255}
                ref={register({ required: true })}
              />
              {errors.firstName && (
                <FormErrorMessage>
                  <FormattedMessage
                    id="generic.forms.required-first-name-error"
                    defaultMessage="First name is required"
                  />
                </FormErrorMessage>
              )}
            </FormControl>
            <FormControl isInvalid={!!errors.lastName}>
              <FormLabel htmlFor="last-name">
                <FormattedMessage
                  id="generic.forms.last-name-label"
                  defaultMessage="Last name"
                />
              </FormLabel>
              <Input
                id="last-name"
                name="lastName"
                maxLength={255}
                ref={register({ required: true })}
              />
              {errors.lastName && (
                <FormErrorMessage>
                  <FormattedMessage
                    id="generic.forms.required-last-name-error"
                    defaultMessage="Last name is required"
                  />
                </FormErrorMessage>
              )}
            </FormControl>
            <Box>
              <Button type="submit" colorScheme="purple">
                <FormattedMessage
                  id="settings.account.update-name-button"
                  defaultMessage="Save changes"
                />
              </Button>
            </Box>
          </Stack>
        </Box>
      </SettingsLayout>
    </AppLayout>
  );
}

Account.fragments = {
  User: gql`
    fragment Account_User on User {
      firstName
      lastName
      ...AppLayout_User
    }
    ${AppLayout.fragments.User}
  `,
};

function useUpdateAccount() {
  return useMutation<
    Account_updateAccountMutation,
    Account_updateAccountMutationVariables
  >(gql`
    mutation Account_updateAccount($id: ID!, $data: UpdateUserInput!) {
      updateUser(id: $id, data: $data) {
        id
        firstName
        lastName
        fullName
      }
    }
  `);
}

Account.getInitialProps = async ({ fetchQuery }: WithApolloDataContext) => {
  await fetchQuery<AccountQuery>(gql`
    query Account {
      me {
        id
        ...Account_User
      }
    }
    ${Account.fragments.User}
  `);
};

export default withApolloData(Account);
