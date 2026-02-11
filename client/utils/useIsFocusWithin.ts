import { RefObject, useEffect, useState } from "react";

export function useIsFocusWithin(ref: RefObject<HTMLElement | null>) {
  const [isFocusWithin, setIsFocusWithin] = useState(false);
  useEffect(() => {
    function handleFocusIn() {
      setIsFocusWithin(true);
    }
    function handleFocusOut() {
      setIsFocusWithin(false);
    }
    ref.current?.addEventListener("focusin", handleFocusIn);
    ref.current?.addEventListener("focusout", handleFocusOut);
    return () => {
      ref.current?.removeEventListener("focusin", handleFocusIn);
      ref.current?.removeEventListener("focusout", handleFocusOut);
    };
  }, [ref.current]);
  return isFocusWithin;
}
