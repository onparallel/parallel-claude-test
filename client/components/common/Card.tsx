import { PseudoBox, PseudoBoxProps, useColorMode } from "@chakra-ui/core";

export type CardProps = PseudoBoxProps;

export function Card({ children, ...props }: CardProps) {
  const { colorMode } = useColorMode();
  return (
    <PseudoBox
      as="section"
      borderWidth="1px"
      backgroundColor={{ light: "white", dark: "gray.900" }[colorMode]}
      shadow="md"
      rounded="md"
      {...props}
    >
      {children}
    </PseudoBox>
  );
}
