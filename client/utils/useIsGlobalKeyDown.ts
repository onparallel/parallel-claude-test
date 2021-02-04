import { useEffect, useState } from "react";

export function useIsGlobalKeyDown(key: string) {
  const [isKeyDown, setIsKeyDown] = useState(false);
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === key) {
        setIsKeyDown(true);
      }
    }
    function handleKeyUp(e: KeyboardEvent) {
      if (e.key === key) {
        setIsKeyDown(false);
      }
    }
    function handleBlur() {
      setIsKeyDown(false);
    }
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("blur", handleBlur);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", handleBlur);
    };
  }, []);
  return isKeyDown;
}
