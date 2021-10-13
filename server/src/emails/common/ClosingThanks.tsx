import { MjmlText } from "mjml-react";
import { FormattedMessage } from "react-intl";

export function ClosingThanks({ tone }: { tone: string }) {
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
