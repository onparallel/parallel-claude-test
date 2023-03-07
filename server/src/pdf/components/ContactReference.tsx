import { gql } from "@apollo/client";
import { Text } from "@react-pdf/renderer";
import { Style } from "@react-pdf/types";
import { FormattedMessage } from "react-intl";
import { isDefined } from "remeda";
import { mergeStyles } from "../utils/styles";
import { ContactReference_ContactFragment, Maybe } from "../__types";

interface ContactReferenceProps {
  contact?: Maybe<ContactReference_ContactFragment>;
  style?: Style | Style[];
  _deleted?: Style | Style[];
}

export function ContactReference({ contact, _deleted, ...props }: ContactReferenceProps) {
  return isDefined(contact) ? (
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
