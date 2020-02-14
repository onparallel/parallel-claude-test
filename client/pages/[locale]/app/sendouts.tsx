import { AppLayout } from "@parallel/components/layout/AppLayout";
import { useQuery } from "@apollo/react-hooks";
import { gql } from "apollo-boost";
import { SendoutsQuery } from "@parallel/graphql/__types";
import { WithDataContext, withData } from "@parallel/components/withData";

function Sendouts() {
  const { data } = useQuery<SendoutsQuery>(GET_SENDOUTS_DATA);
  const { me } = data!;
  return <AppLayout user={me}>sendouts</AppLayout>;
}

const GET_SENDOUTS_DATA = gql`
  query Sendouts {
    me {
      ...AppLayout_User
    }
  }
  ${AppLayout.fragments.user}
`;

Sendouts.getInitialProps = async ({ apollo }: WithDataContext) => {
  await apollo.query<SendoutsQuery>({ query: GET_SENDOUTS_DATA });
};

export default withData(Sendouts);
