import { gql } from "@apollo/client";
import {
  Alert,
  AlertDescription,
  AlertIcon,
  Button,
  Checkbox,
  FormControl,
  HStack,
  ListItem,
  OrderedList,
  Stack,
  Text,
  UnorderedList,
} from "@chakra-ui/react";
import { SignatureIcon } from "@parallel/chakra/icons";
import { BreakLines } from "@parallel/components/common/BreakLines";
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
  ConfirmPetitionSignersDialog_PetitionFragment,
  ConfirmPetitionSignersDialog_PetitionSignerFragment,
  ConfirmPetitionSignersDialog_SignatureConfigFragment,
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

interface ConfirmPetitionSignersDialogProps {
  user: ConfirmPetitionSignersDialog_UserFragment;
  signatureConfig: ConfirmPetitionSignersDialog_SignatureConfigFragment;
  isUpdate?: boolean;
  petition: ConfirmPetitionSignersDialog_PetitionFragment;
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

const MAX_SIGNERS_ALLOWED = 40;

export function ConfirmPetitionSignersDialog(
  props: DialogProps<ConfirmPetitionSignersDialogProps, ConfirmPetitionSignersDialogResult>,
) {
  const { minSigners, instructions, signingMode } = props.signatureConfig;
  const [presetSigners, otherSigners] = partition(
    props.signatureConfig.signers.filter(isDefined),
    (s) => s.isPreset,
  );

  const isSequential = signingMode === "SEQUENTIAL";

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
    mode: "onSubmit",
    defaultValues: {
      signers: otherSigners,
      message: null,
      allowAdditionalSigners: props.petition.isInteractionWithRecipientsEnabled
        ? props.signatureConfig.allowAdditionalSigners
        : false,
    },
  });

  const [showMessage, setShowMessage] = useState(false);

  const signers = watch("signers");
  const allowAdditionalSigners = watch("allowAdditionalSigners");

  const allSigners = [...presetSigners, ...signers];

  const suggestions = uniqBy(
    [
      ...(props.petition.signatureRequests.flatMap((s) => s.signatureConfig.signers) ?? [])
        .filter(isDefined)
        .map((signer) => pick(signer, ["firstName", "lastName", "email"])),
      {
        email: props.user.email,
        firstName: props.user.firstName ?? "",
        lastName: props.user.lastName,
      },
      ...props.petition.accesses
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
  const showSignersAddedByRecipient = allowAdditionalSigners && (props.isUpdate ?? false);
  const ListElement = isSequential ? OrderedList : UnorderedList;
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
            allowAdditionalSigners: props.petition.isInteractionWithRecipientsEnabled
              ? !isMaxSignersReached && allowAdditionalSigners
              : false,
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
        <Stack>
          <Text>
            {presetSigners.length > 0 ? (
              isSequential ? (
                <FormattedMessage
                  id="component.confirm-petition-signers-dialog.preset-signers-sequential"
                  defaultMessage="{names} will sign after the other signers."
                  values={{
                    names: intl.formatList(
                      presetSigners.map((s, i) => (
                        <b key={i}>{fullName(s.firstName, s.lastName)}</b>
                      )),
                    ),
                    // eslint-disable-next-line formatjs/enforce-placeholders
                    count: presetSigners.length,
                  }}
                />
              ) : (
                <FormattedMessage
                  id="component.confirm-petition-signers-dialog.preset-signers"
                  defaultMessage="{names} will sign together with the signers you add."
                  values={{
                    names: intl.formatList(
                      presetSigners.map((s, i) => (
                        <b key={i}>{fullName(s.firstName, s.lastName)}</b>
                      )),
                    ),
                    // eslint-disable-next-line formatjs/enforce-placeholders
                    count: presetSigners.length,
                  }}
                />
              )
            ) : isSequential ? (
              <FormattedMessage
                id="component.confirm-petition-signers-dialog.no-signers-set-sequential"
                defaultMessage="We will send the document to sign to each contact after the one before has signed:"
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
              rules={{
                validate: () => {
                  return showSignersAddedByRecipient || minSigners <= allSigners.length;
                },
              }}
              render={({ field: { onChange, value: signers } }) => (
                <>
                  <ListElement
                    margin={0}
                    paddingY={1}
                    maxH="210px"
                    overflowY="auto"
                    listStylePosition="inside"
                  >
                    {showSignersAddedByRecipient && (
                      <ListItem padding={2}>
                        <Text as="span">
                          <FormattedMessage
                            id="component.confirm-petition-signers-dialog.signer-added-by-recipient"
                            defaultMessage="Signers added by the recipient"
                          />
                        </Text>
                      </ListItem>
                    )}
                    {signers.map((signer, index) => (
                      <SelectedSignerRow
                        key={index}
                        isEditable
                        signer={signer}
                        onRemoveClick={() => onChange(signers.filter((_, i) => index !== i))}
                        onEditClick={handleSelectedSignerRowOnEditClick(onChange, signer, index)}
                      />
                    ))}
                  </ListElement>
                  <Stack marginTop={2}>
                    {signers.length === 0 ? (
                      <Text color="gray.500">
                        <FormattedMessage
                          id="component.confirm-petition-signers-dialog.no-signers-added"
                          defaultMessage="You have not added any signers"
                        />
                      </Text>
                    ) : null}
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
                    {allSigners.length < minSigners ? (
                      <Text color={!!errors.signers ? "red.500" : undefined}>
                        <FormattedMessage
                          id="component.confirm-petition-signers-dialog.min-signers"
                          defaultMessage="Add at least {count, plural, =1{# signer} other{# signers}}"
                          values={{ count: minSigners - allSigners.length }}
                        />
                      </Text>
                    ) : null}
                    {instructions ? (
                      <Alert
                        variant="subtle"
                        status="info"
                        borderRadius="md"
                        backgroundColor="gray.100"
                      >
                        <AlertIcon />
                        <AlertDescription>
                          <BreakLines>{instructions}</BreakLines>
                        </AlertDescription>
                      </Alert>
                    ) : null}
                    <SuggestedSigners
                      isDisabled={isMaxSignersReached}
                      suggestions={suggestions}
                      onAddSigner={(s) => onChange([...signers, s])}
                    />
                  </Stack>
                </>
              )}
            />
          </FormControl>
          {props.isUpdate ? (
            !isMaxSignersReached &&
            props.petition.isInteractionWithRecipientsEnabled && (
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
                  maxLength={1_000}
                />
              </PaddedCollapse>
            </FormControl>
          )}
        </Stack>
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
  get User() {
    return gql`
      fragment ConfirmPetitionSignersDialog_User on User {
        id
        email
        firstName
        lastName
      }
    `;
  },
  get PetitionSigner() {
    return gql`
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
    `;
  },
  get SignatureConfig() {
    return gql`
      fragment ConfirmPetitionSignersDialog_SignatureConfig on SignatureConfig {
        signingMode
        minSigners
        instructions
        allowAdditionalSigners
        signers {
          ...ConfirmPetitionSignersDialog_PetitionSigner
        }
      }
      ${this.PetitionSigner}
    `;
  },
  get Petition() {
    return gql`
      fragment ConfirmPetitionSignersDialog_Petition on Petition {
        id
        isInteractionWithRecipientsEnabled
        accesses {
          id
          status
          contact {
            id
            email
            firstName
            lastName
          }
        }
        signatureRequests {
          signatureConfig {
            signers {
              ...ConfirmPetitionSignersDialog_PetitionSigner
            }
          }
        }
      }
      ${this.PetitionSigner}
    `;
  },
};

export function useConfirmPetitionSignersDialog() {
  return useDialog(ConfirmPetitionSignersDialog);
}
