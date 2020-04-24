import { memo, useEffect } from "react";
import Head from "next/head";
import Router from "next/router";

declare const HubSpotConversations: any;

export const Hubspot = memo(() => {
  useEffect(() => {
    function handler() {
      if (typeof HubSpotConversations !== "undefined") {
        HubSpotConversations.widget.refresh();
      }
    }
    Router.events.on("routeChangeComplete", handler);
    return () => {
      Router.events.off("routeChangeComplete", handler);
    };
  }, []);
  return (
    <Head>
      <script
        id="hs-script-loader"
        async
        defer
        src="//js.hs-scripts.com/6692004.js"
      ></script>
    </Head>
  );
});
