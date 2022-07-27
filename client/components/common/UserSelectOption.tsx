import { gql } from "@apollo/client";
import { Box, Flex, Text } from "@chakra-ui/react";
import { UsersIcon } from "@parallel/chakra/icons";
import {
  UserSelectOption_UserFragment,
  UserSelectOption_UserGroupFragment,
} from "@parallel/graphql/__types";
import { FormattedMessage, useIntl } from "react-intl";
import { HighlightText } from "./HighlightText";

interface UserSelectOptionProps {
  data: UserSelectOption_UserFragment | UserSelectOption_UserGroupFragment;
  highlight?: string;
  isDisabled?: boolean;
}

export function UserSelectOption({ data, highlight, isDisabled }: UserSelectOptionProps) {
  const intl = useIntl();
  return data.__typename === "User" ? (
    <Box verticalAlign="baseline" isTruncated>
      {data.fullName ? (
        <>
          <HighlightText search={highlight} as="span">
            {data.fullName}
          </HighlightText>
          <Text as="span" display="inline-block" width={2} />
          <HighlightText search={highlight} as="span" fontSize="85%" opacity={0.7}>
            {data.email}
          </HighlightText>
        </>
      ) : (
        <Text as="span">{data.email}</Text>
      )}
    </Box>
  ) : data.__typename === "UserGroup" ? (
    <Flex alignItems="center">
      <UsersIcon
        marginRight={2}
        position="relative"
        aria-label={intl.formatMessage({
          id: "component.user-select.user-group-icon-alt",
          defaultMessage: "Team",
        })}
      />
      <Box verticalAlign="baseline">
        <HighlightText search={highlight} as="span">
          {data.name}
        </HighlightText>
        <Text as="span" display="inline-block" width={2} />
        <Text as="span" fontSize="85%" opacity={0.7}>
          <FormattedMessage
            id="generic.n-group-members"
            defaultMessage="{count, plural, =1 {1 member} other {# members}}"
            values={{ count: data.memberCount }}
          />
        </Text>
      </Box>
    </Flex>
  ) : null;
}

UserSelectOption.fragments = {
  User: gql`
    fragment UserSelectOption_User on User {
      id
      fullName
      email
    }
  `,
  UserGroup: gql`
    fragment UserSelectOption_UserGroup on UserGroup {
      id
      name
      memberCount
    }
  `,
};
