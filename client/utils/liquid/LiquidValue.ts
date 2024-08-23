import { Drop } from "liquidjs";
import { IntlShape } from "react-intl";
import { FORMATS, prettifyTimezone } from "../dates";

const INTL = Symbol("intl");

abstract class LiquidValue<T> extends Drop {
  [intl: symbol]: IntlShape;
  constructor(
    intl: IntlShape,
    public readonly content: T,
  ) {
    super();
    this[INTL] = intl;
  }

  abstract override valueOf(): string;
}

export class DateTimeLiquidValue extends LiquidValue<{
  datetime: string;
  timezone: string;
  value: string;
}> {
  valueOf() {
    return `${this[INTL].formatDate(new Date(this.content.value), {
      timeZone: this.content.timezone,
      ...FORMATS["LLL"],
    })} (${prettifyTimezone(this.content.timezone)})`;
  }
}

export class DateLiquidValue extends LiquidValue<{ value: string }> {
  valueOf() {
    return this[INTL].formatDate(new Date(this.content.value), {
      timeZone: "UTC",
      ...FORMATS["LL"],
    });
  }
}

export class WithLabelLiquidValue extends LiquidValue<{ value: string }> {
  constructor(
    intl: IntlShape,
    content: { value: string },
    public label: string,
  ) {
    super(intl, content);
  }
  override valueOf(): string {
    return this.content.value;
  }
}
