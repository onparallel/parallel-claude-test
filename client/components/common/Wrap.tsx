import { PropsWithChildren, ReactNode } from "react";

interface WrapProps {
  when: boolean;
  wrapper: ({ children }: PropsWithChildren) => ReactNode;
}
export function Wrap({ when, wrapper, children }: PropsWithChildren<WrapProps>) {
  return <>{when ? wrapper({ children }) : children}</>;
}
