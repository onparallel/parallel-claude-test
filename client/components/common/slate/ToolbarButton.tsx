import { chakraForwardRef } from "@parallel/chakra/utils";
import { ReactElement } from "react";
import { IconButtonWithTooltip } from "../IconButtonWithTooltip";

export interface ToolbarButtonProps {
  isToggleable?: boolean;
  isActive?: boolean;
  label: string;
  icon: ReactElement;
}

export const ToolbarButton = chakraForwardRef<"button", ToolbarButtonProps>(function ToolbarButton(
  { label, icon, isToggleable, isActive, ...props },
  ref
) {
  return (
    <IconButtonWithTooltip
      ref={ref}
      icon={icon}
      label={label}
      size="sm"
      placement="bottom"
      tabIndex={-1}
      variant={isActive ? "solid" : "ghost"}
      aria-pressed={isToggleable ? isActive : undefined}
      {...props}
    />
  );
});
