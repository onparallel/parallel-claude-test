import { gql, useApolloClient } from "@apollo/client";
import {
  Box,
  Button,
  Circle,
  Flex,
  List,
  ListItem,
  Stack,
  Text,
} from "@chakra-ui/react";
import { AddIcon, EditIcon } from "@parallel/chakra/icons";
import { SmallPopover } from "@parallel/components/common/SmallPopover";
import { Tag } from "@parallel/components/common/Tag";
import {
  PetitionTagListCellContent_PetitionBaseFragment,
  PetitionTagListCellContent_TagFragment,
  PetitionTagListCellContent_tagsQuery,
  PetitionTagListCellContent_tagsQueryVariables,
  usePetitionTagListCellContent_createTagMutation,
  usePetitionTagListCellContent_tagPetitionMutation,
  usePetitionTagListCellContent_tagsQuery,
  usePetitionTagListCellContent_untagPetitionMutation,
} from "@parallel/graphql/__types";
import { clearCache } from "@parallel/utils/apollo/clearCache";
import { withError } from "@parallel/utils/promises/withError";
import { useReactSelectProps } from "@parallel/utils/react-select/hooks";
import { useDebouncedAsync } from "@parallel/utils/useDebouncedAsync";
import useMergedRef from "@react-hook/merged-ref";
import { forwardRef, MouseEvent, useRef, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { ActionMeta, components } from "react-select";
import AsyncCreatableSelect, {
  Props as AsyncCreatableSelectProps,
} from "react-select/async-creatable";
import { omit, pick } from "remeda";
import scrollIntoView from "smooth-scroll-into-view-if-needed";
import { DEFAULT_COLORS } from "./TagColorSelect";
import { useTagEditDialog } from "./TagEditDialog";

type TagSelection = PetitionTagListCellContent_TagFragment;

export function PetitionTagListCellContent({
  petition,
}: {
  petition: PetitionTagListCellContent_PetitionBaseFragment;
}) {
  const selectWrapperRef = useRef<HTMLDivElement>(null);
  const selectRef = useRef<TagSelectInstance>(null);
  const [isEditing, setIsEditing] = useState(false);
  const { data, refetch } = usePetitionTagListCellContent_tagsQuery({
    fetchPolicy: "cache-and-network",
  });
  const intl = useIntl();
  const apollo = useApolloClient();
  const loadOptions = useDebouncedAsync(
    async (search: string) => {
      const { data } = await apollo.query<
        PetitionTagListCellContent_tagsQuery,
        PetitionTagListCellContent_tagsQueryVariables
      >({
        query: PetitionTagListCellContent.queries.tags,
        variables: { search },
        fetchPolicy: "no-cache",
      });
      return data!.tags.items;
    },
    300,
    []
  );
  const handleClick = async function (e: MouseEvent) {
    e.stopPropagation();
    if (!isEditing) {
      if (selectWrapperRef.current?.scrollIntoView) {
        selectWrapperRef.current!.scrollIntoView({
          block: "nearest",
          inline: "nearest",
        });
      } else {
        await scrollIntoView(selectWrapperRef.current!, {
          duration: 0,
          scrollMode: "if-needed",
          block: "nearest",
          inline: "nearest",
        });
      }
      setIsEditing(true);
      setTimeout(() => {
        selectRef.current!.focus();
      });
    }
  };

  const [tagPetition] = usePetitionTagListCellContent_tagPetitionMutation();
  async function handleAddTag(tag: TagSelection) {
    await tagPetition({
      variables: { tagId: tag.id, petitionId: petition.id },
      optimisticResponse: {
        __typename: "Mutation",
        tagPetition: {
          ...pick(petition, ["__typename", "id"]),
          tags: [...petition.tags, tag],
        },
      },
      update(cache) {
        clearCache(cache, /\$ROOT_QUERY\.petitions\(.*tagIds":\[/);
      },
    });
  }

  const [untagPetition] = usePetitionTagListCellContent_untagPetitionMutation();
  async function handleRemoveTag(tag: TagSelection) {
    await untagPetition({
      variables: { tagId: tag.id, petitionId: petition.id },
      optimisticResponse: {
        __typename: "Mutation",
        untagPetition: {
          ...pick(petition, ["__typename", "id"]),
          tags: petition.tags.filter((t) => t.id !== tag.id),
        },
      },
      update(cache) {
        clearCache(cache, /\$ROOT_QUERY\.petitions\(.*tagIds":\[/);
      },
    });
  }

  const showTagEditDialog = useTagEditDialog();
  const handleEditTags = async () => {
    await withError(showTagEditDialog({}));
    await refetch();
  };

  const [createTag] = usePetitionTagListCellContent_createTagMutation();
  const handleCreateTag = async (tag: Pick<TagSelection, "name" | "color">) => {
    const [, result] = await withError(
      createTag({
        variables: tag,
      })
    );
    if (result) {
      await handleAddTag(result.data!.createTag);
    }
    await refetch();
  };

  const tags = petition.tags;
  const sample = tags.length > 4 ? tags.slice(0, 3) : tags;
  const extra = tags.length > 4 ? tags.slice(3) : [];
  return (
    <Flex
      ref={selectWrapperRef}
      height="45px"
      alignItems="center"
      sx={{ scrollMarginTop: "38px" }}
      position="relative"
      onClick={handleClick}
    >
      {isEditing ? (
        <Box
          position="absolute"
          left={0}
          top={0}
          width="100%"
          height="100%"
          zIndex="1"
        >
          <TagSelect
            ref={selectRef}
            value={petition.tags}
            placeholder={intl.formatMessage({
              id: "components.petition-tag-list-cell-content.add-tags",
              defaultMessage: "Add tags",
            })}
            defaultOptions={data?.tags.items ?? []}
            loadOptions={loadOptions}
            onBlur={() => setIsEditing(false)}
            onAddTag={handleAddTag}
            onRemoveTag={handleRemoveTag}
            onEditTags={handleEditTags}
            onCreateTag={handleCreateTag}
          />
        </Box>
      ) : (
        <Stack
          as={List}
          spacing={1.5}
          direction="row"
          flex="1"
          paddingX={2}
          paddingRight={5}
          alignItems="center"
        >
          {petition.tags.length === 0 ? (
            <Stack
              direction="row"
              alignItems="center"
              display="none"
              sx={{
                "td:hover &": {
                  display: "flex",
                },
              }}
            >
              <Circle
                border="1px solid"
                borderColor="gray.400"
                boxSize="16px"
                role="presentation"
              >
                <AddIcon fontSize="8px" color="gray.600" />
              </Circle>
              <Text as="div" whiteSpace="nowrap" fontSize="sm" color="gray.400">
                <FormattedMessage
                  id="components.petition-tag-list-cell-content.add-tags"
                  defaultMessage="Add tags"
                />
              </Text>
            </Stack>
          ) : null}
          {sample.map((tag) => (
            <Tag
              key={tag.id}
              flex="1 1 10px"
              minWidth="0"
              maxWidth="max-content"
              as="li"
              tag={tag}
            />
          ))}
          {extra.length ? (
            <ListItem whiteSpace="nowrap" fontSize="sm" lineHeight="24px">
              <FormattedMessage
                id="components.petition-tag-list-cell-content.tags-x-more"
                defaultMessage="and <b>{extra} more</b>"
                values={{
                  extra: extra.length,
                  b: (chunks: any[]) => (
                    <SmallPopover
                      width="min-content"
                      placement="bottom-end"
                      content={
                        <Stack as={List} alignItems="flex-start">
                          {extra.map((tag) => (
                            <Tag
                              key={tag.id}
                              tag={tag}
                              flex="0 1 auto"
                              minWidth="0"
                              as="li"
                            />
                          ))}
                        </Stack>
                      }
                    >
                      <Box as="strong" color="purple.500" fontWeight="normal">
                        {chunks}
                      </Box>
                    </SmallPopover>
                  ),
                }}
              />
            </ListItem>
          ) : null}
        </Stack>
      )}
    </Flex>
  );
}

PetitionTagListCellContent.fragments = {
  get Tag() {
    return gql`
      fragment PetitionTagListCellContent_Tag on Tag {
        id
        ...Tag_Tag
      }
      ${Tag.fragments.Tag}
    `;
  },
  get PetitionBase() {
    return gql`
      fragment PetitionTagListCellContent_PetitionBase on PetitionBase {
        id
        tags {
          ...PetitionTagListCellContent_Tag
        }
      }
      ${this.Tag}
    `;
  },
};

PetitionTagListCellContent.queries = {
  tags: gql`
    query PetitionTagListCellContent_tags($search: String) {
      tags(search: $search) {
        items {
          ...PetitionTagListCellContent_Tag
        }
      }
    }
    ${PetitionTagListCellContent.fragments.Tag}
  `,
};

PetitionTagListCellContent.mutations = [
  gql`
    mutation PetitionTagListCellContent_tagPetition(
      $tagId: GID!
      $petitionId: GID!
    ) {
      tagPetition(tagId: $tagId, petitionId: $petitionId) {
        id
        tags {
          ...PetitionTagListCellContent_Tag
        }
      }
    }
    ${PetitionTagListCellContent.fragments.Tag}
  `,
  gql`
    mutation PetitionTagListCellContent_untagPetition(
      $tagId: GID!
      $petitionId: GID!
    ) {
      untagPetition(tagId: $tagId, petitionId: $petitionId) {
        id
        tags {
          ...PetitionTagListCellContent_Tag
        }
      }
    }
    ${PetitionTagListCellContent.fragments.Tag}
  `,
  gql`
    mutation PetitionTagListCellContent_createTag(
      $name: String!
      $color: String!
    ) {
      createTag(name: $name, color: $color) {
        ...PetitionTagListCellContent_Tag
      }
    }
    ${PetitionTagListCellContent.fragments.Tag}
  `,
];

type TagSelectInstance = AsyncCreatableSelect<TagSelection, true, never>;

interface TagSelectProps
  extends AsyncCreatableSelectProps<TagSelection, true, never> {
  onAddTag: (tag: TagSelection) => void;
  onRemoveTag: (tag: TagSelection) => void;
  onEditTags: () => void;
  onCreateTag: (tag: Pick<TagSelection, "name" | "color">) => void;
}

function randomColor() {
  return DEFAULT_COLORS[Math.floor(Math.random() * DEFAULT_COLORS.length)];
}

const TagSelect = forwardRef<TagSelectInstance, TagSelectProps>(
  function TagSelect(
    { value, onAddTag, onRemoveTag, onEditTags, onCreateTag, ...props },
    ref
  ) {
    const [newTagColor, setNewTagColor] = useState(randomColor());
    const innerRef = useRef<TagSelectInstance>();
    const _ref = useMergedRef(ref, innerRef);
    const rsProps = useReactSelectProps<TagSelection, true, never>({
      components: {
        IndicatorsContainer: () => <></>,
        MultiValue: ({ data: tag, innerProps, removeProps }) => {
          return (
            <Tag
              tag={tag as TagSelection}
              margin="2px"
              isRemovable
              onRemove={removeProps.onClick}
              minWidth="0"
              {...innerProps}
            />
          );
        },
        Option: (props) => {
          return props.data.__isNew__ ? (
            <components.Option {...props}>
              <FormattedMessage
                id="components.petition-tag-list-cell-content.tags-create"
                defaultMessage="Create {tag}"
                values={{
                  tag: (
                    <Tag
                      marginLeft="0.5rem"
                      flex="0 1 auto"
                      minWidth="0"
                      tag={{ name: props.data.value, color: newTagColor }}
                    />
                  ),
                }}
              />
            </components.Option>
          ) : (
            <components.Option {...props}>
              <Tag
                flex="0 1 auto"
                minWidth="0"
                tag={props.data as TagSelection}
              />
            </components.Option>
          );
        },
        NoOptionsMessage: (props) => (
          <Stack
            direction="column"
            spacing={1}
            textStyle="hint"
            fontSize="sm"
            paddingX={2}
            paddingY={4}
            textAlign="center"
          >
            <Text>
              <FormattedMessage
                id="components.petition-tag-list-cell-content.no-options-1"
                defaultMessage="Your organization doesn't have any tags yet."
              />
            </Text>
            <Text>
              <FormattedMessage
                id="components.petition-tag-list-cell-content.no-options-2"
                defaultMessage="Write something to create the first one."
              />
            </Text>
          </Stack>
        ),
        MenuList: ({ children, ...props }) => (
          <components.MenuList {...props}>
            {children}
            {props.selectProps.defaultOptions?.length > 0 ? (
              <Box
                position="sticky"
                bottom="0"
                padding={2}
                backgroundColor="white"
              >
                <Button
                  width="100%"
                  size="sm"
                  variant="outline"
                  fontWeight="normal"
                  leftIcon={<EditIcon position="relative" top="-1px" />}
                  onClick={() => onEditTags()}
                >
                  <FormattedMessage
                    id="components.petition-tag-list-cell-content.edit-tags"
                    defaultMessage="Edit tags"
                  />
                </Button>
              </Box>
            ) : null}
          </components.MenuList>
        ),
      },
      styles: {
        container: (styles) => ({ ...styles, width: "100%" }),
        valueContainer: (styles) => ({
          ...omit(styles as any, ["padding"]),
          paddingLeft: "0.375rem",
          paddingRight: "0.375rem",
          paddingTop: "8.5px",
          paddingBottom: "8.5px",
          fontSize: "14px",
        }),
        control: (styles, { isFocused, theme }: any) => ({
          ...styles,
          minHeight: "45px",
          borderRadius: 0,
          border: "none",
          boxShadow: isFocused
            ? `inset 0 0 0 2px ${theme.colors.primary}`
            : undefined,
        }),
        option: (styles) => ({
          ...styles,
          display: "flex",
          padding: "0.25rem 1rem",
          fontSize: "14px",
        }),
        menuList: (styles) => ({
          ...styles,
          paddingBottom: 0,
        }),
      },
    });
    const handleChange = function (_: any, action: ActionMeta<TagSelection>) {
      switch (action.action) {
        case "select-option":
          onAddTag(action.option!);
          break;
        case "pop-value":
        case "remove-value":
          if (action.removedValue) {
            onRemoveTag(action.removedValue);
          }
          break;
      }
    };
    return (
      <AsyncCreatableSelect
        ref={_ref}
        {...rsProps}
        isMulti
        isClearable={false}
        defaultMenuIsOpen
        closeMenuOnSelect={false}
        getOptionValue={(o) => o.id}
        getOptionLabel={(o) => o.name}
        value={value}
        onChange={handleChange}
        onMenuOpen={() => setNewTagColor(randomColor())}
        onCreateOption={(name) => {
          onCreateTag({ name, color: newTagColor });
          setNewTagColor(randomColor());
        }}
        {...props}
      />
    );
  }
);
