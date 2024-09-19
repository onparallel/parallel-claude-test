import { Button, ButtonOptions, Text, ThemingProps } from "@chakra-ui/react";
import { AlertCircleFilledIcon } from "@parallel/chakra/icons";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { cloneElement, ReactNode } from "react";
import { SmallPopover } from "../common/SmallPopover";

interface NavBarButtonProps extends ButtonOptions, ThemingProps<"Button"> {
  section?: string;
  isActive?: boolean;
  warningPopover?: ReactNode;
}

export const NavBarButton = chakraForwardRef<"button", NavBarButtonProps>(function NavBarButton(
  { children, onClick, section, isActive, leftIcon, warningPopover, sx = {}, ...props },
  ref,
) {
  return (
    <SmallPopover content={warningPopover} placement="right" isDisabled={!warningPopover}>
      <Button
        ref={ref}
        data-link={section ? `navbar-${section}` : undefined}
        width="100%"
        userSelect="none"
        aria-current={isActive ? "page" : undefined}
        sx={{
          color: "gray.600",
          background: "transparent",
          _hover: { color: "gray.700", background: "gray.100" },
          _focus: { color: "gray.800", background: "blue.50" },
          _active: { color: "gray.800", background: "blue.50" },
          _activeLink: {
            color: "blue.700",
            background: "blue.50",
            _hover: { color: "blue.800" },
            _active: { color: "blue.800" },
          },
          "&:hover svg": {
            transform: "scale(1.2)",
            transition: "transform 150ms ease",
          },
          ...sx,
        }}
        onClick={onClick}
        paddingX={2.5}
        iconSpacing={3}
        justifyContent="flex-start"
        leftIcon={
          leftIcon
            ? cloneElement(leftIcon, {
                "aria-hidden": "true",
                boxSize: 5,
                transition: "transform 150ms ease",
              })
            : undefined
        }
        {...props}
      >
        {warningPopover ? (
          <AlertCircleFilledIcon
            position="absolute"
            color="yellow.500"
            insetStart={1}
            top={1}
            transition="transform 150ms ease"
          />
        ) : null}
        <Text className="show-on-expand" as="span" noOfLines={1}>
          {children}
        </Text>
      </Button>
    </SmallPopover>
  );
});
