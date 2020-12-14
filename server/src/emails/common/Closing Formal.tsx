import React from "react";
import { MjmlText } from "mjml-react";
import { FormattedMessage } from "react-intl";

export function ClosingFormal() {
  return (
    <>
      <MjmlText>
        <FormattedMessage
          id="closing.formal.thank-you"
          defaultMessage="Thank you very much."
        />
      </MjmlText>
      <MjmlText>
        <FormattedMessage
          id="closing.formal.regards"
          defaultMessage="Best regards."
        />
      </MjmlText>
    </>
  );
}
