import {
  Box,
  CloseButton,
  Flex,
  Heading,
  HeadingProps,
  HTMLChakraProps,
} from "@chakra-ui/react";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { ReactNode } from "react";
import { useIntl } from "react-intl";
import { Divider } from "./Divider";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface CardProps extends HTMLChakraProps<"section"> {}

export const Card = chakraForwardRef<"section", {}>(function Card(
  { children, ...props },
  ref
) {
  return (
    <Box
      ref={ref as any}
      as="section"
      border="1px solid"
      borderColor="gray.200"
      backgroundColor="white"
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
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
  size?: HeadingProps["size"];
  isCloseable?: boolean;
  onClose?: () => void;
};

export function CardHeader({
  as = "h3",
  size: size = "sm",
  children,
  isCloseable,
  onClose,
}: CardHeaderProps) {
  const intl = useIntl();
  return (
    <>
      <Flex as="header" padding={4}>
        <Heading as={as} size={size} overflowWrap="anywhere">
          {children}
        </Heading>
        {isCloseable ? (
          <Flex
            flex="1"
            height={5}
            marginLeft={2}
            justifyContent="flex-end"
            alignItems="center"
          >
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
      <Divider />
    </>
  );
}
