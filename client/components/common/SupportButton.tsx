import { Button, ButtonProps } from "@chakra-ui/react";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { isDefined } from "remeda";
import { NakedLink } from "./Link";

interface SupportButton extends ButtonProps {
  message: string;
}

export const SupportButton = chakraForwardRef<"a", SupportButton>(function SupportButton(
  { message, onClick, children, isDisabled, ...props },
  ref
) {
  if (isDisabled) {
    return (
      <Button ref={ref as any} as="a" {...props} isDisabled={isDisabled}>
        {children}
      </Button>
    );
  }

  return (
    <NakedLink href={`mailto:support@onparallel.com?body=${encodeURIComponent(message)}`}>
      <Button
        ref={ref as any}
        as="a"
        {...props}
        onClick={(event) => {
          if (isDefined(window.Intercom)) {
            event.preventDefault();
            window.Intercom("showNewMessage", message);
          }
          onClick?.(event);
        }}
      >
        {children}
      </Button>
    </NakedLink>
  );
});
