import { MjmlButton, MjmlButtonProps } from "mjml-react";
import React, { ReactNode } from "react";
export type ButtonType = "primary";

export type ButtonProps = {
  type?: ButtonType;
  href: string;
  children: ReactNode;
};

export function Button({ type = "primary", href, children }: ButtonProps) {
  return (
    <MjmlButton mj-class={`button-${type}`} href={href}>
      {children}
    </MjmlButton>
  );
}
