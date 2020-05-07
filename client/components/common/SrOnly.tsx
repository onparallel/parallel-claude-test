/** @jsx jsx */
import { Box } from "@chakra-ui/core";
import { jsx } from "@emotion/core";
import { ReactNode } from "react";

export interface SrOnlyProps {
  children: ReactNode;
}

export function SrOnly({ children }: SrOnlyProps) {
  return (
    <Box
      as="span"
      css={{
        position: "absolute",
        width: "1px",
        height: "1px",
        padding: 0,
        margin: "-1px",
        overflow: "hidden",
        clip: "rect(0,0,0,0)",
        border: 0,
      }}
    >
      {children}
    </Box>
  );
}
