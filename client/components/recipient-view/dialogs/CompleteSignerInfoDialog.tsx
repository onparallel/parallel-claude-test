import { gql } from "@apollo/client";
import { Button, Checkbox, ListItem, Spacer, Stack, Text, UnorderedList } from "@chakra-ui/react";
import { CloseIcon, PlusCircleFilledIcon } from "@parallel/chakra/icons";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { GrowingTextarea } from "@parallel/components/common/GrowingTextarea";
import { IconButtonWithTooltip } from "@parallel/components/common/IconButtonWithTooltip";
import { PaddedCollapse } from "@parallel/components/common/PaddedCollapse";
import {
  Maybe,
  PetitionLocale,
  PublicPetitionSignerDataInput,
  Tone,
  useCompleteSignerInfoDialog_PetitionSignerFragment,
  useCompleteSignerInfoDialog_PublicContactFragment,
} from "@parallel/graphql/__types";
import { withError } from "@parallel/utils/promises/withError";
import autosize from "autosize";
import outdent from "outdent";
import { useEffect, useRef, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { isDefined } from "remeda";
import { useAddNewSignerDialog } from "./AddNewSignerDialog";

const messages: Record<PetitionLocale, (organization: string, contactName: string) => string> = {
  en: (organization, contactName) => outdent`
  Hello,

  I have completed this document requested by ${organization} through Parallel. Could you please sign it?

  Thanks,
  ${contactName}.
`,
  es: (organization, contactName) => outdent`
  Hola,

  He completado este documento que nos han pedido de ${organization} a través de Parallel. ¿Podrías por favor firmarlo?
  
  Gracias,
  ${contactName}.
`,
};

function fullName(firstName: Maybe<string> | undefined, lastName: Maybe<string> | undefined) {
  const parts = [firstName, lastName];
  return parts.filter(isDefined).join(" ");
}

type CompleteSignerInfoDialogProps = {
  signers: useCompleteSignerInfoDialog_PetitionSignerFragment[];
  keycode: string;
  contact: useCompleteSignerInfoDialog_PublicContactFragment;
  organization: string;
  recipientCanAddSigners: boolean;
  tone: Tone;
};

export type CompleteSignerInfoDialogResult = {
  additionalSigners: PublicPetitionSignerDataInput[];
  message: Maybe<string>;
};

function CompleteSignerInfoDialog({
  keycode,
  contact,
  organization,
  signers,
  recipientCanAddSigners,
  tone,
  ...props
}: DialogProps<CompleteSignerInfoDialogProps, CompleteSignerInfoDialogResult>) {
  const intl = useIntl();
  const [showMessage, setShowMessage] = useState(false);
  const [message, setMessage] = useState(
    (messages[intl.locale as PetitionLocale] ?? messages["en"])(
      organization,
      contact.firstName ?? ""
    )
  );
  const messageRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (showMessage) {
      const timeout = setTimeout(() => autosize.update(messageRef.current!));
      return () => clearTimeout(timeout);
    }
  }, [showMessage]);

  const [recipientWillSign, setRecipientWillSign] = useState(false);
  const [additionalSigners, setAdditionalSigners] = useState<PublicPetitionSignerDataInput[]>([]);

  function handleRemoveAdditionalSigner(index: number) {
    setAdditionalSigners(additionalSigners.filter((_, i) => i !== index));
  }

  const showAddNewSignerDialog = useAddNewSignerDialog();
  async function handleAddAdditionalSigner() {
    const [error, newSignerInfo] = await withError(showAddNewSignerDialog({ tone }));
    if (!error && newSignerInfo) {
      setAdditionalSigners([...additionalSigners, newSignerInfo]);
    }
  }

  function handleSubmit() {
    const signers = recipientWillSign
      ? [
          {
            email: contact.email,
            firstName: contact.firstName ?? "",
            lastName: contact.lastName ?? "",
          },
          ...additionalSigners,
        ]
      : additionalSigners;

    props.onResolve({
      additionalSigners: signers,
      message: showMessage ? message : null,
    });
  }

  return (
    <ConfirmDialog
      {...props}
      size="xl"
      hasCloseButton
      header={
        <FormattedMessage
          id="recipient-view.complete-signer-info-dialog.header"
          defaultMessage="Sign petition"
        />
      }
      body={
        <Stack>
          <Text>
            <FormattedMessage
              id="recipient-view.complete-signer-info-dialog.subtitle"
              defaultMessage="{tone, select, INFORMAL{An <b>eSignature</b> is required to complete this petition.} other{This petition requires an eSignature in order to be completed.}}"
              values={{ tone }}
            />
          </Text>

          {[...signers, additionalSigners].length > 0 ? (
            <>
              <Spacer marginTop={2} />
              {signers.length > 0 ? (
                <>
                  <Text>
                    <FormattedMessage
                      id="recipient-view.complete-signer-info-dialog.subtitle.with-signers"
                      defaultMessage="{tone, select, INFORMAL{Click on <b>Continue with eSignature</b> and} other{After you click on <b>Continue with eSignature</b>,}} we will send an email with information on how to complete the process to the following people:"
                      values={{ tone }}
                    />
                  </Text>
                  {recipientCanAddSigners ? (
                    <FormattedMessage
                      id="recipient-view.complete-signer-info-dialog.subtitle.recipient-can-add"
                      defaultMessage="You can add more signers if you consider it necessary."
                    />
                  ) : null}
                </>
              ) : (
                <Text as="strong">
                  <FormattedMessage
                    id="recipient-view.complete-signer-info-dialog.no-selected-signers.question"
                    defaultMessage="Who has to sign the document?"
                  />
                </Text>
              )}
              {signers.length === 0 ? (
                <Checkbox
                  paddingLeft="10px"
                  colorScheme="purple"
                  isChecked={recipientWillSign}
                  onChange={(e) => setRecipientWillSign(e.target.checked)}
                >
                  <FormattedMessage
                    id="recipient-view.complete-signer-info-dialog.recipient-will-sign"
                    defaultMessage="I will sign ({email})"
                    values={{ email: contact.email }}
                  />
                </Checkbox>
              ) : null}
              <UnorderedList paddingLeft={8}>
                {[...signers, ...additionalSigners].map((s, i) => {
                  return (
                    <ListItem key={i}>
                      {fullName(s.firstName, s.lastName)} {`<${s.email}> `}
                      {i >= signers.length ? (
                        <IconButtonWithTooltip
                          onClick={() => handleRemoveAdditionalSigner(i - signers.length)}
                          variant="ghost"
                          size="xs"
                          label={intl.formatMessage({
                            id: "recipient-view.complete-signer-info-dialog.remove-signer-button.tooltip",
                            defaultMessage: "Remove signer",
                          })}
                          icon={<CloseIcon />}
                        />
                      ) : null}
                    </ListItem>
                  );
                })}
              </UnorderedList>
            </>
          ) : null}
          {recipientCanAddSigners ? (
            <>
              <Button
                width="fit-content"
                leftIcon={<PlusCircleFilledIcon color="purple.500" fontSize="20px" />}
                variant="outline"
                color="gray.800"
                onClick={() => handleAddAdditionalSigner()}
              >
                <FormattedMessage
                  id="recipient-view.complete-signer-info-dialog.add-more-signers.button"
                  defaultMessage="Add more signers"
                />
              </Button>
            </>
          ) : null}
          {additionalSigners.length > 0 ? (
            <>
              <Spacer />
              <Checkbox
                colorScheme="purple"
                isChecked={showMessage}
                onChange={(e) => setShowMessage(e.target.checked)}
              >
                <FormattedMessage
                  id="recipient-view.complete-signer-info-dialog.include-message"
                  defaultMessage="Include message"
                />
              </Checkbox>
              <PaddedCollapse in={showMessage}>
                <GrowingTextarea
                  ref={messageRef}
                  value={message ?? ""}
                  onChange={(e) => setMessage(e.target.value)}
                  maxHeight="30vh"
                  aria-label={intl.formatMessage({
                    id: "petition-sharing.message-placeholder",
                    defaultMessage: "Message",
                  })}
                  placeholder={intl.formatMessage({
                    id: "petition-sharing.message-placeholder",
                    defaultMessage: "Message",
                  })}
                />
              </PaddedCollapse>
            </>
          ) : null}
        </Stack>
      }
      confirm={
        <Button
          onClick={() => handleSubmit()}
          colorScheme="purple"
          variant="solid"
          isDisabled={signers.length === 0 && additionalSigners.length === 0 && !recipientWillSign}
        >
          <FormattedMessage
            id="petition.continue-with-signature"
            defaultMessage="Continue with eSignature"
          />
        </Button>
      }
    />
  );
}

useCompleteSignerInfoDialog.fragments = {
  PetitionSigner: gql`
    fragment useCompleteSignerInfoDialog_PetitionSigner on PetitionSigner {
      firstName
      lastName
      fullName
      email
    }
  `,
  PublicContact: gql`
    fragment useCompleteSignerInfoDialog_PublicContact on PublicContact {
      firstName
      lastName
      email
    }
  `,
};

export function useCompleteSignerInfoDialog() {
  return useDialog(CompleteSignerInfoDialog);
}
