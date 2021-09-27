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
  | " "
  | "Shift";

export function normalizeEventKey(event: Pick<KeyboardEvent, "key" | "keyCode">) {
  const { key, keyCode } = event;

  const isArrowKey = keyCode >= 37 && keyCode <= 40 && key.indexOf("Arrow") !== 0;

  const eventKey = isArrowKey ? `Arrow${key}` : key;

  return eventKey as EventKey;
}
