import { ContactLink_ContactFragment } from "@parallel/graphql/__types";
import { Tooltip } from "@chakra-ui/core";
import { Link, LinkProps } from "./Link";
import { gql } from "apollo-boost";
import { DisableableTooltip } from "./DisableableTooltip";

export function ContactLink({
  contact,
  ...props
}: {
  contact: ContactLink_ContactFragment;
} & Omit<LinkProps, "href" | "as">) {
  return (
    <DisableableTooltip
      isDisabled={contact.fullName === null}
      showDelay={300}
      label={contact.email}
      aria-label={contact.email}
    >
      <Link
        href="/app/contacts/[contactId]"
        as={`/app/contacts/${contact.id}`}
        {...props}
      >
        {contact.fullName || contact.email}
      </Link>
    </DisableableTooltip>
  );
}

ContactLink.fragments = {
  Contact: gql`
    fragment ContactLink_Contact on Contact {
      id
      fullName
      email
    }
  `,
};
