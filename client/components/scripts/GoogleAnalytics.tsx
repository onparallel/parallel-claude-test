import { memo, useEffect } from "react";
import Head from "next/head";
import Router from "next/router";

declare function gtag(command: string, event: string, params?: any): void;

export const GoogleAnalytics = memo(() => {
  useEffect(() => {
    function handler() {
      setTimeout(() => {
        gtag("event", "page_view", { page_location: window.location.href });
      }, 0);
    }
    Router.events.on("routeChangeComplete", handler);
    handler();
    return () => {
      Router.events.off("routeChangeComplete", handler);
    };
  }, []);
  return (
    <Head>
      <script
        async
        src={`https://www.googletagmanager.com/gtag/js?id=UA-153451031-1`}
      />
      <script
        dangerouslySetInnerHTML={{
          __html: /* js */ `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'UA-153451031-1', { 'send_page_view': false });
          `,
        }}
      />
    </Head>
  );
});
