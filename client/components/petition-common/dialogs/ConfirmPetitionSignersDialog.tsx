import { gql } from "@apollo/client";
import { Box, Button, Checkbox, FormControl, Stack, Text } from "@chakra-ui/react";
import {
  ContactSelect,
  ContactSelectInstance,
  ContactSelectSelection,
} from "@parallel/components/common/ContactSelect";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { GrowingTextarea } from "@parallel/components/common/GrowingTextarea";
import { PaddedCollapse } from "@parallel/components/common/PaddedCollapse";
import {
  ConfirmPetitionSignersDialog_PetitionAccessFragment,
  ConfirmPetitionSignersDialog_PetitionSignerFragment,
  ConfirmPetitionSignersDialog_UserFragment,
  Maybe,
  SignatureConfigInputSigner,
} from "@parallel/graphql/__types";
import { useCreateContact } from "@parallel/utils/mutations/useCreateContact";
import { useSearchContacts } from "@parallel/utils/useSearchContacts";
import { useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";
import { isDefined, pick } from "remeda";
import { SelectedSignerRow } from "../SelectedSignerRow";
import { SuggestedSignerRow } from "../SuggestedSignerRow";
import { useConfirmSignerInfoDialog } from "./ConfirmSignerInfoDialog";

interface ConfirmPetitionSignersDialogProps {
  user: ConfirmPetitionSignersDialog_UserFragment;
  accesses: ConfirmPetitionSignersDialog_PetitionAccessFragment[];
  fixedSigners: ConfirmPetitionSignersDialog_PetitionSignerFragment[];
  allowAdditionalSigners: boolean;
}

export interface ConfirmPetitionSignersDialogResult {
  signers: SignatureConfigInputSigner[];
  message: Maybe<string>;
}

export type SignerSelectSelection = Omit<
  ConfirmPetitionSignersDialog_PetitionSignerFragment,
  "__typename"
> & {
  isFixed?: boolean;
  isSuggested?: boolean;
};

export function ConfirmPetitionSignersDialog({
  user,
  accesses,
  fixedSigners,
  allowAdditionalSigners,
  ...props
}: DialogProps<ConfirmPetitionSignersDialogProps, ConfirmPetitionSignersDialogResult>) {
  const {
    control,
    handleSubmit,
    watch,
    register,
    formState: { errors },
  } = useForm<{ signers: SignerSelectSelection[]; message: Maybe<string> }>({
    mode: "onChange",
    defaultValues: {
      signers: fixedSigners.map((s) => ({ ...s, isFixed: true })),
      message: null,
    },
  });

  const [showMessage, setShowMessage] = useState(false);

  const signers = watch("signers");

  const suggestions: SignerSelectSelection[] = [
    {
      email: user.email,
      firstName: user.firstName ?? "",
      lastName: user.lastName,
      isSuggested: true,
    },
    ...accesses
      .filter(
        (a) => a.status === "ACTIVE" && isDefined(a.contact) && a.contact.email !== user.email
      )
      .map((a) => ({
        contactId: a.contact!.id,
        isSuggested: true,
        ...pick(a.contact!, ["email", "firstName", "lastName"]),
      })),
  ].filter((suggestion) => !signers.some((s) => s.email === suggestion.email));

  const handleSearchContacts = useSearchContacts();
  const handleCreateContact = useCreateContact();
  const intl = useIntl();

  const showConfirmSignerInfo = useConfirmSignerInfoDialog();
  const [selectedContact, setSelectedContact] = useState<ContactSelectSelection | null>(null);
  const contactSelectRef = useRef<ContactSelectInstance<false>>(null);

  return (
    <ConfirmDialog
      size="xl"
      initialFocusRef={contactSelectRef}
      content={{
        as: "form",
        onSubmit: handleSubmit(({ signers, message }) => {
          props.onResolve({
            message: showMessage ? message : null,
            signers: signers.map((s) => ({
              contactId: s.contactId,
              email: s.email,
              firstName: s.firstName,
              lastName: s.lastName ?? "",
            })),
          });
        }),
      }}
      header={
        <FormattedMessage
          id="component.confirm-petition-signers-dialog.header"
          defaultMessage="Who has to sign the document?"
        />
      }
      body={
        <>
          <FormControl id="signers" isInvalid={!!errors.signers}>
            {allowAdditionalSigners ? (
              <Text color="gray.500" marginLeft={1}>
                <FormattedMessage
                  id="component.confirm-petition-signers-dialog.signers-added"
                  defaultMessage="{count, plural, =0{You haven't added any signers yet} one{1 signer added} other{# signers added}}"
                  values={{ count: signers.length }}
                />
              </Text>
            ) : (
              <FormattedMessage
                id="component.confirm-petition-signers-dialog.confirmation-text"
                defaultMessage="When you start the signature, we will send the document to be signed to the following contacts:"
              />
            )}
            <Controller
              name="signers"
              control={control}
              render={({ field: { onChange, value: signers } }) => (
                <>
                  <Stack spacing={0} paddingY={1} maxH="210px" overflowY="auto">
                    {signers.map((signer, index) => (
                      <SelectedSignerRow
                        key={index}
                        isEditable={!signer.isFixed}
                        signer={signer}
                        onRemoveClick={() => onChange(signers.filter((_, i) => index !== i))}
                        onEditClick={async () => {
                          try {
                            onChange([
                              ...signers.slice(0, index),
                              await showConfirmSignerInfo(signer),
                              ...signers.slice(index + 1),
                            ]);
                          } catch {}
                        }}
                      />
                    ))}
                  </Stack>
                  {allowAdditionalSigners ? (
                    <Box marginTop={2}>
                      <ContactSelect
                        ref={contactSelectRef}
                        value={selectedContact}
                        onChange={async (contact: ContactSelectSelection) => {
                          try {
                            onChange([
                              ...signers,
                              signers.find((s) => s.email === contact.email)
                                ? await showConfirmSignerInfo(contact)
                                : contact,
                            ]);
                          } catch {}
                          setSelectedContact(null);
                        }}
                        onSearchContacts={handleSearchContacts}
                        onCreateContact={handleCreateContact}
                        placeholder={intl.formatMessage({
                          id: "component.confirm-petition-signers-dialog.contact-select.placeholder",
                          defaultMessage: "Add a contact to sign",
                        })}
                      />
                      {suggestions.length > 0 ? (
                        <>
                          <Text fontWeight="bold" marginTop={4}>
                            <FormattedMessage
                              id="component.confirm-petition-signers-dialog.suggestions"
                              defaultMessage="Suggested:"
                            />
                          </Text>
                          <Stack marginTop={2} paddingLeft={2}>
                            {suggestions.map((suggestion, i) => (
                              <SuggestedSignerRow
                                key={i}
                                signer={suggestion}
                                onAddClick={() => {
                                  onChange([...signers, suggestion]);
                                }}
                              />
                            ))}
                          </Stack>
                        </>
                      ) : null}
                    </Box>
                  ) : null}
                </>
              )}
            />
          </FormControl>
          {signers.some((s) => !s.isFixed) ? (
            <FormControl isInvalid={!!errors.message}>
              <Checkbox
                marginY={4}
                colorScheme="purple"
                isChecked={showMessage}
                onChange={(e) => setShowMessage(e.target.checked)}
              >
                <FormattedMessage
                  id="component.confirm-petition-signers-dialog.include-message"
                  defaultMessage="Include message"
                />
              </Checkbox>
              <PaddedCollapse in={showMessage}>
                <GrowingTextarea
                  {...register("message", { required: showMessage })}
                  maxHeight="30vh"
                  aria-label={intl.formatMessage({
                    id: "component.confirm-petition-signers-dialog.message-placeholder",
                    defaultMessage: "Write here a message for the signers...",
                  })}
                  placeholder={intl.formatMessage({
                    id: "component.confirm-petition-signers-dialog.message-placeholder",
                    defaultMessage: "Write here a message for the signers...",
                  })}
                />
              </PaddedCollapse>
            </FormControl>
          ) : null}
        </>
      }
      confirm={
        <Button
          data-action="start-signature"
          colorScheme="purple"
          type="submit"
          isDisabled={signers.length === 0}
        >
          <FormattedMessage
            id="component.confirm-petition-signers-dialog.start-signature-button"
            defaultMessage="Start signature"
          />
        </Button>
      }
      {...props}
    />
  );
}

ConfirmPetitionSignersDialog.fragments = {
  User: gql`
    fragment ConfirmPetitionSignersDialog_User on User {
      id
      email
      firstName
      lastName
    }
  `,
  PetitionAccess: gql`
    fragment ConfirmPetitionSignersDialog_PetitionAccess on PetitionAccess {
      id
      status
      contact {
        id
        email
        firstName
        lastName
      }
    }
  `,
  PetitionSigner: gql`
    fragment ConfirmPetitionSignersDialog_PetitionSigner on PetitionSigner {
      contactId
      email
      firstName
      lastName
      ...SelectedSignerRow_PetitionSigner
      ...SuggestedSignerRow_PetitionSigner
    }
    ${SelectedSignerRow.fragments.PetitionSigner}
    ${SuggestedSignerRow.fragments.PetitionSigner}
  `,
};

export function useConfirmPetitionSignersDialog() {
  return useDialog(ConfirmPetitionSignersDialog);
}
