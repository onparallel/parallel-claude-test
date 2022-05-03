import { FormattedMessage } from "react-intl";
import { Tone } from "../../db/__types";

import { Button } from "./Button";

export function CompleteInfoButton({ href, tone }: { href: string; tone: Tone }) {
  return (
    <Button href={href} fontWeight={500}>
      <FormattedMessage
        id="generic.complete-information-button"
        defaultMessage="Complete the information"
        values={{ tone }}
      />
    </Button>
  );
}
