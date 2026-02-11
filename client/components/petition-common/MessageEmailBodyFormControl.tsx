import { gql } from "@apollo/client";
import { FormControl, FormControlProps, FormErrorMessage } from "@chakra-ui/react";
import { chakraComponent } from "@parallel/chakra/utils";
import { MessageEmailBodyFormControl_PetitionBaseFragment } from "@parallel/graphql/__types";
import { RichTextEditorValue } from "@parallel/utils/slate/RichTextEditor/types";
import { usePetitionMessagePlaceholderOptions } from "@parallel/utils/usePetitionMessagePlaceholderOptions";
import { FormattedMessage, useIntl } from "react-intl";
import { RichTextEditor } from "../common/slate/RichTextEditor";

interface MessageEmailBodyFormControlProps extends Omit<FormControlProps, "value" | "onChange"> {
  value: RichTextEditorValue;
  onChange: (value: RichTextEditorValue) => void;
  petition: MessageEmailBodyFormControl_PetitionBaseFragment;
}

export const MessageEmailBodyFormControl = chakraComponent<
  "div",
  MessageEmailBodyFormControlProps
>(function MessageEmailBodyFormControl({ ref, value, onChange, petition, ...props }) {
  const intl = useIntl();
  const placeholderOptions = usePetitionMessagePlaceholderOptions({ petition });
  return (
    <FormControl ref={ref} {...props}>
      <RichTextEditor
        data-testid="petition-email-body-rte"
        value={value}
        onChange={onChange}
        placeholder={intl.formatMessage({
          id: "generic.email-message-placeholder",
          defaultMessage: "Write a message to include in the email",
        })}
        placeholderOptions={placeholderOptions}
      />
      <FormErrorMessage>
        <FormattedMessage
          id="component.message-email-body-form-control.required-error"
          defaultMessage="Customizing the initial message improves the response time of the recipients"
        />
      </FormErrorMessage>
    </FormControl>
  );
});

const _fragments = {
  PetitionBase: gql`
    fragment MessageEmailBodyFormControl_PetitionBase on PetitionBase {
      ...usePetitionMessagePlaceholderOptions_PetitionBase
    }
  `,
};
