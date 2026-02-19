import { gql } from "@apollo/client";
import {
  Alert,
  AlertDescription,
  AlertIcon,
  Checkbox,
  FormControl,
  OrderedList,
  UnorderedList,
} from "@chakra-ui/react";
import { PlusCircleFilledIcon, SignatureIcon } from "@parallel/chakra/icons";
import { BreakLines } from "@parallel/components/common/BreakLines";
import { GrowingTextarea } from "@parallel/components/common/GrowingTextarea";
import { PaddedCollapse } from "@parallel/components/common/PaddedCollapse";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { SelectedSignerRow } from "@parallel/components/petition-common/SelectedSignerRow";
import { SuggestedSigners } from "@parallel/components/petition-common/SuggestedSigners";
import type { SignerSelectSelection } from "@parallel/components/petition-common/dialogs/ConfirmPetitionSignersDialog";
import { useRecipientViewConfirmSignerInfoDialog } from "@parallel/components/petition-common/dialogs/RecipientViewConfirmSignerInfoDialog";
import { Button, HStack, Stack, Text } from "@parallel/components/ui";
import {
  PublicPetitionSignerDataInput,
  Tone,
  useRecipientViewConfirmPetitionSignersDialog_PublicPetitionAccessFragment,
} from "@parallel/graphql/__types";
import { fullName } from "@parallel/utils/fullName";
import { Maybe } from "@parallel/utils/types";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";
import { isNonNullish } from "remeda";
import { assert } from "ts-essentials";
import { useAddNewSignerDialog } from "./AddNewSignerDialog";

interface RecipientViewConfirmPetitionSignersDialogProps {
  keycode: string;
  access: useRecipientViewConfirmPetitionSignersDialog_PublicPetitionAccessFragment;
  tone: Tone;
}

export interface RecipientViewConfirmPetitionSignersDialogResult {
  additionalSigners: PublicPetitionSignerDataInput[];
  message: Maybe<string>;
}

const MAX_SIGNERS_ALLOWED = 40;

