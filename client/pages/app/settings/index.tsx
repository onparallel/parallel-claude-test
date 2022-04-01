import { gql } from "@apollo/client";
import { withApolloData, WithApolloDataContext } from "@parallel/components/common/withApolloData";
import { SettingsLayout } from "@parallel/components/layout/SettingsLayout";
import { Settings_userDocument } from "@parallel/graphql/__types";
import { useAssertQuery } from "@parallel/utils/apollo/useAssertQuery";
import { useSettingsSections } from "@parallel/utils/useSettingsSections";
import { FormattedMessage, useIntl } from "react-intl";

export function Settings() {
  const intl = useIntl();
  const {
    data: { me, realMe },
  } = useAssertQuery(Settings_userDocument);
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
      me={me}
      realMe={realMe}
      sectionsHeader={<FormattedMessage id="settings.title" defaultMessage="Settings" />}
    />
  );
}

Settings.queries = [
  gql`
    query Settings_user {
      ...SettingsLayout_Query
      me {
        id
        ...useSettingsSections_User
      }
    }
    ${SettingsLayout.fragments.Query}
    ${useSettingsSections.fragments.User}
  `,
];

Settings.getInitialProps = async ({ fetchQuery }: WithApolloDataContext) => {
  await fetchQuery(Settings_userDocument);
};

export default withApolloData(Settings);
