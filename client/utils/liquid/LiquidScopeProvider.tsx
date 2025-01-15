import { createContext, PropsWithChildren, useContext, useMemo } from "react";

const LiquidScopeContext = createContext<Record<string, any>[]>([]);

export function LiquidScopeProvider({
  scope,
  children,
}: PropsWithChildren<{ scope: Record<string, any> }>) {
  const parentScopes = useContext(LiquidScopeContext);
  const newScopes = useMemo(() => [...parentScopes, scope], [...parentScopes, scope]);
  return <LiquidScopeContext.Provider value={newScopes}>{children}</LiquidScopeContext.Provider>;
}

export function useLiquidScope() {
  const scopes = useContext(LiquidScopeContext);
  if (scopes.length === 0) {
    console.warn("useLiquidScope used without LiquidScopeProvider");
  }
  return useMemo(() => Object.assign({}, ...scopes), [...scopes]);
}
