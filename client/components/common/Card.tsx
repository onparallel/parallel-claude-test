import { Box, CloseButton, Heading, HeadingProps, HTMLChakraProps, Stack } from "@chakra-ui/react";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { ReactNode } from "react";
import { useIntl } from "react-intl";
import { Divider } from "./Divider";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface CardProps extends HTMLChakraProps<"section"> {}

export const Card = chakraForwardRef<"section", {}>(function Card({ children, ...props }, ref) {
  return (
    <Box
      ref={ref as any}
      as="section"
      border="1px solid"
      borderColor="gray.200"
      backgroundColor="white"
      boxShadow="short"
      borderRadius="md"
      {...props}
    >
      {children}
    </Box>
  );
});

export interface CardHeaderProps extends Omit<GenericCardHeaderProps, "rightAction"> {
  isCloseable?: boolean;
  onClose?: () => void;
}

export function CardHeader({ isCloseable, onClose, ...props }: CardHeaderProps) {
  const intl = useIntl();
  return (
    <GenericCardHeader
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

export interface GenericCardHeaderProps {
  children: ReactNode;
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
  size?: HeadingProps["size"];
  rightAction?: ReactNode;
  omitDivider?: boolean;
}

export function GenericCardHeader({
  as = "h3",
  size: size = "sm",
  children,
  rightAction,
  omitDivider,
}: GenericCardHeaderProps) {
  return (
    <>
      <Stack
        direction="row"
        as="header"
        paddingX={4}
        paddingY={3}
        minHeight="52px"
        alignItems="center"
      >
        <Heading flex="1" as={as} size={size} overflowWrap="anywhere">
          {children}
        </Heading>
        {rightAction}
      </Stack>
      {omitDivider ? null : <Divider />}
    </>
  );
}
