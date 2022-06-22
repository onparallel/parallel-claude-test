import { gql } from "@apollo/client";
import { Box, Button, Checkbox, FormControl, Stack, Text } from "@chakra-ui/react";
import { PlusCircleFilledIcon } from "@parallel/chakra/icons";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { GrowingTextarea } from "@parallel/components/common/GrowingTextarea";
import { PaddedCollapse } from "@parallel/components/common/PaddedCollapse";
import { SignerSelectSelection } from "@parallel/components/petition-common/dialogs/ConfirmPetitionSignersDialog";
import { useConfirmSignerInfoDialog } from "@parallel/components/petition-common/dialogs/ConfirmSignerInfoDialog";
import { SelectedSignerRow } from "@parallel/components/petition-common/SelectedSignerRow";
import { SuggestedSigners } from "@parallel/components/petition-common/SuggestedSigners";
import {
  Maybe,
  PublicPetitionSignerDataInput,
  Tone,
  useRecipientViewConfirmPetitionSignersDialog_PetitionSignerFragment,
  useRecipientViewConfirmPetitionSignersDialog_PublicContactFragment,
} from "@parallel/graphql/__types";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";
import { pick } from "remeda";
import { useAddNewSignerDialog } from "./AddNewSignerDialog";

type RecipientViewConfirmPetitionSignersDialogProps = {
  keycode: string;
  presetSigners: useRecipientViewConfirmPetitionSignersDialog_PetitionSignerFragment[];
  recipients: useRecipientViewConfirmPetitionSignersDialog_PublicContactFragment[];
  contact: useRecipientViewConfirmPetitionSignersDialog_PublicContactFragment;
  organization: string;
  allowAdditionalSigners: boolean;
  tone: Tone;
};

export type RecipientViewConfirmPetitionSignersDialogResult = {
  additionalSigners: PublicPetitionSignerDataInput[];
  message: Maybe<string>;
};

