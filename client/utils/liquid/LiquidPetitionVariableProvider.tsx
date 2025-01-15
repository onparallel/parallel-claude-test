import { Drop } from "liquidjs";
import { PropsWithChildren, useMemo } from "react";
import { FieldLogic } from "../fieldLogic/types";
import { LiquidScopeProvider } from "./LiquidScopeProvider";

class PetitionVariableDrop extends Drop {
  constructor(
    public final: number,
    public after: number,
    public before: number,
  ) {
    super();
  }

  public override valueOf() {
    return this.final;
  }
}

export function LiquidPetitionVariableProvider({
  logic,
  children,
}: PropsWithChildren<{
  logic: FieldLogic;
}>) {
  const scope = useMemo(
    () =>
      Object.fromEntries(
        Object.keys(logic.finalVariables).map((key) => [
          key,
          new PetitionVariableDrop(
            logic.finalVariables[key],
            logic.currentVariables[key],
            logic.previousVariables[key],
          ),
        ]),
      ),
    [logic],
  );
  return <LiquidScopeProvider scope={scope}>{children}</LiquidScopeProvider>;
}
