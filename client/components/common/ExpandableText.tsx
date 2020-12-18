import { Box, Text, TextProps, Tooltip } from "@chakra-ui/react";
import { useEffect, useRef, useState } from "react";
import { useIntl } from "react-intl";

type ExpandableTextProps = TextProps & { noOfLines: number };
export function ExpandableText({
  children,
  noOfLines,
  ...props
}: ExpandableTextProps) {
  const [isExpanded, switchExpandText] = useState(false);
  const [canExpand, setCanExpand] = useState(false);

  const intl = useIntl();
  const textRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    setCanExpand(textRef.current!.scrollHeight > textRef.current!.offsetHeight);
  }, []);

  const handleSwitchExpand = () => {
    if (canExpand) {
      switchExpandText(!isExpanded);
    }
  };

  return (
    <Tooltip
      isDisabled={!canExpand}
      label={
        isExpanded
          ? intl.formatMessage({
              id: "generic.click-to-show-less",
              defaultMessage: "Click to show less",
            })
          : intl.formatMessage({
              id: "generic.click-to-show-more",
              defaultMessage: "Click to show more",
            })
      }
    >
      <Box
        cursor={canExpand ? "pointer" : "default"}
        onClick={handleSwitchExpand}
      >
        <Text
          wordBreak="break-word"
          display="-webkit-box"
          noOfLines={isExpanded ? undefined : noOfLines}
          ref={textRef}
          {...props}
        >
          {children}
        </Text>
      </Box>
    </Tooltip>
  );
}
