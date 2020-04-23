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
      <script
        dangerouslySetInnerHTML={{
          __html: /* js */ `(function(h,o,t,j,a,r){
                h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
                h._hjSettings={hjid:1548670,hjsv:6};
                a=o.getElementsByTagName('head')[0];
                r=o.createElement('script');r.async=1;
                r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
                a.appendChild(r);
            })(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');`,
        }}
      />
    </Head>
  );
});
