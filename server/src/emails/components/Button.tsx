import { MjmlButton, IMjmlButtonProps } from "@faire/mjml-react";
import { ReactNode } from "react";
export type ButtonType = "primary";

export interface ButtonProps extends IMjmlButtonProps {
  type?: ButtonType;
  href: string;
  children: ReactNode;
}

export function Button({ type = "primary", href, children, ...props }: ButtonProps) {
  return (
    <MjmlButton mj-class={`button-${type}`} href={href} {...props}>
      {children}
    </MjmlButton>
  );
}
