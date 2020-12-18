import {
  FormControl,
  FormErrorMessage,
  FormLabel,
  Input,
} from "@chakra-ui/react";
import { isEmptyContent } from "@parallel/utils/slate/isEmptyContent";
import { useId } from "@reach/auto-id";
import { Ref } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import {
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
      <FormControl id={subjectId} isInvalid={showErrors && !subject}>
        <FormLabel paddingBottom={0}>
          <FormattedMessage
            id="component.message-email-editor.subject-label"
            defaultMessage="Subject"
          />
        </FormLabel>
        <Input
          type="text"
          ref={subjectRef}
          value={subject}
          maxLength={255}
          onChange={(event) => onSubjectChange(event.target.value)}
          onBlur={() => onSubjectChange(subject.trim())}
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
