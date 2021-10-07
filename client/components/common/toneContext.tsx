import { createContext, ReactNode, useContext } from "react";

type ToneProviderProps = { children: ReactNode };
type ToneType = "formal" | "informal";

const ToneStateContext = createContext<{ tone: ToneType } | undefined>(undefined);

function ToneProvider({ children }: ToneProviderProps) {
  const value = { tone: "informal" as ToneType };
  return <ToneStateContext.Provider value={value}>{children}</ToneStateContext.Provider>;
}

function useTone() {
  const context = useContext(ToneStateContext);
  if (context === undefined) {
    throw new Error("useTone must be used within a ToneProvider");
  }
  return context;
}

export { ToneProvider, useTone };
