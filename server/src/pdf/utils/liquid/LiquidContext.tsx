import { Liquid } from "liquidjs";
import { createContext, PropsWithChildren } from "react";
import { IntlShape } from "react-intl";
import { isDefined } from "remeda";
import { DateLiquidValue, DateTimeLiquidValue } from "./LiquidValue";
import { FORMATS, prettifyTimezone } from "../../../util/dates";

function useCreateLiquid() {
  const engine = new Liquid({ cache: true });

  engine.registerFilter("number", function (value: any, digits?: number) {
    if (typeof value === "string") {
      value = parseFloat(value);
    } else if (typeof value === "object" && "toString" in value) {
      value = parseFloat(value.toString());
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

  engine.registerFilter("currency", function (value: any, currency: string) {
    if (typeof value === "string") {
      value = parseFloat(value);
    } else if (typeof value === "object" && "toString" in value) {
      value = parseFloat(value.toString());
    }
    if (typeof value !== "number") {
      return undefined;
    }
    const intl = (this.context.globals as any)["intl"] as IntlShape;
    return intl.formatNumber(value, { style: "currency", currency });
  });

  engine.registerFilter("percent", function (value: any, digits?: number) {
    if (typeof value === "string") {
      value = parseFloat(value);
    } else if (typeof value === "object" && "toString" in value) {
      value = parseFloat(value.toString());
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
      const _value = value instanceof DateLiquidValue ? value.content.value : value;
      const intl = (this.context.globals as any)["intl"] as IntlShape;
      return intl.formatDate(_value, {
        timeZone: "UTC",
        ...FORMATS[format as keyof typeof FORMATS],
      });
    },
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
      const _value = value instanceof DateTimeLiquidValue ? value.content.value : value;
      const timezone = value instanceof DateTimeLiquidValue ? value.content.timezone : "UTC";
      const intl = (this.context.globals as any)["intl"] as IntlShape;

      return `${intl.formatDate(_value, {
        timeZone: timezone,
        ...FORMATS[format as keyof typeof FORMATS],
      })} (${prettifyTimezone(timezone)})`;
    },
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
}
export const LiquidContext = createContext<Liquid | null>(null);

export function LiquidProvider({ children }: PropsWithChildren<{}>) {
  const liquid = useCreateLiquid();
  return <LiquidContext.Provider value={liquid}>{children}</LiquidContext.Provider>;
}
