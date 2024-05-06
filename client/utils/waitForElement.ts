import { isDefined } from "remeda";

export function waitForElement<E extends Element = Element>(selector: string): Promise<E> {
  return new Promise<any>((resolve) => {
    const element = document.querySelector(selector);
    if (isDefined(element)) {
      return resolve(element);
    }

    const observer = new MutationObserver(() => {
      const element = document.querySelector(selector);
      if (isDefined(element)) {
        observer.disconnect();
        return resolve(element);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  });
}
