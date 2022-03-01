import { gql } from "@apollo/client";
import { TextProps } from "@chakra-ui/react";
import { UserOrContactReference_UserOrPetitionAccessFragment } from "@parallel/graphql/__types";
import { Maybe } from "@parallel/utils/types";
import { ContactReference } from "../common/ContactReference";
import { UserReference } from "./UserReference";

interface UserOrContactReferenceProps extends TextProps {
  isLink?: boolean;
  userOrAccess?: Maybe<UserOrContactReference_UserOrPetitionAccessFragment>;
}
export function UserOrContactReference({
  userOrAccess,
  isLink,
  ...props
}: UserOrContactReferenceProps) {
  return userOrAccess?.__typename === "PetitionAccess" ? (
    <ContactReference isLink={isLink} contact={userOrAccess.contact} {...props} />
  ) : (
    <UserReference user={userOrAccess?.__typename === "User" ? userOrAccess : null} />
  );
}

UserOrContactReference.fragments = {
  UserOrPetitionAccess: gql`
    fragment UserOrContactReference_UserOrPetitionAccess on UserOrPetitionAccess {
      ... on User {
        ...UserReference_User
      }
      ... on PetitionAccess {
        contact {
          ...ContactReference_Contact
        }
      }
    }
    ${UserReference.fragments.User}
    ${ContactReference.fragments.Contact}
  `,
};
