import { chakra, Flex, Text, ThemingProps } from "@chakra-ui/react";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { Maybe } from "@parallel/graphql/__types";
import useMergedRef from "@react-hook/merged-ref";
import { useEffect, useRef, useState } from "react";

export interface FileNameProps extends ThemingProps<"Text"> {
  value: Maybe<string>;
}

export const FileName = chakraForwardRef<"span", FileNameProps>(function FileName(
  { value, ...props },
  ref,
) {
  const [isTruncated, setIsTruncated] = useState(false);
  const innerRef = useRef<HTMLSpanElement>(null);
  const mergedRef = useMergedRef(ref, innerRef);
  useEffect(() => {
    if (innerRef.current!.scrollWidth > innerRef.current!.offsetWidth) {
      setIsTruncated(true);
    }
  }, []);
  if (!isTruncated) {
    return (
      <Text
        ref={mergedRef as any}
        whiteSpace="nowrap"
        overflow="hidden"
        textOverflow="ellipsis"
        as="span"
        {...props}
      >
        <Text as="span">{value}</Text>
      </Text>
    );
  } else {
    return (
      <Flex
        display="inline-flex"
        ref={mergedRef as any}
        as="span"
        minWidth={0}
        title={isTruncated && value ? value : undefined}
        {...props}
      >
        <chakra.span whiteSpace="nowrap" overflow="hidden" textOverflow="ellipsis">
          {value?.slice(0, -10)}
        </chakra.span>
        <chakra.span flexShrink={0} position="relative" insetStart="-0.2rem">
          {value?.slice(-10)}
        </chakra.span>
      </Flex>
    );
  }
});
