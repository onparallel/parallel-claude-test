import { Box, HStack } from "@parallel/components/ui";
import { Heading, HeadingProps } from "@chakra-ui/react";
import { chakraComponent } from "@parallel/chakra/utils";
import { ReactNode } from "react";
import { CloseButton } from "./CloseButton";
import { Divider } from "./Divider";

export interface CardProps {
  isInteractive?: boolean;
  isDisabled?: boolean;
}

export const Card = chakraComponent<"section", CardProps>(function Card({
  ref,
  children,
  isInteractive,
  isDisabled,
  ...props
}) {
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
      opacity={isDisabled ? 0.4 : undefined}
      cursor={isDisabled ? "not-allowed" : undefined}
      sx={{
        ...(isInteractive && !isDisabled
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

export const CloseableCardHeader = chakraComponent<"header", CloseableCardHeaderProps>(
  function CloseableCardHeader({ ref, isCloseable = true, onClose, ...props }) {
    return (
      <CardHeader
        ref={ref}
        {...props}
        rightAction={isCloseable ? <CloseButton onClick={onClose} /> : null}
      />
    );
  },
);

export interface CardHeaderProps {
  headingLevel?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
  headingSize?: HeadingProps["size"];
  rightAction?: ReactNode;
  omitDivider?: boolean;
  leftIcon?: ReactNode;
  headingMinWidth?: HeadingProps["minWidth"];
}

export const CardHeader = chakraComponent<"header", CardHeaderProps>(function CardHeader({
  ref,
  headingLevel,
  headingSize,
  headingMinWidth,
  rightAction,
  omitDivider,
  leftIcon,
  children,
  ...props
}) {
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
          minWidth={headingMinWidth}
        >
          {children}
        </Heading>
        {rightAction}
      </HStack>
      {omitDivider ? null : <Divider />}
    </>
  );
});
