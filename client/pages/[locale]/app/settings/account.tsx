import { useMutation, useQuery } from "@apollo/react-hooks";
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
  WithDataContext,
} from "@parallel/components/common/withApolloData";
import { AppLayout } from "@parallel/components/layout/AppLayout";
import { SettingsLayout } from "@parallel/components/layout/SettingsLayout";
import {
  AccountQuery,
  Account_updateAccountMutation,
  Account_updateAccountMutationVariables,
} from "@parallel/graphql/__types";
import { gql } from "apollo-boost";
import { useForm } from "react-hook-form";
import { FormattedMessage } from "react-intl";

interface NameChangeFormData {
  firstName: string;
  lastName: string;
}

function Account() {
  const { data } = useQuery<AccountQuery>(GET_ACCOUNT_DATA);
  const me = data!.me;
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
    <AppLayout user={me}>
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
            maxWidth="containers.xs"
            as="form"
            onSubmit={handleSubmit(onSaveName)}
          >
            <FormControl isInvalid={!!errors.firstName}>
              <FormLabel htmlFor="first-name">
                <FormattedMessage
                  id="generic.forms.first-name-label"
                  defaultMessage="First name"
                ></FormattedMessage>
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
                  ></FormattedMessage>
                </FormErrorMessage>
              )}
            </FormControl>
            <FormControl isInvalid={!!errors.lastName}>
              <FormLabel htmlFor="last-name">
                <FormattedMessage
                  id="generic.forms.last-name-label"
                  defaultMessage="Last name"
                ></FormattedMessage>
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
                  ></FormattedMessage>
                </FormErrorMessage>
              )}
            </FormControl>
            <Box>
              <Button type="submit" variantColor="purple">
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

const GET_ACCOUNT_DATA = gql`
  query Account {
    me {
      id
      ...Account_User
    }
  }
  ${Account.fragments.User}
`;

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

Account.getInitialProps = async ({ apollo }: WithDataContext) => {
  await apollo.query<AccountQuery>({ query: GET_ACCOUNT_DATA });
};

export default withApolloData(Account);
