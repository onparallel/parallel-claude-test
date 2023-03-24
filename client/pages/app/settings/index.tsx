import { gql } from "@apollo/client";
import { withApolloData, WithApolloDataContext } from "@parallel/components/common/withApolloData";
import { UserSettingsLayout } from "@parallel/components/layout/UserSettingsLayout";
import { Settings_userDocument } from "@parallel/graphql/__types";
import { useAssertQuery } from "@parallel/utils/apollo/useAssertQuery";
import { useIntl } from "react-intl";

export function Settings() {
  const intl = useIntl();
  const {
    data: { me, realMe },
  } = useAssertQuery(Settings_userDocument);

  return (
    <UserSettingsLayout
      title={intl.formatMessage({
        id: "settings.title",
        defaultMessage: "Settings",
      })}
      isBase
      me={me}
      realMe={realMe}
    />
  );
}

Settings.queries = [
  gql`
    query Settings_user {
      ...UserSettingsLayout_Query
    }
    ${UserSettingsLayout.fragments.Query}
  `,
];

Settings.getInitialProps = async ({ fetchQuery }: WithApolloDataContext) => {
  await fetchQuery(Settings_userDocument);
};

export default withApolloData(Settings);
