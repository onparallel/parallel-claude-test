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

export function GreetingFormal({ fullName }: { fullName: string | null }) {
  return (
    <MjmlText>
      <FormattedMessage
        id="greeting.formal"
        defaultMessage="{fullName, select, null {Dear Sir / Madam,} other {Dear {fullName},}}"
        values={{ fullName }}
      />
    </MjmlText>
  );
}
