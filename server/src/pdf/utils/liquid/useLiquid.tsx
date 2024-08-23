import { LiquidError } from "liquidjs";
import { useContext } from "react";
import { useIntl } from "react-intl";
import { isNullish } from "remeda";
import { LiquidContext } from "./LiquidContext";
import { LiquidScopeContext } from "./LiquidScopeProvider";

export function useLiquid(text: string) {
  const intl = useIntl();
  const scope = useContext(LiquidScopeContext);
  if (isNullish(scope)) {
    throw new Error("useLiquid must be used within a <LiquidScopeProvider/>");
  }
  const liquid = useContext(LiquidContext)!;
  if (text.includes("{{") || text.includes("{%")) {
    try {
      return liquid.parseAndRenderSync(text, scope, { globals: { intl } });
    } catch (e) {
      if (e instanceof LiquidError) {
        // eslint-disable-next-line no-console
        console.log(`Liquid error: ${e.message}`);
      }
      return "";
    }
  } else {
    return text;
  }
}

export function useLiquidRender() {
  const intl = useIntl();
  const scope = useContext(LiquidScopeContext);
  const liquid = useContext(LiquidContext)!;
  return (text: string) => {
    if (text.includes("{{") || text.includes("{%")) {
      try {
        return liquid.parseAndRenderSync(text, scope!, { globals: { intl } });
      } catch {
        return "";
      }
    } else {
      return text;
    }
  };
}
