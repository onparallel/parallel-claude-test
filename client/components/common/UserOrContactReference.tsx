import { gql } from "@apollo/client";
import { SystemStyleObject } from "@chakra-ui/react";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { UserOrContactReference_UserOrPetitionAccessFragment } from "@parallel/graphql/__types";
import { Maybe } from "@parallel/utils/types";
import { ContactReference } from "./ContactReference";
import { UserReference } from "./UserReference";

interface UserOrContactReferenceProps {
  contactAsLink?: boolean;
  userUseYou?: boolean;
  userOrAccess?: Maybe<UserOrContactReference_UserOrPetitionAccessFragment>;
  _activeContact?: SystemStyleObject;
}
export const UserOrContactReference = chakraForwardRef<"span", UserOrContactReferenceProps>(
  function UserOrContactReference(
    { userOrAccess, contactAsLink, userUseYou, _activeContact, ...props },
    ref,
  ) {
    return userOrAccess?.__typename === "PetitionAccess" ? (
      <ContactReference
        ref={ref}
        asLink={contactAsLink}
        contact={userOrAccess.contact}
        _activeContact={_activeContact}
        {...props}
      />
    ) : (
      <UserReference
        ref={ref}
        useYou={userUseYou}
        user={userOrAccess?.__typename === "User" ? userOrAccess : null}
        {...props}
      />
    );
  },
);

const _fragments = {
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
  `,
};
