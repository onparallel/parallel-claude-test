import { gql } from "@apollo/client";
import { Alert, AlertIcon, Box, Button, Flex, Heading, Image, Stack, Text } from "@chakra-ui/react";
import {
  ContactSelectProps,
  ContactSelectSelection,
} from "@parallel/components/common/ContactSelect";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import {
  CopySignatureConfigDialog,
  useCopySignatureConfigDialog,
} from "@parallel/components/petition-compose/dialogs/CopySignatureConfigDialog";
import { useScheduleMessageDialog } from "@parallel/components/petition-compose/dialogs/ScheduleMessageDialog";
import { PetitionRemindersConfig } from "@parallel/components/petition-compose/PetitionRemindersConfig";
import {
  AddPetitionAccessDialog_PetitionFragment,
  BulkSendSigningMode,
  RemindersConfig,
  UpdatePetitionInput,
} from "@parallel/graphql/__types";
import { useCreateContact } from "@parallel/utils/mutations/useCreateContact";
import { emptyRTEValue } from "@parallel/utils/slate/RichTextEditor/emptyRTEValue";
import { isEmptyRTEValue } from "@parallel/utils/slate/RichTextEditor/isEmptyRTEValue";
import { RichTextEditorValue } from "@parallel/utils/slate/RichTextEditor/types";
import { Maybe } from "@parallel/utils/types";
import { useDebouncedCallback } from "@parallel/utils/useDebouncedCallback";
import { useSearchContacts } from "@parallel/utils/useSearchContacts";
import { useSearchContactsByEmail } from "@parallel/utils/useSearchContactsByEmail";
import { useCallback, useRef, useState } from "react";
import { FormattedMessage } from "react-intl";
import { noop, omit } from "remeda";
import { HelpPopover } from "../../common/HelpPopover";
import { RecipientSelectGroups } from "../../common/RecipientSelectGroups";
import { MessageEmailEditor } from "../../petition-common/MessageEmailEditor";
import { SendButton } from "../../petition-common/SendButton";

export type AddPetitionAccessDialogProps = {
  onSearchContacts?: ContactSelectProps["onSearchContacts"];
  onCreateContact?: ContactSelectProps["onCreateContact"];
  onUpdatePetition?: (data: UpdatePetitionInput) => void;
  canAddRecipientGroups?: boolean;
  petition: AddPetitionAccessDialog_PetitionFragment;
};

export type AddPetitionAccessDialogResult = {
  recipientIdGroups: string[][];
  subject: string;
  body: RichTextEditorValue;
  remindersConfig: Maybe<RemindersConfig>;
  scheduledAt: Maybe<Date>;
  bulkSendSigningMode?: BulkSendSigningMode;
};