function RecipientViewConfirmPetitionSignersDialog({
  keycode,
  presetSigners,
  recipients,
  contact,
  organization,
  allowAdditionalSigners,
  tone,
  ...props
}: DialogProps<
  RecipientViewConfirmPetitionSignersDialogProps,
  RecipientViewConfirmPetitionSignersDialogResult
>) {
  const intl = useIntl();
  const {
    control,
    handleSubmit,
    watch,
    register,
    formState: { errors, isDirty },
  } = useForm<{ signers: SignerSelectSelection[]; message: Maybe<string> }>({
    mode: "onChange",
    defaultValues: {
      signers: presetSigners.map((s) => ({ ...s, isPreset: true })),
      message: null,
    },
  });

  const [showMessage, setShowMessage] = useState(false);
  const signers = watch("signers");

  const suggestions: SignerSelectSelection[] = recipients
    .map((r) => ({
      ...pick(r, ["email", "firstName", "lastName"]),
      isSuggested: true,
    }))
    .filter((suggestion) => !signers.some((s) => s.email === suggestion.email))
    .sort((r) => (r.email === contact.email ? -1 : 0)); // first in the list is the contact

  const showConfirmSignerInfo = useConfirmSignerInfoDialog();
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

  const showAddNewSignerDialog = useAddNewSignerDialog();
  const handleAddNewSigner = (onChange: (...events: any[]) => void) => async () => {
    try {
      const newSigner = await showAddNewSignerDialog({ tone });
      const repeatedSigners = signers.filter((s) => s.email === newSigner.email);
      onChange([
        ...signers,
        repeatedSigners.length > 0
          ? await showConfirmSignerInfo({ selection: newSigner, repeatedSigners })
          : newSigner,
      ]);
    } catch {}
  };

  return (
    <ConfirmDialog
      {...props}
      size="xl"
      hasCloseButton
      closeOnOverlayClick={!isDirty}
      content={{
        as: "form",
        onSubmit: handleSubmit(({ signers, message }) => {
          props.onResolve({
            message: showMessage ? message : null,
            additionalSigners: signers
              .filter((s) => !s.isPreset)
              .map((s) => ({
                email: s.email,
                firstName: s.firstName,
                lastName: s.lastName ?? "",
              })),
          });
        }),
      }}
      header={
        <FormattedMessage
          id="component.recipient-view.confirm-petition-signers-dialog.header"
          defaultMessage="Who has to sign the document?"
        />
      }
      body={
        <>
          <FormControl id="signers" isInvalid={!!errors.signers}>
            {signers.length === 0 || allowAdditionalSigners ? (
              <Text color="gray.500" marginLeft={1}>
                <FormattedMessage
                  id="component.recipient-view.confirm-petition-signers-dialog.signers-added"
                  defaultMessage="{count, plural, =0{You haven't added any signers yet} one{1 signer added} other{# signers added}}"
                  values={{ count: signers.length }}
                />
              </Text>
            ) : (
              <FormattedMessage
                id="component.recipient-view.confirm-petition-signers-dialog.confirmation-text"
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
                        isEditable={!signer.isPreset}
                        signer={signer}
                        onRemoveClick={() => onChange(signers.filter((_, i) => index !== i))}
                        onEditClick={handleSelectedSignerRowOnEditClick(onChange, signer, index)}
                      />
                    ))}
                  </Stack>
                  {signers.length === 0 || allowAdditionalSigners ? (
                    <Box marginTop={2}>
                      <Button variant="outline" paddingX={3} onClick={handleAddNewSigner(onChange)}>
                        <PlusCircleFilledIcon color="primary.500" fontSize="xl" marginRight={2} />
                        <FormattedMessage
                          id="component.recipient-view.confirm-petition-signers-dialog.add-signer.button"
                          defaultMessage="Add signers"
                        />
                      </Button>
                      <SuggestedSigners
                        suggestions={suggestions}
                        onAddSigner={(s) => onChange([...signers, s])}
                      />
                    </Box>
                  ) : null}
                </>
              )}
            />
          </FormControl>
          {signers.some((s) => !s.isPreset) ? (
            <FormControl isInvalid={!!errors.message}>
              <Checkbox
                marginY={4}
                colorScheme="primary"
                isChecked={showMessage}
                onChange={(e) => setShowMessage(e.target.checked)}
              >
                <FormattedMessage
                  id="component.recipient-view.confirm-petition-signers-dialog.include-message"
                  defaultMessage="Include message"
                />
              </Checkbox>
              <PaddedCollapse in={showMessage}>
                <GrowingTextarea
                  {...register("message", { required: showMessage })}
                  maxHeight="30vh"
                  aria-label={intl.formatMessage(
                    {
                      id: "component.recipient-view.confirm-petition-signers-dialog.message-placeholder",
                      defaultMessage: "Write here a message for the signers...",
                    },
                    { tone }
                  )}
                  placeholder={intl.formatMessage(
                    {
                      id: "component.recipient-view.confirm-petition-signers-dialog.message-placeholder",
                      defaultMessage: "Write here a message for the signers...",
                    },
                    { tone }
                  )}
                />
              </PaddedCollapse>
            </FormControl>
          ) : null}
        </>
      }
      confirm={
        <Button
          data-action="start-signature"
          colorScheme="primary"
          type="submit"
          isDisabled={signers.length === 0}
        >
          <FormattedMessage
            id="component.recipient-view.confirm-petition-signers-dialog.start-signature-button"
            defaultMessage="Start signature"
          />
        </Button>
      }
      {...props}
    />
  );
}

useRecipientViewConfirmPetitionSignersDialog.fragments = {
  PetitionSigner: gql`
    fragment useRecipientViewConfirmPetitionSignersDialog_PetitionSigner on PetitionSigner {
      firstName
      lastName
      fullName
      email
      ...SelectedSignerRow_PetitionSigner
      ...SuggestedSigners_PetitionSigner
    }
    ${SelectedSignerRow.fragments.PetitionSigner}
    ${SuggestedSigners.fragments.PetitionSigner}
  `,
  PublicContact: gql`
    fragment useRecipientViewConfirmPetitionSignersDialog_PublicContact on PublicContact {
      firstName
      lastName
      email
    }
  `,
};

export function useRecipientViewConfirmPetitionSignersDialog() {
  return useDialog(RecipientViewConfirmPetitionSignersDialog);
}
