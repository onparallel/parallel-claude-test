import { FormControl, FormErrorMessage, FormLabel, Input } from "@chakra-ui/react";
import { usePetitionMessagePlaceholderOptions } from "@parallel/utils/slate/placeholders/usePetitionMessagePlaceholderOptions";
import { isEmptyRTEValue } from "@parallel/utils/slate/RichTextEditor/isEmptyRTEValue";
import { RichTextEditorValue } from "@parallel/utils/slate/RichTextEditor/types";
import { Ref } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { RichTextEditor } from "../common/slate/RichTextEditor";

export function MessageEmailEditor({
  id,
  showErrors,
  subjectRef,
  subject,
  body,
  onSubjectChange,
  onBodyChange,
  isReadOnly,
}: {
  id: string;
  showErrors: boolean;
  subjectRef?: Ref<HTMLInputElement>;
  subject: string;
  body: RichTextEditorValue;
  onSubjectChange: (value: string) => void;
  onBodyChange: (value: RichTextEditorValue) => void;
  isReadOnly?: boolean;
}) {
  const intl = useIntl();
  const placeholderOptions = usePetitionMessagePlaceholderOptions();
  return (
    <>
      <FormControl isInvalid={showErrors && !subject} isDisabled={isReadOnly}>
        <FormLabel paddingBottom={0}>
          {
            <FormattedMessage
              id="component.message-email-editor.subject-label"
              defaultMessage="Subject"
            />
          }
        </FormLabel>
        <Input
          id="input-message-email-editor-subject"
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
          isDisabled={isReadOnly}
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
        id="petition-message-body"
      >
        <RichTextEditor
          id={`email-message-${id}`}
          value={body}
          onChange={onBodyChange}
          placeholder={intl.formatMessage({
            id: "generic.email-message-placeholder",
            defaultMessage: "Write a message to include in the email",
          })}
          placeholderOptions={placeholderOptions}
          isDisabled={isReadOnly}
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