export function AddPetitionAccessDialog({
  petition,
  canAddRecipientGroups,
  onUpdatePetition = noop,
  // TODO: fix this
  onSearchContacts = useSearchContacts(),
  onCreateContact = useCreateContact(),
  ...props
}: DialogProps<AddPetitionAccessDialogProps, AddPetitionAccessDialogResult>) {
  const [showErrors, setShowErrors] = useState(false);
  const [recipientGroups, setRecipientGroups] = useState<ContactSelectSelection[][]>([[]]);

  const [subject, setSubject] = useState(petition.emailSubject ?? "");
  const [body, setBody] = useState<RichTextEditorValue>(petition.emailBody ?? emptyRTEValue());
  const [remindersConfig, setRemindersConfig] = useState<Maybe<RemindersConfig>>(
    petition.remindersConfig ? omit(petition.remindersConfig, ["__typename"]) : null
  );

  const handleSearchContactsByEmail = useSearchContactsByEmail();

  const [updateSubject, updateBody, updateRemindersConfig] = [
    useDebouncedCallback(onUpdatePetition, 500, [onUpdatePetition]),
    useDebouncedCallback(onUpdatePetition, 500, [onUpdatePetition]),
    useDebouncedCallback(onUpdatePetition, 500, [onUpdatePetition]),
  ];

  const handleSubjectChange = useCallback(
    (value: string) => {
      setSubject(value);
      updateSubject({ emailSubject: value || null });
    },
    [updateSubject]
  );

  const handleBodyChange = useCallback(
    (value: RichTextEditorValue) => {
      setBody(value);
      updateBody({ emailBody: isEmptyRTEValue(value) ? null : value });
    },
    [updateBody]
  );

  const handleRemindersConfigChange = useCallback(
    (value: Maybe<RemindersConfig>) => {
      setRemindersConfig(value);
      updateRemindersConfig({
        remindersConfig: value ? omit(value, ["__typename"]) : null,
      });
    },
    [updateRemindersConfig]
  );

  const recipientsRef = useRef<HTMLInputElement>(null);

  const isValid = Boolean(
    subject &&
      !isEmptyRTEValue(body) &&
      recipientGroups.every((g) => g.length > 0 && g.every((r) => !r.isInvalid && !r.isDeleted))
  );

  const showScheduleMessageDialog = useScheduleMessageDialog();
  const showCopySignatureConfigDialog = useCopySignatureConfigDialog();
  const handleSendClick = async (schedule: boolean) => {
    try {
      if (!isValid) {
        setShowErrors(true);
        return;
      }
      const scheduledAt = schedule ? await showScheduleMessageDialog({}) : null;

      // if the petition has signer contacts configured,
      // ask user if they want that contact(s) to sign all the petitions
      let bulkSendSigningMode: BulkSendSigningMode | undefined;
      if (
        petition.signatureConfig &&
        petition.signatureConfig.signers.length > 0 &&
        recipientGroups.length > 1
      ) {
        const option = await showCopySignatureConfigDialog({
          signers: petition.signatureConfig.signers,
        });

        bulkSendSigningMode = option;
      }

      props.onResolve({
        recipientIdGroups: recipientGroups.map((group) => group.map((g) => g.id)),
        subject,
        body,
        remindersConfig,
        scheduledAt,
        bulkSendSigningMode,
      });
    } catch {}
  };

  const { used, limit } = petition.organization.usageLimits.petitions;

  return (
    <ConfirmDialog
      id="send-petition-dialog"
      closeOnEsc={false}
      closeOnOverlayClick={false}
      initialFocusRef={recipientsRef}
      size="2xl"
      header={
        <Flex alignItems="center">
          <FormattedMessage
            id="petition.add-access.header"
            defaultMessage="Who do you want to send it to?"
          />
          {canAddRecipientGroups ? (
            <HelpPopover
              popoverWidth="container.2xs"
              color="blue.200"
              _hover={{ color: "blue.300" }}
            >
              <Stack direction="row">
                <Stack flex="1" alignItems="flex-start">
                  <Image
                    height="40px"
                    marginRight={2}
                    src={`${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/recipient-collaboration.svg`}
                  />
                  <Heading size="sm">
                    <FormattedMessage
                      id="component.add-petition-access-dialog.recipients-label"
                      defaultMessage="Recipients"
                    />
                  </Heading>
                  <Text fontSize="sm">
                    <FormattedMessage
                      id="component.add-petition-access-dialog.recipients-description"
                      defaultMessage="Will reply to the same petition collaboratively."
                    />
                  </Text>
                </Stack>
                <Stack flex="1" alignItems="flex-start">
                  <Image
                    height="40px"
                    marginRight={2}
                    src={`${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/recipient-groups.svg`}
                  />
                  <Heading size="sm">
                    <FormattedMessage
                      id="component.add-petition-access-dialog.recipient-groups-label"
                      defaultMessage="Recipient groups"
                    />
                  </Heading>
                  <Text fontSize="sm">
                    <FormattedMessage
                      id="component.add-petition-access-dialog.recipient-groups-description"
                      defaultMessage="Each group will reply to different petitions."
                    />
                  </Text>
                </Stack>
              </Stack>
            </HelpPopover>
          ) : null}
        </Flex>
      }
      body={
        <>
          {limit - used <= 10 ? (
            <Alert status="warning" borderRadius="md" mb={2}>
              <AlertIcon color="yellow.500" />
              {limit === used ? (
                <FormattedMessage
                  id="component.add-petition-access-dialog.petition-limit-reached.text"
                  defaultMessage="You reached the limit of petitions sent."
                />
              ) : (
                <FormattedMessage
                  id="component.add-petition-access-dialog.petition-limit-near.text"
                  defaultMessage="You can send {left, plural, =1{# more petition} other{# more petitions}}."
                  values={{ left: limit - used }}
                />
              )}
            </Alert>
          ) : null}
          <RecipientSelectGroups
            recipientGroups={recipientGroups}
            onChangeRecipientGroups={setRecipientGroups}
            onSearchContacts={onSearchContacts}
            onCreateContact={onCreateContact}
            onSearchContactsByEmail={handleSearchContactsByEmail}
            showErrors={showErrors}
            canAddRecipientGroups={canAddRecipientGroups}
          />
          <Box marginTop={4}>
            <MessageEmailEditor
              showErrors={showErrors}
              subject={subject}
              body={body}
              onSubjectChange={handleSubjectChange}
              onBodyChange={handleBodyChange}
            />
          </Box>
          <PetitionRemindersConfig
            marginTop={2}
            value={remindersConfig}
            onChange={handleRemindersConfigChange}
            defaultActive={Boolean(remindersConfig)}
          />
        </>
      }
      confirm={
        <SendButton
          data-action="send-petition"
          onSendClick={() => handleSendClick(false)}
          onScheduleClick={() => handleSendClick(true)}
        />
      }
      cancel={
        <Button onClick={() => props.onReject()}>
          <FormattedMessage id="generic.go-back" defaultMessage="Go back" />
        </Button>
      }
      {...props}
    />
  );
}

AddPetitionAccessDialog.fragments = {
  Petition: gql`
    fragment AddPetitionAccessDialog_Petition on Petition {
      emailSubject
      emailBody
      signatureConfig {
        signers {
          ...CopySignatureConfigDialog_PetitionSigner
        }
      }
      remindersConfig {
        offset
        time
        timezone
        weekdaysOnly
      }
      organization {
        id
        usageLimits {
          petitions {
            limit
            used
          }
        }
      }
    }
    ${CopySignatureConfigDialog.fragments.PetitionSigner}
  `,
};

export function useAddPetitionAccessDialog() {
  return useDialog(AddPetitionAccessDialog);
}
