import { Box } from "@chakra-ui/react";
import { Button } from "@parallel/components/ui";
import useResizeObserver from "@react-hook/resize-observer";
import { useRef, useState } from "react";
import { FormattedMessage } from "react-intl";

export function ViewMoreText({ text, maxLines = 3 }: { text: string; maxLines?: number }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isOverflown, setIsOverflown] = useState(false);
  const textRef = useRef<HTMLDivElement>(null);

  useResizeObserver(textRef, ({ target }) => {
    const lineHeight = parseInt(getComputedStyle(target).lineHeight);
    const maxHeight = lineHeight * maxLines;
    const isTextOverflown = target.scrollHeight > maxHeight;
    setIsOverflown(isTextOverflown);
  });

  const toggleReadMore = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <Box>
      <Box
        ref={textRef}
        sx={{
          overflow: isExpanded ? "visible" : "hidden",
          maxHeight: isExpanded ? "none" : `${maxLines * 1.25}em`, // 1.25em provides a little extra space
        }}
      >
        {text}
      </Box>
      {isOverflown && (
        <Button variant="link" onClick={toggleReadMore}>
          <FormattedMessage
            id="generic.show-more-less"
            defaultMessage="Show {more, select, true {more} other {less}}"
            values={{ more: !isExpanded }}
          />
        </Button>
      )}
    </Box>
  );
}
