import { redirect } from "@parallel/components/common/withApolloData";
import languages from "@parallel/lang/languages.json";
import { negotiate } from "@parallel/utils/negotiate";
import { NextPageContext } from "next";

function Redirect() {
  return <></>;
}

Redirect.getInitialProps = async (context: NextPageContext) => {
  const locale = negotiate(
    process.browser
      ? navigator.languages
      : context.req!.headers["accept-language"]!,
    languages.map((l) => l.locale),
    languages.find((l) => l.default)!.locale
  );
  redirect(context, `/${locale}`);
  return {};
};

export default Redirect;
