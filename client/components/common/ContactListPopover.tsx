import { gql } from "@apollo/client";
import {
  Box,
  List,
  ListItem,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverContent,
  PopoverTrigger,
  Portal,
} from "@chakra-ui/react";
import {
  ContactListPopover_ContactFragment,
  ContactListPopover_PetitionSignerFragment,
  ContactListPopover_PublicContactFragment,
} from "@parallel/graphql/__types";
import { ReactNode } from "react";
import { FormattedMessage } from "react-intl";

type ContactSelection =
  | ContactListPopover_ContactFragment
  | ContactListPopover_PublicContactFragment
  | ContactListPopover_PetitionSignerFragment;
interface ContactListPopoverProps<T extends ContactSelection> {
  children: ReactNode;
  contacts: Array<T>;
  onContactClick?: (contactId: string) => void;
}
export function ContactListPopover<T extends ContactSelection>({
  children,
  contacts,
  onContactClick,
}: ContactListPopoverProps<T>) {
  const isClickable = Boolean(onContactClick);

  function handleContactClick(c: ContactSelection) {
    if (c.__typename === "Contact" || c.__typename === "PublicContact") {
      onContactClick?.(c.id);
    }
  }
  return (
    <Popover trigger="hover">
      <PopoverTrigger>{children}</PopoverTrigger>
      <Portal>
        <PopoverContent width="fit-content">
          <PopoverArrow />
          <PopoverBody
            paddingX={0}
            paddingY={2}
            overflow="auto"
            maxHeight="300px"
            onClick={(e) => e.stopPropagation()}
          >
            <List>
              {contacts.map((c, index) => (
                <ListItem
                  key={index}
                  onClick={() => handleContactClick(c)}
                  paddingX={4}
                  paddingY={0.5}
                  backgroundColor="white"
                  role={isClickable ? "link" : undefined}
                  _hover={isClickable ? { backgroundColor: "gray.75" } : {}}
                  cursor={isClickable ? "pointer" : "unset"}
                >
                  {c.fullName ? (
                    <Box whiteSpace="nowrap" color={isClickable ? "purple.600" : "gray.800"}>
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
                </ListItem>
              ))}
            </List>
          </PopoverBody>
        </PopoverContent>
      </Portal>
    </Popover>
  );
}

ContactListPopover.fragments = {
  Contact: gql`
    fragment ContactListPopover_Contact on Contact {
      id
      email
      fullName
    }
  `,
  PublicContact: gql`
    fragment ContactListPopover_PublicContact on PublicContact {
      id
      email
      fullName
    }
  `,
  PetitionSigner: gql`
    fragment ContactListPopover_PetitionSigner on PetitionSigner {
      email
      fullName
    }
  `,
};
