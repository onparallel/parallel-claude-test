import {
  FormControl,
  FormErrorMessage,
  FormLabel,
  Input,
} from "@chakra-ui/react";
import { isEmptyRTEValue } from "@parallel/utils/slate/isEmptyRTEValue";
import { Ref } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { RichTextEditor, RichTextEditorValue } from "../common/RichTextEditor";

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
  body: RichTextEditorValue;
  onSubjectChange: (value: string) => void;
  onBodyChange: (value: RichTextEditorValue) => void;
}) {
  const intl = useIntl();
  return (
    <>
      <FormControl isInvalid={showErrors && !subject}>
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
      <FormControl
        isInvalid={showErrors && isEmptyRTEValue(body)}
        marginTop={4}
      >
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
