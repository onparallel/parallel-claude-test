import { gql } from "@apollo/client";
import { Box, Button, Checkbox, FormControl, HStack, List, Text } from "@chakra-ui/react";
import { PlusCircleFilledIcon, SignatureIcon } from "@parallel/chakra/icons";
import { GrowingTextarea } from "@parallel/components/common/GrowingTextarea";
import { PaddedCollapse } from "@parallel/components/common/PaddedCollapse";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { SelectedSignerRow } from "@parallel/components/petition-common/SelectedSignerRow";
import { SuggestedSigners } from "@parallel/components/petition-common/SuggestedSigners";
import { SignerSelectSelection } from "@parallel/components/petition-common/dialogs/ConfirmPetitionSignersDialog";
import { useConfirmSignerInfoDialog } from "@parallel/components/petition-common/dialogs/ConfirmSignerInfoDialog";
import { MAX_SIGNERS_ALLOWED } from "@parallel/components/petition-common/dialogs/SignatureConfigDialog";
import {
  PublicPetitionSignerDataInput,
  Tone,
  useRecipientViewConfirmPetitionSignersDialog_PetitionSignerFragment,
  useRecipientViewConfirmPetitionSignersDialog_PublicContactFragment,
} from "@parallel/graphql/__types";
import { fullName } from "@parallel/utils/fullName";
import { Maybe } from "@parallel/utils/types";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";
import { isDefined, pick, uniqBy } from "remeda";
import { useAddNewSignerDialog } from "./AddNewSignerDialog";

interface RecipientViewConfirmPetitionSignersDialogProps {
  keycode: string;
  presetSigners: useRecipientViewConfirmPetitionSignersDialog_PetitionSignerFragment[];
  recipients: useRecipientViewConfirmPetitionSignersDialog_PublicContactFragment[];
  contact: useRecipientViewConfirmPetitionSignersDialog_PublicContactFragment;
  organization: string;
  allowAdditionalSigners: boolean;
  tone: Tone;
}

