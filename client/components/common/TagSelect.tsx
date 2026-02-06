import { gql } from "@apollo/client";
import { useApolloClient, useMutation } from "@apollo/client/react";
import {
  Box,
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Grid,
  Input,
  Stack,
} from "@chakra-ui/react";
import { EditIcon } from "@parallel/chakra/icons";
import { Button, Text } from "@parallel/components/ui";
import {
  ManageTagsDialog_updateTagDocument,
  TagSelect_TagFragment,
  TagSelect_TagFragmentDoc,
  TagSelect_createTagDocument,
  TagSelect_tagsDocument,
} from "@parallel/graphql/__types";
import { isApolloError } from "@parallel/utils/apollo/isApolloError";
import { useDeleteTag } from "@parallel/utils/mutations/useDeleteTag";
import { withError } from "@parallel/utils/promises/withError";
import { useReactSelectProps } from "@parallel/utils/react-select/hooks";
import { CustomAsyncSelectProps } from "@parallel/utils/react-select/types";
import { isNotEmptyText } from "@parallel/utils/strings";
import { If, MaybeArray, unMaybeArray } from "@parallel/utils/types";
import { useAsyncMemo } from "@parallel/utils/useAsyncMemo";
import { useDebouncedAsync } from "@parallel/utils/useDebouncedAsync";
import { useGenericErrorToast } from "@parallel/utils/useGenericErrorToast";
import { useHasPermission } from "@parallel/utils/useHasPermission";
import { useRerender } from "@parallel/utils/useRerender";
import { useUpdatingRef } from "@parallel/utils/useUpdatingRef";
import {
  DependencyList,
  ForwardedRef,
  ReactElement,
  RefAttributes,
  forwardRef,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { Controller, useForm } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";
import {
  CSSObjectWithLabel,
  MenuListProps,
  MultiValueProps,
  NoticeProps,
  OptionProps,
  SelectComponentsConfig,
  SelectInstance,
  SingleValueProps,
  components,
} from "react-select";
import AsyncSelect from "react-select/async";
import AsyncCreatableSelect from "react-select/async-creatable";
import { indexBy, isNonNullish, isNullish, zip } from "remeda";
import { assert } from "ts-essentials";
import { ConfirmDialog } from "./dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "./dialogs/DialogProvider";
import { NoElement } from "./NoElement";
import { Tag } from "./Tag";
import { DEFAULT_COLORS, TagColorSelect } from "./TagColorSelect";

type TagSelection = TagSelect_TagFragment;

interface TagSelectProps<IsMulti extends boolean = false>
  extends Omit<CustomAsyncSelectProps<TagSelection, IsMulti, never>, "value"> {
  value: If<IsMulti, TagSelection[] | string[], TagSelection | string | null>;
  allowCreatingTags?: boolean;
  allowUpdatingTags?: boolean;
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

export const TagSelect = forwardRef(function TagSelect<IsMulti extends boolean = false>(
  { value, maxItems, allowCreatingTags, allowUpdatingTags, ...props }: TagSelectProps<IsMulti>,
  ref: ForwardedRef<TagSelectInstance<IsMulti>>,
) {
  const intl = useIntl();
  const [newTagColor, setNewTagColor] = useState(randomColor());
  const apollo = useApolloClient();
  const [key, rerender] = useRerender();
  const _value = useGetTagValues(value, props.isMulti ?? false, [key]);
  const canCreateTags = useHasPermission("TAGS:CREATE_TAGS") && allowCreatingTags;
  const canUpdateTags = useHasPermission("TAGS:UPDATE_TAGS") && allowUpdatingTags;
  // The following code makes sure the component is rerendered whenever the tag search is invalidated
  const firstLoadRef = useRef(true);
  useEffect(() => {
    const subscription = apollo
      .watchQuery({
        query: TagSelect_tagsDocument,
        variables: { search: "" },
        fetchPolicy: "cache-only",
      })
      .subscribe(({ data, partial }) => {
        if (firstLoadRef.current) {
          firstLoadRef.current = false;
        } else {
          if (isNullish(data?.tags) && partial) {
            rerender();
          }
        }
      });
    return () => subscription.unsubscribe();
  }, []);

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
    [],
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
    styles: {
      ...({
        valueContainer: (styles: CSSObjectWithLabel) => ({
          ...styles,
          paddingInlineStart: "0.5rem",
          paddingInlineEnd: "0.5rem",
          paddingTop: "2px",
          paddingBottom: "2px",
          gridGap: "0.25rem",
        }),
        option: (styles: CSSObjectWithLabel) => ({
          ...styles,
          display: "flex",
          padding: "0.25rem 1rem",
        }),
        menuList: (
          styles: CSSObjectWithLabel,
          { selectProps }: MenuListProps<TagSelection> & ReactSelectExtraProps,
        ) => {
          return {
            ...styles,
            ...((selectProps as any).canUpdateTags ? { paddingBottom: 0 } : {}),
          };
        },
      } as any),
      ...props.styles,
    },
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
    [props.isMulti, newTagColor],
  );

  const Component = canCreateTags
    ? AsyncCreatableSelect<TagSelection, IsMulti, never>
    : AsyncSelect<TagSelection, IsMulti, never>;

  return (
    <Component
      key={key}
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
        if (isNonNullish(maxItems) && selection.length >= maxItems) {
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
        canUpdateTags,
      } as any)}
    />
  );
}) as <IsMulti extends boolean = false>(
  props: TagSelectProps<IsMulti> & RefAttributes<TagSelectInstance<IsMulti>>,
) => ReactElement;

