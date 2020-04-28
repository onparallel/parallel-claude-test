import { Button, List, ListItem, Text } from "@chakra-ui/core";
import { ConfirmDialog } from "@parallel/components/common/ConfirmDialog";
import {
  DialogCallbacks,
  useDialog,
} from "@parallel/components/common/DialogOpenerProvider";
import { PetitionSentDialog_ContactFragment } from "@parallel/graphql/__types";
import { gql } from "apollo-boost";
import { useRef } from "react";
import { FormattedMessage } from "react-intl";
import { ContactLink } from "../common/ContactLink";

export function PetitionSentDialog({
  contacts,
  ...props
}: {
  contacts: PetitionSentDialog_ContactFragment[];
} & DialogCallbacks<string>) {
  const focusRef = useRef<HTMLElement>(null);
  return (
    <ConfirmDialog
      focusRef={focusRef}
      header={
        <FormattedMessage
          id="petition.petition-sent-dialog.header"
          defaultMessage="Petition sent"
        />
      }
      body={
        contacts.length === 1 ? (
          <Text>
            <FormattedMessage
              id="petition.petition-sent-dialog.single-contact"
              defaultMessage="Your petition is on it's way to {nameOrEmail}."
              values={{
                nameOrEmail: <ContactLink contact={contacts[0]} />,
              }}
            />
          </Text>
        ) : (
          <>
            <Text>
              <FormattedMessage
                id="petition.petition-sent-dialog.multiple-contacts"
                defaultMessage="Your petition is on it's way to the following contacts:"
              />
            </Text>
            <List styleType="disc">
              {contacts.map((contact) => (
                <ListItem key={contact.id}>
                  <ContactLink contact={contact} />
                </ListItem>
              ))}
            </List>
          </>
        )
      }
      confirm={
        <Button
          ref={focusRef}
          variantColor="purple"
          onClick={() => props.onResolve()}
        >
          <FormattedMessage
            id="generic.go-to-replies"
            defaultMessage="Go to replies"
          />
        </Button>
      }
      cancel={
        <Button onClick={() => props.onReject()}>
          <FormattedMessage
            id="generic.dismiss-button"
            defaultMessage="Dismiss"
          />
        </Button>
      }
      {...props}
    />
  );
}

PetitionSentDialog.fragments = {
  contact: gql`
    fragment PetitionSentDialog_Contact on Contact {
      ...ContactLink_Contact
    }
    ${ContactLink.fragments.contact}
  `,
};

export function usePetitionSentDialog() {
  return useDialog(PetitionSentDialog);
}
