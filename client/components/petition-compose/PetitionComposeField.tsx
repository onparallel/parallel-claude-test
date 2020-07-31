import { gql } from "@apollo/client";
import { Box, BoxProps, Input, Stack, Tooltip } from "@chakra-ui/core";
import {
  DeleteIcon,
  DragHandleIcon,
  SettingsIcon,
  CopyIcon,
} from "@parallel/chakra/icons";
import {
  PetitionComposeField_PetitionFieldFragment,
  UpdatePetitionFieldInput,
} from "@parallel/graphql/__types";
import { generateCssStripe } from "@parallel/utils/css";
import {
  ChangeEvent,
  FocusEvent,
  KeyboardEvent,
  memo,
  MouseEvent,
  useRef,
  useState,
} from "react";
import { useDrag, useDrop, XYCoord } from "react-dnd";
import { useIntl } from "react-intl";
import { GrowingTextarea } from "../common/GrowingTextarea";
import { IconButtonWithTooltip } from "../common/IconButtonWithTooltip";
import { PetitionFieldTypeIndicator } from "../petition-common/PetitionFieldTypeIndicator";

export type PetitionComposeFieldProps = {
  field: PetitionComposeField_PetitionFieldFragment;
  index: number;
  active: boolean;
  showError: boolean;
  onFocus: (event: FocusEvent) => void;
  onMove?: (dragIndex: number, hoverIndex: number, dropped?: boolean) => void;
  onFieldEdit: (data: UpdatePetitionFieldInput) => void;
  onCloneClick: (event: MouseEvent<HTMLButtonElement>) => void;
  onSettingsClick: (event: MouseEvent<HTMLButtonElement>) => void;
  onDeleteClick: (event: MouseEvent<HTMLButtonElement>) => void;
  onTitleKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  onDescriptionKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => void;
} & Omit<BoxProps, "onFocus">;

interface DragItem {
  index: number;
  id: string;
  type: string;
}

export const PetitionComposeField = Object.assign(
  memo(function PetitionComposeField({
    field,
    index,
    active,
    showError,
    onMove,
    onFocus,
    onCloneClick,
    onSettingsClick,
    onFieldEdit,
    onDeleteClick,
    onTitleKeyDown,
    onDescriptionKeyDown,
    ...props
  }: PetitionComposeFieldProps) {
    const intl = useIntl();
    const labels = {
      required: intl.formatMessage({
        id: "generic.required-field",
        defaultMessage: "Required field",
      }),
    };
    const { elementRef, dragRef, previewRef, isDragging } = useDragAndDrop(
      field.id,
      index,
      onMove
    );
    const [title, setTitle] = useState(field.title);
    const [description, setDescription] = useState(field.description);
    return (
      <Box
        ref={elementRef}
        borderY="1px solid"
        borderColor="gray.200"
        marginTop="-1px"
        aria-current={active ? "true" : "false"}
        sx={
          isDragging
            ? generateCssStripe({ size: "1rem", color: "gray.50" })
            : {}
        }
        onFocus={onFocus}
        {...props}
      >
        <Box
          ref={previewRef}
          display="flex"
          flexDirection="row"
          opacity={isDragging ? 0 : 1}
          position="relative"
          backgroundColor={active ? "purple.50" : "white"}
          sx={{
            "[draggable]": {
              opacity: 0,
              transition: "opacity 150ms",
            },
            ".field-actions": {
              display: "none",
            },
            "&:hover [draggable]": {
              opacity: 1,
            },
            "&:hover, &:focus-within": {
              backgroundColor: active ? "purple.50" : "gray.50",
              ".field-actions": {
                display: "block",
              },
            },
          }}
        >
          <Box
            ref={dragRef}
            display="flex"
            flexDirection="column"
            justifyContent="center"
            padding={2}
            width="32px"
            cursor="grab"
            color="gray.400"
            _hover={{
              color: "gray.700",
            }}
            aria-label={intl.formatMessage({
              id: "petition.drag-to-sort-label",
              defaultMessage: "Drag to sort this petition fields",
            })}
          >
            <DragHandleIcon role="presentation" />
          </Box>
          {field.optional ? null : (
            <Box marginX={-2} position="relative">
              <Tooltip
                placement="top"
                aria-label={labels.required}
                label={labels.required}
              >
                <Box
                  width={4}
                  height={4}
                  backgroundColor="red"
                  textAlign="center"
                  marginTop="13px"
                  fontSize="xl"
                  color="red.600"
                  userSelect="none"
                >
                  <Box position="relative" bottom="4px" pointerEvents="none">
                    *
                  </Box>
                </Box>
              </Tooltip>
            </Box>
          )}
          <Box marginLeft={3}>
            <PetitionFieldTypeIndicator
              type={field.type}
              index={index}
              onClick={(event) => onSettingsClick(event)}
              marginTop="10px"
              alignSelf="flex-start"
            />
          </Box>
          <Box
            flex="1"
            paddingLeft={2}
            paddingTop={2}
            paddingBottom={10}
            paddingRight={2}
          >
            <Input
              id={`field-title-${field.id}`}
              aria-label={intl.formatMessage({
                id: "petition.field-title-label",
                defaultMessage: "Field title",
              })}
              placeholder={intl.formatMessage({
                id: "petition.field-title-placeholder",
                defaultMessage: "Enter a field title",
              })}
              value={title ?? ""}
              width="100%"
              maxLength={255}
              border="none"
              paddingX={2}
              height={6}
              backgroundColor={showError && !title ? "red.100" : "transparent"}
              _focus={{
                boxShadow: "none",
              }}
              onFocus={(event: FocusEvent<HTMLInputElement>) =>
                event.target.select()
              }
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                setTitle(event.target.value ?? null)
              }
              onKeyDown={onTitleKeyDown}
              onBlur={() => {
                if (title !== field.title) {
                  onFieldEdit({ title });
                }
              }}
            />
            <GrowingTextarea
              id={`field-description-${field.id}`}
              placeholder={intl.formatMessage({
                id: "petition.field-description-placeholder",
                defaultMessage: "Add a description...",
              })}
              aria-label={intl.formatMessage({
                id: "petition.field-description-label",
                defaultMessage: "Field description",
              })}
              marginTop={1}
              fontSize="sm"
              background="transparent"
              value={description ?? ""}
              border="none"
              height="20px"
              paddingX={2}
              paddingY={0}
              minHeight={0}
              rows={1}
              _focus={{
                boxShadow: "none",
              }}
              onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
                setDescription(event.target.value ?? null)
              }
              onBlur={() => {
                if (description !== field.description) {
                  onFieldEdit({ description });
                }
              }}
              // chakra typings are wrong
              onKeyDown={onDescriptionKeyDown as any}
            />
          </Box>
          <Stack
            className="field-actions"
            position="absolute"
            bottom="0"
            right="0"
            direction="row"
            padding={1}
          >
            <IconButtonWithTooltip
              icon={<CopyIcon />}
              size="sm"
              variant="ghost"
              placement="bottom"
              color="gray.600"
              label={intl.formatMessage({
                id: "petition.field-clone",
                defaultMessage: "Clone field",
              })}
              onClick={onCloneClick}
            />
            <IconButtonWithTooltip
              icon={<SettingsIcon />}
              size="sm"
              variant="ghost"
              placement="bottom"
              color="gray.600"
              label={intl.formatMessage({
                id: "petition.field-settings",
                defaultMessage: "Field settings",
              })}
              onClick={(event) => onSettingsClick(event)}
            />
            <IconButtonWithTooltip
              icon={<DeleteIcon />}
              size="sm"
              variant="ghost"
              placement="bottom"
              color="gray.600"
              label={intl.formatMessage({
                id: "petition.field-delete-button",
                defaultMessage: "Delete field",
              })}
              onClick={(event) => onDeleteClick(event)}
            />
          </Stack>
        </Box>
      </Box>
    );
  }),
  {
    fragments: {
      PetitionField: gql`
        fragment PetitionComposeField_PetitionField on PetitionField {
          id
          type
          title
          description
          optional
          multiple
        }
      `,
    },
  }
);

