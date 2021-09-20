import { gql, useMutation } from "@apollo/client";
import { Radio, RadioGroup } from "@chakra-ui/radio";
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
import { resolveUrl } from "@parallel/utils/next";
import { useSettingsSections } from "@parallel/utils/useSettingsSections";
import { useSupportedLocales } from "@parallel/utils/useSupportedLocales";
import Router from "next/router";
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
  const locales = useSupportedLocales();

  function onSaveName({ firstName, lastName }: NameChangeFormData) {
    updateAccount({ variables: { id: me.id, data: { firstName, lastName } } });
  }

  function handleLocaleChange(locale: string) {
    window.analytics?.identify(me.id, { email: me.email, locale });
    window.zE?.("webWidget", "setLocale", locale);
    Router.push(
      resolveUrl(Router.pathname, {
        ...Router.query,
        locale,
      })
    );
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
      <Stack padding={6} spacing={6} width="full">
        <Card height="fit-content" width="full" maxWidth="container.2xs">
          <Stack padding={4}>
            <Heading as="h4" size="md" marginBottom={2}>
              <FormattedMessage
                id="settings.account.name-header"
                defaultMessage="Name and surname"
              />
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
            <Stack as="form" onSubmit={handleSubmit(onSaveName)} spacing={4}>
              <FormControl id="first-name" isInvalid={!!errors.firstName} isDisabled={me.isSsoUser}>
                <FormLabel>
                  <FormattedMessage
                    id="generic.forms.first-name-label"
                    defaultMessage="First name"
                  />
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
              <Button
                type="submit"
                colorScheme="purple"
                isDisabled={me.isSsoUser}
                width="min-content"
              >
                <FormattedMessage
                  id="settings.account.update-name-button"
                  defaultMessage="Save changes"
                />
              </Button>
            </Stack>
          </Stack>
        </Card>
        <Card height="fit-content" width="full" maxWidth="container.2xs">
          <Stack padding={4}>
            <Heading as="h4" size="md" marginBottom={2}>
              <FormattedMessage id="settings.account.language" defaultMessage="Language" />
            </Heading>
            <RadioGroup onChange={handleLocaleChange} value={intl.locale}>
              <Stack>
                {locales.map(({ key, localizedLabel }) => (
                  <Radio key={key} value={key}>
                    {localizedLabel}
                  </Radio>
                ))}
              </Stack>
            </RadioGroup>
          </Stack>
        </Card>
      </Stack>
    </SettingsLayout>
  );
}

Account.fragments = {
  User: gql`
    fragment Account_User on User {
      firstName
      lastName
      isSsoUser
      email
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
        initials
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
