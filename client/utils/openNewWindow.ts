import { MaybePromise } from "./types";

/**
 * Opens a new window with the passed value.
 * Use this method when you want to open a window from the result of an async
 * computation (e.g. the url is returned by an ajax call), otherwise the
 * browser will block it.
 */
export async function openNewWindow(
  value: MaybePromise<string> | (() => MaybePromise<string>)
) {
  const _window = window.open(undefined, "_blank")!;
  try {
    const url = typeof value === "function" ? await value() : await value;
    _window.location.href = url!;
  } catch {
    _window?.close();
  }
}
