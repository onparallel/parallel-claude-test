import { FormattedMessage } from "react-intl";

function quotientAndRemainder(divident: number, divisor: number) {
  return [Math.floor(divident / divisor), divident % divisor];
}

export function TimeSpan({ seconds }: { seconds: number }) {
  const [days, rem0] = quotientAndRemainder(seconds, 24 * 60 * 60);
  const [hours, rem1] = quotientAndRemainder(rem0, 60 * 60);
  const [minutes, _] = quotientAndRemainder(rem1, 60);
  return (
    <FormattedMessage
      id="component.timespan.value"
      defaultMessage="{days, plural, =0 {} =1 {# day } other {# days }} {hours}h {minutes}'"
      values={{ days, hours, minutes }}
    />
  );
}
