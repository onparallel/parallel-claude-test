import React from "react";
import { MjmlText } from "mjml-react";
import { FormattedMessage } from "react-intl";

export function Closing() {
  return (
    <>
      <MjmlText>
        <FormattedMessage id="closing.text" defaultMessage="Regards," />
      </MjmlText>
      <MjmlText paddingTop="0">
        <FormattedMessage
          id="closing.sender"
          defaultMessage="The Parallel team"
        />
      </MjmlText>
    </>
  );
}