function RecipientViewConfirmPetitionSignersDialog({
  keycode,
  access,
  tone,
  ...props
}: DialogProps<
  RecipientViewConfirmPetitionSignersDialogProps,
  RecipientViewConfirmPetitionSignersDialogResult
>) {
  const intl = useIntl();

  const petition = access.petition;
  const contact = access.contact;
  const signatureConfig = petition.signatureConfig;

  assert(
    signatureConfig,
    "petition.signatureConfig is required in RecipientViewConfirmPetitionSignersDialog",
  );
  assert(contact, "access.contact is required in RecipientViewConfirmPetitionSignersDialog");

  const {
    control,
    handleSubmit,
    watch,
    register,
    formState: { errors, isDirty },
  } = useForm<{ additionalSigners: SignerSelectSelection[]; message: Maybe<string> }>({
    mode: "onSubmit",
    defaultValues: {
      additionalSigners: [],
      message: null,
    },
  });

  const { allowAdditionalSigners, signingMode, instructions, minSigners } = signatureConfig;

  const presetSigners = signatureConfig.signers;

  const isSequential = signingMode === "SEQUENTIAL";

  const [showMessage, setShowMessage] = useState(false);
  const additionalSigners = watch("additionalSigners");

  const allSigners = [...presetSigners, ...additionalSigners];

  const showConfirmSignerInfo = useRecipientViewConfirmSignerInfoDialog();
  const handleSelectedSignerRowOnEditClick =
    (onChange: (...events: any[]) => void, signer: SignerSelectSelection, index: number) =>
    async () => {
      try {
        onChange([
          ...additionalSigners.slice(0, index),
          await showConfirmSignerInfo({
            selection: { ...signer, email: signer.email! },
            repeatedSigners: [],
            tone,
          }),
          ...additionalSigners.slice(index + 1),
        ]);
      } catch {}
    };

  const showAddNewSignerDialog = useAddNewSignerDialog();
  const handleAddNewSigner = (onChange: (...events: any[]) => void) => async () => {
    try {
      const newSigner = await showAddNewSignerDialog({ tone });
      const repeatedSigners = allSigners.filter((s) => s.email === newSigner.email);

      onChange([
        ...additionalSigners,
        repeatedSigners.length > 0
          ? await showConfirmSignerInfo({ selection: newSigner, repeatedSigners })
          : newSigner,
      ]);
    } catch {}
  };

  const isMaxSignersReached = allSigners.length >= MAX_SIGNERS_ALLOWED;
  const ListElement = isSequential ? OrderedList : UnorderedList;

  return (
    <ConfirmDialog
      {...props}
      size="xl"
      hasCloseButton
      closeOnOverlayClick={!isDirty}
      content={{
        containerProps: {
          as: "form",
          onSubmit: handleSubmit(({ additionalSigners, message }) => {
            props.onResolve({
              message: showMessage ? message : null,
              additionalSigners: additionalSigners.map((s) => ({
                email: s.email!,
                firstName: s.firstName,
                lastName: s.lastName ?? "",
              })),
            });
          }),
        },
      }}
      header={
        <HStack>
          <SignatureIcon />
          <FormattedMessage id="generic.start-signature" defaultMessage="Start signature" />
        </HStack>
      }
      body={
        allowAdditionalSigners || presetSigners.length === 0 ? (
          <Stack>
            {presetSigners.length > 0 && (
              <Text>
                {isSequential ? (
                  <FormattedMessage
                    id="component.recipient-view-confirm-petition-signers-dialog.preset-signers-added-sequential"
                    defaultMessage="{names} will sign after the signers you add."
                    values={{
                      names: intl.formatList(
                        presetSigners.map((s, key) => (
                          <b key={key}>{fullName(s.firstName, s.lastName)}</b>
                        )),
                      ),
                      // eslint-disable-next-line formatjs/enforce-placeholders
                      count: presetSigners.length,
                    }}
                  />
                ) : (
                  <FormattedMessage
                    id="component.recipient-view-confirm-petition-signers-dialog.preset-signers-added"
                    defaultMessage="{names} will sign together with the signers you add."
                    values={{
                      names: intl.formatList(
                        presetSigners.map((s, key) => (
                          <b key={key}>{fullName(s.firstName, s.lastName)}</b>
                        )),
                      ),
                      // eslint-disable-next-line formatjs/enforce-placeholders
                      count: presetSigners.length,
                    }}
                  />
                )}
              </Text>
            )}

            {instructions ? (
              <Alert status="info" rounded="md" backgroundColor="gray.100">
                <AlertIcon />
                <AlertDescription>
                  <BreakLines>{instructions}</BreakLines>
                </AlertDescription>
              </Alert>
            ) : null}
            <FormControl id="signers" isInvalid={!!errors.additionalSigners}>
              {additionalSigners.length === 0 && (
                <Text color="gray.500" marginStart={1}>
                  <FormattedMessage
                    id="component.recipient-view-confirm-petition-signers-dialog.signers-added"
                    defaultMessage="You haven't added any signers yet"
                  />
                </Text>
              )}

              <Controller
                name="additionalSigners"
                control={control}
                rules={{
                  validate: () => {
                    return minSigners <= allSigners.length;
                  },
                }}
                render={({ field: { onChange, value: signers } }) => (
                  <>
                    <ListElement
                      gap={0}
                      paddingY={1}
                      margin={0}
                      maxH="210px"
                      overflowY="auto"
                      listStylePosition="inside"
                    >
                      {signers
                        .filter((s) => isNonNullish(s.email))
                        .map((signer, index) => (
                          <SelectedSignerRow
                            key={index}
                            isEditable
                            signer={signer}
                            isMe={
                              [signer.email, signer.firstName, signer.lastName].join("") ===
                              [contact.email, contact.firstName, contact.lastName].join("")
                            }
                            onRemoveClick={() => onChange(signers.filter((_, i) => index !== i))}
                            onEditClick={handleSelectedSignerRowOnEditClick(
                              onChange,
                              signer,
                              index,
                            )}
                          />
                        ))}
                    </ListElement>
                    {!isMaxSignersReached ? (
                      <Stack marginTop={2}>
                        <HStack>
                          <Button
                            variant="outline"
                            paddingX={3}
                            onClick={handleAddNewSigner(onChange)}
                            leftIcon={<PlusCircleFilledIcon color="primary.500" fontSize="xl" />}
                          >
                            <FormattedMessage
                              id="component.recipient-view-confirm-petition-signers-dialog.add-signer-button"
                              defaultMessage="Add signers"
                            />
                          </Button>
                          {allSigners.length < minSigners ? (
                            <Text color={!!errors.additionalSigners ? "red.500" : undefined}>
                              {"("}
                              <FormattedMessage
                                id="component.recipient-view-confirm-petition-signers-dialog.min-signers"
                                defaultMessage="Add at least {count, plural, =1{# signer} other{# signers}}"
                                values={{ count: minSigners - allSigners.length }}
                              />

                              {")"}
                            </Text>
                          ) : null}
                        </HStack>
                        <SuggestedSigners
                          petition={petition}
                          contact={contact}
                          currentSigners={allSigners}
                          onAddSigner={(s) => onChange([...signers, s])}
                          tone={tone}
                        />
                      </Stack>
                    ) : null}
                  </>
                )}
              />
            </FormControl>
            {additionalSigners.length > 0 ? (
              <FormControl isInvalid={!!errors.message}>
                <Checkbox
                  marginY={4}
                  isChecked={showMessage}
                  onChange={(e) => setShowMessage(e.target.checked)}
                >
                  <FormattedMessage
                    id="component.recipient-view-confirm-petition-signers-dialog.include-message"
                    defaultMessage="Include message"
                  />
                </Checkbox>
                <PaddedCollapse open={showMessage}>
                  <GrowingTextarea
                    {...register("message", {
                      required: showMessage,
                      validate: (m) => !showMessage || (isNonNullish(m) && m.length > 0),
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
                    maxLength={1_000}
                  />
                </PaddedCollapse>
              </FormControl>
            ) : null}
          </Stack>
        ) : (
          <>
            {isSequential ? (
              <FormattedMessage
                id="component.recipient-view-confirm-petition-signers-dialog.confirmation-text-sequential"
                defaultMessage="We will send the document to sign to each contact after the one before has signed:"
              />
            ) : (
              <FormattedMessage
                id="component.recipient-view-confirm-petition-signers-dialog.confirmation-text"
                defaultMessage="We will send the document to the following contacts:"
              />
            )}

            <ListElement
              gap={0}
              paddingY={1}
              margin={0}
              maxH="210px"
              overflowY="auto"
              listStylePosition="inside"
            >
              {presetSigners
                .filter((s) => isNonNullish(s.email))
                .map((signer, index) => (
                  <SelectedSignerRow key={index} signer={signer} />
                ))}
            </ListElement>
          </>
        )
      }
      confirm={
        <Button
          data-action="start-signature"
          colorPalette="primary"
          type="submit"
          disabled={allSigners.length === 0}
        >
          <FormattedMessage id="generic.start-signature" defaultMessage="Start signature" />
        </Button>
      }
      {...props}
    />
  );
}

const _fragments = {
  PetitionSigner: gql`
    fragment useRecipientViewConfirmPetitionSignersDialog_PetitionSigner on PetitionSigner {
      ...Fragments_FullPetitionSigner
      ...SelectedSignerRow_PetitionSigner
    }
  `,
  PublicContact: gql`
    fragment useRecipientViewConfirmPetitionSignersDialog_PublicContact on PublicContact {
      firstName
      lastName
      email
      ...SuggestedSigners_PublicContact
    }
  `,
  PublicSignatureConfig: gql`
    fragment useRecipientViewConfirmPetitionSignersDialog_PublicSignatureConfig on PublicSignatureConfig {
      signingMode
      minSigners
      instructions
      allowAdditionalSigners
      signers {
        ...useRecipientViewConfirmPetitionSignersDialog_PetitionSigner
      }
    }
  `,
  PublicPetition: gql`
    fragment useRecipientViewConfirmPetitionSignersDialog_PublicPetition on PublicPetition {
      signatureConfig {
        ...useRecipientViewConfirmPetitionSignersDialog_PublicSignatureConfig
      }
      recipients {
        ...useRecipientViewConfirmPetitionSignersDialog_PublicContact
      }
      ...SuggestedSigners_PublicPetition
    }
  `,
  PublicPetitionAccess: gql`
    fragment useRecipientViewConfirmPetitionSignersDialog_PublicPetitionAccess on PublicPetitionAccess {
      petition {
        ...useRecipientViewConfirmPetitionSignersDialog_PublicPetition
      }
      contact {
        ...useRecipientViewConfirmPetitionSignersDialog_PublicContact
      }
    }
  `,
};

export function useRecipientViewConfirmPetitionSignersDialog() {
  return useDialog(RecipientViewConfirmPetitionSignersDialog);
}
