import { Center, Checkbox, Flex } from "@chakra-ui/react";
import { CloseIcon } from "@parallel/chakra/icons";
import { TableColumnFilterProps } from "@parallel/components/common/Table";
import { useUpdatingRef } from "@parallel/utils/useUpdatingRef";
import {
  KeyboardEvent,
  MouseEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { FormattedMessage } from "react-intl";

export interface CheckboxTableFilterProps<T extends string>
  extends TableColumnFilterProps<T[] | null> {
  options: { value: T; text: string }[];
}

export function CheckboxTableFilter<T extends string>({
  value,
  onChange,
  options,
}: CheckboxTableFilterProps<T>) {
  const valueRef = useUpdatingRef(value);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(0);
  const activeIndexRef = useUpdatingRef(activeIndex);

  function descendant(index: number) {
    return wrapperRef.current!.childNodes.item(index) as HTMLButtonElement;
  }

  function focus(index: number) {
    setActiveIndex(index);
    descendant(index).focus();
  }

  const buttonProps = useMemo(
    () => ({
      alignItems: "center",
      paddingX: 3,
      paddingY: "0.4rem",
      _focus: {
        outline: "none",
        backgroundColor: "gray.100",
      },
      onMouseEnter: (e: MouseEvent) => {
        const button = e.target as HTMLElement;
        const index = parseInt(button.getAttribute("data-index")!);
        focus(index);
      },
      onMouseLeave: () => {
        setActiveIndex(null);
        descendant(activeIndexRef.current!).blur();
      },
      onClick: (e: MouseEvent) => {
        const button = e.target as HTMLElement;
        const index = parseInt(button.getAttribute("data-index")!);
        const newValue = new Set(valueRef.current ?? []);
        if (index === 0) {
          newValue.clear();
        } else {
          const status = options[index - 1]?.value;
          if (status) {
            if (newValue.has(status)) {
              newValue.delete(status);
            } else {
              newValue.add(status);
            }
          }
        }
        onChange(newValue.size === 0 ? null : Array.from(newValue.values()));
      },
    }),
    [],
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const optionsLength = options.length + 1;
      switch (e.key) {
        case "Tab": {
          e.preventDefault();
          return;
        }
        case "ArrowDown": {
          e.preventDefault();
          const button = e.target as HTMLElement;
          const index = parseInt(button.getAttribute("data-index")!);
          focus((index + 1) % optionsLength);
          return;
        }
        case "ArrowUp": {
          e.preventDefault();
          const button = e.target as HTMLElement;
          const index = parseInt(button.getAttribute("data-index")!);
          focus((index - 1 + optionsLength) % optionsLength);
          return;
        }
      }
    },
    [options.length],
  );

  useEffect(() => {
    wrapperRef.current?.querySelectorAll("input").forEach((input) => {
      input.setAttribute("tabindex", "-1");
    });
  }, []);

  return (
    <Flex direction="column" ref={wrapperRef} onKeyDown={handleKeyDown}>
      <Flex
        as="button"
        {...buttonProps}
        data-index={0}
        tabIndex={activeIndex === 0 || activeIndex === null ? 0 : -1}
      >
        <Center boxSize={4} marginEnd={2} pointerEvents="none">
          <CloseIcon fontSize="xs" role="presentation" />
        </Center>
        <FormattedMessage
          id="component.petition-list-status-filter.clear-filter"
          defaultMessage="Clear filter"
        />
      </Flex>
      {options.map((option, i) => (
        <Flex
          key={option.value}
          as="button"
          {...buttonProps}
          data-index={i + 1}
          tabIndex={activeIndex === i + 1 ? 0 : -1}
        >
          <Checkbox
            pointerEvents="none"
            role="presentation"
            isChecked={value?.includes(option.value) ?? false}
            isReadOnly
            marginEnd={2}
          />
          {option.text}
        </Flex>
      ))}
    </Flex>
  );
}
