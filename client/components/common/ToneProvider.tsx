import { Tone } from "@parallel/graphql/__types";
import { createContext, ReactNode, useContext } from "react";

interface ToneProviderProps {
  value: Tone;
  children: ReactNode;
}

const ToneContext = createContext<Tone | undefined>(undefined);

export function ToneProvider({ value, children }: ToneProviderProps) {
  return <ToneContext.Provider value={value}>{children}</ToneContext.Provider>;
}

export function useTone() {
  const context = useContext(ToneContext);
  if (context === undefined) {
    throw new Error("useTone must be used within a ToneProvider");
  }
  return context;
}
