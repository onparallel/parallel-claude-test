import { AppLayout } from "@parallel/components/layout/AppLayout";
import { withData, WithDataContext } from "@parallel/components/withData";
import { gql } from "apollo-boost";
import Router from "next/router";

function AppHome() {
  // const {
  //   data: { me },
  // } = assertQuery(useAppHomeQuery());
  return (
    <></>
    // <AppLayout user={me}>
    //   <></>
    // </AppLayout>
  );
}

const GET_APP_HOME_DATA = gql`
  query AppHome {
    me {
      ...AppLayout_User
    }
  }
  ${AppLayout.fragments.user}
`;

AppHome.getInitialProps = async ({ apollo, query, res }: WithDataContext) => {
  // await apollo.query<AppHomeQuery>({ query: GET_APP_HOME_DATA });
  if (process.browser) {
    Router.push("/[locale]/app/petitions", `/${query.locale}/app/petitions`);
  } else if (res?.writeHead) {
    res!.writeHead(302, { Location: `/${query.locale}/app/petitions` });
    res!.end();
  }
  return {};
};

export default withData(AppHome);
