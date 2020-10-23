import languages from "@parallel/lang/languages.json";
import { negotiate } from "@parallel/utils/negotiate";
import { NextPageContext } from "next";
import Router, { useRouter } from "next/router";
import { useEffect } from "react";

function Redirect() {
  const router = useRouter();
  useEffect(() => {
    const language = negotiate(
      navigator.languages,
      languages.map((l) => l.locale),
      languages.find((l) => l.default)!.locale
    );
    router.push("/[locale]", `/${language}`);
  }, []);
  return <></>;
}

Redirect.getInitialProps = async ({ req, res }: NextPageContext) => {
  if (process.browser) {
    const language = negotiate(
      navigator.languages,
      languages.map((l) => l.locale),
      languages.find((l) => l.default)!.locale
    );
    Router.push("/[locale]", `/${language}`);
  } else if (res?.writeHead) {
    const accepts = req!.headers["accept-language"]!;
    const language = negotiate(
      accepts,
      languages.map((l) => l.locale),
      languages.find((l) => l.default)!.locale
    );
    res!.writeHead(302, { Location: `/${language}` }).end();
  }
  return {};
};

export default Redirect;
