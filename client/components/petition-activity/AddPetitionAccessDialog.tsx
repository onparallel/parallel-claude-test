import { gql } from "@apollo/client";
import {
  Alert,
  AlertIcon,
  Box,
  Button,
  FormControl,
  FormErrorMessage,
  FormLabel,
} from "@chakra-ui/react";
import { ConfirmDialog } from "@parallel/components/common/ConfirmDialog";
import {
  DialogProps,
  useDialog,
} from "@parallel/components/common/DialogProvider";
import {
  RemindersConfig,
  UpdatePetitionInput,
} from "@parallel/graphql/__types";
import { emptyContent } from "@parallel/utils/slate/emptyContent";
import { isEmptyContent } from "@parallel/utils/slate/isEmptyContent";
import { Maybe } from "@parallel/utils/types";
import { useDebouncedCallback } from "@parallel/utils/useDebouncedCallback";
import { useCallback, useRef, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { noop, omit } from "remeda";
import {
  ContactSelect,
  ContactSelectProps,
  ContactSelectSelection,
} from "../common/ContactSelect";
import { RichTextEditorContent } from "../common/RichTextEditor";
import { MessageEmailEditor } from "../petition-common/MessageEmailEditor";
import { SendButton } from "../petition-common/SendButton";
import { PetitionRemindersConfig } from "../petition-compose/PetitionRemindersConfig";
import { useScheduleMessageDialog } from "../petition-compose/ScheduleMessageDialog";

export type AddPettionAccessDialogProps = {
  onSearchContacts: ContactSelectProps["onSearchContacts"];
  onCreateContact: ContactSelectProps["onCreateContact"];
  onUpdatePetition?: (data: UpdatePetitionInput) => void;
  defaultSubject?: Maybe<string>;
  defaultBody?: Maybe<RichTextEditorContent>;
  defaultRemindersConfig?: Maybe<RemindersConfig>;
};

export type AddPettionAccessDialogResult = {
  recipientIds: string[];
  subject: string;
  body: RichTextEditorContent;
  remindersConfig: Maybe<RemindersConfig>;
  scheduledAt: Maybe<Date>;
};

export function AddPetitionAccessDialog({
  defaultSubject,
  defaultBody,
  defaultRemindersConfig,
  onUpdatePetition = noop,
  onSearchContacts,
  onCreateContact,
  ...props
}: DialogProps<AddPettionAccessDialogProps, AddPettionAccessDialogResult>) {
  const intl = useIntl();
  const [showErrors, setShowErrors] = useState(false);
  const [recipients, setRecipients] = useState<ContactSelectSelection[]>([]);
  const [subject, setSubject] = useState(defaultSubject ?? "");
  const [body, setBody] = useState<RichTextEditorContent>(
    defaultBody ?? emptyContent()
  );
  const [remindersConfig, setRemindersConfig] = useState<
    Maybe<RemindersConfig>
  >(
    defaultRemindersConfig ? omit(defaultRemindersConfig, ["__typename"]) : null
  );
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
    (value: RichTextEditorContent) => {
      setBody(value);
      updateBody({ emailBody: isEmptyContent(value) ? null : value });
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

  const validRecipients = recipients.filter((r) => !r.isInvalid);
  const invalidRecipients = recipients.filter((r) => r.isInvalid);
  const isValid = Boolean(
    subject &&
      !isEmptyContent(body) &&
      validRecipients.length > 0 &&
      invalidRecipients.length === 0
  );

  const showScheduleMessageDialog = useScheduleMessageDialog();
  const handleSendClick = async (schedule: boolean) => {
    try {
      if (!isValid) {
        setShowErrors(true);
        return;
      }
      const scheduledAt = schedule ? await showScheduleMessageDialog({}) : null;
      props.onResolve({
        recipientIds: recipients.map((r) => r.id),
        subject,
        body,
        remindersConfig,
        scheduledAt,
      });
    } catch {}
  };

  return (
    <ConfirmDialog
      closeOnEsc={false}
      closeOnOverlayClick={false}
      initialFocusRef={recipientsRef}
      size="2xl"
      header={
        <FormattedMessage
          id="petition.add-access.header"
          defaultMessage="Who do you want to send it to?"
        />
      }
      body={
        <>
          <FormControl
            id="petition-recipients"
            isInvalid={
              (showErrors && recipients.length === 0) ||
              invalidRecipients.length > 0
            }
          >
            <FormLabel>
              <FormattedMessage
                id="petition.add-access.recipients-label"
                defaultMessage="Recipients"
              />
            </FormLabel>
            <ContactSelect
              placeholder={intl.formatMessage({
                id: "petition.add-access.recipients-placeholder",
                defaultMessage: "Enter recipients...",
              })}
              onCreateContact={onCreateContact}
              onSearchContacts={onSearchContacts}
              value={recipients}
              onChange={setRecipients}
            />
            <FormErrorMessage>
              {invalidRecipients.length === 0 ? (
                <FormattedMessage
                  id="petition.add-access.required-recipients-error"
                  defaultMessage="Please specify at least one recipient"
                />
              ) : (
                <FormattedMessage
                  id="petition.add-access.unknown-recipients"
                  defaultMessage="We couldn't find {count, plural, =1 {{email}} other {some of the emails}} in your contacts list."
                  values={{
                    count: invalidRecipients.length,
                    email: invalidRecipients[0].email,
                  }}
                />
              )}
            </FormErrorMessage>
          </FormControl>
          {validRecipients.length >= 2 && invalidRecipients.length === 0 ? (
            <Alert status="info" marginTop={4}>
              <AlertIcon />
              <FormattedMessage
                id="petition.add-access.same-petition-warning"
                defaultMessage="All {recipientCount} recipients will receive a link to the same petition so they can fill it out collaboratively."
                values={{ recipientCount: validRecipients.length }}
              />
            </Alert>
          ) : null}
          <Box marginTop={2}>
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
          />
        </>
      }
      confirm={
        <SendButton
          onSendClick={() => handleSendClick(false)}
          onScheduleClick={() => handleSendClick(true)}
        />
      }
      cancel={
        <Button onClick={() => props.onReject({ reason: "CANCEL" })}>
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
      remindersConfig {
        offset
        time
        timezone
        weekdaysOnly
      }
    }
  `,
};

export function useAddPetitionAccessDialog() {
  return useDialog(AddPetitionAccessDialog);
}
