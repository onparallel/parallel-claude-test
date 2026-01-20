import { gql } from "@apollo/client";
import { FormControl, FormControlProps, FormErrorMessage, FormLabel } from "@chakra-ui/react";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { MessageEmailSubjectFormControl_PetitionBaseFragment } from "@parallel/graphql/__types";
import { usePetitionMessagePlaceholderOptions } from "@parallel/utils/usePetitionMessagePlaceholderOptions";
import { FormattedMessage, useIntl } from "react-intl";
import { PlaceholderInput } from "../common/slate/PlaceholderInput";

interface MessageEmailSubjectFormControlProps extends Omit<FormControlProps, "value" | "onChange"> {
  value: string;
  onChange: (value: string) => void;
  petition: MessageEmailSubjectFormControl_PetitionBaseFragment;
}

export const MessageEmailSubjectFormControl = chakraForwardRef<
  "div",
  MessageEmailSubjectFormControlProps
>(function MessageEmailSubjectFormControl({ value, onChange, petition, ...props }, ref) {
  const intl = useIntl();
  const placeholderOptions = usePetitionMessagePlaceholderOptions({ petition });
  return (
    <FormControl ref={ref} {...props}>
      <FormLabel fontWeight="normal">
        <FormattedMessage
          id="component.message-email-subject-form-control.label"
          defaultMessage="Subject"
        />
      </FormLabel>
      <PlaceholderInput
        data-testid="petition-email-subject-input"
        value={value}
        onChange={(value) => onChange(value)}
        onBlur={() => onChange(value.trim())}
        placeholder={intl.formatMessage({
          id: "component.message-email-subject-form-control.placeholder",
          defaultMessage: "Enter the subject of the email",
        })}
        placeholders={placeholderOptions}
      />
      <FormErrorMessage>
        <FormattedMessage
          id="component.message-email-subject-form-control.required-error"
          defaultMessage="A subject helps the recipient understand the context of your parallel"
        />
      </FormErrorMessage>
    </FormControl>
  );
});

const _fragments = {
  PetitionBase: gql`
    fragment MessageEmailSubjectFormControl_PetitionBase on PetitionBase {
      ...usePetitionMessagePlaceholderOptions_PetitionBase
    }
  `,
};
