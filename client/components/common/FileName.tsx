import { chakra, Flex, Text, TextProps } from "@chakra-ui/react";
import { chakraForwardRef } from "@parallel/chakra/utils";
import useMergedRef from "@react-hook/merged-ref";
import { useEffect, useRef, useState } from "react";

export interface FileNameProps extends TextProps {
  value: string;
}

export const FileName = chakraForwardRef<"span", FileNameProps>(
  function FileName({ value, ...props }, ref) {
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
        <Text ref={mergedRef as any} isTruncated as="span" {...props}>
          {value}
        </Text>
      );
    } else {
      return (
        <Flex
          display="inline-flex"
          ref={mergedRef as any}
          as="span"
          minWidth={0}
          title={isTruncated ? value : undefined}
          {...props}
        >
          <chakra.span isTruncated>{value.slice(0, -10)}</chakra.span>
          <chakra.span flexShrink={0}>{value.slice(-10)}</chakra.span>
        </Flex>
      );
    }
  }
);
