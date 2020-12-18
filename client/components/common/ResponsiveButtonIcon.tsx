import {
  Button,
  chakra,
  IconButtonProps,
  Placement,
  Tooltip,
  useBreakpointValue,
} from "@chakra-ui/react";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { cloneElement, isValidElement } from "react";

export interface ResponsiveButtonIconProps
  extends Omit<IconButtonProps, "aria-label"> {
  label: string;
  breakpoint?: string;
  placement?: Placement;
}

export const ResponsiveButtonIcon = chakraForwardRef<
  "button",
  ResponsiveButtonIconProps
>(function (
  {
    label,
    icon,
    breakpoint = "md",
    placement,
    ...props
  }: ResponsiveButtonIconProps,
  ref
) {
  const isOnlyIcon = useBreakpointValue({ base: true, [breakpoint]: false });
  return (
    <Tooltip
      placement={placement}
      label={label}
      isDisabled={props.isDisabled || !isOnlyIcon}
    >
      <Button
        aria-label={isOnlyIcon ? label : undefined}
        paddingX={{ base: 0, [breakpoint]: 4 }}
        {...props}
        ref={ref}
      >
        <chakra.span
          marginRight={2}
          display={{ base: "none", [breakpoint]: "inline" }}
        >
          {label}
        </chakra.span>
        <chakra.span>
          {isValidElement(icon)
            ? cloneElement(icon, {
                "aria-hidden": true,
                focusable: false,
              })
            : icon}
        </chakra.span>
      </Button>
    </Tooltip>
  );
});
