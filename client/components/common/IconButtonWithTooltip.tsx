import {
  IconButtonProps,
  Tooltip,
  IconButton,
  TooltipProps,
  useTheme,
} from "@chakra-ui/core";
import { forwardRef } from "react";

export type IconButtonWithTooltipProps = {
  label: string;
} & IconButtonProps &
  Pick<TooltipProps, "placement">;

export const IconButtonWithTooltip = forwardRef<
  HTMLButtonElement,
  IconButtonWithTooltipProps
>(function ({ label, placement, ...props }, ref) {
  const { zIndices } = useTheme();
  return (
    <Tooltip
      label={label}
      placement={placement}
      isDisabled={props.isDisabled}
      zIndex={zIndices.tooltip}
    >
      <IconButton aria-label={label} {...props} ref={ref} />
    </Tooltip>
  );
});
