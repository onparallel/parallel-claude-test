import { gql } from "@apollo/client";
import { Button, Checkbox, ListItem, Spacer, Stack, Text, UnorderedList } from "@chakra-ui/react";
import { CloseIcon, PlusCircleFilledIcon } from "@parallel/chakra/icons";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { GrowingTextarea } from "@parallel/components/common/GrowingTextarea";
import { IconButtonWithTooltip } from "@parallel/components/common/IconButtonWithTooltip";
import { PaddedCollapse } from "@parallel/components/common/PaddedCollapse";
import { useAddNewSignerDialog } from "@parallel/components/recipient-view/dialogs/AddNewSignerDialog";
import {
  PetitionLocale,
  PublicPetitionSignerDataInput,
  usePetitionPreviewSignerInfoDialog_OrganizationFragment,
  usePetitionPreviewSignerInfoDialog_PetitionSignerFragment,
  usePetitionPreviewSignerInfoDialog_UserFragment,
} from "@parallel/graphql/__types";
import { withError } from "@parallel/utils/promises/withError";
import { useRegisterWithRef } from "@parallel/utils/react-form-hook/useRegisterWithRef";
import { Maybe } from "@parallel/utils/types";
import autosize from "autosize";
import { outdent } from "outdent";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";
import { isDefined } from "remeda";

type PetitionPreviewSignerInfoDialogProps = {
  petitionId: string;
  signers: usePetitionPreviewSignerInfoDialog_PetitionSignerFragment[];
  recipientCanAddSigners: boolean;
  user: usePetitionPreviewSignerInfoDialog_UserFragment;
  organization: usePetitionPreviewSignerInfoDialog_OrganizationFragment;
};

export type PetitionPreviewSignerInfoDialogResult = {
  additionalSigners: PublicPetitionSignerDataInput[];
  message: Maybe<string>;
};

function PetitionPreviewSignerInfoDialog({
  petitionId,
  signers,
  recipientCanAddSigners,
  user,
  organization,
  ...props
}: DialogProps<PetitionPreviewSignerInfoDialogProps, PetitionPreviewSignerInfoDialogResult>) {
  const intl = useIntl();

  const { handleSubmit, register, watch, setValue } = useForm<{
    additionalSigners: PublicPetitionSignerDataInput[];
    message: string;
  }>({
    mode: "onChange",
    defaultValues: {
      additionalSigners: [],
      message: (messages[intl.locale as PetitionLocale] ?? messages["en"])(
        organization.name,
        user.fullName ?? ""
      ),
    },
  });

  const [showMessage, setShowMessage] = useState(false);
  const [userWillSign, setUserWillSign] = useState(false);
  const messageRef = useRef<HTMLTextAreaElement>(null);
  const messageRegisterProps = useRegisterWithRef(messageRef, register, "message");

  useEffect(() => {
    if (showMessage) {
      const timeout = setTimeout(() => autosize.update(messageRef.current!));
      return () => clearTimeout(timeout);
    }
  }, [showMessage]);

  const additionalSigners = watch("additionalSigners");

  function handleRemoveAdditionalSigner(index: number) {
    setValue(
      "additionalSigners",
      additionalSigners.filter((_, i) => i !== index)
    );
  }

  const showAddNewSignerDialog = useAddNewSignerDialog();
  async function handleAddAdditionalSigner() {
    const [error, newSignerInfo] = await withError(showAddNewSignerDialog({ tone: "INFORMAL" }));
    if (!error && newSignerInfo) {
      setValue("additionalSigners", [...additionalSigners, newSignerInfo]);
    }
  }

  function fullName(firstName: Maybe<string> | undefined, lastName: Maybe<string> | undefined) {
    const parts = [firstName, lastName];
    return parts.filter(isDefined).join(" ");
  }

  return (
    <ConfirmDialog
      {...props}
      size="xl"
      hasCloseButton
      content={{
        as: "form",
        onSubmit: handleSubmit(({ additionalSigners, message }) => {
          const signers = userWillSign
            ? [
                {
                  email: user.email,
                  firstName: user.firstName ?? "",
                  lastName: user.lastName ?? "",
                },
                ...additionalSigners,
              ]
            : additionalSigners;

          props.onResolve({
            additionalSigners: signers,
            message: showMessage ? message : null,
          });
        }),
      }}
      header={
        <FormattedMessage
          id="recipient-view.complete-signer-info-dialog.header"
          defaultMessage="Sign petition"
        />
      }
      body={
        <Stack spacing={2}>
          <Text>
            <FormattedMessage
              id="recipient-view.complete-signer-info-dialog.subtitle"
              defaultMessage="{tone, select, INFORMAL{An <b>eSignature</b> is required to complete this petition.} other{This petition requires an eSignature in order to be completed.}}"
              values={{
                tone: "INFORMAL",
              }}
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
                      defaultMessage="{tone, select, INFORMAL{Click on <b>{button}</b> and} other{After you click on <b>{button}</b>,}} we will send an email with information on how to complete the process to the following people:"
                      values={{
                        tone: "INFORMAL",
                        button: (
                          <FormattedMessage
                            id="component.signature-config-dialog.confirm-start"
                            defaultMessage="Start signature"
                          />
                        ),
                      }}
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
                  isChecked={userWillSign}
                  onChange={(e) => setUserWillSign(e.target.checked)}
                >
                  <FormattedMessage
                    id="recipient-view.complete-signer-info-dialog.recipient-will-sign"
                    defaultMessage="I will sign ({email})"
                    values={{ email: user.email }}
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
          ) : null}
          {additionalSigners.length > 0 ? (
            <>
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
                  {...messageRegisterProps}
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
          colorScheme="purple"
          type="submit"
          isDisabled={signers.length === 0 && additionalSigners.length === 0 && !userWillSign}
        >
          <FormattedMessage
            id="component.signature-config-dialog.confirm-start"
            defaultMessage="Start signature"
          />
        </Button>
      }
    />
  );
}

const messages: Record<PetitionLocale, (organization: string, userName: string) => string> = {
  en: (organization, userName) => outdent`
  Hello,

  I have completed this document requested by ${organization} through Parallel. Could you please sign it?

  Thanks,
  ${userName}.
`,
  es: (organization, userName) => outdent`
  Hola,

  He completado este documento que nos han pedido de ${organization} a través de Parallel. ¿Podrías por favor firmarlo?
  
  Gracias,
  ${userName}.
`,
};

usePetitionPreviewSignerInfoDialog.fragments = {
  PetitionSigner: gql`
    fragment usePetitionPreviewSignerInfoDialog_PetitionSigner on PetitionSigner {
      firstName
      lastName
      email
    }
  `,
  User: gql`
    fragment usePetitionPreviewSignerInfoDialog_User on User {
      id
      firstName
      lastName
      fullName
      email
    }
  `,
  Organization: gql`
    fragment usePetitionPreviewSignerInfoDialog_Organization on Organization {
      id
      name
    }
  `,
};

export function usePetitionPreviewSignerInfoDialog() {
  return useDialog(PetitionPreviewSignerInfoDialog);
}
