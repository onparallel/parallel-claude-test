import { IconButton, IconButtonProps, PlacementWithLogical } from "@chakra-ui/react";
import { Tooltip } from "@parallel/chakra/components";
import { chakraForwardRef } from "@parallel/chakra/utils";

export interface IconButtonWithTooltipProps extends Omit<IconButtonProps, "aria-label"> {
  label: string;
  placement?: PlacementWithLogical;
  disabled?: boolean;
}

export const IconButtonWithTooltip = chakraForwardRef<"button", IconButtonWithTooltipProps>(
  function IconButtonWithTooltip({ label, placement, disabled, ...props }, ref) {
    return (
      <Tooltip label={label} placement={placement} isDisabled={props.isDisabled || disabled}>
        <IconButton
          aria-label={label}
          isDisabled={props.isDisabled || disabled}
          {...props}
          ref={ref}
        />
      </Tooltip>
    );
  },
);
