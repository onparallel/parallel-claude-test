import languages from "@parallel/lang/languages.json";
import { negotiate } from "@parallel/utils/negotiate";
import { NextPageContext } from "next";
import Router from "next/router";

function Redirect() {
  return <></>;
}

Redirect.getInitialProps = async ({ req, res }: NextPageContext) => {
  if (process.browser) {
    Router.push("/");
  } else {
    const accepts = req!.headers["accept-language"]!;
    const language = negotiate(
      accepts,
      languages.map((l) => l.locale),
      languages.find((l) => l.default)!.locale
    );
    res!.writeHead(302, { Location: `/${language}` });
    res!.end();
  }
  return {};
};

export default Redirect;
