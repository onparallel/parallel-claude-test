import { gql, useMutation } from "@apollo/client";
import { Divider, Heading, Stack, useToast } from "@chakra-ui/react";
import { withDialogs } from "@parallel/components/common/dialogs/DialogProvider";
import { withApolloData, WithApolloDataContext } from "@parallel/components/common/withApolloData";
import { SettingsLayout } from "@parallel/components/layout/SettingsLayout";
import {
  AccountChangeName,
  AccountChangeNameData,
} from "@parallel/components/settings/AccountChangeName";
import { AccountDelegates } from "@parallel/components/settings/AccountDelegates";
import { AccountLocaleChange } from "@parallel/components/settings/AccountLocaleChange";
import {
  Account_setUserDelegatesDocument,
  Account_setUserPreferredLocaleDocument,
  Account_updateAccountDocument,
  Account_userDocument,
} from "@parallel/graphql/__types";
import { useAssertQuery } from "@parallel/utils/apollo/useAssertQuery";
import { compose } from "@parallel/utils/compose";
import { useGenericErrorToast } from "@parallel/utils/useGenericErrorToast";
import { useSettingsSections } from "@parallel/utils/useSettingsSections";
import { useRouter } from "next/router";
import { FormattedMessage, useIntl } from "react-intl";

function Account() {
  const intl = useIntl();
  const router = useRouter();
  const toast = useToast();
  const showGenericErrorToast = useGenericErrorToast();

  const updateSuccessToast = () => {
    toast({
      title: intl.formatMessage({
        id: "settings.account.success-toast-title",
        defaultMessage: "Changes saved correctly",
      }),
      description: intl.formatMessage({
        id: "settings.account.success-toast-description",
        defaultMessage: "Your account has been successfully updated.",
      }),
      status: "success",
      isClosable: true,
    });
  };

  const {
    data: { me, realMe },
  } = useAssertQuery(Account_userDocument);
  const sections = useSettingsSections(me);

  const [updateAccount] = useMutation(Account_updateAccountDocument);
  const [setUserLocale] = useMutation(Account_setUserPreferredLocaleDocument);
  const [setUserDelegates] = useMutation(Account_setUserDelegatesDocument);

  async function onSaveName({ firstName, lastName }: AccountChangeNameData) {
    try {
      window.analytics?.identify(me.id, { firstName, lastName, name: me.fullName! });
      await updateAccount({ variables: { firstName, lastName } });
      updateSuccessToast();
    } catch (error) {
      showGenericErrorToast(error);
    }
  }

  async function onSaveDelegates(ids: string[]) {
    try {
      await setUserDelegates({ variables: { delegateIds: ids } });
      updateSuccessToast();
    } catch (error) {
      showGenericErrorToast(error);
    }
  }

  async function handleLocaleChange(locale: string) {
    try {
      await setUserLocale({ variables: { locale } });
      window.analytics?.identify(me.id, { locale, name: me.fullName! });
      window.Intercom?.("boot", { language_override: locale });
      router.push(router.asPath, undefined, { locale });
    } catch (error) {
      showGenericErrorToast(error);
    }
  }

  return (
    <SettingsLayout
      title={intl.formatMessage({
        id: "settings.account",
        defaultMessage: "Account",
      })}
      basePath="/app/settings"
      sections={sections}
      me={me}
      realMe={realMe}
      sectionsHeader={<FormattedMessage id="settings.title" defaultMessage="Settings" />}
      header={
        <Heading as="h3" size="md">
          <FormattedMessage id="settings.account" defaultMessage="Account" />
        </Heading>
      }
    >
      <Stack padding={6} spacing={8} maxWidth="container.sm" width="100%" paddingBottom={16}>
        <AccountChangeName user={me} onSubmit={onSaveName} />
        <Divider borderColor="gray.300" />
        <AccountLocaleChange user={me} onChange={handleLocaleChange} />
        <Divider borderColor="gray.300" />
        <AccountDelegates user={me} onSubmit={onSaveDelegates} />
      </Stack>
    </SettingsLayout>
  );
}

Account.fragments = {
  Query: gql`
    fragment Account_Query on Query {
      ...SettingsLayout_Query
      me {
        ...useSettingsSections_User
        ...AccountChangeName_User
        ...AccountLocaleChange_User
        ...AccountDelegates_User
      }
    }
    ${SettingsLayout.fragments.Query}
    ${useSettingsSections.fragments.User}
    ${AccountChangeName.fragments.User}
    ${AccountLocaleChange.fragments.User}
    ${AccountDelegates.fragments.User}
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
        ...AccountLocaleChange_User
      }
    }
    ${AccountLocaleChange.fragments.User}
  `,
  gql`
    mutation Account_setUserDelegates($delegateIds: [GID!]!) {
      setUserDelegates(delegateIds: $delegateIds) {
        id
        ...AccountDelegates_User
      }
    }
    ${AccountDelegates.fragments.User}
  `,
];

Account.queries = [
  gql`
    query Account_user {
      ...Account_Query
    }
    ${Account.fragments.Query}
  `,
];

Account.getInitialProps = async ({ fetchQuery }: WithApolloDataContext) => {
  await fetchQuery(Account_userDocument);
};

export default compose(withDialogs, withApolloData)(Account);
