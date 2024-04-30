import { useCallback, useState } from "react";

export function useRerender() {
  const [key, setKey] = useState(0);
  return [key, useCallback(() => setKey((c) => c + 1), [])] as const;
}
