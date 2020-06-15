import {
  withApolloData,
  WithApolloDataContext,
} from "@parallel/components/common/withApolloData";
import Router from "next/router";

function AppHome() {
  return <></>;
}

AppHome.getInitialProps = async ({
  apollo,
  query,
  res,
}: WithApolloDataContext) => {
  if (process.browser) {
    Router.push("/[locale]/app/petitions", `/${query.locale}/app/petitions`);
  } else if (res?.writeHead) {
    res!.writeHead(302, { Location: `/${query.locale}/app/petitions` });
    res!.end();
  }
  return {};
};

export default withApolloData(AppHome);
