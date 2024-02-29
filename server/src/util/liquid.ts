import { Liquid } from "liquidjs";
import { IntlShape } from "react-intl";
import { isDefined } from "remeda";
import { DateLiquidValue, DateTimeLiquidValue } from "../pdf/utils/liquid/LiquidValue";
import { FORMATS, prettifyTimezone } from "./dates";
import { startOfToday, format as formatDate } from "date-fns";

export function createLiquid() {
  const engine = new Liquid({ cache: true });

  engine.registerFilter("number", function (value: any, digits?: number) {
    if (typeof value === "string") {
      value = parseFloat(value);
    } else if (typeof value === "object" && "valueOf" in value) {
      value = parseFloat(value.valueOf());
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
    } else if (typeof value === "object" && "valueOf" in value) {
      value = parseFloat(value.valueOf());
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
    } else if (typeof value === "object" && "valueOf" in value) {
      value = parseFloat(value.valueOf());
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
      if (!isDefined(format) || !["LL", "L", "ISO"].includes(format)) {
        format = "LL";
      }
      let _value: string | number | Date | undefined;
      if (value instanceof DateLiquidValue) {
        _value = value.content.value;
      } else if (value === "now" || value === "today") {
        _value = formatDate(startOfToday(), "yyyy-MM-dd");
      } else {
        _value = value;
      }
      if (format === "ISO") {
        return formatDate(new Date(_value), "yyyy-MM-dd");
      }
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
      let _value: string | number | Date | undefined;
      if (value instanceof DateTimeLiquidValue) {
        _value = value.content.value;
      } else if (value === "now") {
        _value = Date.now();
      } else {
        _value = value;
      }
      const timezone = value instanceof DateTimeLiquidValue ? value.content.timezone : "UTC";
      const intl = (this.context.globals as any)["intl"] as IntlShape;

      return `${intl.formatDate(_value, {
        timeZone: timezone,
        ...FORMATS[format as keyof typeof FORMATS],
      })} (${prettifyTimezone(timezone)})`;
    },
  );

  engine.registerFilter("append_obj", function (value: any[], ...args: any[]) {
    const obj: any = {};
    for (let i = 0; i < args.length; i += 2) {
      const key = args[i];
      const value = args[i + 1];
      obj[key] = value;
    }
    return [...value, obj];
  });

  for (const filter of ["escape", "escape_once", "url_decode", "newline_to_br", "strip_html"]) {
    engine.registerFilter(filter, function () {
      throw new Error(`filter "${filter}" disabled`);
    });
  }

  for (const tag of [
    "capture",
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
