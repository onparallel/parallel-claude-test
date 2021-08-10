import { Box, BoxProps } from "@chakra-ui/react";
import React, { ReactNode } from "react";

export interface SimpleWizardProps extends BoxProps {
  index: number;
  children: ReactNode;
}

export const SimpleWizard = ({ index, children }: SimpleWizardProps) => {
  const pages = React.Children.toArray(children);
  const indexToDispaly = index <= pages.length ? index : 0;
  return (
    <>
      {pages.map((page, i) => {
        return (
          <Box key={i} display={i === indexToDispaly ? "block" : "none"}>
            {page}
          </Box>
        );
      })}
    </>
  );
};
