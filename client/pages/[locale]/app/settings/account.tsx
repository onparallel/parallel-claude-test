import { gql, useMutation } from "@apollo/client";
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
} from "@chakra-ui/react";
import { Card } from "@parallel/components/common/Card";
import { withDialogs } from "@parallel/components/common/DialogProvider";
import { withApolloData, WithApolloDataContext } from "@parallel/components/common/withApolloData";
import { SettingsLayout } from "@parallel/components/layout/SettingsLayout";
import {
  AccountQuery,
  Account_updateAccountMutation,
  Account_updateAccountMutationVariables,
  useAccountQuery,
} from "@parallel/graphql/__types";
import { assertQuery } from "@parallel/utils/apollo/assertQuery";
import { compose } from "@parallel/utils/compose";
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
  const sections = useSettingsSections(me);

  const {
    handleSubmit,
    register,
    formState: { errors },
  } = useForm<NameChangeFormData>({
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
      sectionsHeader={<FormattedMessage id="settings.title" defaultMessage="Settings" />}
      header={
        <Heading as="h3" size="md">
          <FormattedMessage id="settings.account" defaultMessage="Account" />
        </Heading>
      }
    >
      <Card margin={4} height="fit-content">
        <Stack padding={4} alignItems="stretch" flex="1" maxWidth="container.2xs">
          <Heading as="h4" size="md" fontWeight="normal" marginBottom={2}>
            <FormattedMessage id="settings.account.name-header" defaultMessage="Name" />
          </Heading>
          {me.isSsoUser ? (
            <Alert>
              <AlertIcon />
              <FormattedMessage
                id="settings.account.sso-user-explanation"
                defaultMessage="SSO users are not able to change their name"
              />
            </Alert>
          ) : null}
          <Stack as="form" onSubmit={handleSubmit(onSaveName)}>
            <FormControl id="first-name" isInvalid={!!errors.firstName} isDisabled={me.isSsoUser}>
              <FormLabel>
                <FormattedMessage id="generic.forms.first-name-label" defaultMessage="First name" />
              </FormLabel>
              <Input {...register("firstName", { required: true, maxLength: 255 })} />
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
              isDisabled={me.isSsoUser}
              mb={2}
            >
              <FormLabel>
                <FormattedMessage id="generic.forms.last-name-label" defaultMessage="Last name" />
              </FormLabel>
              <Input {...register("lastName", { required: true, maxLength: 255 })} />
              <FormErrorMessage>
                <FormattedMessage
                  id="generic.forms.required-last-name-error"
                  defaultMessage="Last name is required"
                />
              </FormErrorMessage>
            </FormControl>
            <Button type="submit" colorScheme="purple" isDisabled={me.isSsoUser}>
              <FormattedMessage
                id="settings.account.update-name-button"
                defaultMessage="Save changes"
              />
            </Button>
          </Stack>
        </Stack>
      </Card>
    </SettingsLayout>
  );
}

Account.fragments = {
  User: gql`
    fragment Account_User on User {
      firstName
      lastName
      isSsoUser
      ...SettingsLayout_User
      ...useSettingsSections_User
    }
    ${SettingsLayout.fragments.User}
    ${useSettingsSections.fragments.User}
  `,
};

function useUpdateAccount() {
  return useMutation<Account_updateAccountMutation, Account_updateAccountMutationVariables>(gql`
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

export default compose(withDialogs, withApolloData)(Account);
