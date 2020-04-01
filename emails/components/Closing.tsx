import React from "react";
import { MjmlText } from "mjml-react";
import { FormattedMessage } from "react-intl";

export function Closing() {
  return (
    <>
      <MjmlText>
        <FormattedMessage id="closing.text" defaultMessage="Cheers," />
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
