import { ReactNode } from "react";

interface IfProps {
  condition: any;
  children: ReactNode;
}

export const If = ({ condition, children }: IfProps) => (
  <>{condition ? children : null}</>
);
