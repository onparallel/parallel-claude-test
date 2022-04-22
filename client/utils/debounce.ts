import { isDefined } from "remeda";

export function debounce<T extends (...args: any[]) => void>(callback: T, ms?: number) {
  let timerId: ReturnType<typeof setTimeout> | null = null;
  return ((...args) => {
    if (isDefined(timerId)) {
      clearTimeout(timerId);
    }
    timerId = setTimeout(() => {
      timerId = null;
      callback(...args);
    }, ms);
  }) as T;
}
