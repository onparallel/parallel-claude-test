import { Drop } from "liquidjs";
import { PropsWithChildren } from "react";
import { FieldLogicResult } from "../../../util/fieldLogic";
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

export function buildPetitionVariablesLiquidScope(logic: FieldLogicResult) {
  return Object.fromEntries(
    Object.keys(logic.finalVariables).map((key) => [
      key,
      new PetitionVariableDrop(
        logic.finalVariables[key],
        logic.currentVariables[key],
        logic.previousVariables[key],
      ),
    ]),
  );
}

export function LiquidPetitionVariableProvider({
  logic,
  children,
}: PropsWithChildren<{
  logic: FieldLogicResult;
}>) {
  return (
    <LiquidScopeProvider scope={buildPetitionVariablesLiquidScope(logic)}>
      {children}
    </LiquidScopeProvider>
  );
}
