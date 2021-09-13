import Script, { ScriptProps } from "next/script";

export const Zendesk = (props: Pick<ScriptProps, "onLoad">) => {
  return (
    <>
      <Script
        id="ze-snippet"
        strategy="afterInteractive"
        src="//static.zdassets.com/ekr/snippet.js?key=f96da31d-cc9a-4568-a1f9-4d2ae55939f5"
        {...props}
      />
    </>
  );
};
