import { OrgPreferedTone } from "@parallel/graphql/__types";
import { createContext, ReactNode, useContext } from "react";

type ToneProviderProps = {
  value?: OrgPreferedTone;
  children: ReactNode;
};

const ToneStateContext = createContext<OrgPreferedTone | undefined>(undefined);

function ToneProvider({ value = "FORMAL", children }: ToneProviderProps) {
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
