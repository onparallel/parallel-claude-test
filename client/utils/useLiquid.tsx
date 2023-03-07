import { Liquid } from "liquidjs";
import { createContext, PropsWithChildren, useContext } from "react";
import { IntlShape, useIntl } from "react-intl";
import { isDefined } from "remeda";
import { FORMATS, prettifyTimezone } from "./dates";
import { useConstant } from "./useConstant";
import { DateLiquidValue, DateTimeLiquidValue } from "./useLiquidScope";

function useCreateLiquid() {
  return useConstant(() => {
    const engine = new Liquid({ cache: true });

    engine.registerFilter("number", function (value: number | string, digits?: number) {
      if (typeof value === "string") {
        value = parseFloat(value);
      }
      if (typeof value !== "number") {
        return undefined;
      }
      const intl = (this.context.globals as any)["intl"] as IntlShape;
      return intl.formatNumber(value, {
        maximumFractionDigits: digits,
        minimumFractionDigits: digits,
      });
    });

    engine.registerFilter("currency", function (value: number | string, currency: string) {
      if (typeof value === "string") {
        value = parseFloat(value);
      }
      if (typeof value !== "number") {
        return undefined;
      }
      const intl = (this.context.globals as any)["intl"] as IntlShape;
      return intl.formatNumber(value, { style: "currency", currency });
    });

    engine.registerFilter("percent", function (value: number | string, digits?: number) {
      if (typeof value === "string") {
        value = parseFloat(value);
      }
      if (typeof value !== "number") {
        return undefined;
      }
      const intl = (this.context.globals as any)["intl"] as IntlShape;
      return intl.formatNumber(value / 100, {
        style: "percent",
        maximumFractionDigits: digits,
        minimumFractionDigits: digits,
      });
    });

    engine.registerFilter(
      "date",
      function (value: string | number | Date | DateLiquidValue, format?: string) {
        if (value === undefined) {
          return "";
        }
        if (!isDefined(format) || !["LL", "L"].includes(format)) {
          format = "LL";
        }
        const _value = value instanceof DateLiquidValue ? value.value : value;
        const intl = (this.context.globals as any)["intl"] as IntlShape;
        return intl.formatDate(_value, {
          timeZone: "UTC",
          ...FORMATS[format as keyof typeof FORMATS],
        });
      }
    );

    engine.registerFilter(
      "datetime",
      function (value: string | number | Date | DateTimeLiquidValue, format?: string) {
        if (value === undefined) {
          return "";
        }
        if (!isDefined(format) || !["LLL", "L+LT", "L+LTS"].includes(format)) {
          format = "LLL";
        }
        const _value = value instanceof DateTimeLiquidValue ? value.value : value;
        const timezone = value instanceof DateTimeLiquidValue ? value.timezone : "UTC";
        const intl = (this.context.globals as any)["intl"] as IntlShape;

        return `${intl.formatDate(_value, {
          timeZone: timezone,
          ...FORMATS[format as keyof typeof FORMATS],
        })} (${prettifyTimezone(timezone)})`;
      }
    );

    for (const filter of ["escape", "escape_once", "url_decode", "newline_to_br", "strip_html"]) {
      engine.registerFilter(filter, function () {
        throw new Error(`filter "${filter}" disabled`);
      });
    }

    for (const tag of [
      "capture",
      "comment",
      "cycle",
      "decrement",
      "echo",
      "include",
      "increment",
      "layout",
      "render",
      "tablerow",
    ]) {
      engine.registerTag(tag, {
        parse: function (token) {
          throw new Error(`tag "${token.name}" disabled`);
        },
        render() {},
      });
    }
    return engine;
  });
}

const LiquidContext = createContext<Liquid | null>(null);

export function LiquidProvider({ children }: PropsWithChildren<{}>) {
  const liquid = useCreateLiquid();
  return <LiquidContext.Provider value={liquid}>{children}</LiquidContext.Provider>;
}

const LiquidScopeContext = createContext<any>({});

export function LiquidScopeProvider({ scope, children }: PropsWithChildren<{ scope: any }>) {
  return <LiquidScopeContext.Provider value={scope}>{children}</LiquidScopeContext.Provider>;
}

export function useLiquid(text: string) {
  const intl = useIntl();
  const scope = useContext(LiquidScopeContext);
  const liquid = useContext(LiquidContext)!;
  if (text.includes("{{") || text.includes("{%")) {
    try {
      return liquid.parseAndRenderSync(text, scope, { globals: { intl } });
    } catch {
      return "";
    }
  } else {
    return text;
  }
}
