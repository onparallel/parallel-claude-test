import { KeyboardEvent, KeyboardEventHandler, MouseEventHandler, useCallback } from "react";
import { normalizeEventKey } from "./keys";

/**
 * Returns the necessary properties and callbacks to ensure propper a11y when
 * using the role="button" attribute on a non button element.
 */
export function useRoleButton(onPressed?: MouseEventHandler<any> | KeyboardEventHandler<any>) {
  return {
    role: "button",
    tabIndex: 0,
    onClick: onPressed as MouseEventHandler,
    onKeyDown: useCallback(
      (event: KeyboardEvent) => {
        const key = normalizeEventKey(event);
        if (key === "Enter" || key === "Space") {
          onPressed?.(event as any);
          event.preventDefault();
        }
      },
      [onPressed]
    ),
  };
}
