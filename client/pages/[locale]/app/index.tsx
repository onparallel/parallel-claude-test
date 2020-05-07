import {
  withData,
  WithDataContext,
} from "@parallel/components/common/withData";
import Router from "next/router";

function AppHome() {
  return <></>;
}

AppHome.getInitialProps = async ({ apollo, query, res }: WithDataContext) => {
  if (process.browser) {
    Router.push("/[locale]/app/petitions", `/${query.locale}/app/petitions`);
  } else if (res?.writeHead) {
    res!.writeHead(302, { Location: `/${query.locale}/app/petitions` });
    res!.end();
  }
  return {};
};

export default withData(AppHome);
