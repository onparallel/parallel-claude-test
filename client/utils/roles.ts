import { gql } from "@apollo/client";
import { isAdmin_UserFragment } from "@parallel/graphql/__types";

export function isAdmin(user: isAdmin_UserFragment) {
  return ["OWNER", "ADMIN"].includes(user.role);
}

isAdmin.fragments = {
  User: gql`
    fragment isAdmin_User on User {
      role
    }
  `,
};
