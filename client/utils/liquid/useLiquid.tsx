import { LiquidError } from "liquidjs";
import { useContext, useMemo } from "react";
import { useIntl } from "react-intl";
import { LiquidContext } from "./LiquidContext";
import { useLiquidScope } from "./LiquidScopeProvider";

export function useLiquid(text: string) {
  const intl = useIntl();
  const liquid = useContext(LiquidContext)!;
  const scope = useLiquidScope();
  return useMemo(() => {
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
  }, [text, scope]);
}
