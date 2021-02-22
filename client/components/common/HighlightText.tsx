import { Text } from "@chakra-ui/react";
import escapeStringRegexp from "escape-string-regexp";
import { Fragment } from "react";

export interface HighlightTextProps {
  text: string;
  search: string;
}

export function HighlightText({ text, search }: HighlightTextProps) {
  if (search === "") {
    return <>{text}</>;
  }
  const _search = search.toLowerCase();
  const regex = new RegExp(`(${escapeStringRegexp(_search)})`, "gi");
  return (
    <>
      {text.split(regex).map((value, i) => {
        if (value.toLowerCase() === _search) {
          return (
            <Text
              key={i}
              as="span"
              sx={{ "-webkit-text-stroke-width": "0.04em" }}
            >
              {value}
            </Text>
          );
        } else {
          return <Fragment key={i}>{value}</Fragment>;
        }
      })}
    </>
  );
}
