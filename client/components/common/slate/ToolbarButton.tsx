import { chakraComponent } from "@parallel/chakra/utils";
import { IconButtonWithTooltip, IconButtonWithTooltipProps } from "../IconButtonWithTooltip";

export interface ToolbarButtonProps extends IconButtonWithTooltipProps {
  isToggleable?: boolean;
}

export const ToolbarButton = chakraComponent<"button", ToolbarButtonProps>(function ToolbarButton({
  ref,
  isToggleable,
  isActive,
  ...props
}) {
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
