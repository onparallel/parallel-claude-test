import { Key, useCallback, useState } from "react";

export function useRerender(): [key: Key, rerender: () => void] {
  const [key, setKey] = useState(0);
  return [key, useCallback(() => setKey((c) => c + 1), [])] as const;
}
