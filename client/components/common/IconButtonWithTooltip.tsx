import {
  IconButtonProps,
  Tooltip,
  IconButton,
  TooltipProps,
  useTheme,
} from "@chakra-ui/core";
import { forwardRef } from "react";

export type IconButtonWithTooltipProps = Omit<IconButtonProps, "aria-label"> &
  Pick<TooltipProps, "placement" | "showDelay"> & {
    label: string;
  };

export const IconButtonWithTooltip = forwardRef(function (
  {
    label,
    placement,
    showDelay,
    isDisabled,
    ...props
  }: IconButtonWithTooltipProps,
  ref
) {
  const { zIndices } = useTheme();
  return isDisabled ? (
    <IconButton isDisabled aria-label={label} {...props} ref={ref} />
  ) : (
    <Tooltip
      aria-label={label}
      label={label}
      showDelay={showDelay}
      placement={placement}
      zIndex={zIndices.tooltip}
    >
      <IconButton aria-label={label} {...props} ref={ref} />
    </Tooltip>
  );
});
