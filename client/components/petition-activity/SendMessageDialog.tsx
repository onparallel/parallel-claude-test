import { ConfirmDialog } from "@parallel/components/common/ConfirmDialog";
import {
  DialogProps,
  useDialog,
} from "@parallel/components/common/DialogProvider";
import { emptyContent } from "@parallel/utils/slate/emptyContent";
import { isEmptyContent } from "@parallel/utils/slate/isEmptyContent";
import { useRef, useState } from "react";
import { FormattedMessage } from "react-intl";
import { RichTextEditorContent } from "../common/RichTextEditor";
import { MessageEmailEditor } from "../petition-common/MessageEmailEditor";
import { SendButton } from "../petition-common/SendButton";
import { useScheduleMessageDialog } from "../petition-compose/ScheduleMessageDialog";

export type SendMessageDialogDialogResult = {
  subject: string;
  body: RichTextEditorContent;
  scheduledAt: Date | null;
};

export function SendMessageDialogDialog({
  ...props
}: DialogProps<{}, SendMessageDialogDialogResult>) {
  const [showErrors, setShowErrors] = useState(false);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState<RichTextEditorContent>(emptyContent());
  const isValid = Boolean(subject && !isEmptyContent(body));
  const subjectRef = useRef<HTMLInputElement>(null);
  const showScheduleMessageDialog = useScheduleMessageDialog();
  const handleScheduleClick = async () => {
    try {
      if (!isValid) {
        setShowErrors(true);
        return;
      }
      const scheduledAt = await showScheduleMessageDialog({});
      props.onResolve({ subject, body, scheduledAt });
    } catch {}
  };
  const handleSendClick = () => {
    if (!isValid) {
      setShowErrors(true);
      return;
    }
    props.onResolve({ subject, body, scheduledAt: null });
  };

  return (
    <ConfirmDialog
      closeOnEsc={false}
      closeOnOverlayClick={false}
      size="2xl"
      initialFocusRef={subjectRef}
      header={
        <FormattedMessage
          id="petition.send-message-header.header"
          defaultMessage="Send message"
        />
      }
      body={
        <MessageEmailEditor
          showErrors={showErrors}
          subjectRef={subjectRef}
          subject={subject}
          body={body}
          onSubjectChange={setSubject}
          onBodyChange={setBody}
        />
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

export function useSendMessageDialogDialog() {
  return useDialog(SendMessageDialogDialog);
}
