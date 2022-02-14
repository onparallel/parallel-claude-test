import { gql } from "@apollo/client";
import {
  Box,
  Button,
  Checkbox,
  Flex,
  FlexProps,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Input,
  Stack,
  Text,
} from "@chakra-ui/react";
import { DeleteIcon, EditIcon } from "@parallel/chakra/icons";
import {
  ContactSelect,
  ContactSelectInstance,
  ContactSelectSelection,
} from "@parallel/components/common/ContactSelect";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { GrowingTextarea } from "@parallel/components/common/GrowingTextarea";
import { IconButtonWithTooltip } from "@parallel/components/common/IconButtonWithTooltip";
import { PaddedCollapse } from "@parallel/components/common/PaddedCollapse";
import {
  ConfirmPetitionSignersDialog_PetitionAccessFragment,
  ConfirmPetitionSignersDialog_PetitionSignerFragment,
  ConfirmPetitionSignersDialog_UserFragment,
  Maybe,
  SignatureConfigInputSigner,
} from "@parallel/graphql/__types";
import { useCreateContact } from "@parallel/utils/mutations/useCreateContact";
import { useRegisterWithRef } from "@parallel/utils/react-form-hook/useRegisterWithRef";
import { useSearchContacts } from "@parallel/utils/useSearchContacts";
import { useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";
import { isDefined, pick } from "remeda";

interface ConfirmPetitionSignersDialogProps {
  user: ConfirmPetitionSignersDialog_UserFragment;
  accesses: ConfirmPetitionSignersDialog_PetitionAccessFragment[];
  fixedSigners: ConfirmPetitionSignersDialog_PetitionSignerFragment[];
  reviewBeforeSigning?: boolean;
  allowAdditionalSigners?: boolean;
}

export interface ConfirmPetitionSignersDialogResult {
  signers: SignatureConfigInputSigner[];
  message: Maybe<string>;
}

type SignerSelectSelection = Omit<
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
  reviewBeforeSigning,
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
        ...pick(a.contact!, ["email", "firstName", "lastName", "contactId"]),
        isSuggested: true,
      })),
  ].filter((suggestion) => !signers.some((s) => s.email === suggestion.email));

  const handleSearchContacts = useSearchContacts();
  const handleCreateContact = useCreateContact();
  const intl = useIntl();

  const showConfirmSignerInfo = useDialog(ConfirmSignerInfoDialog);
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
            message,
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
            {allowAdditionalSigners || reviewBeforeSigning ? (
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
                  {allowAdditionalSigners || reviewBeforeSigning ? (
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
        contactId: id
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
    }
  `,
};

export function useConfirmPetitionSignersDialog() {
  return useDialog(ConfirmPetitionSignersDialog);
}

interface SuggestedSignerRowProps {
  signer: ConfirmPetitionSignersDialog_PetitionSignerFragment;
  onAddClick: () => void;
}
function SuggestedSignerRow({ signer, onAddClick }: SuggestedSignerRowProps) {
  return (
    <Flex justifyContent="space-between" alignItems="center">
      <Box>
        {signer.firstName} {signer.lastName} {"<"}
        {signer.email}
        {">"}
      </Box>
      <Button onClick={onAddClick} size="sm">
        <FormattedMessage id="generic.add" defaultMessage="Add" />
      </Button>
    </Flex>
  );
}

interface SelectedSignerRowProps extends FlexProps {
  signer: ConfirmPetitionSignersDialog_PetitionSignerFragment;
  isEditable?: boolean;
  onRemoveClick?: () => void;
  onEditClick?: () => void;
}
function SelectedSignerRow({
  signer,
  isEditable,
  onRemoveClick: onRemove,
  onEditClick: onEdit,
  ...props
}: SelectedSignerRowProps) {
  const intl = useIntl();
  return (
    <Flex
      justifyContent="space-between"
      alignItems="center"
      minHeight={9}
      _hover={isEditable ? { backgroundColor: "gray.75" } : undefined}
      borderRadius="md"
      paddingX={2}
      paddingY={1}
      paddingLeft={4}
      {...props}
    >
      <Text as="li" margin={1}>
        {signer.firstName} {signer.lastName} {"<"}
        {signer.email}
        {">"}
      </Text>
      {isEditable ? (
        <Flex gridGap={1}>
          <IconButtonWithTooltip
            variant="ghost"
            size="sm"
            label={intl.formatMessage({ id: "generic.edit", defaultMessage: "Edit" })}
            icon={<EditIcon />}
            _hover={{ backgroundColor: "gray.200" }}
            onClick={onEdit}
          />
          <IconButtonWithTooltip
            variant="ghost"
            size="sm"
            label={intl.formatMessage({
              id: "component.selected-signer-row.remove-signer",
              defaultMessage: "Remove signer",
            })}
            marginLeft={1}
            icon={<DeleteIcon />}
            _hover={{ backgroundColor: "gray.200" }}
            onClick={onRemove}
          />
        </Flex>
      ) : null}
    </Flex>
  );
}

function ConfirmSignerInfoDialog({
  email,
  firstName,
  lastName,
  ...props
}: DialogProps<SignerSelectSelection, SignerSelectSelection>) {
  const {
    handleSubmit,
    register,
    formState: { errors },
  } = useForm<SignerSelectSelection>({
    mode: "onSubmit",
    defaultValues: {
      email,
      firstName,
      lastName,
    },
  });
  const firstNameRef = useRef<HTMLInputElement>(null);
  const firstNameProps = useRegisterWithRef(firstNameRef, register, "firstName", {
    required: true,
  });
  return (
    <ConfirmDialog
      initialFocusRef={firstNameRef}
      size="md"
      content={{
        as: "form",
        onSubmit: handleSubmit(({ firstName, lastName }) => {
          props.onResolve({ email, firstName, lastName });
        }),
      }}
      header={
        <FormattedMessage
          id="component.confirm-signer-info-dialog.title"
          defaultMessage="Confirm the signer's information"
        />
      }
      body={
        <Stack>
          <FormControl id="email">
            <FormLabel fontWeight="bold">
              <FormattedMessage id="generic.email" defaultMessage="Email" />
            </FormLabel>
            <Input {...register("email", { disabled: true })} />
          </FormControl>
          <Stack direction="row">
            <FormControl isInvalid={!!errors.firstName}>
              <FormLabel fontWeight="bold">
                <FormattedMessage id="generic.forms.first-name-label" defaultMessage="First name" />
              </FormLabel>
              <Input {...firstNameProps} />
              <FormErrorMessage>
                <FormattedMessage
                  id="generic.forms.invalid-first-name-error"
                  defaultMessage="Please, enter the first name"
                />
              </FormErrorMessage>
            </FormControl>
            <FormControl isInvalid={!!errors.lastName}>
              <FormLabel fontWeight="bold">
                <FormattedMessage id="generic.forms.last-name-label" defaultMessage="Last name" />
              </FormLabel>
              <Input {...register("lastName", { required: true })} />
              <FormErrorMessage>
                <FormattedMessage
                  id="generic.forms.invalid-last-name-error"
                  defaultMessage="Please, enter the last name"
                />
              </FormErrorMessage>
            </FormControl>
          </Stack>
          <Text fontSize="14px">
            <FormattedMessage
              id="component.confirm-signer-info-dialog.footer"
              defaultMessage="Continue to update the signer's information. The contact data will not be overwritten."
            />
          </Text>
        </Stack>
      }
      confirm={
        <Button colorScheme="purple" type="submit">
          <FormattedMessage id="generic.continue" defaultMessage="Continue" />
        </Button>
      }
      {...props}
    />
  );
}
