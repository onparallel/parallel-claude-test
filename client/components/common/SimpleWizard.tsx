import { Flex, FlexProps } from "@chakra-ui/react";
import React, { ReactNode } from "react";

export interface SimpleWizardProps extends FlexProps {
  index: number;
  children: ReactNode;
}

export const SimpleWizard = ({ index, children, ...props }: SimpleWizardProps) => {
  const pages = React.Children.toArray(children);
  const indexToDispaly = index <= pages.length ? index : 0;
  return (
    <>
      {pages.map((page, i) => {
        return (
          <Flex key={i} {...props} display={i === indexToDispaly ? "flex" : "none"}>
            {page}
          </Flex>
        );
      })}
    </>
  );
};
