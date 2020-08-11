import { resolveUrl } from "@parallel/utils/next";
import { NextPageContext } from "next";
import Router from "next/router";

function Redirect() {
  return <></>;
}

Redirect.getInitialProps = async (ctx: NextPageContext) => {
  const toPathname = `${ctx.pathname}/[page]`;
  const toUrl = resolveUrl(toPathname, { ...ctx.query, page: "1" });
  if (process.browser) {
    Router.push(toPathname, toUrl);
  } else if (ctx.res?.writeHead) {
    ctx.res!.writeHead(302, { Location: toUrl });
    ctx.res!.end();
  }
  return {};
};

export default Redirect;
