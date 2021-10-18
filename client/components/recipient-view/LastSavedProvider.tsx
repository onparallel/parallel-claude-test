import { createContext, ReactNode, useContext, useMemo, useState } from "react";

interface LastSavedProviderProps {
  children: ReactNode;
}

interface LastSavedContextValue {
  lastSaved: Date | null;
  updateLastSaved: () => void;
}

const LastSavedContext = createContext<LastSavedContextValue | undefined>(undefined);

export function LastSavedProvider({ children }: LastSavedProviderProps) {
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const value = useMemo<LastSavedContextValue>(
    () => ({
      lastSaved,
      updateLastSaved: () => setLastSaved(new Date()),
    }),
    [lastSaved]
  );

  return <LastSavedContext.Provider value={value}>{children}</LastSavedContext.Provider>;
}

export function useLastSaved() {
  const context = useContext(LastSavedContext);
  if (context === undefined) {
    throw new Error("useLastSaved must be used within a LastSavedProvider");
  }
  return context;
}
