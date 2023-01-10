import { FormattedMessage } from "react-intl";
import { Tone } from "../utils/types";
import { Button, ButtonProps } from "./Button";

interface CompleteInfoButton extends Omit<ButtonProps, "children"> {
  tone: Tone;
}

export function CompleteInfoButton({ tone, ...props }: CompleteInfoButton) {
  return (
    <Button fontWeight="500" {...props}>
      <FormattedMessage
        id="generic.complete-information-button"
        defaultMessage="Complete the information"
        values={{ tone }}
      />
    </Button>
  );
}
