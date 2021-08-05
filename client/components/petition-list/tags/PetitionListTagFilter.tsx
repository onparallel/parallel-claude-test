import { gql } from "@apollo/client";
import { Box, Center, Checkbox, Flex, Input, useId } from "@chakra-ui/react";
import { CloseIcon } from "@parallel/chakra/icons";
import { TableColumnFilterProps } from "@parallel/components/common/Table";
import { Tag } from "@parallel/components/common/Tag";
import { usePetitionListTagFilter_tagsQuery } from "@parallel/graphql/__types";
import { useDebouncedCallback } from "@parallel/utils/useDebouncedCallback";
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

type PetitionListTagFilter = string[] | null;

export function PetitionListTagFilter({
  value,
  onChange,
}: TableColumnFilterProps<PetitionListTagFilter>) {
  const intl = useIntl();
  const { data, refetch } = usePetitionListTagFilter_tagsQuery();
  const tags = useMemo(() => {
    // intentionally not include value so this only changes when data changes
    const selected = [];
    const notSelected = [];
    for (const tag of data?.tags.items ?? []) {
      if (value?.includes(tag.id)) {
        selected.push(tag);
      } else {
        notSelected.push(tag);
      }
    }
    return [...selected, ...notSelected];
  }, [data?.tags.items]);
  const [search, setSearch] = useState("");
  const _refetch = useDebouncedCallback(refetch, 300, [refetch]);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(0);
  const activeIndexRef = useUpdatingRef(activeIndex);

  function descendant(index: number) {
    return wrapperRef.current!.childNodes.item(index) as HTMLButtonElement;
  }

  const toggle = useCallback(
    function toggle(index: number) {
      if (index === 0) {
        onChange(null);
      } else if (index === 1) {
        if (Array.isArray(value) && value.length === 0) {
          onChange(null);
        } else {
          onChange([]);
        }
      } else {
        const button = descendant(index);
        const tagId = button.getAttribute("data-tag-id")!;
        const newValue = new Set(value);
        if (newValue.has(tagId)) {
          newValue.delete(tagId);
        } else {
          newValue.add(tagId);
        }
        onChange(newValue.size === 0 ? null : Array.from(newValue.values()));
      }
    },
    [onChange]
  );

  const buttonProps = useMemo(
    () => ({
      alignItems: "center",
      paddingX: 3,
      paddingY: "0.4rem",
      tabIndex: -1,
      _active: {
        outline: "none",
        backgroundColor: "gray.100",
      },
      onMouseEnter: (e: MouseEvent) => {
        const button = e.target as HTMLElement;
        const index = parseInt(button.getAttribute("data-index")!);
        setActiveIndex(index);
      },
      onMouseLeave: () => {
        setActiveIndex(null);
      },
      onClick: (e: MouseEvent) => {
        const button = e.target as HTMLElement;
        const index = parseInt(button.getAttribute("data-index")!);
        toggle(index);
      },
    }),
    [value?.join(",")]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      switch (e.key) {
        case "Tab": {
          e.preventDefault();
          return;
        }
        case "ArrowDown": {
          e.preventDefault();
          const index = activeIndexRef.current!;
          setActiveIndex((index + 1) % (tags.length + 2));
          return;
        }
        case "ArrowUp": {
          e.preventDefault();
          const index = activeIndexRef.current!;
          setActiveIndex((index - 1 + tags.length + 2) % (tags.length + 2));
          return;
        }
        case "Enter": {
          const index = activeIndexRef.current!;
          toggle(index);
        }
      }
    },
    [tags.length, toggle]
  );
  useEffect(() => {
    wrapperRef.current?.querySelectorAll("input").forEach((input) => {
      input.setAttribute("tabindex", "-1");
    });
  }, []);
  const id = useId(undefined, "tag-filter");

  return (
    <Flex flex="1" direction="column" onKeyDown={handleKeyDown}>
      <Box paddingX={2} marginBottom={2}>
        <Input
          size="sm"
          aria-controls={id}
          data-index="-1"
          aria-activedescendant={
            activeIndex !== null ? `${id}-${activeIndex}` : undefined
          }
          placeholder={intl.formatMessage({
            id: "component.petition-list-tag-filter.placeholder",
            defaultMessage: "Search for tags...",
          })}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            _refetch({ search: e.target.value.trim() });
          }}
        />
      </Box>
      <Flex
        direction="column"
        ref={wrapperRef}
        flex="1"
        maxHeight="200px"
        overflow="auto"
        role="listbox"
        id={id}
      >
        <Flex
          as="button"
          {...buttonProps}
          data-index={0}
          data-active={activeIndex === 0 ? "true" : undefined}
          id={`${id}-0`}
        >
          <Center boxSize={4} marginRight={2}>
            <CloseIcon fontSize="xs" role="presentation" />
          </Center>
          <FormattedMessage
            id="component.petition-list-tag-filter.clear-filter"
            defaultMessage="Clear filter"
          />
        </Flex>
        <Flex
          as="button"
          {...buttonProps}
          data-index={1}
          data-active={activeIndex === 1 ? "true" : undefined}
          id={`${id}-1`}
        >
          <Checkbox
            colorScheme="purple"
            pointerEvents="none"
            role="presentation"
            isChecked={value?.length === 0}
            isReadOnly
            marginRight={2}
          />
          <FormattedMessage
            id="component.petition-list-tag-filter.without-tags"
            defaultMessage="Without tags"
          />
        </Flex>
        {tags.map((tag, i) => (
          <Flex
            key={tag.id}
            as="button"
            {...buttonProps}
            data-index={i + 2}
            data-active={activeIndex === i + 2 ? "true" : undefined}
            data-tag-id={tag.id}
            id={`${id}-${i + 2}`}
          >
            <Checkbox
              colorScheme="purple"
              pointerEvents="none"
              role="presentation"
              isChecked={value?.includes(tag.id) ?? false}
              isReadOnly
              marginRight={2}
            />
            <Tag tag={tag} pointerEvents="none" />
          </Flex>
        ))}
      </Flex>
    </Flex>
  );
}

PetitionListTagFilter.fragments = {
  Tag: gql`
    fragment PetitionListTagFilter_Tag on Tag {
      id
      ...Tag_Tag
    }
    ${Tag.fragments.Tag}
  `,
};

PetitionListTagFilter.queries = {
  tags: gql`
    query PetitionListTagFilter_tags($search: String) {
      tags(search: $search) {
        items {
          ...PetitionTagListCellContent_Tag
        }
      }
    }
    ${PetitionListTagFilter.fragments.Tag}
  `,
};
