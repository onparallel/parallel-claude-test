import { MjmlText } from "mjml-react";
import { FormattedMessage } from "react-intl";
import { Tone } from "../utils/types";

export function GreetingUser({ name }: { name: string | null }) {
  return (
    <MjmlText>
      <FormattedMessage
        id="greeting-user"
        defaultMessage="{name, select, null {Hi,} other {Hi {name},}}"
        values={{ name }}
      />
    </MjmlText>
  );
}

export function GreetingNewUser({ name }: { name: string | null }) {
  return (
    <MjmlText>
      <FormattedMessage
        id="component.greeting-new-user"
        defaultMessage="{name, select, null {Hi! 👋} other {Hi {name}! 👋}}"
        values={{ name }}
      />
    </MjmlText>
  );
}

export function GreetingContact({
  name,
  fullName,
  tone,
}: {
  name: string;
  fullName: string;
  tone: Tone;
}) {
  return (
    <MjmlText>
      {tone === "INFORMAL" ? (
        <FormattedMessage
          id="greeting-contact.informal"
          defaultMessage="Hello {name},"
          values={{ name }}
        />
      ) : (
        <FormattedMessage
          id="greeting-contact.formal"
          defaultMessage="Dear {fullName},"
          values={{ fullName }}
        />
      )}
    </MjmlText>
  );
}
