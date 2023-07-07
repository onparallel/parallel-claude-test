import { ComponentType } from "react";

export function withProps<P extends {}, T extends Partial<P>>(
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Component: ComponentType<P>,
  props: T | (() => T),
): ComponentType<Omit<P, keyof T>> {
  return function (rest: Omit<P, keyof T>) {
    const p = typeof props === "function" ? props() : props;
    return <Component {...({ ...rest, ...p } as unknown as P)} />;
  };
}
