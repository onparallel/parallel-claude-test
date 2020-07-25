import { gql } from "@apollo/client";
import { ContactLink_ContactFragment } from "@parallel/graphql/__types";
import { Link, LinkProps } from "./Link";
import { Tooltip } from "@chakra-ui/core";

export function ContactLink({
  contact,
  ...props
}: {
  contact: ContactLink_ContactFragment;
} & Omit<LinkProps, "href" | "as">) {
  return (
    <Tooltip isDisabled={contact.fullName === null} label={contact.email}>
      <Link
        href="/app/contacts/[contactId]"
        as={`/app/contacts/${contact.id}`}
        {...props}
      >
        {contact.fullName || contact.email}
      </Link>
    </Tooltip>
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
