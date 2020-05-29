import {
  IconButtonProps,
  Tooltip,
  IconButton,
  TooltipProps,
  useTheme,
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
  const { zIndices } = useTheme();
  return isDisabled ? (
    <IconButton isDisabled aria-label={label} {...props} />
  ) : (
    <Tooltip
      aria-label={label}
      label={label}
      showDelay={showDelay}
      placement={placement}
      zIndex={zIndices.tooltip}
    >
      <IconButton aria-label={label} {...props} />
    </Tooltip>
  );
}
