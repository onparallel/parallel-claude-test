import { FormattedMessage } from "react-intl";
import { Button } from "./Button";

export function CompleteInfoButton({ href }: { href: string }) {
  return (
    <Button href={href} fontWeight={500}>
      <FormattedMessage
        id="generic.complete-information-button"
        defaultMessage="Complete the information"
      />
    </Button>
  );
}
