import { Button, ButtonOptions, Center, Text, ThemingProps } from "@chakra-ui/react";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { ReactElement, ReactNode } from "react";

interface NavBarButtonProps
  extends Omit<ButtonOptions, "leftIcon" | "rightIcon">,
    ThemingProps<"Button"> {
  icon: ReactElement;
  section?: string;
  isActive?: boolean;
  badge?: ReactNode;
}

export const NavBarButton = chakraForwardRef<"button", NavBarButtonProps>(function NavBarButton(
  { children, onClick, section, isActive, icon, badge, sx = {}, ...props },
  ref,
) {
  return (
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
        ".chakra-button__icon svg:first-of-type": {
          transition: "transform 150ms ease",
        },
        "&:hover .chakra-button__icon svg:first-of-type": {
          transform: "scale(1.2)",
        },
        ...sx,
      }}
      onClick={onClick}
      paddingX={2.5}
      iconSpacing={3}
      justifyContent="flex-start"
      leftIcon={
        <Center boxSize={5} position="relative">
          {icon}
          {badge}
        </Center>
      }
      {...props}
    >
      <Text className="show-on-expand" as="span" noOfLines={1}>
        {children}
      </Text>
    </Button>
  );
});
