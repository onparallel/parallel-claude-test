import { redirect } from "@parallel/components/common/withApolloData";
import languages from "@parallel/lang/languages.json";
import { negotiate } from "@parallel/utils/negotiate";
import { NextPageContext } from "next";

function Redirect() {
  return <></>;
}

Redirect.getInitialProps = async (context: NextPageContext) => {
  // this only runs in development
  const url = context.query.url;
  const locale = negotiate(
    typeof window !== "undefined" ? navigator.languages : context.req!.headers["accept-language"]!,
    languages.map((l) => l.locale),
    languages.find((l) => l.default)!.locale
  );
  return redirect(context, `/${locale}${url ?? ""}`);
};

export default Redirect;
