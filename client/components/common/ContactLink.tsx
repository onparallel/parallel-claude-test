import { gql } from "@apollo/client";
import { ContactLink_ContactFragment, Maybe } from "@parallel/graphql/__types";
import { Link, LinkProps } from "./Link";
import { Tooltip } from "@chakra-ui/react";
import { DeletedContact } from "./DeletedContact";

export function ContactLink({
  contact,
  isFull,
  ...props
}: {
  contact?: Maybe<ContactLink_ContactFragment>;
  isFull?: boolean;
} & Omit<LinkProps, "href">) {
  return contact ? (
    <Tooltip isDisabled={!contact.fullName && !isFull} label={contact.email}>
      <Link href={`/app/contacts/${contact.id}`} {...props}>
        {contact.fullName || contact.email}
        {isFull && contact.fullName ? `<${contact.email}>` : null}
      </Link>
    </Tooltip>
  ) : (
    <DeletedContact />
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
