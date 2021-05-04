import { gql } from "@apollo/client";
import { Box } from "@chakra-ui/react";
import {
  SimpleContactInfoList_ContactFragment,
  SimpleContactInfoList_PublicContactFragment,
} from "@parallel/graphql/__types";
import { FormattedMessage } from "react-intl";

type ContactSelection =
  | SimpleContactInfoList_ContactFragment
  | SimpleContactInfoList_PublicContactFragment;
interface SimpleContactInfoListProps<T extends ContactSelection> {
  contacts: Array<T>;
  onContactClick?: (contactId: string) => void;
}
export function SimpleContactInfoList<T extends ContactSelection>({
  contacts,
  onContactClick,
}: SimpleContactInfoListProps<T>) {
  const isClickable = Boolean(onContactClick);
  return (
    <Box
      onClick={(e) => e.stopPropagation()}
      overflowY="auto"
      maxHeight="180px"
      paddingY={2}
    >
      {contacts.map((c) => (
        <Box
          key={c.id}
          onClick={onContactClick && (() => onContactClick?.(c.id))}
          paddingX={4}
          paddingY={0.5}
          backgroundColor="white"
          role={isClickable ? "link" : undefined}
          _hover={isClickable ? { backgroundColor: "gray.75" } : {}}
          cursor={isClickable ? "pointer" : "unset"}
        >
          {c.fullName ? (
            <Box
              whiteSpace="nowrap"
              color={isClickable ? "purple.600" : "gray.800"}
            >
              {c.fullName}
            </Box>
          ) : (
            <Box textStyle="hint">
              <FormattedMessage id="generic.no-name" defaultMessage="No name" />
            </Box>
          )}
          <Box whiteSpace="nowrap" color="gray.600" fontSize="xs">
            {c.email}
          </Box>
        </Box>
      ))}
    </Box>
  );
}

SimpleContactInfoList.fragments = {
  Contact: gql`
    fragment SimpleContactInfoList_Contact on Contact {
      id
      email
      fullName
    }
  `,
  PublicContact: gql`
    fragment SimpleContactInfoList_PublicContact on PublicContact {
      id
      email
      fullName
    }
  `,
};
