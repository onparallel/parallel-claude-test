import { Box, BoxProps, Button, ButtonProps } from "@chakra-ui/core";

export type BurgerButtonProps = Omit<ButtonProps, "children"> & {
  isOpen: boolean;
};

export function BurgerButton({ isOpen, ...props }: BurgerButtonProps) {
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
      {...props}
    >
      <Box
        {...common}
        transform={isOpen ? "rotate(-45deg)" : "translateY(-7px)"}
      ></Box>
      <Box {...common} opacity={isOpen ? 0 : 1}></Box>
      <Box
        {...common}
        transform={isOpen ? "rotate(45deg)" : "translateY(7px)"}
      ></Box>
    </Button>
  );
}
