import React from "react";
import { MjmlText } from "mjml-react";
import { FormattedMessage } from "react-intl";

export function Greeting({ name }: { name: string | null }) {
  return (
    <MjmlText>
      <FormattedMessage
        id="greeting"
        defaultMessage={`Hi{name, select, null {} other { {name}}},`}
        values={{ name }}
      />
    </MjmlText>
  );
}
