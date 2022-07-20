import { gql } from "@apollo/client";
import { ContactReference_ContactFragment, Maybe } from "@parallel/graphql/__types";
import { Link } from "./Link";
import { Text, TextProps, Tooltip } from "@chakra-ui/react";
import { DeletedContact } from "./DeletedContact";
import { FormattedMessage } from "react-intl";

export function ContactReference({
  contact,
  isFull,
  isLink = true,
  isEmpty,
  ...props
}: {
  contact?: Maybe<ContactReference_ContactFragment>;
  isFull?: boolean;
  isLink?: boolean;
  isEmpty?: boolean;
} & TextProps) {
  if (isEmpty) {
    return (
      <Text as="span" textStyle="hint">
        <FormattedMessage id="component.contact-reference.empty" defaultMessage="Empty" />
      </Text>
    );
  }

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
