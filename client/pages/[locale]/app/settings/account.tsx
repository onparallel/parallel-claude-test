import { useMutation, useQuery } from "@apollo/react-hooks";
import {
  Box,
  Button,
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Heading,
  Input
} from "@chakra-ui/core";
import { AppLayout } from "@parallel/components/layout/AppLayout";
import { SettingsLayout } from "@parallel/components/layout/SettingsLayout";
import { withData, WithDataContext } from "@parallel/components/withData";
import {
  AccountQuery,
  updateAccountMutation,
  updateAccountMutationVariables
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
      lastName: me.lastName ?? undefined
    }
  });
  const [updateAccount] = useMutation<
    updateAccountMutation,
    updateAccountMutationVariables
  >(UPDATE_ACCOUNT);

  function onSaveName({ firstName, lastName }: NameChangeFormData) {
    updateAccount({ variables: { id: me.id, firstName, lastName } });
  }

  return (
    <AppLayout user={me}>
      <SettingsLayout
        header={
          <FormattedMessage id="settings.account" defaultMessage="Account" />
        }
      >
        <Box padding={4}>
          <Heading as="h4" size="sm" marginBottom={2}>
            <FormattedMessage
              id="settings.account.name-header"
              defaultMessage="Name"
            />
          </Heading>
          <form onSubmit={handleSubmit(onSaveName)}>
            <Flex flexWrap="wrap" marginX={-2}>
              <Box
                flex="1"
                maxWidth="300px"
                minWidth="200px"
                paddingX={2}
                marginBottom={2}
              >
                <FormControl isInvalid={!!errors.firstName}>
                  <FormLabel htmlFor="first-name">
                    <FormattedMessage
                      id="generic.forms.fist-name-label"
                      defaultMessage="First name"
                    ></FormattedMessage>
                  </FormLabel>
                  <Input
                    id="first-name"
                    name="firstName"
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
              </Box>
              <Box
                flex="1"
                maxWidth="300px"
                minWidth="200px"
                paddingX={2}
                marginBottom={2}
              >
                <FormControl isInvalid={!!errors.lastName}>
                  <FormLabel htmlFor="last-name">
                    <FormattedMessage
                      id="generic.forms.fist-name-label"
                      defaultMessage="Last name"
                    ></FormattedMessage>
                  </FormLabel>
                  <Input
                    id="last-name"
                    name="lastName"
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
              </Box>
            </Flex>
            <Button type="submit" variantColor="purple">
              <FormattedMessage
                id="settings.account.update-name-button"
                defaultMessage="Update name"
              />
            </Button>
          </form>
        </Box>
      </SettingsLayout>
    </AppLayout>
  );
}

Account.fragments = {
  user: gql`
    fragment Account_User on User {
      firstName
      lastName
      ...AppLayout_User
    }
    ${AppLayout.fragments.user}
  `
};

const UPDATE_ACCOUNT = gql`
  mutation updateAccount($id: ID!, $firstName: String!, $lastName: String!) {
    updateUser(id: $id, data: { firstName: $firstName, lastName: $lastName }) {
      id
      firstName
      lastName
      fullName
    }
  }
`;

const GET_ACCOUNT_DATA = gql`
  query Account {
    me {
      id
      ...Account_User
    }
  }
  ${Account.fragments.user}
`;

Account.getInitialProps = async ({ apollo }: WithDataContext) => {
  await apollo.query<AccountQuery>({ query: GET_ACCOUNT_DATA });
};

export default withData(Account);
