import { MjmlText } from "mjml-react";
import { FormattedMessage } from "react-intl";

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

export function GreetingContact({
  name,
  fullName,
  tone,
}: {
  name: string | null;
  fullName: string | null;
  tone: string;
}) {
  return (
    <MjmlText>
      {tone === "INFORMAL" ? (
        <FormattedMessage
          id="greeting-contact.informal"
          defaultMessage="{name, select, null {Hello,} other {Hello {name},}}"
          values={{ name }}
        />
      ) : (
        <FormattedMessage
          id="greeting-contact.formal"
          defaultMessage="{fullName, select, null {Dear Sir / Madam,} other {Dear {fullName},}}"
          values={{ fullName }}
        />
      )}
    </MjmlText>
  );
}

export function GreetingReminder({
  name,
  fullName,
  tone,
}: {
  name: string | null;
  fullName: string | null;
  tone: string;
}) {
  return (
    <MjmlText>
      {tone === "INFORMAL" ? (
        <FormattedMessage
          id="greeting-reminder.informal"
          defaultMessage="{name, select, null {🔔 Hello!} other {🔔 Hello {name}!}}"
          values={{ name }}
        />
      ) : (
        <FormattedMessage
          id="greeting-contact.formal"
          defaultMessage="{fullName, select, null {Dear Sir / Madam,} other {Dear {fullName},}}"
          values={{ fullName }}
        />
      )}
    </MjmlText>
  );
}
