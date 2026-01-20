import { gql } from "@apollo/client";
import { withApolloData, WithApolloDataContext } from "@parallel/components/common/withApolloData";
import { UserSettingsLayout } from "@parallel/components/layout/UserSettingsLayout";
import { Settings_userDocument } from "@parallel/graphql/__types";
import { useAssertQuery } from "@parallel/utils/apollo/useAssertQuery";

export function Settings() {
  const { data: queryObject } = useAssertQuery(Settings_userDocument);

  return <UserSettingsLayout isBase queryObject={queryObject} />;
}

Settings.queries = [
  gql`
    query Settings_user {
      ...UserSettingsLayout_Query
    }
  `,
];

Settings.getInitialProps = async ({ fetchQuery }: WithApolloDataContext) => {
  await fetchQuery(Settings_userDocument);
};

export default withApolloData(Settings);
