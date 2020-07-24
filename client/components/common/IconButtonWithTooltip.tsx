import {
  IconButtonProps,
  Tooltip,
  IconButton,
  TooltipProps,
  useTheme,
} from "@chakra-ui/core";
import { forwardRef } from "react";

export type IconButtonWithTooltipProps = Omit<IconButtonProps, "aria-label"> &
  Pick<TooltipProps, "placement"> & {
    label: string;
  };

export const IconButtonWithTooltip = forwardRef(function (
  { label, placement, isDisabled, ...props }: IconButtonWithTooltipProps,
  ref
) {
  const { zIndices } = useTheme();
  return isDisabled ? (
    <IconButton isDisabled aria-label={label} {...props} ref={ref} />
  ) : (
    <Tooltip
      aria-label={label}
      label={label}
      placement={placement}
      zIndex={zIndices.tooltip}
    >
      <IconButton aria-label={label} {...props} ref={ref} />
    </Tooltip>
  );
});
