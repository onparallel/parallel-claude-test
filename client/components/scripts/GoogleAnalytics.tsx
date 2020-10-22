import { memo, useEffect } from "react";
import Head from "next/head";
import Router from "next/router";

export const GoogleAnalytics = memo(() => {
  const gtagId = "UA-153451031-1";

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
        src={`https://www.googletagmanager.com/gtag/js?id=${gtagId}`}
      />
      <script
        dangerouslySetInnerHTML={{
          __html: /* js */ `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${gtagId}', { 'send_page_view': false });
          `.replace(/\s*\n\s*/g, ""),
        }}
      />
    </Head>
  );
});
