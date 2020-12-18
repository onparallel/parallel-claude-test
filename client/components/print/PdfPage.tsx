import { Flex } from "@chakra-ui/react";
import { ExtendChakra } from "@parallel/chakra/utils";
import { ReactNode } from "react";

type PdfPageProps = ExtendChakra<{
  children?: ReactNode;
  heading?: ReactNode;
  footer?: ReactNode;
}>;

export function PdfPage({ children, heading, footer, ...props }: PdfPageProps) {
  return (
    <Flex
      sx={{
        width: "210mm",
        minHeight: "297mm",
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
