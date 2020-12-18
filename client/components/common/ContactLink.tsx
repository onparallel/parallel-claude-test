import { gql } from "@apollo/client";
import { ContactLink_ContactFragment } from "@parallel/graphql/__types";
import { Link, LinkProps } from "./Link";
import { Tooltip } from "@chakra-ui/react";

export function ContactLink({
  contact: { id, email, fullName },
  isFull,
  ...props
}: {
  contact: ContactLink_ContactFragment;
  isFull?: boolean;
} & Omit<LinkProps, "href">) {
  return (
    <Tooltip isDisabled={!fullName && !isFull} label={email}>
      <Link href={`/app/contacts/${id}`} {...props}>
        {fullName || email}
        {isFull && fullName ? `<${email}>` : null}
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
