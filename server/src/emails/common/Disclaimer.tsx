import { MjmlText } from "mjml-react";
import { FormattedMessage } from "react-intl";

export function Disclaimer({ email }: { email: string }) {
  return (
    <>
      <MjmlText fontStyle="italic" align="center">
        <FormattedMessage
          id="disclaimer"
          defaultMessage="This is an email sent via Parallel from the verified account {email}"
          values={{ email }}
        />
      </MjmlText>
    </>
  );
}
