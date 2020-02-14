import { AppLayout } from "@parallel/components/layout/AppLayout";
import { withData, WithDataContext } from "@parallel/components/withData";
import { gql } from "apollo-boost";
import { AppHomeQuery } from "@parallel/graphql/__types";
import { useQuery } from "@apollo/react-hooks";

function AppHome() {
  const { data } = useQuery<AppHomeQuery>(GET_APP_HOME_DATA);
  const { me } = data!;
  return <AppLayout user={me}>home</AppLayout>;
}

const GET_APP_HOME_DATA = gql`
  query AppHome {
    me {
      ...AppLayout_User
    }
  }
  ${AppLayout.fragments.user}
`;

AppHome.getInitialProps = async ({ apollo }: WithDataContext) => {
  await apollo.query<AppHomeQuery>({ query: GET_APP_HOME_DATA });
};

export default withData(AppHome);
