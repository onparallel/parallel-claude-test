import { gql } from "@apollo/client";
import { Button, FormControl, FormLabel, Select, Stack } from "@chakra-ui/core";
import { ConfirmDialog } from "@parallel/components/common/ConfirmDialog";
import {
  DialogProps,
  useDialog,
} from "@parallel/components/common/DialogOpenerProvider";
import {
  SignatureConfigDialog_OrgIntegrationFragment,
  SignatureConfigDialog_SignatureConfigFragment,
  SignatureConfigInput,
} from "@parallel/graphql/__types";
import { Maybe } from "@parallel/utils/types";
import { useRef, useState } from "react";
import { FormattedMessage } from "react-intl";
import {
  ContactSelect,
  ContactSelectProps,
  ContactSelectSelection,
} from "../common/ContactSelect";

export type SignatureConfigDialogProps = {
  config: Maybe<SignatureConfigDialog_SignatureConfigFragment>;
  providers: SignatureConfigDialog_OrgIntegrationFragment[];
  onSearchContacts: ContactSelectProps["onSearchContacts"];
  onCreateContact: ContactSelectProps["onCreateContact"];
};

export function SignatureConfigDialog({
  config,
  providers,
  onSearchContacts,
  onCreateContact,
  ...props
}: DialogProps<SignatureConfigDialogProps, SignatureConfigInput>) {
  const [provider, setProvider] = useState(providers[0].provider);
  const [contacts, setContacts] = useState(
    config?.contacts.map(
      (contact, index) =>
        (contact ?? {
          id: "" + index,
          email: "",
          isInvalid: true,
          isDeleted: true,
        }) as ContactSelectSelection
    ) ?? []
  );
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const contactsRef = useRef<any>();
  const isInvalid = contacts.some((c) => c === null || c.isInvalid);
  return (
    <ConfirmDialog
      initialFocusRef={contactsRef}
      size="xl"
      header={
        <FormattedMessage
          id="component.signature-config-dialog.header"
          defaultMessage="eSignature configuration"
        />
      }
      body={
        <Stack>
          <FormControl>
            <FormLabel>
              <FormattedMessage
                id="component.signature-config-dialog.provider-label"
                defaultMessage="eSignature provider"
              />
            </FormLabel>
            <Select
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
            >
              {providers.map((p, index) => (
                <option key={index} value={p.provider}>
                  {p.name}
                </option>
              ))}
            </Select>
          </FormControl>
          <FormControl isInvalid={isInvalid}>
            <FormLabel>
              <FormattedMessage
                id="component.signature-config-dialog.contacts-label"
                defaultMessage="Who has to sign the petition?"
              />
            </FormLabel>
            <ContactSelect
              ref={contactsRef}
              value={contacts}
              onChange={setContacts}
              onSearchContacts={onSearchContacts}
              onCreateContact={onCreateContact}
            />
          </FormControl>
        </Stack>
      }
      confirm={
        <Button
          colorScheme="purple"
          isDisabled={isInvalid || contacts.length === 0}
          onClick={() =>
            props.onResolve({
              provider,
              contactIds: contacts.map((c) => c!.id),
              timezone,
            })
          }
        >
          <FormattedMessage id="generic.continue" defaultMessage="Continue" />
        </Button>
      }
      {...props}
    />
  );
}

SignatureConfigDialog.fragments = {
  SignatureConfig: gql`
    fragment SignatureConfigDialog_SignatureConfig on SignatureConfig {
      provider
      contacts {
        ...ContactSelect_Contact
      }
      timezone
    }
    ${ContactSelect.fragments.Contact}
  `,
  OrgIntegration: gql`
    fragment SignatureConfigDialog_OrgIntegration on OrgIntegration {
      name
      provider
    }
  `,
};

export function useSignatureConfigDialog() {
  return useDialog(SignatureConfigDialog);
}
