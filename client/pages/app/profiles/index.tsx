import { gql } from "@apollo/client";
import { withDialogs } from "@parallel/components/common/dialogs/DialogProvider";
import { withApolloData, WithApolloDataContext } from "@parallel/components/common/withApolloData";
import { withFeatureFlag } from "@parallel/components/common/withFeatureFlag";
import { AppLayout } from "@parallel/components/layout/AppLayout";
import { Profiles_userDocument } from "@parallel/graphql/__types";
import { useAssertQuery } from "@parallel/utils/apollo/useAssertQuery";
import { compose } from "@parallel/utils/compose";

function Profiles() {
  const {
    data: { me, realMe },
  } = useAssertQuery(Profiles_userDocument);

  return <AppLayout title={"Profiles"} me={me} realMe={realMe}></AppLayout>;
}

const _queries = [
  gql`
    query Profiles_user {
      ...AppLayout_Query
    }
    ${AppLayout.fragments.Query}
  `,
];

Profiles.getInitialProps = async ({ query, fetchQuery }: WithApolloDataContext) => {
  await fetchQuery(Profiles_userDocument);
  return {};
};

export default compose(
  withDialogs,
  withFeatureFlag("PROFILES", "/app/petitions"),
  withApolloData
)(Profiles);
