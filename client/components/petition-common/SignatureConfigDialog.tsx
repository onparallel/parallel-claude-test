import { gql } from "@apollo/client";
import {
  Button,
  FormControl,
  FormLabel,
  Input,
  Select,
  Stack,
} from "@chakra-ui/core";
import { ConfirmDialog } from "@parallel/components/common/ConfirmDialog";
import {
  DialogProps,
  useDialog,
} from "@parallel/components/common/DialogOpenerProvider";
import {
  SignatureConfigDialog_OrgIntegrationFragment,
  SignatureConfigDialog_PetitionFragment,
  SignatureConfigInput,
} from "@parallel/graphql/__types";

import { useMemo, useRef, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import {
  ContactSelect,
  ContactSelectProps,
  ContactSelectSelection,
} from "../common/ContactSelect";
import { HelpPopover } from "../common/HelpPopover";

export type SignatureConfigDialogProps = {
  petition: SignatureConfigDialog_PetitionFragment;
  providers: SignatureConfigDialog_OrgIntegrationFragment[];
  onSearchContacts: ContactSelectProps["onSearchContacts"];
  onCreateContact: ContactSelectProps["onCreateContact"];
};

export function SignatureConfigDialog({
  petition,
  providers,
  onSearchContacts,
  onCreateContact,
  ...props
}: DialogProps<SignatureConfigDialogProps, SignatureConfigInput>) {
  const [title, setTitle] = useState(
    petition.signatureConfig?.title ?? petition.name ?? ""
  );
  const [provider, setProvider] = useState(providers[0].provider);
  const [contacts, setContacts] = useState(
    petition.signatureConfig?.contacts.map(
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
  const isInvalid = useMemo(
    () => contacts.some((c) => c === null || c.isInvalid) || !title,
    [contacts, title]
  );

  const intl = useIntl();
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
              placeholder={intl.formatMessage({
                id: "petition.signature-config-dialog.contacts-placeholder",
                defaultMessage: "Search contacts...",
              })}
              ref={contactsRef}
              value={contacts}
              onChange={setContacts}
              onSearchContacts={onSearchContacts}
              onCreateContact={onCreateContact}
            />
          </FormControl>
          <FormControl isInvalid={isInvalid}>
            <FormLabel display="flex" alignItems="center">
              <FormattedMessage
                id="component.signature-config-dialog.title-label"
                defaultMessage="Title of the document"
              />
              <HelpPopover marginLeft={2}>
                <FormattedMessage
                  id="component.signature-config-dialog.title-help"
                  defaultMessage="We will use this as the title of the signing document"
                />
              </HelpPopover>
            </FormLabel>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={intl.formatMessage({
                id: "component.signature-config-dialog.title-placeholder",
                defaultMessage: "Enter a title...",
              })}
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
              title,
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
  Petition: gql`
    fragment SignatureConfigDialog_Petition on Petition {
      name
      signatureConfig {
        provider
        contacts {
          ...ContactSelect_Contact
        }
        timezone
        title
      }
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
