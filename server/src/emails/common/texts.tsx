import { IntlShape } from "react-intl";
import outdent from "outdent";
import { DateTimeProps } from "./DateTime";
import { PetitionField } from "./PetitionFieldList";
import { Tone } from "../utils/types";

export function closing({}, intl: IntlShape) {
  return outdent`
    ${intl.formatMessage({
      id: "closing.text",
      defaultMessage: "Regards,",
    })}
    ${intl.formatMessage({
      id: "closing.sender",
      defaultMessage: "The Parallel team.",
    })}
    `;
}

export function greetingUser({ name }: { name: string | null }, intl: IntlShape) {
  return intl.formatMessage(
    {
      id: "greeting-user",
      defaultMessage: "{name, select, null {Hi,} other {Hi {name},}}",
    },
    { name }
  );
}

export function greetingContact(
  { name, fullName, tone }: { name: string; fullName: string; tone: Tone },
  intl: IntlShape
) {
  return intl.formatMessage(
    {
      id: "greeting-contact",
      defaultMessage: "{tone, select, INFORMAL{Hello {name},} other{Dear {fullName},}}",
    },
    { name, fullName, tone }
  );
}

export function petitionFieldList(
  {
    fields,
  }: {
    fields: PetitionField[];
  },
  intl: IntlShape
) {
  return fields
    .map(
      ({ position, title }, index) =>
        `  ${position + 1}. ${
          title ||
          intl.formatMessage({
            id: "generic.untitled-field",
            defaultMessage: "Untitled field",
          })
        }`
    )
    .join("\n");
}

export function dateTime({ value, format }: DateTimeProps, intl: IntlShape) {
  return intl.formatDate(value, format);
}

export function disclaimer({ email }: { email: string }, intl: IntlShape) {
  return intl.formatMessage(
    {
      id: "disclaimer",
      defaultMessage: "This is an email sent via Parallel from the verified account {email}",
    },
    { email }
  );
}

export function gdprDisclaimer(intl: IntlShape) {
  return intl.formatMessage({
    id: "gdpr.processor-disclaimer",
    defaultMessage:
      "Under the provisions of Regulation (EU) 2016/679 of the European Parliament and of the Council of April 27, 2016 regarding the protection of natural persons with regard to the processing of personal data and on the free movement of such data, you are informed that Parallel Solutions, SL has sent you this email in fulfillment of the order received for the provision of services regarding the management of information workflows. You can contact the data controller to exercise your rights.",
  });
}
