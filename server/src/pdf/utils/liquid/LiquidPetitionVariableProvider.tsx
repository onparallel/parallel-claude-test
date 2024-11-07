import { PropsWithChildren, useContext, useMemo } from "react";
import { isNullish } from "remeda";
import { FieldLogicResult } from "../../../util/fieldLogic";
import { LiquidScopeContext } from "./LiquidScopeProvider";
import { buildPetitionVariablesLiquidScope } from "./liquidScope";

export function LiquidPetitionVariableProvider({
  logic,
  children,
}: PropsWithChildren<{
  logic: FieldLogicResult;
}>) {
  const parent = useContext(LiquidScopeContext);
  if (isNullish(parent)) {
    throw new Error(
      "<LiquidPetitionVariableProvider/> must be used within a <LiquidScopeProvider/>",
    );
  }
  const scope = useMemo(() => {
    const petitionVariablesScope = buildPetitionVariablesLiquidScope(logic);
    return Object.assign({}, parent, petitionVariablesScope);
  }, [parent, logic]);
  return <LiquidScopeContext.Provider value={scope}>{children}</LiquidScopeContext.Provider>;
}
