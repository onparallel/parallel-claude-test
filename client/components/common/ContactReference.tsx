import { gql } from "@apollo/client";
import { Text, TextProps, Tooltip } from "@chakra-ui/react";
import { ContactReference_ContactFragment, Maybe } from "@parallel/graphql/__types";
import { DeletedContact } from "./DeletedContact";
import { Link } from "./Link";

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
    <Tooltip isDisabled={isFull} label={contact.email}>
      <Text as="span" {...props}>
        {isLink ? (
          <Link href={`/app/contacts/${contact.id}`}>
            {contact.fullName}
            {isFull ? `<${contact.email}>` : null}
          </Link>
        ) : (
          <>
            {contact.fullName}
            {isFull ? `<${contact.email}>` : null}
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
