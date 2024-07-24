import { useCallback, useRef, useState } from "react";
import { isDefined } from "remeda";
import { centeredPopup, openNewWindow } from "./openNewWindow";
import { useInterval } from "./useInterval";
import { useWindowEvent } from "./useWindowEvent";

type PromiseArgs = Parameters<ConstructorParameters<typeof Promise<void>>[0]>;

export function useDocusignConsentPopup() {
  const windowRef = useRef<Window>();
  const [isRunning, setIsRunning] = useState(false);
  const promiseArgsRef = useRef<PromiseArgs>();

  useInterval(
    () => {
      if (windowRef.current?.closed) {
        setIsRunning(false);
        promiseArgsRef.current?.[1]("CLOSED");
      }
    },
    { delay: 500, isRunning },
  );

  useWindowEvent(
    "message",
    (m) => {
      const window = windowRef.current;
      if (isDefined(window) && m.source === windowRef.current) {
        if (isDefined(m.data.success)) {
          if (m.data.success === true) {
            setIsRunning(false);
            promiseArgsRef.current?.[0]();
          }
          window.close();
        }
      }
    },
    { isListening: isRunning },
    [],
  );

  return useCallback(
    async (params?: {
      id?: string;
      isDefault: boolean;
      name: string;
      environment: "sandbox" | "production";
    }) => {
      setIsRunning(true);
      try {
        windowRef.current = await openNewWindow(
          () =>
            `/api/oauth/docusign/authorize?${new URLSearchParams(
              params
                ? {
                    ...params,
                    isDefault: params.isDefault.toString(),
                  }
                : {},
            )}`,
          centeredPopup({ width: 500, height: 600 }),
        );
      } catch {}
      return new Promise<void>((...params) => {
        promiseArgsRef.current = params;
      });
    },
    [],
  );
}
