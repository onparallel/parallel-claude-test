import { Center, Checkbox, Flex } from "@chakra-ui/react";
import { CloseIcon } from "@parallel/chakra/icons";
import { TableColumnFilterProps } from "@parallel/components/common/Table";
import { PetitionStatus } from "@parallel/graphql/__types";
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
import { FormattedMessage, useIntl } from "react-intl";

type PetitionListStatusFilter = PetitionStatus[] | null;

export function PetitionListStatusFilter({
  value,
  onChange,
}: TableColumnFilterProps<PetitionListStatusFilter>) {
  const intl = useIntl();

  const statuses = useMemo<{ value: PetitionStatus; text: string }[]>(
    () => [
      {
        value: "DRAFT",
        text: intl.formatMessage({
          id: "component.petition-list-status-filter.draft",
          defaultMessage: "Draft",
        }),
      },
      {
        value: "PENDING",
        text: intl.formatMessage({
          id: "component.petition-list-status-filter.pending",
          defaultMessage: "Pending",
        }),
      },
      {
        value: "COMPLETED",
        text: intl.formatMessage({
          id: "component.petition-list-status-filter.completed",
          defaultMessage: "Completed",
        }),
      },
      {
        value: "CLOSED",
        text: intl.formatMessage({
          id: "component.petition-list-status-filter.closed",
          defaultMessage: "Closed",
        }),
      },
    ],
    []
  );

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
  function blur() {
    setActiveIndex(null);
    descendant(activeIndexRef.current!).blur();
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
        blur();
      },
      onClick: (e: MouseEvent) => {
        const button = e.target as HTMLElement;
        const index = parseInt(button.getAttribute("data-index")!);
        const newValue = new Set(value);
        if (index === 0) {
          newValue.clear();
        } else {
          const status = statuses[index - 1]?.value;
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
    [value?.join(",")]
  );

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    switch (e.key) {
      case "Tab": {
        e.preventDefault();
        return;
      }
      case "ArrowDown": {
        e.preventDefault();
        const button = e.target as HTMLElement;
        const index = parseInt(button.getAttribute("data-index")!);
        focus((index + 1) % 5);
        return;
      }
      case "ArrowUp": {
        e.preventDefault();
        const button = e.target as HTMLElement;
        const index = parseInt(button.getAttribute("data-index")!);
        focus((index - 1 + 5) % 5);
        return;
      }
    }
  }, []);
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
        <Center boxSize={4} marginRight={2} pointerEvents="none">
          <CloseIcon fontSize="xs" role="presentation" />
        </Center>
        <FormattedMessage
          id="component.petition-list-status-filter.clear-filter"
          defaultMessage="Clear filter"
        />
      </Flex>
      {statuses.map((option, i) => (
        <Flex
          key={option.value}
          as="button"
          {...buttonProps}
          data-index={i + 1}
          tabIndex={activeIndex === i + 1 ? 0 : -1}
        >
          <Checkbox
            colorScheme="primary"
            pointerEvents="none"
            role="presentation"
            isChecked={value?.includes(option.value) ?? false}
            isReadOnly
            marginRight={2}
          />
          {option.text}
        </Flex>
      ))}
    </Flex>
  );
}
