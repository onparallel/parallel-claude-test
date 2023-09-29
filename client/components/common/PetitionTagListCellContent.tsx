import { gql, useMutation } from "@apollo/client";
import { Box, Circle, Flex, List, ListItem, Stack, Text } from "@chakra-ui/react";
import { AddIcon } from "@parallel/chakra/icons";
import { SmallPopover } from "@parallel/components/common/SmallPopover";
import { Tag } from "@parallel/components/common/Tag";
import {
  PetitionTagListCellContent_PetitionBaseFragment,
  PetitionTagListCellContent_TagFragment,
  PetitionTagListCellContent_tagPetitionDocument,
  PetitionTagListCellContent_untagPetitionDocument,
} from "@parallel/graphql/__types";
import { MouseEvent, useRef, useState } from "react";
import { FormattedMessage } from "react-intl";
import { ActionMeta } from "react-select";
import { omit } from "remeda";
import scrollIntoView from "smooth-scroll-into-view-if-needed";
import { TagSelect, TagSelectInstance } from "./TagSelect";

type TagSelection = PetitionTagListCellContent_TagFragment;

export function PetitionTagListCellContent({
  petition,
}: {
  petition: PetitionTagListCellContent_PetitionBaseFragment;
}) {
  const selectWrapperRef = useRef<HTMLDivElement>(null);
  const selectRef = useRef<TagSelectInstance<true>>(null);
  const [isEditing, setIsEditing] = useState(false);

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

  const [tagPetition] = useMutation(PetitionTagListCellContent_tagPetitionDocument);
  const [untagPetition] = useMutation(PetitionTagListCellContent_untagPetitionDocument);
  const handleChange = async function (_: any, action: ActionMeta<TagSelection>) {
    switch (action.action) {
      case "select-option":
        await tagPetition({
          variables: { tagId: action.option!.id, petitionId: petition.id },
        });
        break;
      case "pop-value":
      case "remove-value":
        if (action.removedValue) {
          await untagPetition({
            variables: { tagId: action.removedValue.id, petitionId: petition.id },
          });
        }
        break;
    }
  };

  const tags = petition.tags;
  const sample = tags.length > 4 ? tags.slice(0, 3) : tags;
  const extra = tags.length > 4 ? tags.slice(3) : [];
  return (
    <Flex
      ref={selectWrapperRef}
      height="40px"
      alignItems="center"
      sx={{ scrollMarginTop: "38px" }}
      position="relative"
      onClick={handleClick}
    >
      {isEditing ? (
        <Box position="absolute" inset={0} zIndex="1">
          <TagSelect
            ref={selectRef}
            size="sm"
            isMulti
            defaultMenuIsOpen
            value={petition.tags}
            onBlur={() => setIsEditing(false)}
            onChange={handleChange}
            styles={{
              container: (styles) => ({ ...styles, width: "100%" }),
              valueContainer: (styles) => ({
                ...omit(styles as any, ["padding"]),
                paddingLeft: "0.5rem",
                paddingRight: "0.5rem",
                paddingTop: "6px",
                paddingBottom: "6px",
                fontSize: "14px",
                gridGap: "0.25rem",
              }),
              control: (styles, { isFocused, theme }: any) => ({
                ...styles,
                minHeight: "40px",
                borderRadius: 0,
                border: "none",
                boxShadow: isFocused ? `inset 0 0 0 2px ${theme.colors.primary}` : undefined,
              }),
            }}
            components={{ IndicatorsContainer }}
            allowCreatingTags
            allowUpdatingTags
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
          maxWidth="400px"
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
              <Circle border="1px solid" borderColor="gray.400" size="16px" role="presentation">
                <AddIcon fontSize="8px" color="gray.600" />
              </Circle>
              <Text as="div" whiteSpace="nowrap" fontSize="sm" color="gray.400">
                <FormattedMessage
                  id="component.petition-tag-list-cell-content.add-tags"
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
                id="component.petition-tag-list-cell-content.tags-x-more"
                defaultMessage="and <b>{extra} more</b>"
                values={{
                  extra: extra.length,
                  b: (chunks: any) => (
                    <SmallPopover
                      width="min-content"
                      placement="bottom-end"
                      content={
                        <Stack as={List} alignItems="flex-start">
                          {extra.map((tag) => (
                            <Tag key={tag.id} tag={tag} flex="0 1 auto" minWidth="0" as="li" />
                          ))}
                        </Stack>
                      }
                    >
                      <Text as="strong" color="primary.500" fontWeight="normal">
                        {chunks}
                      </Text>
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
        ...TagSelect_Tag
      }
      ${Tag.fragments.Tag}
      ${TagSelect.fragments.Tag}
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

PetitionTagListCellContent.mutations = [
  gql`
    mutation PetitionTagListCellContent_tagPetition($tagId: GID!, $petitionId: GID!) {
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
    mutation PetitionTagListCellContent_untagPetition($tagId: GID!, $petitionId: GID!) {
      untagPetition(tagId: $tagId, petitionId: $petitionId) {
        id
        tags {
          ...PetitionTagListCellContent_Tag
        }
      }
    }
    ${PetitionTagListCellContent.fragments.Tag}
  `,
];

const IndicatorsContainer = function () {
  return <></>;
};
