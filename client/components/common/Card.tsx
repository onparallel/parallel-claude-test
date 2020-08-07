import { Box, CloseButton, Flex, Heading, HeadingProps } from "@chakra-ui/core";
import { forwardRef, ReactNode } from "react";
import { useIntl } from "react-intl";
import { Divider } from "./Divider";

export const Card: typeof Box = forwardRef(function Card(
  { children, ...props },
  ref: any
) {
  return (
    <Box
      ref={ref}
      as="section"
      borderWidth="1px"
      backgroundColor="white"
      boxShadow="md"
      borderRadius="md"
      {...props}
    >
      {children}
    </Box>
  );
}) as any; // TODO: Try after rc.1 is fixed

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
        <Flex flex="1">
          <Heading as={headingAs} size={headingSize} overflowWrap="anywhere">
            {children}
          </Heading>
          {isCloseable ? (
            <Flex flex="1" height={5} marginLeft={2} justifyContent="flex-end">
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
