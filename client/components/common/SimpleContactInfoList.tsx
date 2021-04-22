import { gql } from "@apollo/client";
import { Flex, Stack, Text } from "@chakra-ui/react";
import {
  SimpleContactInfoList_ContactFragment,
  SimpleContactInfoList_PublicContactFragment,
} from "@parallel/graphql/__types";
import { useGoToContact } from "@parallel/utils/goToContact";
import { useState } from "react";

type Contact = SimpleContactInfoList_ContactFragment;
type PublicContact = SimpleContactInfoList_PublicContactFragment;
interface SimpleContactInfoListProps<T extends Contact | PublicContact> {
  contacts: Array<T>;
  isClickable?: boolean;
}
export function SimpleContactInfoList<T extends Contact | PublicContact>({
  contacts,
  isClickable,
}: SimpleContactInfoListProps<T>) {
  const goToContact = useGoToContact();
  const [hoveredContactId, setHoveredContactId] = useState<string | null>(null);
  function handleContactClick() {
    if (isClickable && hoveredContactId) {
      goToContact(hoveredContactId);
    }
  }
  return (
    <Stack
      onClick={(e) => e.stopPropagation()}
      spacing={0}
      overflowY="auto"
      maxHeight="180px"
    >
      {contacts.map((c) => (
        <Flex
          height="62px"
          key={c.id}
          direction="column"
          onClick={handleContactClick}
          onMouseOver={() => setHoveredContactId(c.id)}
          backgroundColor={
            isClickable && c.id === hoveredContactId ? "gray.75" : "transparent"
          }
        >
          <Flex direction="column" padding={2}>
            <Text color={isClickable ? "purple.600" : "gray.800"}>
              {c.fullName}
            </Text>
            <Text color="gray.600" fontSize="sm">
              {c.email}
            </Text>
          </Flex>
        </Flex>
      ))}
    </Stack>
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
