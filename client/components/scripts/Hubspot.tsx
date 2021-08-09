import Head from "next/head";
import { memo } from "react";

export const Hubspot = memo(() => {
  return (
    <Head>
      <script id="hs-script-loader" async defer src="//js.hs-scripts.com/6692004.js" />
    </Head>
  );
});
