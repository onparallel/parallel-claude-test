import {
  Button,
  chakra,
  IconButtonProps,
  IconProps,
  Placement,
  Tooltip,
  useBreakpointValue,
} from "@chakra-ui/react";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { cloneElement, isValidElement } from "react";

export interface ResponsiveButtonIconProps extends Omit<IconButtonProps, "aria-label"> {
  label: string;
  breakpoint?: string;
  hideIconOnDesktop?: boolean;
  placement?: Placement;
}

export const ResponsiveButtonIcon = chakraForwardRef<"button", ResponsiveButtonIconProps>(function (
  {
    label,
    icon,
    breakpoint = "md",
    hideIconOnDesktop,
    placement,
    ...props
  }: ResponsiveButtonIconProps,
  ref
) {
  const isOnlyIcon = useBreakpointValue({ base: true, [breakpoint]: false });
  return (
    <Tooltip placement={placement} label={label} isDisabled={props.isDisabled || !isOnlyIcon}>
      <Button
        aria-label={isOnlyIcon ? label : undefined}
        paddingX={{ base: 0, [breakpoint]: props.size === "sm" ? 3 : 4 }}
        {...props}
        ref={ref}
      >
        <chakra.span
          display={hideIconOnDesktop ? { base: "inherit", [breakpoint]: "none" } : "inherit"}
        >
          {isValidElement(icon)
            ? cloneElement<IconProps>(icon as any, {
                "aria-hidden": true,
                focusable: false,
              })
            : icon}
        </chakra.span>
        <chakra.span
          marginLeft={hideIconOnDesktop ? 0 : 2}
          display={{ base: "none", [breakpoint]: "inline" }}
        >
          {label}
        </chakra.span>
      </Button>
    </Tooltip>
  );
});
