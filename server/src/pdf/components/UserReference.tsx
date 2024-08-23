import { gql } from "@apollo/client";
import { Text } from "@react-pdf/renderer";
import { Style } from "@react-pdf/types";
import { FormattedMessage } from "react-intl";
import { isNonNullish } from "remeda";
import { Maybe, UserReference_UserFragment } from "../__types";
import { mergeStyles } from "../utils/styles";

interface UserReferenceProps {
  user?: Maybe<UserReference_UserFragment>;
  style?: Style | Style[];
  _deleted?: Style | Style[];
}

export function UserReference({ user, _deleted, ...props }: UserReferenceProps) {
  return isNonNullish(user) ? (
    <Text {...props}>{user.fullName}</Text>
  ) : (
    <Text {...props} style={mergeStyles(props.style, _deleted, { fontStyle: "italic" })}>
      <FormattedMessage id="generic.deleted-user" defaultMessage="Deleted user" />
    </Text>
  );
}

UserReference.fragments = {
  User: gql`
    fragment UserReference_User on User {
      id
      fullName
    }
  `,
};
