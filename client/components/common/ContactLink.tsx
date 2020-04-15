import { ContactLink_ContactFragment } from "@parallel/graphql/__types";
import { Tooltip } from "@chakra-ui/core";
import { Link, LinkProps } from "./Link";
import { gql } from "apollo-boost";

export function ContactLink({
  contact,
  ...props
}: {
  contact: ContactLink_ContactFragment;
} & Omit<LinkProps, "href" | "as">) {
  const link = (
    <Link
      href="/app/contacts/[contactId]"
      as={`/app/contacts/${contact.id}`}
      {...props}
    >
      {contact.fullName || contact.email}
    </Link>
  );
  if (contact.fullName) {
    return (
      <Tooltip label={contact.email} aria-label={contact.email}>
        {link}
      </Tooltip>
    );
  } else {
    return link;
  }
}

ContactLink.fragments = {
  contact: gql`
    fragment ContactLink_Contact on Contact {
      id
      fullName
      email
    }
  `,
};