export interface RecipientViewConfirmPetitionSignersDialogResult {
  additionalSigners: PublicPetitionSignerDataInput[];
  message: Maybe<string>;
}

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
  } = useForm<{ additionalSigners: SignerSelectSelection[]; message: Maybe<string> }>({
    mode: "onChange",
    defaultValues: {
      additionalSigners: [],
      message: null,
    },
  });

  const [showMessage, setShowMessage] = useState(false);
  const additionalSigners = watch("additionalSigners");

  const allSigners = [...presetSigners, ...additionalSigners];

  const suggestions = uniqBy(
    recipients
      .map((r) => pick(r, ["email", "firstName", "lastName"]))
      .filter((suggestion) => !allSigners.some((s) => s.email === suggestion.email))
      // first in the list is the contact
      .sort((r) => (r.email === contact.email ? -1 : 0)),
    (s) => [s.email, s.firstName, s.lastName].join("|"),
  );

  const showConfirmSignerInfo = useConfirmSignerInfoDialog();
  const handleSelectedSignerRowOnEditClick =
    (onChange: (...events: any[]) => void, signer: SignerSelectSelection, index: number) =>
    async () => {
      try {
        onChange([
          ...additionalSigners.slice(0, index),
          await showConfirmSignerInfo({
            selection: signer,
            repeatedSigners: [],
          }),
          ...additionalSigners.slice(index + 1),
        ]);
      } catch {}
    };

  const showAddNewSignerDialog = useAddNewSignerDialog();
  const handleAddNewSigner = (onChange: (...events: any[]) => void) => async () => {
    try {
      const newSigner = await showAddNewSignerDialog({ tone });
      const repeatedSigners = additionalSigners.filter((s) => s.email === newSigner.email);
      onChange([
        ...additionalSigners,
        repeatedSigners.length > 0
          ? await showConfirmSignerInfo({ selection: newSigner, repeatedSigners })
          : newSigner,
      ]);
    } catch {}
  };

  const isMaxSignersReached = allSigners.length >= MAX_SIGNERS_ALLOWED;

  return (
    <ConfirmDialog
      {...props}
      size="xl"
      hasCloseButton
      closeOnOverlayClick={!isDirty}
      content={{
        as: "form",
        onSubmit: handleSubmit(({ additionalSigners, message }) => {
          props.onResolve({
            message: showMessage ? message : null,
            additionalSigners: additionalSigners.map((s) => ({
              email: s.email,
              firstName: s.firstName,
              lastName: s.lastName ?? "",
              isPreset: false,
            })),
          });
        }),
      }}
      header={
        <HStack>
          <SignatureIcon />
          <FormattedMessage
            id="component.recipient-view-confirm-petition-signers-dialog.header"
            defaultMessage="Start signature"
          />
        </HStack>
      }
      body={
        allowAdditionalSigners || presetSigners.length === 0 ? (
          <>
            {presetSigners.length > 0 && (
              <Box marginBottom={2}>
                <FormattedMessage
                  id="component.recipient-view-confirm-petition-signers-dialog.preset-signers-added"
                  defaultMessage="{names} will sign together with the signers you add."
                  values={{
                    names: intl.formatList(
                      presetSigners.map((s, key) => (
                        <b key={key}>{fullName(s.firstName, s.lastName)}</b>
                      )),
                    ),
                    // eslint-disable-next-line
                    count: presetSigners.length,
                  }}
                />
              </Box>
            )}
            <FormControl id="signers" isInvalid={!!errors.additionalSigners}>
              {additionalSigners.length === 0 && (
                <Text color="gray.500" marginLeft={1}>
                  <FormattedMessage
                    id="component.recipient-view-confirm-petition-signers-dialog.signers-added"
                    defaultMessage="You haven't added any signers yet"
                  />
                </Text>
              )}
              <Controller
                name="additionalSigners"
                control={control}
                render={({ field: { onChange, value: signers } }) => (
                  <>
                    <List spacing={0} paddingY={1} maxH="210px" overflowY="auto">
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
                    {!isMaxSignersReached ? (
                      <Box marginTop={2}>
                        <Button
                          variant="outline"
                          paddingX={3}
                          onClick={handleAddNewSigner(onChange)}
                        >
                          <PlusCircleFilledIcon color="primary.500" fontSize="xl" marginRight={2} />
                          <FormattedMessage
                            id="component.recipient-view-confirm-petition-signers-dialog.add-signer-button"
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
            {additionalSigners.length > 0 ? (
              <FormControl isInvalid={!!errors.message}>
                <Checkbox
                  marginY={4}
                  colorScheme="primary"
                  isChecked={showMessage}
                  onChange={(e) => setShowMessage(e.target.checked)}
                >
                  <FormattedMessage
                    id="component.recipient-view-confirm-petition-signers-dialog.include-message"
                    defaultMessage="Include message"
                  />
                </Checkbox>
                <PaddedCollapse in={showMessage}>
                  <GrowingTextarea
                    {...register("message", {
                      required: showMessage,
                      validate: (m) => isDefined(m) && m.length > 0,
                    })}
                    maxHeight="30vh"
                    aria-label={intl.formatMessage(
                      {
                        id: "component.recipient-view-confirm-petition-signers-dialog.message-placeholder",
                        defaultMessage: "Write here a message for the signers...",
                      },
                      { tone },
                    )}
                    placeholder={intl.formatMessage(
                      {
                        id: "component.recipient-view-confirm-petition-signers-dialog.message-placeholder",
                        defaultMessage: "Write here a message for the signers...",
                      },
                      { tone },
                    )}
                  />
                </PaddedCollapse>
              </FormControl>
            ) : null}
          </>
        ) : (
          <>
            <FormattedMessage
              id="component.recipient-view-confirm-petition-signers-dialog.confirmation-text"
              defaultMessage="We will send the document to the following contacts:"
            />
            <List spacing={0} paddingY={1} maxH="210px" overflowY="auto">
              {presetSigners.map((signer, index) => (
                <SelectedSignerRow
                  marker={
                    <Text as="span" paddingX={2}>
                      {"•"}
                    </Text>
                  }
                  key={index}
                  signer={signer}
                />
              ))}
            </List>
          </>
        )
      }
      confirm={
        <Button
          data-action="start-signature"
          colorScheme="primary"
          type="submit"
          isDisabled={allSigners.length === 0}
        >
          <FormattedMessage
            id="component.recipient-view-confirm-petition-signers-dialog.start-signature-button"
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
      isPreset
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
