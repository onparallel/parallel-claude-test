import { gql, useApolloClient } from "@apollo/client";
import { Box, Button, Flex, Stack, Text } from "@chakra-ui/react";
import { EditIcon } from "@parallel/chakra/icons";
import {
  TagSelect_createTagDocument,
  TagSelect_TagFragment,
  TagSelect_TagFragmentDoc,
  TagSelect_tagsDocument,
} from "@parallel/graphql/__types";
import {
  genericRsComponent,
  rsStyles,
  useReactSelectProps,
} from "@parallel/utils/react-select/hooks";
import { CustomAsyncSelectProps } from "@parallel/utils/react-select/types";
import { If, MaybeArray, unMaybeArray } from "@parallel/utils/types";
import { useAsyncMemo } from "@parallel/utils/useAsyncMemo";
import { useDebouncedAsync } from "@parallel/utils/useDebouncedAsync";
import { useUpdatingRef } from "@parallel/utils/useUpdatingRef";
import {
  ForwardedRef,
  forwardRef,
  ReactElement,
  RefAttributes,
  useCallback,
  useState,
} from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { components, SelectComponentsConfig, SelectInstance } from "react-select";
import AsyncSelect from "react-select/async";
import AsyncCreatableSelect from "react-select/async-creatable";
import { indexBy, isDefined, zip } from "remeda";
import { assert } from "ts-essentials";
import { Tag } from "./Tag";
import { DEFAULT_COLORS } from "./TagColorSelect";

type TagSelection = TagSelect_TagFragment;

interface TagSelectProps<IsMulti extends boolean = false>
  extends Omit<CustomAsyncSelectProps<TagSelection, IsMulti, never>, "value"> {
  value: If<IsMulti, TagSelection[] | string[], TagSelection | string | null>;
  onEditTags?: () => void;
  canCreateTags?: boolean;
  maxItems?: number;
}

function randomColor() {
  return DEFAULT_COLORS[Math.floor(Math.random() * DEFAULT_COLORS.length)];
}

export type TagSelectInstance<IsMulti extends boolean = false> = SelectInstance<
  TagSelection,
  IsMulti,
  never
>;

