import { gql } from "@apollo/client";
import { ContactReference_ContactFragment, Maybe } from "@parallel/graphql/__types";
import { Link } from "./Link";
import { Text, TextProps, Tooltip } from "@chakra-ui/react";
import { DeletedContact } from "./DeletedContact";

export function ContactReference({
  contact,
  isFull,
  isLink = true,
  ...props
}: {
  contact?: Maybe<ContactReference_ContactFragment>;
  isFull?: boolean;
  isLink?: boolean;
} & TextProps) {
  return contact ? (
    <Tooltip isDisabled={!contact.fullName && !isFull} label={contact.email}>
      <Text as="span" {...props}>
        {isLink ? (
          <Link href={`/app/contacts/${contact.id}`}>
            {contact.fullName || contact.email}
            {isFull && contact.fullName ? `<${contact.email}>` : null}
          </Link>
        ) : (
          <>
            {contact.fullName || contact.email}
            {isFull && contact.fullName ? `<${contact.email}>` : null}
          </>
        )}
      </Text>
    </Tooltip>
  ) : (
    <DeletedContact />
  );
}

ContactReference.fragments = {
  Contact: gql`
    fragment ContactReference_Contact on Contact {
      id
      fullName
      email
    }
  `,
};
