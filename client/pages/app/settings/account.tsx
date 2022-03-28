import { gql, useMutation } from "@apollo/client";
import {
  Alert,
  AlertIcon,
  Button,
  Divider,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Heading,
  Input,
  Radio,
  RadioGroup,
  Stack,
} from "@chakra-ui/react";
import { withDialogs } from "@parallel/components/common/dialogs/DialogProvider";
import { withApolloData, WithApolloDataContext } from "@parallel/components/common/withApolloData";
import { SettingsLayout } from "@parallel/components/layout/SettingsLayout";
import {
  Account_setUserPreferredLocaleDocument,
  Account_updateAccountDocument,
  Account_userDocument,
} from "@parallel/graphql/__types";
import { useAssertQuery } from "@parallel/utils/apollo/useAssertQuery";
import { compose } from "@parallel/utils/compose";
import { useSettingsSections } from "@parallel/utils/useSettingsSections";
import { useSupportedLocales } from "@parallel/utils/useSupportedLocales";
import { useRouter } from "next/router";
import { useForm } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";

interface NameChangeFormData {
  firstName: string;
  lastName: string;
}

function Account() {
  const intl = useIntl();
  const router = useRouter();

  const {
    data: { me },
  } = useAssertQuery(Account_userDocument);
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
  const [updateAccount] = useMutation(Account_updateAccountDocument);
  const [setUserLocale] = useMutation(Account_setUserPreferredLocaleDocument);
  const locales = useSupportedLocales();

  function onSaveName({ firstName, lastName }: NameChangeFormData) {
    window.analytics?.identify(me.id, { firstName, lastName });
    updateAccount({ variables: { firstName, lastName } });
  }

  function handleLocaleChange(locale: string) {
    setUserLocale({ variables: { locale } });
    window.analytics?.identify(me.id, { locale });
    router.push(router.asPath, undefined, { locale });
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
      <Stack padding={6} spacing={8} maxWidth="container.2xs" width="100%" paddingBottom={16}>
        <Stack>
          <Heading as="h4" size="md" marginBottom={2}>
            <FormattedMessage id="settings.account.name-header" defaultMessage="Name" />
          </Heading>
          {me.isSsoUser ? (
            <Alert borderRadius="md">
              <AlertIcon />
              <FormattedMessage
                id="settings.account.sso-user-explanation"
                defaultMessage="SSO users are not able to change their name"
              />
            </Alert>
          ) : null}
          <Stack as="form" onSubmit={handleSubmit(onSaveName)} spacing={4}>
            <FormControl id="first-name" isInvalid={!!errors.firstName} isDisabled={me.isSsoUser}>
              <FormLabel fontWeight="semibold">
                <FormattedMessage id="generic.forms.first-name-label" defaultMessage="First name" />
              </FormLabel>
              <Input
                backgroundColor="white"
                {...register("firstName", { required: true, maxLength: 255 })}
              />
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
              <FormLabel fontWeight="semibold">
                <FormattedMessage id="generic.forms.last-name-label" defaultMessage="Last name" />
              </FormLabel>
              <Input
                backgroundColor="white"
                {...register("lastName", { required: true, maxLength: 255 })}
              />
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
        <Divider borderColor="gray.300" />
        <Stack>
          <Heading as="h4" size="md" marginBottom={2}>
            <FormattedMessage id="settings.account.language" defaultMessage="Language" />
          </Heading>
          <RadioGroup onChange={handleLocaleChange} value={me.preferredLocale ?? intl.locale}>
            <Stack>
              {locales.map(({ key, localizedLabel }) => (
                <Radio backgroundColor="white" key={key} value={key}>
                  {localizedLabel}
                </Radio>
              ))}
            </Stack>
          </RadioGroup>
        </Stack>
        <Divider borderColor="gray.300" />
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
      preferredLocale
      ...SettingsLayout_User
      ...useSettingsSections_User
    }
    ${SettingsLayout.fragments.User}
    ${useSettingsSections.fragments.User}
  `,
};

Account.mutations = [
  gql`
    mutation Account_updateAccount($firstName: String, $lastName: String) {
      updateUser(firstName: $firstName, lastName: $lastName) {
        id
        firstName
        lastName
        fullName
        initials
      }
    }
  `,
  gql`
    mutation Account_setUserPreferredLocale($locale: String!) {
      setUserPreferredLocale(locale: $locale) {
        id
        ...Account_User
      }
    }
    ${Account.fragments.User}
  `,
];

Account.queries = [
  gql`
    query Account_user {
      me {
        id
        ...Account_User
      }
    }
    ${Account.fragments.User}
  `,
];

Account.getInitialProps = async ({ fetchQuery }: WithApolloDataContext) => {
  await fetchQuery(Account_userDocument);
};

export default compose(withDialogs, withApolloData)(Account);
