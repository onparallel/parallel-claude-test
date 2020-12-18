import { Box, BoxProps, Button, ButtonProps } from "@chakra-ui/react";
import { useIntl } from "react-intl";

export type BurgerButtonProps = Omit<ButtonProps, "children"> & {
  isOpen: boolean;
};

export function BurgerButton({ isOpen, ...props }: BurgerButtonProps) {
  const intl = useIntl();
  const common: BoxProps = {
    width: "30px",
    height: "3px",
    backgroundColor: "gray.800",
    borderRadius: "3px",
    transition: "300ms",
    position: "absolute",
    top: "50%",
    left: "5px",
  };

  return (
    <Button
      position="relative"
      width="40px"
      height="40px"
      variant="ghost"
      aria-label={
        isOpen
          ? intl.formatMessage({
              id: "component.burger-button.label-close",
              defaultMessage: "Close menu",
            })
          : intl.formatMessage({
              id: "component.burger-button.label-open",
              defaultMessage: "Open menu",
            })
      }
      {...props}
    >
      <Box
        {...common}
        transform={isOpen ? "rotate(-45deg)" : "translateY(-7px)"}
      />
      <Box {...common} opacity={isOpen ? 0 : 1} />
      <Box
        {...common}
        transform={isOpen ? "rotate(45deg)" : "translateY(7px)"}
      />
    </Button>
  );
}
