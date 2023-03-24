import { gql } from "@apollo/client";
import { withDialogs } from "@parallel/components/common/dialogs/DialogProvider";
import { withApolloData, WithApolloDataContext } from "@parallel/components/common/withApolloData";
import { withFeatureFlag } from "@parallel/components/common/withFeatureFlag";
import { AppLayout } from "@parallel/components/layout/AppLayout";
import { ProfileDetail_userDocument } from "@parallel/graphql/__types";
import { useAssertQuery } from "@parallel/utils/apollo/useAssertQuery";
import { compose } from "@parallel/utils/compose";

function ProfileDetail() {
  const {
    data: { me, realMe },
  } = useAssertQuery(ProfileDetail_userDocument);

  return <AppLayout title={"ProfileDetail"} me={me} realMe={realMe}></AppLayout>;
}

const _queries = [
  gql`
    query ProfileDetail_user {
      ...AppLayout_Query
    }
    ${AppLayout.fragments.Query}
  `,
];

ProfileDetail.getInitialProps = async ({ query, fetchQuery }: WithApolloDataContext) => {
  await fetchQuery(ProfileDetail_userDocument);
  return {};
};

export default compose(
  withDialogs,
  withFeatureFlag("PROFILES", "/app/petitions"),
  withApolloData
)(ProfileDetail);
