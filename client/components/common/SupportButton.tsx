import { Button, ButtonOptions, ThemingProps } from "@chakra-ui/react";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { isDefined } from "remeda";
import { NakedLink } from "./Link";

interface SupportButton extends ButtonOptions, ThemingProps<"Button"> {
  message: string;
}

export const SupportButton = chakraForwardRef<"a", SupportButton>(function SupportButton(
  { message, onClick, children, isDisabled, ...props },
  ref,
) {
  if (isDisabled) {
    return (
      <Button ref={ref as any} as="a" {...(props as any)} isDisabled={isDisabled}>
        {children}
      </Button>
    );
  }

  return (
    <NakedLink href={`mailto:support@onparallel.com?body=${encodeURIComponent(message)}`}>
      <Button
        ref={ref as any}
        as="a"
        {...(props as any)}
        onClick={(event) => {
          if (isDefined(window.Intercom)) {
            event.preventDefault();
            window.Intercom("showNewMessage", message);
          }
          onClick?.(event as any);
        }}
      >
        {children}
      </Button>
    </NakedLink>
  );
});
