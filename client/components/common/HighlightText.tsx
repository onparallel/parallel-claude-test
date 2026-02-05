import { chakraForwardRef } from "@parallel/chakra/utils";
import escapeStringRegexp from "escape-string-regexp";
import { Fragment } from "react";
import { isNullish } from "remeda";
import { Text } from "@parallel/components/ui";

export interface HighlightTextProps {
  children?: string;
  search?: string;
}

export const HighlightText = chakraForwardRef<"p", HighlightTextProps>(function HighlightText(
  { children, search, ...props },
  ref,
) {
  if (search === "" || isNullish(search) || isNullish(children)) {
    return (
      <Text ref={ref} {...props}>
        {children}
      </Text>
    );
  }
  const _search = search.toLowerCase();
  const regex = new RegExp(`(${escapeStringRegexp(_search)})`, "gi");
  return (
    <Text ref={ref} {...props}>
      {children.split(regex).map((value, i) => {
        if (value.toLowerCase() === _search) {
          return (
            <Text key={i} as="span" sx={{ WebkitTextStrokeWidth: "0.04em" }}>
              {value}
            </Text>
          );
        } else {
          return <Fragment key={i}>{value}</Fragment>;
        }
      })}
    </Text>
  );
});
