import { gql } from "@apollo/client";
import { Box, Button, Checkbox, FormControl, HStack, List, ListItem, Text } from "@chakra-ui/react";
import { SignatureIcon } from "@parallel/chakra/icons";
import {
  ContactSelect,
  ContactSelectInstance,
  ContactSelectSelection,
} from "@parallel/components/common/ContactSelect";
import { GrowingTextarea } from "@parallel/components/common/GrowingTextarea";
import { HelpPopover } from "@parallel/components/common/HelpPopover";
import { PaddedCollapse } from "@parallel/components/common/PaddedCollapse";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import {
  ConfirmPetitionSignersDialog_PetitionAccessFragment,
  ConfirmPetitionSignersDialog_PetitionSignatureRequestFragment,
  ConfirmPetitionSignersDialog_PetitionSignerFragment,
  ConfirmPetitionSignersDialog_UserFragment,
  SignatureConfigInputSigner,
} from "@parallel/graphql/__types";
import { fullName } from "@parallel/utils/fullName";
import { useCreateContact } from "@parallel/utils/mutations/useCreateContact";
import { Maybe } from "@parallel/utils/types";
import { useSearchContacts } from "@parallel/utils/useSearchContacts";
import { useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";
import { isDefined, partition, pick, uniqBy } from "remeda";
import { SelectedSignerRow } from "../SelectedSignerRow";
import { SuggestedSigners } from "../SuggestedSigners";
import { useConfirmSignerInfoDialog } from "./ConfirmSignerInfoDialog";
import { MAX_SIGNERS_ALLOWED } from "./SignatureConfigDialog";

interface ConfirmPetitionSignersDialogProps {
  user: ConfirmPetitionSignersDialog_UserFragment;
  accesses: ConfirmPetitionSignersDialog_PetitionAccessFragment[];
  signers: ConfirmPetitionSignersDialog_PetitionSignerFragment[];
  allowAdditionalSigners: boolean;
  isUpdate?: boolean;
  previousSignatures?: ConfirmPetitionSignersDialog_PetitionSignatureRequestFragment[];
}

export interface ConfirmPetitionSignersDialogResult {
  signers: SignatureConfigInputSigner[];
  message: Maybe<string>;
  allowAdditionalSigners: boolean;
}

export type SignerSelectSelection = Omit<
  ConfirmPetitionSignersDialog_PetitionSignerFragment,
  "__typename" | "isPreset"
>;

export function ConfirmPetitionSignersDialog(
  props: DialogProps<ConfirmPetitionSignersDialogProps, ConfirmPetitionSignersDialogResult>,
) {
  const [presetSigners, otherSigners] = partition(
    props.signers.filter(isDefined),
    (s) => s.isPreset,
  );

  const {
    control,
    handleSubmit,
    watch,
    register,
    formState: { errors, isDirty },
  } = useForm<{
    signers: SignerSelectSelection[];
    message: Maybe<string>;
    allowAdditionalSigners: boolean;
  }>({
    mode: "onChange",
    defaultValues: {
      signers: otherSigners,
      message: null,
      allowAdditionalSigners: props.allowAdditionalSigners,
    },
  });

  const [showMessage, setShowMessage] = useState(false);

  const signers = watch("signers");
  const allowAdditionalSigners = watch("allowAdditionalSigners");

  const allSigners = [...presetSigners, ...signers];

  const suggestions = uniqBy(
    [
      ...(props.previousSignatures?.flatMap((s) => s.signatureConfig.signers) ?? [])
        .filter(isDefined)
        .map((signer) => pick(signer, ["firstName", "lastName", "email"])),
      {
        email: props.user.email,
        firstName: props.user.firstName ?? "",
        lastName: props.user.lastName,
      },
      ...props.accesses
        .filter((a) => a.status === "ACTIVE" && isDefined(a.contact))
        .map((a) => ({
          contactId: a.contact!.id,
          email: a.contact!.email,
          firstName: a.contact!.firstName,
          lastName: a.contact!.lastName ?? "",
        })),
    ]
      // remove already added signers
      .filter(
        (suggestion) =>
          !allSigners.some(
            (s) =>
              s.email === suggestion.email &&
              s.firstName === suggestion.firstName &&
              s.lastName === suggestion.lastName,
          ),
      ),
    (s) => [s.email, s.firstName, s.lastName].join("|"),
  );

  const handleSearchContacts = useSearchContacts();
  const handleCreateContact = useCreateContact();
  const intl = useIntl();

  const showConfirmSignerInfo = useConfirmSignerInfoDialog();
  const [selectedContact, setSelectedContact] = useState<ContactSelectSelection | null>(null);
  const contactSelectRef = useRef<ContactSelectInstance<false>>(null);

  const handleContactSelectOnChange =
    (onChange: (...events: any[]) => void) => async (contact: ContactSelectSelection | null) => {
      try {
        const repeatedSigners = [...presetSigners, ...signers].filter(
          (s) => s.email === contact!.email,
        );
        onChange([
          ...signers,
          repeatedSigners.length > 0
            ? await showConfirmSignerInfo({ selection: contact!, repeatedSigners })
            : contact!,
        ]);
      } catch {}
      setSelectedContact(null);
    };

  const handleSelectedSignerRowOnEditClick =
    (onChange: (...events: any[]) => void, signer: SignerSelectSelection, index: number) =>
    async () => {
      try {
        onChange([
          ...signers.slice(0, index),
          await showConfirmSignerInfo({
            selection: signer,
            repeatedSigners: [],
          }),
          ...signers.slice(index + 1),
        ]);
      } catch {}
    };

  const isMaxSignersReached = allSigners.length >= MAX_SIGNERS_ALLOWED;

  return (
    <ConfirmDialog
      size="xl"
      initialFocusRef={contactSelectRef}
      closeOnOverlayClick={!isDirty}
      hasCloseButton
      content={{
        as: "form",
        onSubmit: handleSubmit(({ signers, message, allowAdditionalSigners }) => {
          props.onResolve({
            message: showMessage ? message : null,
            signers: [
              ...signers.map((s) => ({
                contactId: s.contactId,
                email: s.email,
                firstName: s.firstName,
                lastName: s.lastName ?? "",
              })),
              ...presetSigners.map((s) => ({
                contactId: s.contactId,
                email: s.email,
                firstName: s.firstName,
                lastName: s.lastName ?? "",
                isPreset: true,
              })),
            ],
            allowAdditionalSigners: !isMaxSignersReached && allowAdditionalSigners,
          });
        }),
      }}
      header={
        <HStack>
          <SignatureIcon />
          {props.isUpdate ? (
            <FormattedMessage
              id="component.confirm-petition-signers-dialog.edit-signers-header"
              defaultMessage="Edit signers"
            />
          ) : (
            <FormattedMessage
              id="component.confirm-petition-signers-dialog.start-signature-header"
              defaultMessage="Start signature"
            />
          )}
        </HStack>
      }
      body={
        <>
          <Text>
            {presetSigners.length > 0 ? (
              <FormattedMessage
                id="component.confirm-petition-signers-dialog.preset-signers"
                defaultMessage="{names} will sign together with the signers you add."
                values={{
                  names: intl.formatList(
                    presetSigners.map((s, i) => <b key={i}>{fullName(s.firstName, s.lastName)}</b>),
                  ),
                  // eslint-disable-next-line formatjs/enforce-placeholders
                  count: presetSigners.length,
                }}
              />
            ) : (
              <FormattedMessage
                id="component.confirm-petition-signers-dialog.no-signers-set"
                defaultMessage="We will send the document to the following contacts:"
              />
            )}
          </Text>
          <FormControl id="signers" isInvalid={!!errors.signers}>
            <Controller
              name="signers"
              control={control}
              render={({ field: { onChange, value: signers } }) => (
                <>
                  <List paddingY={1} marginLeft={0} maxH="210px" overflowY="auto">
                    {allowAdditionalSigners && props.isUpdate && (
                      <ListItem padding={2}>
                        <Text as="span" paddingX={2}>
                          {"•"}
                        </Text>
                        <Text as="span">
                          <FormattedMessage
                            id="component.confirm-petition-signers-dialog.signer-added-by-recipient"
                            defaultMessage="Signers added by the recipient"
                          />
                        </Text>
                      </ListItem>
                    )}
                    {signers.length === 0 ? (
                      <ListItem>
                        <Text color="gray.500" marginLeft={1} marginTop={2}>
                          <FormattedMessage
                            id="component.confirm-petition-signers-dialog.no-signers-added"
                            defaultMessage="You have not added any signers"
                          />
                        </Text>
                      </ListItem>
                    ) : null}
                    {signers.map((signer, index) => (
                      <SelectedSignerRow
                        key={index}
                        isEditable
                        marker={
                          <Text as="span" paddingX={2}>
                            {"•"}
                          </Text>
                        }
                        signer={signer}
                        onRemoveClick={() => onChange(signers.filter((_, i) => index !== i))}
                        onEditClick={handleSelectedSignerRowOnEditClick(onChange, signer, index)}
                      />
                    ))}
                  </List>
                  <Box marginTop={2}>
                    <ContactSelect
                      ref={contactSelectRef as any}
                      isDisabled={isMaxSignersReached}
                      value={selectedContact}
                      onChange={handleContactSelectOnChange(onChange)}
                      onSearchContacts={handleSearchContacts}
                      onCreateContact={handleCreateContact}
                      placeholder={intl.formatMessage({
                        id: "component.confirm-petition-signers-dialog.contact-select-placeholder",
                        defaultMessage: "Add a contact to sign",
                      })}
                    />
                    <SuggestedSigners
                      isDisabled={isMaxSignersReached}
                      suggestions={suggestions}
                      onAddSigner={(s) => onChange([...signers, s])}
                    />
                  </Box>
                </>
              )}
            />
          </FormControl>
          {props.isUpdate ? (
            !isMaxSignersReached && (
              <Checkbox marginTop={4} colorScheme="primary" {...register("allowAdditionalSigners")}>
                <HStack alignContent="center">
                  <FormattedMessage
                    id="component.confirm-petition-signers-dialog.allow-additional-signers-label"
                    defaultMessage="Allow recipients to add additional signers"
                  />
                  <HelpPopover>
                    <FormattedMessage
                      id="component.confirm-petition-signers-dialog.allow-additional-signers-help"
                      defaultMessage="If this option is disabled, only the indicated people will be able to sign the document."
                    />
                  </HelpPopover>
                </HStack>
              </Checkbox>
            )
          ) : (
            <FormControl isInvalid={!!errors.message}>
              <Checkbox
                marginY={4}
                colorScheme="primary"
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
          )}
        </>
      }
      confirm={
        <Button
          data-action="start-signature"
          colorScheme="primary"
          type="submit"
          isDisabled={props.isUpdate ? false : allSigners.length === 0}
        >
          {props.isUpdate ? (
            <FormattedMessage id="generic.save" defaultMessage="Save" />
          ) : (
            <FormattedMessage
              id="component.confirm-petition-signers-dialog.start-signature-button"
              defaultMessage="Start signature"
            />
          )}
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
      isPreset
      ...SelectedSignerRow_PetitionSigner
      ...SuggestedSigners_PetitionSigner
    }
    ${SelectedSignerRow.fragments.PetitionSigner}
    ${SuggestedSigners.fragments.PetitionSigner}
  `,
  PetitionSignatureRequest: gql`
    fragment ConfirmPetitionSignersDialog_PetitionSignatureRequest on PetitionSignatureRequest {
      signatureConfig {
        signers {
          ...ConfirmPetitionSignersDialog_PetitionSigner
        }
      }
    }
  `,
};

export function useConfirmPetitionSignersDialog() {
  return useDialog(ConfirmPetitionSignersDialog);
}
