import { Flex, FlexProps } from "@chakra-ui/react";
import { Children, ReactNode } from "react";

export interface SimpleWizardProps extends FlexProps {
  index: number;
  children: ReactNode;
}

export const SimpleWizard = ({ index, children, ...props }: SimpleWizardProps) => {
  return (
    <>
      {Children.toArray(children).map((page, i) => {
        return (
          <Flex key={i} {...props} display={i === index ? "flex" : "none"}>
            {page}
          </Flex>
        );
      })}
    </>
  );
};
