import { KeyboardEvent } from "react";

export function isMetaReturn(event: KeyboardEvent) {
  return event.key === "Enter" && (event.metaKey || event.ctrlKey);
}
