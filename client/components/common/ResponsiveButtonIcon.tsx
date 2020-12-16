import {
  chakra,
  Button,
  forwardRef,
  IconButtonProps,
  Tooltip,
  Placement,
  useBreakpointValue,
} from "@chakra-ui/core";
import { cloneElement, isValidElement } from "react";

export interface ResponsiveButtonIconProps
  extends Omit<IconButtonProps, "aria-label"> {
  label: string;
  breakpoint?: string;
  placement?: Placement;
}

export const ResponsiveButtonIcon = forwardRef<
  ResponsiveButtonIconProps,
  "button"
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
