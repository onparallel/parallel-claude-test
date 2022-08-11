import { Box, CloseButton, Heading, HeadingProps, HStack } from "@chakra-ui/react";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { ReactNode } from "react";
import { useIntl } from "react-intl";
import { Divider } from "./Divider";

export interface CardProps {
  isInteractive?: boolean;
}

export const Card = chakraForwardRef<"section", CardProps>(function Card(
  { children, isInteractive, ...props },
  ref
) {
  return (
    <Box
      ref={ref as any}
      as="section"
      border="1px solid"
      borderColor="gray.200"
      backgroundColor="white"
      boxShadow="short"
      borderRadius="md"
      transition="all 150ms ease"
      sx={{
        ...(isInteractive
          ? {
              _hover: {
                transform: "scale(1.025)",
                borderColor: "gray.300",
                boxShadow: "long",
              },
              _focus: {
                boxShadow: "outline",
                borderColor: "gray.200",
                outline: "none",
              },
            }
          : {}),
      }}
      {...props}
    >
      {children}
    </Box>
  );
});

export interface CloseableCardHeaderProps extends Omit<CardHeaderProps, "rightAction"> {
  isCloseable?: boolean;
  onClose?: () => void;
}

export const CloseableCardHeader = chakraForwardRef<"header", CloseableCardHeaderProps>(
  function CloseableCardHeader({ isCloseable = true, onClose, ...props }, ref) {
    const intl = useIntl();
    return (
      <CardHeader
        ref={ref}
        {...props}
        rightAction={
          isCloseable ? (
            <CloseButton
              size="sm"
              aria-label={intl.formatMessage({
                id: "generic.close",
                defaultMessage: "Close",
              })}
              onClick={onClose}
            />
          ) : null
        }
      />
    );
  }
);

export interface CardHeaderProps {
  headingLevel?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
  headingSize?: HeadingProps["size"];
  rightAction?: ReactNode;
  omitDivider?: boolean;
  leftIcon?: ReactNode;
}

export const CardHeader = chakraForwardRef<"header", CardHeaderProps>(function CardHeader(
  { headingLevel, headingSize, rightAction, omitDivider, leftIcon, children, ...props },
  ref
) {
  return (
    <>
      <HStack
        ref={ref as any}
        as="header"
        paddingX={4}
        minHeight="52px"
        alignItems="center"
        {...props}
      >
        {leftIcon}
        <Heading
          flex="1"
          as={headingLevel ?? "h3"}
          size={headingSize ?? "sm"}
          overflowWrap="anywhere"
          paddingY={3}
        >
          {children}
        </Heading>
        {rightAction}
      </HStack>
      {omitDivider ? null : <Divider />}
    </>
  );
});
