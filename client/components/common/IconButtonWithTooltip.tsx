import {
  IconButton,
  IconButtonProps,
  Placement,
  Tooltip,
} from "@chakra-ui/react";
import { chakraForwardRef } from "@parallel/chakra/utils";

export interface IconButtonWithTooltipProps
  extends Omit<IconButtonProps, "aria-label"> {
  label: string;
  placement?: Placement;
}

export const IconButtonWithTooltip = chakraForwardRef<
  "button",
  IconButtonWithTooltipProps
>(function IconButtonWithTooltip({ label, placement, ...props }, ref) {
  return (
    <Tooltip label={label} placement={placement} isDisabled={props.isDisabled}>
      <IconButton aria-label={label} {...props} ref={ref} />
    </Tooltip>
  );
});
