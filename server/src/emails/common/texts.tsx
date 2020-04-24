import { IntlShape } from "react-intl";
import outdent from "outdent";
import { DateTimeProps } from "./DateTime";

export function closing({}, intl: IntlShape) {
  return outdent`
    ${intl.formatMessage({
      id: "closing.text",
      defaultMessage: "Regards,",
    })}
    ${intl.formatMessage({
      id: "closing.sender",
      defaultMessage: "The Parallel team",
    })}
    `;
}

export function greeting({ name }: { name: string | null }, intl: IntlShape) {
  return intl.formatMessage(
    {
      id: "greeting",
      defaultMessage: "Hi{name, select, null {} other { {name}}},",
    },
    { name }
  );
}

export function petitionFieldList(
  {
    fields,
  }: {
    fields: { id: number; title: string | null }[];
  },
  intl: IntlShape
) {
  return fields
    .map(
      ({ title }, index) =>
        `${index + 1}. ${
          title ||
          intl.formatMessage({
            id: "generic.untitled-field",
            defaultMessage: "Untitled field",
          })
        }`
    )
    .join("\n");
}

export function renderSlateText(node: any) {
  function render(node: any, index: number) {
    if (Array.isArray(node.children)) {
      switch (node.type) {
        case "paragraph":
        case undefined:
          return `${node.children.map(render).join("")}`;
        case "bulleted-list":
          return node.children.map(render).join("\n");
        case "list-item":
          return `- ${node.children.map(render).join("")}`;
      }
    } else if (typeof node.text === "string") {
      return node.text;
    }
    return "";
  }
  return node?.map(render).join("\n") || "";
}

export function dateTime({ value, format }: DateTimeProps, intl: IntlShape) {
  return intl.formatDate(value, format);
}

export function disclaimer({ email }: { email: string }, intl: IntlShape) {
  return intl.formatMessage(
    {
      id: "disclaimer",
      defaultMessage:
        "This is an email sent via Parallel from the verified account {email}",
    },
    { email }
  );
}