function useDragAndDrop(
  id: string,
  index: number,
  onMove?: (dragIndex: number, hoverIndex: number, dropped?: boolean) => void
) {
  const elementRef = useRef<HTMLDivElement>(null);

  const [, drop] = useDrop<DragItem, unknown, any>({
    accept: "FIELD",
    hover(item, monitor) {
      if (!elementRef.current) {
        return;
      }
      const dragIndex = item.index;
      const hoverIndex = index;

      // Don't replace items with themselves
      if (dragIndex === hoverIndex) {
        return;
      }

      // Determine rectangle on screen
      const hoverBoundingRect = elementRef.current!.getBoundingClientRect();

      // Get vertical middle
      const hoverMiddleY =
        (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;

      // Determine mouse position
      const clientOffset = monitor.getClientOffset();

      // Get pixels to the top
      const hoverClientY = (clientOffset as XYCoord).y - hoverBoundingRect.top;

      // Only perform the move when the mouse has crossed half of the items height
      // When dragging downwards, only move when the cursor is below 50%
      // When dragging upwards, only move when the cursor is above 50%

      // Dragging downwards
      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return;
      }

      // Dragging upwards
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return;
      }

      // Time to actually perform the action
      onMove?.(dragIndex, hoverIndex);

      // Note: we're mutating the monitor item here!
      // Generally it's better to avoid mutations,
      // but it's good here for the sake of performance
      // to avoid expensive index searches.
      item.index = hoverIndex;
    },
  });

  const [{ isDragging }, dragRef, previewRef] = useDrag({
    item: { type: "FIELD", id, index },
    collect: (monitor: any) => {
      return {
        isDragging: monitor.isDragging(),
      };
    },
    end: (dropResult, monitor) => {
      const { index: hoverIndex } = monitor.getItem();
      onMove?.(index, hoverIndex, true);
    },
  });

  drop(elementRef);
  return { elementRef, dragRef, previewRef, isDragging };
}
