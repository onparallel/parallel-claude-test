import { MjmlText } from "@faire/mjml-react";
import { FormattedMessage } from "react-intl";
import { Tone } from "../utils/types";

export function ClosingThanks({ tone }: { tone: Tone }) {
  return (
    <>
      <MjmlText>
        <FormattedMessage id="closing-thanks.thank-you" defaultMessage="Thank you very much." />
      </MjmlText>
      <MjmlText>
        <FormattedMessage
          id="closing-thanks.regards"
          defaultMessage="{tone, select, INFORMAL{Regards.} other{Best regards.}}"
          values={{ tone }}
        />
      </MjmlText>
    </>
  );
}
