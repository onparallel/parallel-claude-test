import {
  chakra,
  IconButtonProps,
  IconProps,
  Placement,
  useBreakpointValue,
} from "@chakra-ui/react";
import { Tooltip } from "@parallel/chakra/components";
import { chakraComponent } from "@parallel/chakra/utils";
import { Button } from "@parallel/components/ui";
import { cloneElement, isValidElement } from "react";

export interface ResponsiveButtonIconProps extends Omit<IconButtonProps, "aria-label"> {
  label: string;
  breakpoint?: string;
  hideIconOnDesktop?: boolean;
  placement?: Placement;
  disabled?: boolean;
  loading?: boolean;
}

export const ResponsiveButtonIcon = chakraComponent<"button", ResponsiveButtonIconProps>(
  function ResponsiveButtonIcon({
    ref,
    label,
    icon,
    breakpoint = "md",
    hideIconOnDesktop,
    placement,
    disabled,
    loading,
    ...props
  }) {
    const isOnlyIcon = useBreakpointValue({ base: true, [breakpoint]: false });
    return (
      <Tooltip
        placement={placement}
        label={label}
        isDisabled={props.isDisabled || disabled || !isOnlyIcon}
      >
        <Button
          aria-label={isOnlyIcon ? label : undefined}
          paddingX={{ base: 0, [breakpoint]: props.size === "sm" ? 3 : 4 }}
          disabled={props.isDisabled || disabled}
          loading={props.isLoading || loading}
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
            marginStart={hideIconOnDesktop ? 0 : 2}
            display={{ base: "none", [breakpoint]: "inline" }}
            whiteSpace="nowrap"
            overflow="hidden"
            textOverflow="ellipsis"
          >
            {label}
          </chakra.span>
        </Button>
      </Tooltip>
    );
  },
);