export const TagSelect = Object.assign(
  forwardRef(function TagSelect<IsMulti extends boolean = false>(
    { value, onEditTags, canCreateTags, maxItems, ...props }: TagSelectProps<IsMulti>,
    ref: ForwardedRef<TagSelectInstance<IsMulti>>
  ) {
    const intl = useIntl();
    const [newTagColor, setNewTagColor] = useState(randomColor());
    const _value = useGetTagValues(value, props.isMulti ?? false);
    const apollo = useApolloClient();
    const loadOptions = useDebouncedAsync(
      async (search: string) => {
        const { data } = await apollo.query({
          query: TagSelect_tagsDocument,
          variables: { search },
          fetchPolicy: "network-only",
        });
        return data!.tags.items;
      },
      150,
      []
    );
    const rsProps = useReactSelectProps<TagSelection, IsMulti, never>({
      ...props,
      components: {
        ...({
          MultiValue,
          SingleValue,
          Option,
          NoOptionsMessage,
          MenuList,
        } as unknown as SelectComponentsConfig<TagSelection, IsMulti, never>),
        ...props.components,
      },
      styles: rsStyles({
        valueContainer: (styles) => ({
          ...styles,
          paddingLeft: "0.5rem",
          paddingRight: "0.5rem",
          paddingTop: "2px",
          paddingBottom: "2px",
          gridGap: "0.25rem",
        }),
        option: (styles) => ({
          ...styles,
          display: "flex",
          padding: "0.25rem 1rem",
        }),
        menuList: (styles, { selectProps }) => {
          return {
            ...styles,
            ...((selectProps as any).onEditTags ? { paddingBottom: 0 } : {}),
          };
        },
        ...props.styles,
      }),
    });

    const valueRef = useUpdatingRef(_value);
    const handleCreateTag = useCallback(
      async (name: string) => {
        const { data } = await apollo.mutate({
          mutation: TagSelect_createTagDocument,
          variables: { name, color: newTagColor },
          fetchPolicy: "network-only",
        });
        setNewTagColor(randomColor());
        const tag = data!.createTag;
        props.onChange((props.isMulti ? [...((valueRef.current as any) ?? []), tag] : tag) as any, {
          action: "select-option",
          option: tag,
        });
      },
      [props.isMulti, newTagColor]
    );

    const Component = canCreateTags
      ? AsyncCreatableSelect<TagSelection, IsMulti, never>
      : AsyncSelect<TagSelection, IsMulti, never>;

    return (
      <Component
        ref={ref}
        getOptionValue={(o) => o.id}
        getOptionLabel={(o) => o.name}
        isClearable={false}
        closeMenuOnSelect={!props.isMulti}
        placeholder={
          props.isMulti
            ? intl.formatMessage({
                id: "component.tag-select.placeholder-multi",
                defaultMessage: "Enter tags...",
              })
            : intl.formatMessage({
                id: "component.tag-select.placeholder-single",
                defaultMessage: "Select a tag...",
              })
        }
        isOptionDisabled={(_, selection) => {
          if (isDefined(maxItems) && selection.length >= maxItems) {
            return true;
          }
          return false;
        }}
        value={_value}
        isValidNewOption={(value, _, options) => {
          const name = value.trim().replace(/\s+/g, " ");
          return name.length > 0 && !options.some((o) => o.name === name);
        }}
        loadOptions={loadOptions}
        defaultOptions
        onMenuOpen={() => setNewTagColor(randomColor())}
        onCreateOption={handleCreateTag}
        {...props}
        {...rsProps}
        {...({
          canCreateTags,
          newTagColor,
          onEditTags,
        } as any)}
      />
    );
  }) as <IsMulti extends boolean = false>(
    props: TagSelectProps<IsMulti> & RefAttributes<TagSelectInstance<IsMulti>>
  ) => ReactElement,
  {
    fragments: {
      Tag: gql`
        fragment TagSelect_Tag on Tag {
          id
          ...Tag_Tag
        }
        ${Tag.fragments.Tag}
      `,
    },
  }
);

const _queries = [
  gql`
    query TagSelect_tags($search: String, $tagIds: [GID!]) {
      tags(search: $search, tagIds: $tagIds) {
        items {
          ...TagSelect_Tag
        }
      }
    }
    ${TagSelect.fragments.Tag}
  `,
];

const _mutations = [
  gql`
    mutation TagSelect_createTag($name: String!, $color: String!) {
      createTag(name: $name, color: $color) {
        ...TagSelect_Tag
      }
    }
    ${TagSelect.fragments.Tag}
  `,
];

const rsComponent = genericRsComponent<
  TagSelection,
  boolean,
  never,
  {
    selectProps: {
      newTagColor: string;
      onEditTags?: () => void;
      canCreateTags?: boolean;
    };
  }
>();

const NoOptionsMessage = rsComponent("NoOptionsMessage", function (props) {
  const {
    selectProps: { canCreateTags },
  } = props;
  return (
    <Stack
      direction="column"
      spacing={1}
      textStyle="hint"
      fontSize="sm"
      paddingX={2}
      paddingY={4}
      textAlign="center"
    >
      {props.options.length === 0 && !props.selectProps.inputValue ? (
        <>
          <Text>
            <FormattedMessage
              id="component.tag-select.no-options-1"
              defaultMessage="Your organization doesn't have any tags yet."
            />
          </Text>
          {canCreateTags ? (
            <Text>
              <FormattedMessage
                id="component.tag-select.no-options-2"
                defaultMessage="Write something to create the first one."
              />
            </Text>
          ) : null}
        </>
      ) : canCreateTags ? (
        <Text as="div">
          <FormattedMessage
            id="component.tag-select.no-options-3"
            defaultMessage="Type to create a new tag"
          />
        </Text>
      ) : (
        <Text as="div">
          <FormattedMessage
            id="component.tag-select.no-options-4"
            defaultMessage="No tags matching"
          />
        </Text>
      )}
    </Stack>
  );
});

