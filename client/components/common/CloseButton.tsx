import { IconButton, IconButtonProps } from "@chakra-ui/react";
import { CloseIcon } from "@parallel/chakra/icons";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { useIntl } from "react-intl";

interface CloseButtonProps
  extends Omit<IconButtonProps, "icon" | "aria-label">,
    Partial<Pick<IconButtonProps, "aria-label">> {
  isClear?: boolean;
}

export const CloseButton = chakraForwardRef<"button", CloseButtonProps>(function CloseButton(
  { isClear, ...props },
  ref,
) {
  const intl = useIntl();
  return (
    <IconButton
      ref={ref}
      variant="ghost"
      icon={<CloseIcon width="0.875em" height="0.875em" />}
      size="xs"
      aria-label={
        isClear
          ? intl.formatMessage({
              id: "generic.clear",
              defaultMessage: "Clear",
            })
          : intl.formatMessage({
              id: "generic.close",
              defaultMessage: "Close",
            })
      }
      {...props}
    />
  );
});
