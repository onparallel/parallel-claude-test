import { Box, chakra, PropsOf } from "@chakra-ui/react";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { Card } from "@parallel/components/common/Card";
import { HighlightText } from "@parallel/components/common/HighlightText";
import { CustomDomComponent, motion, Variants } from "framer-motion";
import { useEffect, useRef } from "react";
import scrollIntoView from "smooth-scroll-into-view-if-needed";
import { PlaceholderOption } from "../../../utils/slate/placeholders/PlaceholderPlugin";

interface PlaceholderMenuProps {
  isOpen: boolean;
  menuId: string;
  itemIdPrefix: string;
  search?: string | null;
  values: PlaceholderOption[];
  highlightedIndex: number;
  onAddPlaceholder: (placeholder: PlaceholderOption) => void;
  onHighlightOption: (index: number) => void;
}

const motionVariants: Variants = {
  enter: {
    visibility: "visible",
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.2,
      ease: [0.4, 0, 0.2, 1],
    },
  },
  exit: {
    transitionEnd: {
      visibility: "hidden",
    },
    opacity: 0,
    scale: 0.8,
    transition: {
      duration: 0.1,
      easings: "easeOut",
    },
  },
};

const MotionCard: CustomDomComponent<PropsOf<typeof chakra.div>> = motion(Card);

export const PlaceholderMenu = chakraForwardRef<"div", PlaceholderMenuProps>(
  function PlaceholderMenu(
    {
      isOpen,
      search,
      menuId,
      itemIdPrefix,
      values,
      highlightedIndex,
      onAddPlaceholder,
      onHighlightOption,
      ...props
    },
    ref
  ) {
    const menuRef = useRef<HTMLElement>(null);
    useEffect(() => {
      const element = menuRef.current?.children.item(highlightedIndex);
      if (element) {
        scrollIntoView(element, { block: "nearest", scrollMode: "if-needed" });
      }
    }, [highlightedIndex]);
    return (
      <chakra.div ref={ref} pointerEvents={isOpen ? undefined : "none"}>
        <MotionCard
          ref={menuRef}
          id={menuId}
          role="listbox"
          overflow="auto"
          maxHeight="180px"
          paddingY={1}
          visibility="hidden"
          variants={motionVariants}
          animate={isOpen ? "enter" : "exit"}
          {...props}
        >
          {values.map((placeholder, index) => {
            const isSelected = index === highlightedIndex;
            return (
              <Box
                key={placeholder.value}
                id={`${itemIdPrefix}-${placeholder.value}`}
                role="option"
                aria-selected={isSelected ? "true" : undefined}
                backgroundColor={isSelected ? "gray.100" : "white"}
                paddingX={4}
                paddingY={1}
                cursor="pointer"
                onMouseDown={() => onAddPlaceholder(placeholder)}
                onMouseEnter={() => onHighlightOption(index)}
              >
                <Box whiteSpace="nowrap">
                  <HighlightText text={placeholder.label} search={search ?? ""} />
                </Box>
              </Box>
            );
          })}
        </MotionCard>
      </chakra.div>
    );
  }
);
