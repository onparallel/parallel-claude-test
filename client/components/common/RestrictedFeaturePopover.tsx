import { chakraForwardRef } from "@parallel/chakra/utils";
import { Box, BoxProps, Placement, PopoverProps, Text, TextProps } from "@chakra-ui/react";
import { ReactNode } from "react";
import { SmallPopover } from "./SmallPopover";
import { FormattedMessage } from "react-intl";
import { Link } from "./Link";

export type RestrictedFeaturePopoverProps = {
  children: ReactNode;
  isRestricted: boolean;
  placement?: Placement;
  popoverWidth?: BoxProps["width"];
  fontSize?: TextProps["fontSize"];
} & PopoverProps;

export const RestrictedFeaturePopover = chakraForwardRef<"div", RestrictedFeaturePopoverProps>(
  function (
    { children, isRestricted, placement = "bottom", popoverWidth, fontSize = "sm", ...props },
    ref
  ) {
    return (
      <SmallPopover
        content={
          <Box fontSize={fontSize}>
            <Text>
              <FormattedMessage
                id="component.restricted-feature-popover.restricted"
                defaultMessage="This feature is restricted."
              />
            </Text>
            <Text>
              <FormattedMessage
                id="component.restricted-feature-popover.contact-and-admin"
                defaultMessage="<a>Contact an admin</a> if you need to change these permissions."
                values={{
                  a: (chunks: any) => <Link href={`/app/organization/users`}>{chunks}</Link>,
                }}
              />
            </Text>
          </Box>
        }
        placement={placement}
        width={popoverWidth}
        isDisabled={!isRestricted}
      >
        {isRestricted ? (
          <Box
            ref={ref}
            tabIndex={0}
            position="relative"
            _focus={{ outline: "none" }}
            _focusVisible={{ shadow: "outline" }}
            borderRadius="md"
            {...props}
          >
            <>{children}</>
            {/* This box ensures that the popover works correctly on Chrome */}
            <Box position="absolute" top="0" left="0" width="100%" height="100%" />
          </Box>
        ) : (
          children
        )}
      </SmallPopover>
    );
  }
);
