import { TooltipProps, Tooltip } from "@chakra-ui/core";

export function DisableableTooltip({
  isDisabled,
  children,
  ...props
}: { isDisabled?: boolean } & TooltipProps) {
  return isDisabled ? (
    <>{children}</>
  ) : (
    <Tooltip {...props}>{children}</Tooltip>
  );
}
