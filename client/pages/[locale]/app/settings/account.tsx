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
import { assertQuery } from "@parallel/utils/apollo/assertQuery";
import { useSettingsSections } from "@parallel/utils/useSettingsSections";
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
  const sections = useSettingsSections();

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
    <SettingsLayout
      title={intl.formatMessage({
        id: "settings.account",
        defaultMessage: "Account",
      })}
      basePath="/app/settings"
      sections={sections}
      user={me}
      sectionsHeader={
        <FormattedMessage id="settings.header" defaultMessage="Settings" />
      }
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
          <FormControl id="first-name" isInvalid={!!errors.firstName}>
            <FormLabel>
              <FormattedMessage
                id="generic.forms.first-name-label"
                defaultMessage="First name"
              />
            </FormLabel>
            <Input
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
          <FormControl id="last-name" isInvalid={!!errors.lastName}>
            <FormLabel>
              <FormattedMessage
                id="generic.forms.last-name-label"
                defaultMessage="Last name"
              />
            </FormLabel>
            <Input
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
    mutation Account_updateAccount($id: GID!, $data: UpdateUserInput!) {
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