const SingleValue = rsComponent("SingleValue", function (props) {
  return (
    <components.SingleValue {...props}>
      <Flex>
        <Tag tag={props.data} />
      </Flex>
    </components.SingleValue>
  );
});

const MultiValue = rsComponent("MultiValue", function ({ data, removeProps, innerProps }) {
  return (
    <Tag
      tag={data}
      isRemovable
      onRemove={removeProps.onClick}
      minWidth="0"
      {...(innerProps as any)}
    />
  );
});

const Option = rsComponent("Option", function (props) {
  const {
    selectProps: { newTagColor },
  } = props;
  return (props.data as any).__isNew__ ? (
    <components.Option {...props}>
      <Flex alignItems="baseline">
        <FormattedMessage
          id="component.tag-select.tags-create"
          defaultMessage="Create {tag}"
          values={{
            tag: (
              <Tag
                marginLeft="0.5rem"
                flex="0 1 auto"
                minWidth="0"
                tag={{
                  name: (props.data as any).value.trim().replace(/\s+/g, " "),
                  color: newTagColor,
                }}
              />
            ),
          }}
        />
      </Flex>
    </components.Option>
  ) : (
    <components.Option {...props}>
      <Tag flex="0 1 auto" minWidth="0" tag={props.data as TagSelection} />
    </components.Option>
  );
});

const MenuList = rsComponent("MenuList", function (props) {
  const {
    selectProps: { onEditTags },
  } = props;
  return (
    <components.MenuList {...props}>
      {props.children}
      {props.options.length > 0 && onEditTags ? (
        <Box position="sticky" bottom="0" padding={2} backgroundColor="white">
          <Button
            width="100%"
            size="sm"
            variant="outline"
            fontWeight="normal"
            leftIcon={<EditIcon position="relative" top="-1px" />}
            onClick={() => onEditTags()}
          >
            <FormattedMessage id="component.tag-select.edit-tags" defaultMessage="Edit tags" />
          </Button>
        </Box>
      ) : null}
    </components.MenuList>
  );
});

function useGetTagValues<IsMulti extends boolean = false>(
  value: If<IsMulti, TagSelection[] | string[], TagSelection | string | null>,
  isMulti: IsMulti
) {
  assert(!isMulti || Array.isArray(value));
  const client = useApolloClient();
  const needsLoading =
    typeof value === "string" || (isMulti && typeof (value as any[])[0] === "string");
  async function getTags(ids: MaybeArray<string>) {
    const _ids = unMaybeArray(ids);
    const fromCache = zip(
      _ids,
      _ids.map((id) => {
        const tag = client.readFragment({
          fragment: TagSelect_TagFragmentDoc,
          id,
          fragmentName: "TagSelect_Tag",
        });
        if (tag?.__typename === "Tag") {
          return tag;
        }
        return null;
      })
    );
    const missing = fromCache.filter(([, value]) => value === null).map(([id]) => id);
    if (missing.length) {
      const fromServer = await client.query({
        query: TagSelect_tagsDocument,
        variables: {
          tagIds: missing,
        },
        fetchPolicy: "network-only",
      });
      const fromServerById = indexBy(fromServer.data.tags.items, (x) => x.id);
      const result = fromCache.map(([id, value]) => value ?? fromServerById[id]!);
      return isMulti ? result : result[0];
    } else {
      const result = fromCache.map(([, value]) => value!);
      return isMulti ? result : result[0];
    }
  }
  return useAsyncMemo(
    async () => {
      if (value === null) {
        return null;
      }
      if (needsLoading) {
        return await getTags(value as any);
      } else {
        return value as MaybeArray<TagSelection>;
      }
    },
    [
      needsLoading,
      // Rerun when value changes
      value === null
        ? null
        : needsLoading
        ? // value is string | string[]
          unMaybeArray(value as any).join(",")
        : // value is TagSelection[]
          unMaybeArray(value as any)
            .map((x) => x.id)
            .join(","),
    ],
    isMulti ? [] : null
  );
}
