import { Button, List, ListItem, Text } from "@chakra-ui/core";
import { ConfirmDialog } from "@parallel/components/common/ConfirmDialog";
import {
  DialogCallbacks,
  useDialog,
} from "@parallel/components/common/DialogOpenerProvider";
import { PetitionScheduledDialog_ContactFragment } from "@parallel/graphql/__types";
import { gql } from "apollo-boost";
import { useRef } from "react";
import { FormattedMessage } from "react-intl";
import { ContactLink } from "../common/ContactLink";
import { DateTime } from "../common/DateTime";
import { FORMATS } from "@parallel/utils/dates";

export function PetitionScheduledDialog({
  contacts,
  scheduledAt,
  ...props
}: {
  contacts: PetitionScheduledDialog_ContactFragment[];
  scheduledAt: Date;
} & DialogCallbacks<string>) {
  const focusRef = useRef<HTMLElement>(null);
  return (
    <ConfirmDialog
      focusRef={focusRef}
      header={
        <FormattedMessage
          id="petition.petition-scheduled-dialog.header"
          defaultMessage="Petition scheduled"
        />
      }
      body={
        contacts.length === 1 ? (
          <Text>
            <FormattedMessage
              id="petition.petition-scheduled-dialog.single-contact"
              defaultMessage="Your petition will be sent to {nameOrEmail} on {date}."
              values={{
                nameOrEmail: <ContactLink contact={contacts[0]} />,
                date: (
                  <DateTime
                    as="span"
                    fontWeight="bold"
                    value={scheduledAt}
                    format={FORMATS.LLL}
                  />
                ),
              }}
            />
          </Text>
        ) : (
          <>
            <Text>
              <FormattedMessage
                id="petition.petition-scheduled-dialog.multiple-contacts"
                defaultMessage="Your petition will be sent to the following contacts on {date}."
                values={{
                  date: (
                    <DateTime
                      as="span"
                      fontWeight="bold"
                      value={scheduledAt}
                      format={FORMATS.LLL}
                    />
                  ),
                }}
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
            id="generic.go-to-review"
            defaultMessage="Go to review"
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

PetitionScheduledDialog.fragments = {
  contact: gql`
    fragment PetitionScheduledDialog_Contact on Contact {
      ...ContactLink_Contact
    }
    ${ContactLink.fragments.contact}
  `,
};

export function usePetitionScheduledDialog() {
  return useDialog(PetitionScheduledDialog);
}
