import { gql } from "@apollo/client";
import { SystemStyleObject } from "@chakra-ui/react";
import { Tooltip } from "@parallel/chakra/components";
import { chakraComponent } from "@parallel/chakra/utils";
import { Text } from "@parallel/components/ui";
import { ContactReference_ContactFragment } from "@parallel/graphql/__types";
import { Maybe } from "@parallel/utils/types";
import { isNonNullish } from "remeda";
import { DeletedContact } from "./DeletedContact";
import { Link } from "./Link";

export const ContactReference = chakraComponent<
  "a" | "span",
  {
    contact?: Maybe<ContactReference_ContactFragment>;
    withEmail?: boolean;
    asLink?: boolean;
    _activeContact?: SystemStyleObject;
  }
>(function ContactReference({ ref, contact, withEmail, asLink = true, _activeContact, ...props }) {
  return isNonNullish(contact) ? (
    <Tooltip isDisabled={withEmail} label={contact.email}>
      <Text
        ref={ref}
        sx={{ ...props.sx, ..._activeContact }}
        {...(asLink ? { as: Link, href: `/app/contacts/${contact.id}` } : { as: "span" })}
        {...(props as any)}
      >
        {contact.fullName}
        {withEmail ? ` <${contact.email}>` : null}
      </Text>
    </Tooltip>
  ) : (
    <DeletedContact />
  );
});

const _fragments = {
  Contact: gql`
    fragment ContactReference_Contact on Contact {
      id
      fullName
      email
    }
  `,
};
