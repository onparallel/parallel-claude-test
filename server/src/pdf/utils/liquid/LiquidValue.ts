import { IntlShape } from "react-intl";
import { FORMATS, prettifyTimezone } from "../../../util/dates";

abstract class LiquidValue<T> {
  constructor(
    protected intl: IntlShape,
    public readonly content: T,
  ) {}

  abstract toString(): string;
}

export class DateTimeLiquidValue extends LiquidValue<{
  datetime: string;
  timezone: string;
  value: string;
}> {
  toString() {
    return `${this.intl.formatDate(new Date(this.content.value), {
      timeZone: this.content.timezone,
      ...FORMATS["LLL"],
    })} (${prettifyTimezone(this.content.timezone)})`;
  }
}

export class DateLiquidValue extends LiquidValue<{ value: string }> {
  toString() {
    return this.intl.formatDate(new Date(this.content.value), {
      timeZone: "UTC",
      ...FORMATS["LL"],
    });
  }
}