const _fragments = {
  Tag: gql`
    fragment TagSelect_Tag on Tag {
      id
      ...Tag_Tag
    }
  `,
};

const _queries = [
  gql`
    query TagSelect_tags($search: String, $tagIds: [GID!]) {
      tags(search: $search, tagIds: $tagIds) {
        items {
          ...TagSelect_Tag
        }
      }
    }
  `,
];

const _mutations = [
  gql`
    mutation TagSelect_createTag($name: String!, $color: String!) {
      createTag(name: $name, color: $color) {
        id
        ...TagSelect_Tag
      }
    }
  `,
];

interface ReactSelectExtraProps {
  newTagColor: string;
  canUpdateTags?: () => void;
  canCreateTags?: boolean;
}

function NoOptionsMessage(props: NoticeProps & { selectProps: ReactSelectExtraProps }) {
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
}

function SingleValue(props: SingleValueProps<TagSelection>) {
  return (
    <components.SingleValue {...props}>
      <Flex>
        <Tag tag={props.data} />
      </Flex>
    </components.SingleValue>
  );
}

function MultiValue({ data, removeProps, innerProps }: MultiValueProps<TagSelection>) {
  return (
    <Tag
      tag={data}
      isRemovable
      onRemove={removeProps.onClick}
      minWidth="0"
      {...(innerProps as any)}
    />
  );
}

function Option(props: OptionProps<TagSelection> & { selectProps: ReactSelectExtraProps }) {
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
                marginStart="0.5rem"
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
}

function MenuList(props: MenuListProps<TagSelection> & { selectProps: ReactSelectExtraProps }) {
  const {
    selectProps: { canUpdateTags },
  } = props;
  const showManageTagsDialog = useManageTagsDialog();
  const handleEditTags = async () => {
    await withError(showManageTagsDialog());
  };
  return (
    <components.MenuList {...props}>
      {props.children}
      {props.options.length > 0 && canUpdateTags ? (
        <Box position="sticky" bottom="0" padding={2} backgroundColor="white">
          <Button
            width="100%"
            size="sm"
            variant="outline"
            fontWeight="normal"
            leftIcon={<EditIcon position="relative" top="-1px" />}
            onClick={handleEditTags}
          >
            <FormattedMessage id="component.tag-select.manage-tags" defaultMessage="Manage tags" />
          </Button>
        </Box>
      ) : null}
    </components.MenuList>
  );
}

function useGetTagValues<IsMulti extends boolean = false>(
  value: If<IsMulti, TagSelection[] | string[], TagSelection | string | null>,
  isMulti: IsMulti,
  deps: DependencyList,
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
      }),
    );
    const missing = fromCache.filter(([, value]) => value === null).map(([id]) => id);
    if (missing.length) {
      try {
        const fromServer = await client.query({
          query: TagSelect_tagsDocument,
          variables: {
            tagIds: missing,
          },
          fetchPolicy: "network-only",
        });
        const fromServerById = indexBy(fromServer.data?.tags.items ?? [], (x) => x.id);
        const result = fromCache.map(([id, value]) => value ?? fromServerById[id]!);
        return isMulti ? result : result[0];
      } catch {}
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
      ...deps,
    ],

    isMulti ? [] : null,
  );
}

interface ManageTagsDialogData {
  tagId: string | null;
  name: string;
  color: string | null;
}

interface ManageTagsDialogProps extends DialogProps {}

