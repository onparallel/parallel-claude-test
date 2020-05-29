import {
  FormControl,
  FormErrorMessage,
  FormLabel,
  Input,
} from "@chakra-ui/core";
import { useId } from "@reach/auto-id";
import { ChangeEvent, Ref } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import {
  isEmptyContent,
  RichTextEditor,
  RichTextEditorContent,
} from "../common/RichTextEditor";

export function MessageEmailEditor({
  showErrors,
  subjectRef,
  subject,
  body,
  onSubjectChange,
  onBodyChange,
}: {
  showErrors: boolean;
  subjectRef?: Ref<HTMLInputElement>;
  subject: string;
  body: RichTextEditorContent;
  onSubjectChange: (value: string) => void;
  onBodyChange: (value: RichTextEditorContent) => void;
}) {
  const intl = useIntl();
  const subjectId = `subject-${useId()}`;
  return (
    <>
      <FormControl isInvalid={showErrors && !subject}>
        <FormLabel htmlFor={subjectId} paddingBottom={0}>
          <FormattedMessage
            id="component.message-email-editor.subject-label"
            defaultMessage="Subject"
          />
        </FormLabel>
        <Input
          id={subjectId}
          type="text"
          ref={subjectRef}
          value={subject}
          onChange={(event: ChangeEvent<HTMLInputElement>) =>
            onSubjectChange(event.target.value)
          }
          placeholder={intl.formatMessage({
            id: "component.message-email-editor.subject-placeholder",
            defaultMessage: "Enter the subject of the email",
          })}
        />
        <FormErrorMessage>
          <FormattedMessage
            id="component.message-email-editor.subject-required-error"
            defaultMessage="A subject helps the recipient understand the context of your petition"
          />
        </FormErrorMessage>
      </FormControl>
      <FormControl isInvalid={showErrors && isEmptyContent(body)} marginTop={4}>
        <RichTextEditor
          value={body}
          onChange={onBodyChange}
          placeholder={intl.formatMessage({
            id: "component.message-email-editor.body-placeholder",
            defaultMessage: "Write a message to include in the email",
          })}
        />
        <FormErrorMessage>
          <FormattedMessage
            id="component.message-email-editor.body-required-error"
            defaultMessage="Customizing the initial message improves the response time of the recipients"
          />
        </FormErrorMessage>
      </FormControl>
    </>
  );
}
