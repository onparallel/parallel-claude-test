import { useState } from "react";
import { useWindowEvent } from "./useWindowEvent";

export function useIsGlobalKeyDown(key: string) {
  const [isKeyDown, setIsKeyDown] = useState(false);
  useWindowEvent(
    "keydown",
    function handleKeyDown(e) {
      if (e.key === key) {
        setIsKeyDown(true);
      }
    },
    [],
  );
  useWindowEvent(
    "keyup",
    function handleKeyUp(e) {
      if (e.key === key) {
        setIsKeyDown(false);
      }
    },
    [],
  );
  useWindowEvent(
    "blur",
    function handleBlur() {
      setIsKeyDown(false);
    },
    [],
  );
  return isKeyDown;
}
