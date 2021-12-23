import { gql } from "@apollo/client";
import { TextProps } from "@chakra-ui/react";
import { UserOrContactReference_UserOrPetitionAccessFragment } from "@parallel/graphql/__types";
import { Maybe } from "@parallel/utils/types";
import { ContactReference } from "../common/ContactReference";
import { UserReference } from "./UserReference";

interface UserOrContactReferenceProps extends TextProps {
  userOrAccess?: Maybe<UserOrContactReference_UserOrPetitionAccessFragment>;
}
export function UserOrContactReference({ userOrAccess, ...props }: UserOrContactReferenceProps) {
  return userOrAccess?.__typename === "User" ? (
    <UserReference user={userOrAccess} />
  ) : userOrAccess?.__typename === "PetitionAccess" ? (
    <ContactReference contact={userOrAccess.contact} {...props} />
  ) : null;
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