export function ManageTagsDialog({ ...props }: ManageTagsDialogProps) {
  const {
    handleSubmit,
    register,
    reset,
    control,
    watch,
    setError,
    formState: { errors, isDirty },
  } = useForm<ManageTagsDialogData>({
    mode: "onSubmit",
    defaultValues: {
      tagId: null,
      name: "",
      color: null,
    },
  });

  const canDeleteTags = useHasPermission("TAGS:DELETE_TAGS");
  const [updateTag, { loading: isUpdating }] = useMutation(ManageTagsDialog_updateTagDocument);
  const tagId = watch("tagId");

  const [selectedTag, setSelectedTag] = useState<TagSelect_TagFragment | null>(null);

  const showGenericErrorToast = useGenericErrorToast();
  const deleteTag = useDeleteTag();
  const handleDeleteTag = async () => {
    try {
      const result = await deleteTag({ id: tagId!, name: selectedTag!.name });

      if (result === "SUCCESS") {
        reset({ tagId: null, name: "", color: null });
        setSelectedTag(null);
      } else {
        showGenericErrorToast();
      }
    } catch {}
  };

  return (
    <ConfirmDialog
      {...props}
      content={{
        containerProps: {
          as: "form",
          onSubmit: handleSubmit(async ({ tagId, color, name }) => {
            try {
              await updateTag({
                variables: { id: tagId!, data: { color, name } },
                update(cache) {
                  cache.evict({ fieldName: "tags", args: { search: "" } });
                  cache.gc();
                },
              });
              reset({ tagId, color, name });
            } catch (e) {
              if (isApolloError(e, "TAG_ALREADY_EXISTS")) {
                setError("name", { type: "unavailable" });
              }
            }
          }),
        },
      }}
      hasCloseButton
      closeOnEsc
      header={
        <Stack direction="row" alignItems="center">
          <EditIcon position="relative" />
          <Text as="div" flex="1">
            <FormattedMessage
              id="component.manage-tags-dialog.header"
              defaultMessage="Manage tags"
            />
          </Text>
        </Stack>
      }
      body={
        <Box>
          <FormControl>
            <FormLabel>
              <FormattedMessage id="component.manage-tags-dialog.tag-label" defaultMessage="Tag" />
            </FormLabel>
            <Controller
              name="tagId"
              control={control}
              render={({ field }) => (
                <TagSelect
                  value={field.value}
                  onChange={(tag) => {
                    setSelectedTag(tag);
                    reset({ tagId: tag!.id, name: tag!.name, color: tag!.color });
                  }}
                />
              )}
            />
          </FormControl>
          <Grid gridTemplateColumns="auto 1fr" alignItems="center" gridRowGap={2} marginTop={4}>
            <FormControl as={NoElement} isDisabled={isNullish(tagId)} isInvalid={!!errors.name}>
              <FormLabel marginBottom="0">
                <FormattedMessage id="generic.rename" defaultMessage="Rename" />
              </FormLabel>
              <Input {...register("name", { required: true, validate: { isNotEmptyText } })} />

              <FormErrorMessage gridColumn="2" marginTop={0}>
                {errors.name?.type === "unavailable" ? (
                  <FormattedMessage
                    id="component.manage-tags-dialog.existing-tag"
                    defaultMessage="A tag with the same name already exists"
                  />
                ) : (
                  <FormattedMessage
                    id="generic.field-required-error"
                    defaultMessage="This field is required"
                  />
                )}
              </FormErrorMessage>
            </FormControl>
            <FormControl as={NoElement} isDisabled={isNullish(tagId)}>
              <FormLabel marginBottom="0">
                <FormattedMessage
                  id="component.manage-tags-dialog.color-label"
                  defaultMessage="Color"
                />
              </FormLabel>
              <Controller
                name="color"
                control={control}
                render={({ field }) => (
                  <TagColorSelect
                    value={field.value}
                    onChange={(color) => {
                      field.onChange(color);
                    }}
                  />
                )}
              />
            </FormControl>
          </Grid>
        </Box>
      }
      confirm={
        <Button loading={isUpdating} disabled={!isDirty} type="submit" colorPalette="primary">
          <FormattedMessage id="generic.save-changes" defaultMessage="Save changes" />
        </Button>
      }
      alternative={
        canDeleteTags ? (
          <Button disabled={!tagId} colorPalette="red" variant="outline" onClick={handleDeleteTag}>
            <FormattedMessage id="generic.delete" defaultMessage="Delete" />
          </Button>
        ) : null
      }
      cancel={<></>}
    />
  );
}

ManageTagsDialog.mutations = [
  gql`
    mutation ManageTagsDialog_updateTag($id: GID!, $data: UpdateTagInput!) {
      updateTag(id: $id, data: $data) {
        ...TagSelect_Tag
      }
    }
  `,
];

export function useManageTagsDialog() {
  return useDialog(ManageTagsDialog);
}
