import {
  Button,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Icon,
  IconButton,
  Input,
  MenuItem,
  MenuList,
} from "@chakra-ui/core";
import { ConfirmDialog } from "@parallel/components/common/ConfirmDialog";
import {
  DialogProps,
  useDialog,
} from "@parallel/components/common/DialogOpenerProvider";
import { ChangeEvent, useCallback, useRef, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { ButtonDropdown } from "../common/ButtonDropdown";
import {
  isEmptyContent,
  RichTextEditor,
  RichTextEditorContent,
} from "../common/RichTextEditor";
import { SplitButton } from "../common/SplitButton";
import { useScheduleMessageDialog } from "../petition-compose/ScheduleMessageDialog";

export function SendMessageDialogDialog({
  ...props
}: DialogProps<{
  subject: string;
  body: RichTextEditorContent;
  scheduledAt: Date | null;
}>) {
  const intl = useIntl();
  const [showErrors, setShowErrors] = useState(false);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState<RichTextEditorContent>([
    { children: [{ text: "" }] },
  ]);
  const isValid = Boolean(subject && !isEmptyContent(body));
  const subjectRef = useRef<HTMLInputElement>(null);
  const showScheduleMessageDialog = useScheduleMessageDialog();
  const handleScheduleClick = useCallback(async () => {
    try {
      if (!isValid) {
        setShowErrors(true);
        return;
      }
      const scheduledAt = await showScheduleMessageDialog({});
      props.onResolve({ subject, body, scheduledAt });
    } catch {}
  }, [isValid]);
  const handleSendClick = useCallback(() => {
    if (!isValid) {
      setShowErrors(true);
      return;
    }
    props.onResolve({ subject, body, scheduledAt: null });
  }, [isValid]);

  return (
    <ConfirmDialog
      size="2xl"
      focusRef={subjectRef}
      header={
        <FormattedMessage
          id="petition.send-message-header.header"
          defaultMessage="Send message"
        />
      }
      body={
        <>
          <FormControl isInvalid={showErrors && !subject}>
            <FormLabel htmlFor="petition-subject" paddingBottom={0}>
              <FormattedMessage
                id="petition.subject-label"
                defaultMessage="Subject"
              />
            </FormLabel>
            <Input
              id="petition-subject"
              type="text"
              ref={subjectRef}
              value={subject}
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                setSubject(event.target.value)
              }
              placeholder={intl.formatMessage({
                id: "petition.subject-placeholder",
                defaultMessage: "Enter the subject of the email",
              })}
            />
            <FormErrorMessage>
              <FormattedMessage
                id="petition.subject-required"
                defaultMessage="A subject helps the recipient understand the context of your petition."
              />
            </FormErrorMessage>
          </FormControl>
          <FormControl
            isInvalid={showErrors && isEmptyContent(body)}
            marginTop={4}
          >
            <RichTextEditor
              value={body}
              onChange={setBody}
              placeholder={intl.formatMessage({
                id: "petition.body-placeholder",
                defaultMessage: "Write a message to include in the email",
              })}
            />
            <FormErrorMessage>
              <FormattedMessage
                id="petition.body-required"
                defaultMessage="Customizing the initial message improves the response time of the recipients."
              />
            </FormErrorMessage>
          </FormControl>
        </>
      }
      confirm={
        <SplitButton dividerColor="purple.600">
          <Button
            type="submit"
            variantColor="purple"
            leftIcon={"paper-plane" as any}
            onClick={handleSendClick}
          >
            <FormattedMessage id="petition.send-button" defaultMessage="Send" />
          </Button>
          <ButtonDropdown
            as={IconButton}
            variantColor="purple"
            icon="chevron-down"
            aria-label="Options"
            minWidth={8}
            dropdown={
              <MenuList minWidth={0} placement="top-end">
                <MenuItem onClick={handleScheduleClick}>
                  <Icon name="time" marginRight={2} />
                  <FormattedMessage
                    id="petition.schedule-send-button"
                    defaultMessage="Schedule send"
                  />
                </MenuItem>
              </MenuList>
            }
          ></ButtonDropdown>
        </SplitButton>
      }
      {...props}
    />
  );
}

export function useSendMessageDialogDialog() {
  return useDialog(SendMessageDialogDialog);
}
