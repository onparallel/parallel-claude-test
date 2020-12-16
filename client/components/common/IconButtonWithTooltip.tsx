import {
  IconButtonProps,
  Tooltip,
  IconButton,
  Placement,
} from "@chakra-ui/core";
import { ExtendChakra } from "@parallel/chakra/utils";
import { forwardRef } from "react";

export interface IconButtonWithTooltipProps
  extends ExtendChakra<Omit<IconButtonProps, "aria-label">> {
  label: string;
  placement?: Placement;
}

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
