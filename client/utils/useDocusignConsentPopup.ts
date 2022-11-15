import { useRef, useState } from "react";
import { isDefined } from "remeda";
import { centeredPopup, openNewWindow } from "./openNewWindow";
import { useInterval } from "./useInterval";
import { useWindowEvent } from "./useWindowEvent";

export function useDocusignConsentPopup() {
  const windowRef = useRef<Window>();
  const [isRunning, setIsRunning] = useState(false);
  const promiseArgsRef = useRef<Parameters<ConstructorParameters<typeof Promise<void>>[0]>>();
  useInterval(
    () => {
      if (windowRef.current?.closed) {
        setIsRunning(false);
        promiseArgsRef.current?.[1]("CLOSED");
      }
    },
    { delay: 2_000, isRunning }
  );

  useWindowEvent(
    "message",
    (m) => {
      const window = windowRef.current;
      if (isDefined(window) && m.source === windowRef.current) {
        if (m.data.success) {
          setIsRunning(false);
          promiseArgsRef.current?.[0]();
        }
      }
    },
    { isListening: isRunning },
    []
  );

  return async (params: { isDefault: boolean; name: string }) => {
    setIsRunning(true);
    windowRef.current = await openNewWindow(
      () =>
        `${process.env.NEXT_PUBLIC_PARALLEL_URL}/api/oauth/docusign/authorize?${new URLSearchParams(
          { isDefault: params.isDefault.toString(), name: params.name }
        )}`,
      centeredPopup({ width: 500, height: 600 })
    );
    return new Promise<void>((...params) => {
      promiseArgsRef.current = params;
    });
  };
}
