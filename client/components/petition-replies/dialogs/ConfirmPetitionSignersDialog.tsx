import { gql } from "@apollo/client";
import {
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
import { ContactSelect } from "@parallel/components/common/ContactSelect";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { GrowingTextarea } from "@parallel/components/common/GrowingTextarea";
import { IconButtonWithTooltip } from "@parallel/components/common/IconButtonWithTooltip";
import { PaddedCollapse } from "@parallel/components/common/PaddedCollapse";
import {
  SignatureConfigInputSigner,
  ConfirmPetitionSignersDialog_PetitionSignerFragment,
  ConfirmPetitionSignersDialog_UserFragment,
  Maybe,
} from "@parallel/graphql/__types";
import { useCreateContact } from "@parallel/utils/mutations/useCreateContact";
import { withError } from "@parallel/utils/promises/withError";
import { useRegisterWithRef } from "@parallel/utils/react-form-hook/useRegisterWithRef";
import { useSearchContacts } from "@parallel/utils/useSearchContacts";
import { useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";

interface ConfirmPetitionSignersDialogProps {
  user: ConfirmPetitionSignersDialog_UserFragment;
  fixedSigners: ConfirmPetitionSignersDialog_PetitionSignerFragment[];
  reviewBeforeSigning?: boolean;
  allowAdditionalSigners?: boolean;
}

export interface ConfirmPetitionSignersDialogResult {
  signers: SignatureConfigInputSigner[];
  message: Maybe<string>;
}

type SignerSelectSelection = ConfirmPetitionSignersDialog_PetitionSignerFragment & {
  isFixed?: boolean;
  isSuggested?: boolean;
};

export function ConfirmPetitionSignersDialog({
  user,
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

  const suggestedSigner: SignerSelectSelection = {
    email: user.email,
    firstName: user.firstName ?? "",
    lastName: user.lastName,
    isSuggested: true,
  };

  const handleSearchContacts = useSearchContacts();
  const handleCreateContact = useCreateContact();
  const intl = useIntl();

  const showConfirmSignerInfo = useDialog(ConfirmSignerInfoDialog);
  const handleAddSigner =
    (onChange: (...event: any[]) => void) => async (value: SignerSelectSelection) => {
      const foundEmail = signers.find((s) => s.email === value.email);
      if (foundEmail) {
        const [, confirmedSigner] = await withError(showConfirmSignerInfo(value));
        if (confirmedSigner) {
          onChange([...signers, confirmedSigner]);
        }
      } else {
        onChange([...signers, value]);
      }
    };

  const handleRemoveSigner = (onChange: (...event: any[]) => void) => async (index: number) => {
    onChange([...signers.filter((_, n) => index !== n)]);
  };

  const handleEditSigner = (onChange: (...event: any[]) => void) => async (index: number) => {
    const signer = signers[index];
    const [, confirmedSigner] = await withError(showConfirmSignerInfo(signer));
    if (confirmedSigner) {
      const newSigners = signers;
      newSigners[index] = confirmedSigner;
      onChange(newSigners);
    }
  };

  const messageRef = useRef<HTMLTextAreaElement>(null);
  const messageRegisterProps = useRegisterWithRef(messageRef, register, "message", {
    required: showMessage,
  });

  return (
    <ConfirmDialog
      size="xl"
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
          defaultMessage="Sign petition"
        />
      }
      body={
        <>
          <FormControl id="signers" isInvalid={!!errors.signers}>
            <FormLabel>
              {allowAdditionalSigners || reviewBeforeSigning ? (
                <Flex>
                  <Text as="strong">
                    <FormattedMessage
                      id="component.confirm-petition-signers-dialog.contacts-label"
                      defaultMessage="Who has to sign the document?"
                    />
                  </Text>
                  <Text color="gray.500" marginLeft={1}>
                    <FormattedMessage
                      id="component.confirm-petition-signers-dialog.n-added"
                      defaultMessage="({n} added)"
                      values={{ n: signers.length }}
                    />
                  </Text>
                </Flex>
              ) : (
                <FormattedMessage
                  id="component.confirm-petition-signers-dialog.confirmation-text"
                  defaultMessage="When you start the signature, we will send the document to be signed to the following contacts:"
                />
              )}
            </FormLabel>
            <Controller
              name="signers"
              control={control}
              render={({ field: { onChange } }) => (
                <Stack>
                  <Stack spacing={2} paddingY={1} maxH="210px" overflowY="auto">
                    {signers.map((s, key) => (
                      <SelectedSignerRow
                        key={key}
                        height={6}
                        isEditable={!s.isFixed}
                        signer={s}
                        onRemove={() => handleRemoveSigner(onChange)(key)}
                        onEdit={() => handleEditSigner(onChange)(key)}
                      />
                    ))}
                  </Stack>
                  {allowAdditionalSigners || reviewBeforeSigning ? (
                    <>
                      <ContactSelect
                        // pass a variable key so we force a rerender of the select and the input is cleared every time a new signer is set
                        key={`contact-select-${signers.length}`}
                        onChange={handleAddSigner(onChange)}
                        onSearchContacts={handleSearchContacts}
                        onCreateContact={handleCreateContact}
                        placeholder={intl.formatMessage({
                          id: "component.confirm-petition-signers-dialog.contact-select.placeholder",
                          defaultMessage: "Add a contact to sign",
                        })}
                      />
                      {!signers.find((s) => s.isSuggested) ? (
                        <SuggestedSignerRow
                          signer={suggestedSigner}
                          onAdd={handleAddSigner(onChange)}
                        />
                      ) : null}
                    </>
                  ) : null}
                </Stack>
              )}
            />
          </FormControl>
          {signers.some((s) => !s.isFixed) ? (
            <FormControl isInvalid={!!errors.message}>
              <Checkbox
                marginY={2}
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
                  {...messageRegisterProps}
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
        <Button colorScheme="purple" type="submit" isDisabled={signers.length === 0}>
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
  onAdd: (s: ConfirmPetitionSignersDialog_PetitionSignerFragment) => void;
}
function SuggestedSignerRow({ signer, onAdd }: SuggestedSignerRowProps) {
  return (
    <Flex justifyContent="space-between" alignItems="center">
      <Flex>
        <Text as="strong">
          <FormattedMessage id="component.suggested-signer-row.title" defaultMessage="Suggested:" />
        </Text>
        <Text marginLeft={1}>
          {signer.firstName} {signer.lastName} {"<"}
          {signer.email}
          {">"}
        </Text>
      </Flex>

      <Button onClick={() => onAdd(signer)} size="sm">
        <FormattedMessage id="generic.add" defaultMessage="Add" />
      </Button>
    </Flex>
  );
}

interface SelectedSignerRowProps extends FlexProps {
  signer: ConfirmPetitionSignersDialog_PetitionSignerFragment;
  isEditable?: boolean;
  onRemove?: () => void;
  onEdit?: () => void;
}
function SelectedSignerRow({
  signer,
  isEditable,
  onRemove,
  onEdit,
  ...props
}: SelectedSignerRowProps) {
  const intl = useIntl();
  return (
    <Flex
      justifyContent="space-between"
      alignItems="center"
      _hover={{ backgroundColor: "gray.50" }}
      borderRadius="md"
      {...props}
    >
      <Text as="li">
        {signer.firstName} {signer.lastName} {"<"}
        {signer.email}
        {">"}
      </Text>
      {isEditable ? (
        <Flex>
          <IconButtonWithTooltip
            variant="ghost"
            size="sm"
            label={intl.formatMessage({ id: "generic.edit", defaultMessage: "Edit" })}
            icon={<EditIcon />}
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
  return (
    <ConfirmDialog
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
          defaultMessage="Confirm signer's data"
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
            <FormControl id="firstName" isInvalid={!!errors.firstName}>
              <FormLabel fontWeight="bold">
                <FormattedMessage id="generic.forms.first-name-label" defaultMessage="First name" />
              </FormLabel>
              <Input {...register("firstName", { required: true })} />
              <FormErrorMessage>
                <FormattedMessage
                  id="generic.forms.invalid-first-name-error"
                  defaultMessage="Please, enter the first name"
                />
              </FormErrorMessage>
            </FormControl>
            <FormControl id="lastName" isInvalid={!!errors.lastName}>
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
              defaultMessage="Continue to update the signer's data. The contact data will not be overwritten."
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
