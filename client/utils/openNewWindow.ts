import { MaybePromise } from "./types";

interface WindowFeatures {
  popup: boolean;
  width: number;
  height: number;
  top: number;
  left: number;
}

/**
 * Opens a new window with the passed value.
 * Use this method when you want to open a window from the result of an async
 * computation (e.g. the url is returned by an ajax call), otherwise the
 * browser will block it.
 */
export async function openNewWindow(
  value: MaybePromise<string> | (() => MaybePromise<string>),
  features?: Partial<WindowFeatures>,
) {
  const windowFeatures =
    features &&
    Object.entries(features)
      .map(([name, value]) => {
        if (typeof value === "boolean") {
          return `${name}=${value ? "yes" : "no"}`;
        } else {
          return `${name}=${value}`;
        }
      })
      .join(",");
  const _window = window.open(undefined, "_blank", windowFeatures);
  try {
    if (!_window) {
      throw new Error("WINDOW_BLOCKED");
    }
    const url = typeof value === "function" ? await value() : await value;
    _window.location.href = url!;
    return _window;
  } catch (e) {
    _window?.close();
    throw e;
  }
}

export function isWindowBlockedError(e: unknown): boolean {
  return e instanceof Error && e.message === "WINDOW_BLOCKED";
}

export function centeredPopup({
  width,
  height,
}: Pick<WindowFeatures, "width" | "height">): Partial<WindowFeatures> {
  return {
    popup: true,
    width,
    height,
    top: (window.screenTop + window.outerHeight - height) / 2,
    left: (window.screenLeft + window.outerWidth - height) / 2,
  };
}
