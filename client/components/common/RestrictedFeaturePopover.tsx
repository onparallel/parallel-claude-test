import { Box, BoxProps, Placement, PopoverProps, Text, TextProps } from "@chakra-ui/react";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { useHasPermission } from "@parallel/utils/useHasPermission";
import { ReactNode } from "react";
import { FormattedMessage } from "react-intl";
import { Link } from "./Link";
import { SmallPopover } from "./SmallPopover";

export type RestrictedFeaturePopoverProps = {
  children: ReactNode;
  isRestricted: boolean;
  content?: ReactNode;
  placement?: Placement;
  popoverWidth?: BoxProps["width"];
  fontSize?: TextProps["fontSize"];
} & PopoverProps;

export const RestrictedFeaturePopover = chakraForwardRef<"div", RestrictedFeaturePopoverProps>(
  function (
    {
      children,
      isRestricted,
      content,
      placement = "bottom",
      popoverWidth,
      fontSize = "sm",
      ...props
    },
    ref,
  ) {
    const userCanListOrgUsers = useHasPermission("USERS:LIST_USERS");
    return (
      <SmallPopover
        content={
          <Box fontSize={fontSize}>
            {content ?? (
              <>
                <Text>
                  <FormattedMessage
                    id="component.restricted-feature-popover.restricted"
                    defaultMessage="This feature is restricted."
                  />
                </Text>
                <Text>
                  <FormattedMessage
                    id="component.restricted-feature-popover.contact-org-owner"
                    defaultMessage="<a>Contact the owner</a> of your organization if you need to change these permissions."
                    values={{
                      a: (chunks: any) =>
                        userCanListOrgUsers ? (
                          <Link href={`/app/organization/users`}>{chunks}</Link>
                        ) : (
                          chunks
                        ),
                    }}
                  />
                </Text>
              </>
            )}
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
            <Box position="absolute" top="0" insetStart="0" width="100%" height="100%" />
          </Box>
        ) : (
          children
        )}
      </SmallPopover>
    );
  },
);
