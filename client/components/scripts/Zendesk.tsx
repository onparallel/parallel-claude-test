import Head from "next/head";
import { memo } from "react";

export const Zendesk = memo(() => {
  return (
    <Head>
      <script
        id="ze-snippet"
        async
        defer
        src="//static.zdassets.com/ekr/snippet.js?key=f96da31d-cc9a-4568-a1f9-4d2ae55939f5"
      />
    </Head>
  );
});
