import { FormControl, FormLabel } from "@chakra-ui/react";
import { usePetitionMessagePlaceholderOptions } from "@parallel/utils/slate/placeholders/usePetitionMessagePlaceholderOptions";
import { RichTextEditorValue } from "@parallel/utils/slate/RichTextEditor/types";
import { FormattedMessage, useIntl } from "react-intl";
import { RichTextEditor } from "../common/slate/RichTextEditor";

export function MessageClosingEmailEditor({
  id,
  showErrors,
  body,
  onBodyChange,
  isReadOnly,
}: {
  id: string;
  showErrors: boolean;
  body: RichTextEditorValue;
  onBodyChange: (value: RichTextEditorValue) => void;
  isReadOnly?: boolean;
}) {
  const intl = useIntl();
  const placeholderOptions = usePetitionMessagePlaceholderOptions();
  return (
    <FormControl isInvalid={showErrors} id="petition-closing-message-body">
      <FormLabel marginBottom={3.5}>
        <FormattedMessage
          id="component.message-closing-email-editor.body-label"
          defaultMessage="This message will only be sent if the option to <b>notify the customer</b> when the request is closed is selected."
        />
      </FormLabel>
      <RichTextEditor
        id={`email-closing-message-${id}`}
        value={body}
        onChange={onBodyChange}
        placeholder={intl.formatMessage({
          id: "component.message-email-editor.body-placeholder",
          defaultMessage: "Write a message to include in the email",
        })}
        placeholderOptions={placeholderOptions}
        isDisabled={isReadOnly}
      />
    </FormControl>
  );
}
