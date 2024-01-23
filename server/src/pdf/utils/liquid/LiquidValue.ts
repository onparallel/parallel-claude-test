import { IntlShape } from "react-intl";
import { FORMATS, prettifyTimezone } from "../../../util/dates";

const INTL = Symbol("intl");

abstract class LiquidValue<T> {
  [intl: symbol]: IntlShape;
  constructor(
    intl: IntlShape,
    public readonly content: T,
  ) {
    this[INTL] = intl;
  }

  abstract toString(): string;
}

export class DateTimeLiquidValue extends LiquidValue<{
  datetime: string;
  timezone: string;
  value: string;
}> {
  toString() {
    return `${this[INTL].formatDate(new Date(this.content.value), {
      timeZone: this.content.timezone,
      ...FORMATS["LLL"],
    })} (${prettifyTimezone(this.content.timezone)})`;
  }
}

export class DateLiquidValue extends LiquidValue<{ value: string }> {
  toString() {
    return this[INTL].formatDate(new Date(this.content.value), {
      timeZone: "UTC",
      ...FORMATS["LL"],
    });
  }
}
