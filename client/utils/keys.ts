import { KeyboardEvent } from "react";

export type EventKey =
  | "ArrowDown"
  | "ArrowUp"
  | "ArrowLeft"
  | "ArrowRight"
  | "Enter"
  | "Space"
  | "Tab"
  | "Backspace"
  | "Control"
  | "Meta"
  | "Home"
  | "End"
  | "PageDown"
  | "PageUp"
  | "Delete"
  | "Escape"
  | "Shift";

export function normalizeEventKey(event: Pick<KeyboardEvent, "key" | "keyCode">): EventKey {
  const { key, keyCode } = event;
  if (key === " ") {
    return "Space";
  }

  // Internet Explorer, Edge (16 and earlier), and Firefox (36 and earlier) use  "Left", "Right",
  // "Up", and "Down" instead of "ArrowLeft", "ArrowRight", "ArrowUp", and "ArrowDown".
  if (keyCode >= 37 && keyCode <= 40 && key.indexOf("Arrow") !== 0) {
    return `Arrow${key}` as EventKey;
  }

  return key as EventKey;
}

export function isMetaReturn(event: KeyboardEvent) {
  return event.key === "Enter" && (event.metaKey || event.ctrlKey);
}
