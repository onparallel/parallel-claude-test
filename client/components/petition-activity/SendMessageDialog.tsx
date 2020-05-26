import {
  Box,
  Button,
  FormControl,
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
import { ChangeEvent, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { ButtonDropdown } from "../common/ButtonDropdown";
import {
  RichTextEditor,
  RichTextEditorContent,
} from "../common/RichTextEditor";
import { SplitButton } from "../common/SplitButton";
import { useCallback } from "react";
import { useScheduleMessageDialog } from "../petition-compose/ScheduleMessageDialog";

export function SendMessageDialogDialog({ ...props }: DialogProps<void>) {
  const intl = useIntl();
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState<RichTextEditorContent>([
    { children: [{ text: "" }] },
  ]);
  const showScheduleMessageDialog = useScheduleMessageDialog();
  const handleScheduleClick = useCallback(async () => {
    try {
      const scheduleAt = await showScheduleMessageDialog({});
      console.log(scheduleAt);
    } catch {}
  }, []);
  const handleSendClick = useCallback(() => {}, []);
  return (
    <ConfirmDialog
      size="2xl"
      header={
        <FormattedMessage
          id="petition.send-message-header.header"
          defaultMessage="Send message"
        />
      }
      body={
        <>
          <FormControl>
            <FormLabel htmlFor="petition-subject" paddingBottom={0}>
              <FormattedMessage
                id="petition.subject-label"
                defaultMessage="Subject"
              />
            </FormLabel>
            <Input
              id="petition-subject"
              type="text"
              value={subject}
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                setSubject(event.target.value)
              }
              placeholder={intl.formatMessage({
                id: "petition.subject-placeholder",
                defaultMessage: "Enter the subject of the email",
              })}
            />
          </FormControl>
          <Box marginTop={4}>
            <RichTextEditor
              value={body}
              onChange={setBody}
              placeholder={intl.formatMessage({
                id: "petition.body-placeholder",
                defaultMessage: "Write a message to include in the email",
              })}
            />
          </Box>
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
