import { Liquid } from "liquidjs";
import { createContext, PropsWithChildren } from "react";
import { createLiquid } from "../../../util/liquid";

export const LiquidContext = createContext<Liquid | null>(null);

export function LiquidProvider({ children }: PropsWithChildren<{}>) {
  const liquid = createLiquid();
  return <LiquidContext.Provider value={liquid}>{children}</LiquidContext.Provider>;
}
