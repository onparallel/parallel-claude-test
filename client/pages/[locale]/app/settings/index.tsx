import { gql } from "@apollo/client";
import { withApolloData, WithApolloDataContext } from "@parallel/components/common/withApolloData";
import { SettingsLayout } from "@parallel/components/layout/SettingsLayout";
import { SettingsQuery, useSettingsQuery } from "@parallel/graphql/__types";
import { assertQuery } from "@parallel/utils/apollo/assertQuery";
import { useSettingsSections } from "@parallel/utils/useSettingsSections";
import { FormattedMessage, useIntl } from "react-intl";

export function Settings() {
  const intl = useIntl();
  const {
    data: { me },
  } = assertQuery(useSettingsQuery());
  const sections = useSettingsSections(me);

  return (
    <SettingsLayout
      title={intl.formatMessage({
        id: "settings.title",
        defaultMessage: "Settings",
      })}
      isBase
      basePath="/app/settings"
      sections={sections}
      user={me}
      sectionsHeader={<FormattedMessage id="settings.title" defaultMessage="Settings" />}
    />
  );
}

Settings.fragments = {
  User: gql`
    fragment Settings_User on User {
      ...SettingsLayout_User
      ...useSettingsSections_User
    }
    ${SettingsLayout.fragments.User}
    ${useSettingsSections.fragments.User}
  `,
};

Settings.getInitialProps = async ({ fetchQuery }: WithApolloDataContext) => {
  await fetchQuery<SettingsQuery>(gql`
    query Settings {
      me {
        id
        ...Settings_User
      }
    }
    ${Settings.fragments.User}
  `);
};

export default withApolloData(Settings);
