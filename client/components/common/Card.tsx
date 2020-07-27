import {
  Box,
  BoxProps,
  CloseButton,
  Flex,
  Heading,
  HeadingProps,
  useColorMode,
} from "@chakra-ui/core";
import { forwardRef, ReactNode } from "react";
import { useIntl } from "react-intl";
import { Divider } from "./Divider";

export type CardProps = BoxProps;

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { children, ...props },
  ref
) {
  const { colorMode } = useColorMode();
  return (
    <Box
      ref={ref}
      as="section"
      borderWidth="1px"
      backgroundColor={{ light: "white", dark: "gray.900" }[colorMode]}
      boxShadow="md"
      borderRadius="md"
      {...props}
    >
      {children}
    </Box>
  );
});

export type CardHeaderProps = {
  children: ReactNode;
  headingAs?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
  headingSize?: HeadingProps["size"];
  isCloseable?: boolean;
  onClose?: () => void;
};

export function CardHeader({
  headingAs = "h3",
  headingSize = "sm",
  children,
  isCloseable,
  onClose,
}: CardHeaderProps) {
  const intl = useIntl();
  return (
    <>
      <Flex padding={4}>
        <Flex flex="1" alignItems="center">
          <Heading as={headingAs} size={headingSize}>
            {children}
          </Heading>
          {isCloseable ? (
            <Flex flex="1" height={5} marginLeft={1} justifyContent="flex-end">
              <CloseButton
                size="sm"
                aria-label={intl.formatMessage({
                  id: "generic.close",
                  defaultMessage: "Close",
                })}
                onClick={onClose}
              />
            </Flex>
          ) : null}
        </Flex>
      </Flex>
      <Divider />
    </>
  );
}
