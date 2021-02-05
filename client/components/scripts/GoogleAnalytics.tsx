import Router from "next/router";
import { memo, useEffect } from "react";
import ReactGA from "react-ga";

export const GoogleAnalytics = memo(() => {
  useEffect(() => {
    ReactGA.initialize("UA-153451031-1");
    function handler() {
      setTimeout(() => {
        ReactGA.pageview(window.location.href + window.location.search);
      }, 0);
    }
    Router.events.on("routeChangeComplete", handler);
    handler();
    return () => {
      Router.events.off("routeChangeComplete", handler);
    };
  }, []);
  return null;
});
