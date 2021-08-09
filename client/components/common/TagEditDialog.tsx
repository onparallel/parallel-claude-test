import { gql } from "@apollo/client";
import {
  Box,
  Button,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Grid,
  Input,
  Stack,
  Text,
} from "@chakra-ui/react";
import { EditIcon } from "@parallel/chakra/icons";
import {
  TagEditDialog_TagFragment,
  useTagEditDialog_tagsQuery,
  useTagEditDialog_updateTagMutation,
} from "@parallel/graphql/__types";
import { withError } from "@parallel/utils/promises/withError";
import { useReactSelectProps } from "@parallel/utils/react-select/hooks";
import { useDebouncedCallback } from "@parallel/utils/useDebouncedCallback";
import { ReactNode, useEffect, useState } from "react";
import { FormattedMessage } from "react-intl";
import Select, { components, Props as SelectProps } from "react-select";
import { maxBy, pick } from "remeda";
import { ConfirmDialog } from "./ConfirmDialog";
import { DialogProps, useDialog } from "./DialogProvider";
import { Tag } from "./Tag";
import { TagColorSelect } from "./TagColorSelect";

type TagSelection = TagEditDialog_TagFragment;

export function TagEditDialog({ ...props }: DialogProps) {
  const { data } = useTagEditDialog_tagsQuery({
    fetchPolicy: "cache-and-network",
  });
  const isDisabled = !data || data.tags.items.length === 0;
  const [tag, setTag] = useState<TagSelection | null>(null);
  const [error, setError] = useState<string | undefined>();
  const [updateTag] = useTagEditDialog_updateTagMutation();
  useEffect(() => {
    if (data && data.tags.items.length > 0 && tag === null) {
      const selected = maxBy(data.tags.items, (t) => new Date(t.createdAt).valueOf());
      setTag({ ...selected! });
    }
  }, [data]);
  useEffect(() => {
    if (data) {
      const selected = maxBy(data.tags.items, (t) => new Date(t.createdAt).valueOf());
      setTag({ ...selected! });
    }
  }, []);
  const handleTagChange = useDebouncedCallback(
    async function (tag: TagSelection) {
      if (tag.name.trim().length > 0) {
        const [error] = await withError(
          updateTag({
            variables: { id: tag.id, data: pick(tag, ["name", "color"]) },
          })
        );
        if (error) {
          setError((error as any).graphQLErrors?.[0]?.extensions?.code);
        }
      }
    },
    300,
    []
  );
  return (
    <ConfirmDialog
      {...props}
      header={
        <Stack direction="row" alignItems="center">
          <EditIcon position="relative" />
          <Text as="div" flex="1">
            <FormattedMessage id="components.tag-edit-dialog.header" defaultMessage="Edit tags" />
          </Text>
        </Stack>
      }
      body={
        <Box>
          <FormControl isDisabled={isDisabled}>
            <FormLabel>
              <FormattedMessage id="components.tag-edit-dialog.tag-label" defaultMessage="Tag" />
            </FormLabel>
            <TagSelect
              value={tag}
              options={data?.tags.items ?? []}
              onChange={(tag) => setTag({ ...tag! })}
            />
          </FormControl>
          <Grid gridTemplateColumns="auto 1fr" alignItems="center" gridRowGap={2} marginTop={4}>
            <FormControl as={NoElement} isDisabled={isDisabled} isInvalid={!!error}>
              <FormLabel marginBottom="0">
                <FormattedMessage
                  id="components.tag-edit-dialog.name-label"
                  defaultMessage="Edit text"
                />
              </FormLabel>
              <Input
                value={tag?.name ?? ""}
                onChange={(e) => {
                  const name = e.target.value;
                  setTag({ ...tag!, name });
                  handleTagChange({ ...tag!, name });
                }}
                onBlur={() => handleTagChange.immediateIfPending(tag!)}
              />
              {error === "TAG_ALREADY_EXISTS" ? (
                <FormErrorMessage gridColumn="2" marginTop={0}>
                  <FormattedMessage
                    id="components.tag-edit-dialog.existing-tag"
                    defaultMessage="A tag with the same name already exists"
                  />
                </FormErrorMessage>
              ) : null}
            </FormControl>
            <FormControl as={NoElement} isDisabled={isDisabled}>
              <FormLabel marginBottom="0">
                <FormattedMessage
                  id="components.tag-edit-dialog.color-label"
                  defaultMessage="Color"
                />
              </FormLabel>
              <TagColorSelect
                value={tag?.color ?? null}
                onChange={(color) => {
                  setTag({ ...tag!, color: color! });
                  handleTagChange.immediate({ ...tag!, color: color! });
                }}
              />
            </FormControl>
          </Grid>
        </Box>
      }
      confirm={
        <Button colorScheme="purple" onClick={() => props.onResolve()}>
          <FormattedMessage id="generic.done" defaultMessage="Done" />
        </Button>
      }
      cancel={<></>}
    />
  );
}

function NoElement({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

TagEditDialog.fragments = {
  get Tag() {
    return gql`
      fragment TagEditDialog_Tag on Tag {
        id
        ...Tag_Tag
        createdAt
      }
      ${Tag.fragments.Tag}
    `;
  },
};

TagEditDialog.queries = {
  tags: gql`
    query TagEditDialog_tags {
      tags {
        items {
          ...TagEditDialog_Tag
        }
      }
    }
    ${TagEditDialog.fragments.Tag}
  `,
};

TagEditDialog.mutations = [
  gql`
    mutation TagEditDialog_updateTag($id: GID!, $data: UpdateTagInput!) {
      updateTag(id: $id, data: $data) {
        ...TagEditDialog_Tag
      }
    }
    ${TagEditDialog.fragments.Tag}
  `,
];

export function useTagEditDialog() {
  return useDialog(TagEditDialog);
}

function TagSelect({ value, onChange, ...props }: SelectProps<TagSelection, false, never>) {
  const rsProps = useReactSelectProps<TagSelection, false, never>({
    components: {
      SingleValue: ({ data: tag, innerProps }) => {
        return <Tag tag={tag as TagSelection} minWidth="0" {...innerProps} />;
      },
      Option: (props) => {
        return (
          <components.Option {...props}>
            <Tag
              flex="0 1 auto"
              minWidth="0"
              tag={props.data as TagSelection}
              // boxShadow={props.isFocused ? "outline" : "none"}
            />
          </components.Option>
        );
      },
    },
    styles: {
      valueContainer: (styles) => ({
        ...styles,
        flexWrap: "nowrap",
        paddingLeft: "1rem",
        paddingRight: "1rem",
      }),
      option: (styles, { isFocused, theme }) => ({
        ...styles,
        display: "flex",
        padding: "0.25rem 1rem",
      }),
    },
  });

  return (
    <Select
      {...rsProps}
      getOptionValue={(o) => o.id}
      getOptionLabel={(o) => o.name}
      value={value}
      onChange={onChange}
      {...props}
    />
  );
}
