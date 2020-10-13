import { Box, Button, Flex, ModalCloseButton, Text } from "@chakra-ui/core";
import { EmailIcon, ThumbUpIcon } from "@parallel/chakra/icons";
import { ConfirmDialog } from "@parallel/components/common/ConfirmDialog";
import {
  DialogProps,
  useDialog,
} from "@parallel/components/common/DialogOpenerProvider";
import { useMemo, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import {
  RichTextEditor,
  RichTextEditorContent,
} from "../common/RichTextEditor";

export function ConfirmPetitionCompletedDialog({
  ...props
}: DialogProps<{}, RichTextEditorContent>) {
  const intl = useIntl();
  const [body, setBody] = useState<RichTextEditorContent>([
    {
      children: [
        {
          text: `${intl.formatMessage({
            id: "generic.hi",
            defaultMessage: "Hi",
          })},`,
        },
      ],
    },
    { children: [{ text: "" }] },
    {
      children: [
        {
          text: `${intl.formatMessage({
            id: "petition-replies.confirm-reviewed-default-body.text-1",
            defaultMessage: "We have reviewed all the information.",
          })} `,
        },
        {
          text: intl.formatMessage({
            id: "petition-replies.confirm-reviewed-default-body.text-2",
            defaultMessage: "We confirm that everything is correct.",
          }),
        },
      ],
    },
    { children: [{ text: "" }] },
    {
      children: [
        {
          text: intl.formatMessage({
            id: "petition-replies.confirm-reviewed-default-body.text-3",
            defaultMessage:
              "We will get to work and if we have any questions or need any more information we will let you know.",
          }),
        },
      ],
    },
    { children: [{ text: "" }] },
    {
      children: [
        {
          text: intl.formatMessage({
            id: "generic.greetings",
            defaultMessage: "Greetings.",
          }),
        },
      ],
    },
  ]);

  const isInvalidBody = useMemo(() => {
    return (
      body.length === 1 &&
      body[0].children &&
      (body[0].children as any[]).length === 1 &&
      (body[0].children as any[])[0].text === ""
    );
  }, [body]);

  return (
    <ConfirmDialog
      size="xl"
      header={
        <>
          <ModalCloseButton />
          <Flex alignItems="center">
            <Box
              display="flex"
              justifyContent="center"
              alignItems="center"
              backgroundColor="blue.500"
              borderRadius="100%"
              margin={1}
              padding={2}
            >
              <ThumbUpIcon color="white" />
            </Box>
            <FormattedMessage
              id="petition-replies.confirm-reviewed.dialog-heading"
              defaultMessage="Confirm that you have all the information"
            />
          </Flex>
          <Text fontWeight="normal" fontSize="md" marginTop={1}>
            <FormattedMessage
              id="petition-replies.confirm-reviewed.dialog-subheading"
              defaultMessage="If everything is correct, notify the recipient for peace of mind"
            />
          </Text>
        </>
      }
      body={
        <RichTextEditor
          isInvalid={isInvalidBody}
          value={body}
          onChange={setBody}
          placeholder={intl.formatMessage({
            id: "component.message-email-editor.body-placeholder",
            defaultMessage: "Write a message to include in the email",
          })}
        />
      }
      cancel={
        <Button onClick={() => props.onReject({ reason: "CLOSE" })}>
          <FormattedMessage
            id="generic.confirm-later"
            defaultMessage="Confirm later"
          />
        </Button>
      }
      confirm={
        <Button
          leftIcon={<EmailIcon />}
          colorScheme="purple"
          onClick={() => props.onResolve(body)}
          disabled={isInvalidBody}
        >
          <FormattedMessage id="generic.send" defaultMessage="Send" />
        </Button>
      }
      {...props}
    />
  );
}

export function useConfirmPetitionCompletedDialog() {
  return useDialog(ConfirmPetitionCompletedDialog);
}
