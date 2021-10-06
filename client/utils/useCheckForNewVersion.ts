import { assignRef } from "@chakra-ui/hooks";
import { useRef, useState } from "react";
import { isDefined } from "remeda";
import { useInterval } from "./useInterval";

export function useCheckForNewVersion() {
  const [hasNewVersion, setHasNewVersion] = useState(false);
  const currentVersionRef = useRef<string>();
  useInterval(
    async () => {
      try {
        const res = await fetch("/status");
        const version = await res.text();
        if (isDefined(currentVersionRef.current) && currentVersionRef.current !== version) {
          setHasNewVersion(true);
        }
        assignRef(currentVersionRef, version);
      } catch {}
    },
    60 * 1000,
    []
  );
  return hasNewVersion;
}
