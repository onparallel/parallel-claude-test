import Script, { ScriptProps } from "next/script";

export const Hubspot = (props: Pick<ScriptProps, "onLoad">) => {
  return (
    <>
      <Script
        id="hs-script-loader"
        strategy="lazyOnload"
        src="//js.hs-scripts.com/6692004.js"
        {...props}
      />
    </>
  );
};
