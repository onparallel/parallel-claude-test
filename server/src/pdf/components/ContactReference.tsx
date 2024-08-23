import { gql } from "@apollo/client";
import { Text } from "@react-pdf/renderer";
import { Style } from "@react-pdf/types";
import { FormattedMessage } from "react-intl";
import { isNonNullish } from "remeda";
import { ContactReference_ContactFragment, Maybe } from "../__types";
import { mergeStyles } from "../utils/styles";

interface ContactReferenceProps {
  contact?: Maybe<ContactReference_ContactFragment>;
  style?: Style | Style[];
  _deleted?: Style | Style[];
}

export function ContactReference({ contact, _deleted, ...props }: ContactReferenceProps) {
  return isNonNullish(contact) ? (
    <Text {...props}>{contact.fullName}</Text>
  ) : (
    <Text {...props} style={mergeStyles(props.style, _deleted, { fontStyle: "italic" })}>
      <FormattedMessage id="generic.deleted-contact" defaultMessage="Deleted Contact" />
    </Text>
  );
}

ContactReference.fragments = {
  Contact: gql`
    fragment ContactReference_Contact on Contact {
      id
      fullName
    }
  `,
};
