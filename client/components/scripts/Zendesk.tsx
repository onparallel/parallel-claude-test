import Head from "next/head";
import Router from "next/router";
import { useEffect } from "react";

declare const zE: any;

export const Zendesk = () => {
  useEffect(() => {
    const hide = () => (window as any).zE?.(() => zE.hide());
    Router.events.on("routeChangeStart", hide);
    window.addEventListener("load", hide);
    return () => {
      Router.events.off("routeChangeStart", hide);
      window.removeEventListener("load", hide);
    };
  }, []);
  return (
    <Head>
      <script
        id="ze-snippet"
        async
        defer
        src="//static.zdassets.com/ekr/snippet.js?key=f96da31d-cc9a-4568-a1f9-4d2ae55939f5"
        onLoad={"zE(function(){zE.hide()})" as any}
      />
    </Head>
  );
};
