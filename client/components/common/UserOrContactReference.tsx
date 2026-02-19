import { gql } from "@apollo/client";
import { SystemStyleObject } from "@chakra-ui/react";
import { chakraComponent } from "@parallel/chakra/utils";
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
export const UserOrContactReference = chakraComponent<"span", UserOrContactReferenceProps>(
  function UserOrContactReference({
    ref,
    userOrAccess,
    contactAsLink,
    userUseYou,
    _activeContact,
    ...props
  }) {
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
