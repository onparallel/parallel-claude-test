import { Fragment } from "react";
import { Maybe } from "../../util/types";

export function BreakLines({ text }: { text: Maybe<string> }) {
  return (
    <>
      {text?.split(/\n/).map((line, index) => (
        <Fragment key={index}>
          {line}
          <br />
        </Fragment>
      )) ?? null}
    </>
  );
}
