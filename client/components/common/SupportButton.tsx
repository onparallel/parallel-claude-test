import { ButtonOptions, ThemingProps } from "@chakra-ui/react";
import { chakraComponent } from "@parallel/chakra/utils";
import { Button } from "@parallel/components/ui";
import { isNonNullish } from "remeda";

interface SupportButton extends ButtonOptions, ThemingProps<"Button"> {
  message: string;
}

export const SupportButton = chakraComponent<"a", SupportButton>(function SupportButton({
  ref,
  message,
  onClick,
  children,
  isDisabled,
  ...props
}) {
  if (isDisabled) {
    return (
      <Button ref={ref as any} as="a" {...(props as any)} disabled={isDisabled}>
        {children}
      </Button>
    );
  }

  return (
    <Button
      ref={ref as any}
      as="a"
      href={`mailto:support@onparallel.com?body=${encodeURIComponent(message)}`}
      {...(props as any)}
      onClick={(event) => {
        if (isNonNullish(window.Intercom)) {
          event.preventDefault();
          window.Intercom("showNewMessage", message);
        }
        onClick?.(event as any);
      }}
    >
      {children}
    </Button>
  );
});
