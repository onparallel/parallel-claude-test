import { gql } from "@apollo/client";
import {
  withApolloData,
  WithApolloDataContext,
} from "@parallel/components/common/withApolloData";
import { AppLayout } from "@parallel/components/layout/AppLayout";
import { SettingsLayout } from "@parallel/components/layout/SettingsLayout";
import { useSettingsQuery } from "@parallel/graphql/__types";
import { assertQuery } from "@parallel/utils/apollo/assertQuery";
import { useSettingsSections } from "@parallel/utils/useSettingsSections";
import { FormattedMessage, useIntl } from "react-intl";

function Settings() {
  const intl = useIntl();
  const {
    data: { me },
  } = assertQuery(useSettingsQuery());
  const sections = useSettingsSections();

  return (
    <SettingsLayout
      title={intl.formatMessage({
        id: "settings.header",
        defaultMessage: "Settings",
      })}
      isBase
      basePath="/app/settings"
      sections={sections}
      user={me}
      sectionsHeader={
        <FormattedMessage id="settings.header" defaultMessage="Settings" />
      }
    />
  );
}

Settings.fragments = {
  User: gql`
    fragment Settings_User on User {
      ...AppLayout_User
    }
    ${AppLayout.fragments.User}
  `,
};

Settings.getInitialProps = async ({ fetchQuery }: WithApolloDataContext) => {
  await fetchQuery<SettingsQuey>(gql`
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
