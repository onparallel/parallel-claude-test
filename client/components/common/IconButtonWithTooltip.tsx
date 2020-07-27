import {
  IconButtonProps,
  Tooltip,
  IconButton,
  TooltipProps,
} from "@chakra-ui/core";
import { forwardRef } from "react";

export type IconButtonWithTooltipProps = {
  label: string;
} & Omit<IconButtonProps, "aria-label"> &
  Pick<TooltipProps, "placement">;

export const IconButtonWithTooltip = forwardRef<
  HTMLButtonElement,
  IconButtonWithTooltipProps
>(function ({ label, placement, ...props }, ref) {
  return (
    <Tooltip label={label} placement={placement} isDisabled={props.isDisabled}>
      <IconButton aria-label={label} {...props} ref={ref} />
    </Tooltip>
  );
});
