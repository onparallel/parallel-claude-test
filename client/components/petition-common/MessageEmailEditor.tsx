import { FormControl, FormErrorMessage, FormLabel, FormLabelProps } from "@chakra-ui/react";
import { isEmptyRTEValue } from "@parallel/utils/slate/RichTextEditor/isEmptyRTEValue";
import { RichTextEditorValue } from "@parallel/utils/slate/RichTextEditor/types";
import { usePetitionMessagePlaceholderOptions } from "@parallel/utils/usePetitionMessagePlaceholderOptions";
import { FormattedMessage, useIntl } from "react-intl";
import { PlaceholderInput } from "../common/slate/PlaceholderInput";
import { RichTextEditor } from "../common/slate/RichTextEditor";
import { gql } from "@apollo/client";
import { MessageEmailEditor_PetitionBaseFragment } from "@parallel/graphql/__types";

export function MessageEmailEditor({
  id,
  showErrors,
  subject,
  body,
  onSubjectChange,
  onBodyChange,
  isReadOnly,
  petition,
  labelProps,
}: {
  id: string;
  showErrors: boolean;
  subject: string;
  body: RichTextEditorValue;
  onSubjectChange: (value: string) => void;
  onBodyChange: (value: RichTextEditorValue) => void;
  isReadOnly?: boolean;
  petition: MessageEmailEditor_PetitionBaseFragment;
  labelProps?: FormLabelProps;
}) {
  const intl = useIntl();
  const placeholderOptions = usePetitionMessagePlaceholderOptions({ petition });
  return (
    <>
      <FormControl isInvalid={showErrors && !subject} isDisabled={isReadOnly} id={`${id}-subject`}>
        <FormLabel paddingBottom={0} {...labelProps}>
          {
            <FormattedMessage
              id="component.message-email-editor.subject-label"
              defaultMessage="Subject"
            />
          }
        </FormLabel>
        <PlaceholderInput
          data-testid="petition-email-subject-input"
          value={subject}
          onChange={(value) => onSubjectChange(value)}
          onBlur={() => onSubjectChange(subject.trim())}
          placeholder={intl.formatMessage({
            id: "component.message-email-editor.subject-placeholder",
            defaultMessage: "Enter the subject of the email",
          })}
          placeholders={placeholderOptions}
          isDisabled={isReadOnly}
        />
        <FormErrorMessage>
          <FormattedMessage
            id="component.message-email-editor.subject-required-error"
            defaultMessage="A subject helps the recipient understand the context of your parallel"
          />
        </FormErrorMessage>
      </FormControl>
      <FormControl isInvalid={showErrors && isEmptyRTEValue(body)} marginTop={4} id={`${id}-body`}>
        <RichTextEditor
          data-testid="petition-email-body-rte"
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

MessageEmailEditor.fragments = {
  PetitionBase: gql`
    fragment MessageEmailEditor_PetitionBase on PetitionBase {
      ...usePetitionMessagePlaceholderOptions_PetitionBase
    }
    ${usePetitionMessagePlaceholderOptions.fragments.PetitionBase}
  `,
};
