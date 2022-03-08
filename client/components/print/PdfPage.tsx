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
        width: "210mm",
        height: "auto",
        maxHeight: "297mm",
        margin: "auto",
        padding: "10mm",
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
