import { gql } from "@apollo/client";
import { FormControl, FormLabel } from "@chakra-ui/react";
import { MessageClosingEmailEditor_PetitionBaseFragment } from "@parallel/graphql/__types";
import { RichTextEditorValue } from "@parallel/utils/slate/RichTextEditor/types";
import { usePetitionMessagePlaceholderOptions } from "@parallel/utils/usePetitionMessagePlaceholderOptions";
import { FormattedMessage, useIntl } from "react-intl";
import { RichTextEditor } from "../common/slate/RichTextEditor";

export function MessageClosingEmailEditor({
  id,
  showErrors,
  body,
  onBodyChange,
  petition,
  isReadOnly,
}: {
  id: string;
  showErrors: boolean;
  body: RichTextEditorValue;
  onBodyChange: (value: RichTextEditorValue) => void;
  petition: MessageClosingEmailEditor_PetitionBaseFragment;
  isReadOnly?: boolean;
}) {
  const intl = useIntl();
  const placeholderOptions = usePetitionMessagePlaceholderOptions({ petition });
  return (
    <FormControl isInvalid={showErrors} id={`email-closing-message-${id}`} isDisabled={isReadOnly}>
      <FormLabel marginBottom={3.5}>
        <FormattedMessage
          id="component.message-closing-email-editor.body-label"
          defaultMessage="The subject of this email will be the same as the subject of the parallel message."
        />
      </FormLabel>
      <RichTextEditor
        value={body}
        onChange={onBodyChange}
        placeholder={intl.formatMessage({
          id: "generic.email-message-placeholder",
          defaultMessage: "Write a message to include in the email",
        })}
        placeholderOptions={placeholderOptions}
      />
    </FormControl>
  );
}

MessageClosingEmailEditor.fragments = {
  PetitionBase: gql`
    fragment MessageClosingEmailEditor_PetitionBase on PetitionBase {
      ...usePetitionMessagePlaceholderOptions_PetitionBase
    }
    ${usePetitionMessagePlaceholderOptions.fragments.PetitionBase}
  `,
};
