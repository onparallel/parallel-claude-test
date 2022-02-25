import { BoxProps, Flex } from "@chakra-ui/react";
import { ReactNode } from "react";

interface PdfPageProps extends BoxProps {
  children?: ReactNode;
  heading?: ReactNode;
  footer?: ReactNode;
}

export function PdfPage({ children, heading, footer, ...props }: PdfPageProps) {
  return (
    <Flex
      sx={{
        width: "100%",
        height: "auto",
        margin: "0 auto",
        display: "block",
        position: "relative",
        pageBreakAfter: "always",
      }}
      {...props}
    >
      <Flex justifyContent="center">{heading}</Flex>
      {children}
    </Flex>
  );
}
