import { BaseSyntheticEvent } from "react";

export function getPreventDefaultHandler<T extends (...args: any) => any>(
  handler: T,
  ...args: Parameters<T>
): (event: BaseSyntheticEvent) => ReturnType<T> {
  return (event: BaseSyntheticEvent) => {
    event.preventDefault();
    return handler(...args);
  };
}
