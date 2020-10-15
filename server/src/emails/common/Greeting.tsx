import React from "react";
import { MjmlText } from "mjml-react";
import { FormattedMessage } from "react-intl";

export function Greeting({ name }: { name: string | null }) {
  return (
    <MjmlText>
      <FormattedMessage
        id="greeting"
        defaultMessage="{name, select, null {Hi,} other {Hi {name},}}"
        values={{ name }}
      />
    </MjmlText>
  );
}
