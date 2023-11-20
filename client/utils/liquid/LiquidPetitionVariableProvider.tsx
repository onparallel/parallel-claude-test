import { PropsWithChildren, useContext, useMemo } from "react";
import { isDefined } from "remeda";
import { FieldLogic } from "../fieldLogic/useFieldLogic";
import { LiquidScopeContext } from "./LiquidScopeProvider";

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
            {
              after: logic.currentVariables[key],
              before: logic.previousVariables[key],
              toString() {
                return logic.finalVariables[key];
              },
            },
          ]),
        ),
      ),
    [parent, logic],
  );
  return <LiquidScopeContext.Provider value={scope}>{children}</LiquidScopeContext.Provider>;
}
