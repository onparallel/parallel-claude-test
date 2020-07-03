import {
  Flex,
  Heading,
  HeadingProps,
  IconButton,
  PseudoBox,
  PseudoBoxProps,
  useColorMode,
} from "@chakra-ui/core";
import { ReactNode } from "react";
import { useIntl } from "react-intl";
import { Divider } from "./Divider";

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

export type CardHeaderProps = {
  children: ReactNode;
  headingAs?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
  headingFontSize?: HeadingProps["fontSize"];
  isCloseable?: boolean;
  onClose?: () => void;
};

export function CardHeader({
  headingAs = "h3",
  headingFontSize = "md",
  children,
  isCloseable,
  onClose,
}: CardHeaderProps) {
  const intl = useIntl();
  return (
    <>
      <Flex padding={4}>
        <Flex flex="1" alignItems="center">
          <Heading as={headingAs} fontSize={headingFontSize}>
            {children}
          </Heading>
          {isCloseable ? (
            <Flex flex="1" height={5} marginLeft={1} justifyContent="flex-end">
              <IconButton
                variant="ghost"
                size="xs"
                icon="close"
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
