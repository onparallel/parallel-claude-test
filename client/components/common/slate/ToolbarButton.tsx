import { chakraForwardRef } from "@parallel/chakra/utils";
import { IconButtonWithTooltip, IconButtonWithTooltipProps } from "../IconButtonWithTooltip";

export interface ToolbarButtonProps extends IconButtonWithTooltipProps {
  isToggleable?: boolean;
}

export const ToolbarButton = chakraForwardRef<"button", ToolbarButtonProps>(function ToolbarButton(
  { isToggleable, isActive, ...props },
  ref
) {
  return (
    <IconButtonWithTooltip
      ref={ref}
      size="sm"
      placement="bottom"
      tabIndex={-1}
      variant={isActive ? "solid" : "ghost"}
      aria-pressed={isToggleable ? isActive : undefined}
      {...props}
    />
  );
});
