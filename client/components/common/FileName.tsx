import { chakra, Flex, ThemingProps } from "@chakra-ui/react";
import { Tooltip } from "@parallel/chakra/components";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { Maybe } from "@parallel/graphql/__types";
import useMergedRef from "@react-hook/merged-ref";
import { useEffect, useRef, useState } from "react";
import { Text } from "@parallel/components/ui";

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
      <Tooltip isDisabled={!isTruncated} label={value}>
        {/* minWidth 20px is needed, if less than that ellipsis doesn't show in some browsers */}
        <Flex display="inline-flex" ref={mergedRef as any} as="span" minWidth="20px" {...props}>
          <chakra.span
            whiteSpace="nowrap"
            overflow="hidden"
            textOverflow="ellipsis"
            minWidth="30px"
          >
            {value?.slice(0, -10)}
          </chakra.span>
          <chakra.span flexShrink={0} position="relative" insetStart="-0.2rem">
            {value?.slice(-10)}
          </chakra.span>
        </Flex>
      </Tooltip>
    );
  }
});
