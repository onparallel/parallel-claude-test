import { IntlListFormatOptions } from "@formatjs/intl-listformat";
import { ReactNode } from "react";
import { FormattedList, FormattedMessage } from "react-intl";

export interface EnumerateListProps<TValue> extends IntlListFormatOptions {
  values: TValue[];
  maxItems: number;
  renderItem: (props: { value: TValue }, index: number) => ReactNode;
  renderOther?: (props: { children: ReactNode; remaining: TValue[] }) => ReactNode;
}

/**
 * Renders a list of elements.
 *
 * @param values - The array of raw values
 * @param maxItems - Max elements showed before `renderOther`
 * @param renderItem - Used to render the showed values
 * @param renderOther - Used to render the remaining values
 * @returns The `FormattedList`
 *
 * @example
 * ```
 * <EnumerateList
 *  maxItems={1}
 *  values={contacts}
 *  renderItem={({ value }) => <Contact value={value} />}
 *  renderOther={({ children, remaining }) => <Popover>{children}</Popover>}
 *  type="conjunction"
 * />;
 * ```
 */
export function EnumerateList<TValue>({
  values,
  maxItems,
  renderItem,
  renderOther = ({ children }) => children,
  ...options
}: EnumerateListProps<TValue>) {
  const sample = values.slice(0, maxItems);
  const value = sample.map((value, index) => renderItem({ value }, index));
  if (values.length > maxItems) {
    value.push(
      renderOther({
        remaining: values.slice(maxItems),
        children: (
          <FormattedMessage
            id="generic.n-more"
            defaultMessage="{count} more"
            values={{ count: values.length - maxItems }}
          />
        ),
      })
    );
  }
  return <FormattedList value={value} {...options} />;
}
