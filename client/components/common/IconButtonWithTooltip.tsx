import {
  IconButtonProps,
  Tooltip,
  IconButton,
  TooltipProps
} from "@chakra-ui/core";

export type IconButtonWithTooltipProps = Omit<IconButtonProps, "aria-label"> &
  Pick<TooltipProps, "placement" | "showDelay"> & {
    label: string;
  };

export function IconButtonWithTooltip({
  label,
  placement,
  showDelay,
  isDisabled,
  ...props
}: IconButtonWithTooltipProps) {
  return isDisabled ? (
    <IconButton isDisabled aria-label={label} {...props} />
  ) : (
    <Tooltip
      aria-label={label}
      label={label}
      showDelay={showDelay}
      placement={placement}
    >
      <IconButton aria-label={label} {...props} />
    </Tooltip>
  );
}
