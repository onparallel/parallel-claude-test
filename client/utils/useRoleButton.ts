import { MouseEvent, KeyboardEvent, useCallback, DependencyList, MouseEventHandler } from "react";

/**
 * Returns the necessary properties and callbacks to ensure propper a11y when
 * using the role="button" attribute on a non button element.
 */
export function useRoleButton(
  onPressed: (event: MouseEvent | KeyboardEvent) => void,
  deps: DependencyList
) {
  const callback = useCallback(onPressed, deps);
  return {
    role: "button",
    tabIndex: 0,
    onClick: callback as MouseEventHandler,
    onKeyDown: useCallback(
      (event: KeyboardEvent) => {
        if (event.key === "Enter" || event.key === " ") {
          onPressed(event);
          event.preventDefault();
        }
      },
      [callback]
    ),
  };
}
