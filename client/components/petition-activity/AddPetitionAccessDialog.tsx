import { Alert, AlertIcon, Box } from "@chakra-ui/core";
import { ConfirmDialog } from "@parallel/components/common/ConfirmDialog";
import {
  DialogProps,
  useDialog,
} from "@parallel/components/common/DialogOpenerProvider";
import { useRef, useState } from "react";
import { FormattedMessage } from "react-intl";
import {
  Recipient,
  RecipientSelect,
  RecipientSelectProps,
} from "../common/RecipientSelect";
import {
  isEmptyContent,
  RichTextEditorContent,
} from "../common/RichTextEditor";
import { MessageEmailEditor } from "../petition-common/MessageEmailEditor";
import { SendButton } from "../petition-common/SendButton";
import { useScheduleMessageDialog } from "../petition-compose/ScheduleMessageDialog";
import {
  PetitionRemindersConfig,
  RemindersConfig,
} from "../petition-compose/PetitionRemindersConfig";
import { Maybe } from "@parallel/utils/types";

export function AddPetitionAccessDialog({
  onSearchContacts,
  onCreateContact,
  ...props
}: {
  onSearchContacts: RecipientSelectProps["onSearchContacts"];
  onCreateContact: RecipientSelectProps["onCreateContact"];
} & DialogProps<{
  recipientIds: string[];
  subject: string;
  body: RichTextEditorContent;
  remindersConfig: Maybe<RemindersConfig>;
  scheduledAt: Maybe<Date>;
}>) {
  const [showErrors, setShowErrors] = useState(false);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState<RichTextEditorContent>([
    { children: [{ text: "" }] },
  ]);
  const [remindersConfig, setRemindersConfig] = useState<
    Maybe<RemindersConfig>
  >(null);
  const isValid = Boolean(subject && !isEmptyContent(body));
  const recipientsRef = useRef<HTMLInputElement>(null);

  const showScheduleMessageDialog = useScheduleMessageDialog();
  const handleScheduleClick = async () => {
    try {
      if (!isValid) {
        setShowErrors(true);
        return;
      }
      const scheduledAt = await showScheduleMessageDialog({});
      props.onResolve({
        recipientIds: recipients.map((r) => r.id),
        subject,
        body,
        remindersConfig,
        scheduledAt,
      });
    } catch {}
  };

  const handleSendClick = () => {
    if (!isValid) {
      setShowErrors(true);
      return;
    }
    props.onResolve({
      recipientIds: recipients.map((r) => r.id),
      subject,
      body,
      remindersConfig,
      scheduledAt: null,
    });
  };

  return (
    <ConfirmDialog
      closeOnEsc={false}
      closeOnOverlayClick={false}
      focusRef={recipientsRef}
      size="2xl"
      header={
        <FormattedMessage
          id="petition.send-message-header.header"
          defaultMessage="Send message"
        />
      }
      body={
        <>
          <RecipientSelect
            showErrors={showErrors}
            onCreateContact={onCreateContact}
            onSearchContacts={onSearchContacts}
            value={recipients}
            onChange={setRecipients}
          />
          {recipients.length ? (
            <Alert status="info" marginTop={4}>
              <AlertIcon />
              <FormattedMessage
                id="component.send-petition-dialog..same-petition-warning"
                defaultMessage="Recipients will receive a link to the same petition so they can fill it out collaboratively."
              />
            </Alert>
          ) : null}
          <Box marginTop={2}>
            <MessageEmailEditor
              showErrors={showErrors}
              subject={subject}
              body={body}
              onSubjectChange={setSubject}
              onBodyChange={setBody}
            />
          </Box>
          <PetitionRemindersConfig
            marginTop={2}
            value={remindersConfig}
            onChange={setRemindersConfig}
          />
        </>
      }
      confirm={
        <SendButton
          onSendClick={handleSendClick}
          onScheduleClick={handleScheduleClick}
        />
      }
      {...props}
    />
  );
}

export function useAddPetitionAccessDialog() {
  return useDialog(AddPetitionAccessDialog);
}
