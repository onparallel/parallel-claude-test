import { MjmlButton, MjmlButtonProps } from "mjml-react";
import { ReactNode } from "react";
export type ButtonType = "primary";

export interface ButtonProps extends MjmlButtonProps {
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
