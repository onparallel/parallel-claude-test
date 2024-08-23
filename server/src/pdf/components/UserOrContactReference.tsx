import { gql } from "@apollo/client";
import { Style } from "@react-pdf/types";
import { Maybe, UserOrContactReference_UserOrPetitionAccessFragment } from "../__types";
import { ContactReference } from "./ContactReference";
import { UserReference } from "./UserReference";

interface UserOrContactReferenceProps {
  userOrAccess?: Maybe<UserOrContactReference_UserOrPetitionAccessFragment>;
  style?: Style | Style[];
  _deleted?: Style | Style[];
}
export function UserOrContactReference({ userOrAccess, ...props }: UserOrContactReferenceProps) {
  return userOrAccess?.__typename === "PetitionAccess" ? (
    <ContactReference contact={userOrAccess.contact} {...props} />
  ) : (
    <UserReference user={userOrAccess} {...props} />
  );
}

UserOrContactReference.fragments = {
  UserOrPetitionAccess: gql`
    fragment UserOrContactReference_UserOrPetitionAccess on UserOrPetitionAccess {
      __typename
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
