import { PropsWithChildren, useContext, useMemo } from "react";
import { isDefined } from "remeda";
import { FieldLogic } from "../fieldLogic/useFieldLogic";
import { LiquidScopeContext } from "./LiquidScopeProvider";
import { Drop } from "liquidjs";

export function LiquidPetitionVariableProvider({
  logic,
  children,
}: PropsWithChildren<{
  logic: FieldLogic;
}>) {
  const parent = useContext(LiquidScopeContext);
  if (!isDefined(parent)) {
    throw new Error(
      "<LiquidPetitionVariableProvider/> must be used within a <LiquidScopeProvider/>",
    );
  }
  const scope = useMemo(
    () =>
      Object.assign(
        {},
        parent,
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
      ),
    [parent, logic],
  );
  return <LiquidScopeContext.Provider value={scope}>{children}</LiquidScopeContext.Provider>;
}

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
