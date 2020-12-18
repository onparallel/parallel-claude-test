import { gql } from "@apollo/client";
import { Box, Input, Stack, Tooltip } from "@chakra-ui/react";
import {
  CopyIcon,
  DeleteIcon,
  DragHandleIcon,
  SettingsIcon,
} from "@parallel/chakra/icons";
import { chakraForwardRef } from "@parallel/chakra/utils";
import {
  PetitionComposeField_PetitionFieldFragment,
  UpdatePetitionFieldInput,
} from "@parallel/graphql/__types";
import { generateCssStripe } from "@parallel/utils/css";
import { setNativeValue } from "@parallel/utils/setNativeValue";
import { isSelectionExpanded } from "@udecode/slate-plugins";
import { memo, MouseEvent, useEffect, useMemo, useRef, useState } from "react";
import { useDrag, useDrop, XYCoord } from "react-dnd";
import { useIntl } from "react-intl";
import { omit } from "remeda";
import { shallowEqualObjects } from "shallow-equal";
import { Editor, Point } from "slate";
import { GrowingTextarea } from "../common/GrowingTextarea";
import { IconButtonWithTooltip } from "../common/IconButtonWithTooltip";
import { PetitionFieldTypeIndicator } from "../petition-common/PetitionFieldTypeIndicator";
import {
  SelectTypeFieldOptions,
  SelectTypeFieldOptionsRef,
} from "./SelectTypeFieldOptions";

export interface PetitionComposeFieldProps {
  field: PetitionComposeField_PetitionFieldFragment;
  fieldRelativeIndex: number | string;
  index: number;
  isActive: boolean;
  showError: boolean;
  onMove?: (dragIndex: number, hoverIndex: number, dropped?: boolean) => void;
  onFieldEdit: (data: UpdatePetitionFieldInput) => void;
  onCloneClick: (event: MouseEvent<HTMLButtonElement>) => void;
  onSettingsClick: (event: MouseEvent<HTMLButtonElement>) => void;
  onDeleteClick: (event: MouseEvent<HTMLButtonElement>) => void;
  onFocusNextField: () => void;
  onFocusPrevField: () => void;
  onAddField: () => void;
}

interface DragItem {
  index: number;
  id: string;
  type: string;
}

export type PetitionComposeFieldRef = {
  focusFromPrevious: () => void;
  focusFromNext: () => void;
};

const _PetitionComposeField = chakraForwardRef<
  "div",
  PetitionComposeFieldProps,
  PetitionComposeFieldRef
>(function PetitionComposeField(
  {
    field,
    fieldRelativeIndex,
    index,
    isActive,
    showError,
    onMove,
    onFocus,
    onCloneClick,
    onSettingsClick,
    onFieldEdit,
    onDeleteClick,
    onFocusNextField,
    onFocusPrevField,
    onAddField,
    ...props
  },
  ref
) {
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
    onMove,
    field.isFixed ? "FIXED_FIELD" : "FIELD"
  );
  const [title, setTitle] = useState(field.title);
  const titleRef = useRef<HTMLInputElement>(null);
  const [description, setDescription] = useState(field.description);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const selectFieldOptionsRef = useRef<SelectTypeFieldOptionsRef>(null);

  // to make sure 'description' is set to null on client
  useEffect(() => {
    if (!field.isDescriptionShown) {
      setDescription(null);
    }
  }, [field.isDescriptionShown]);

  const _ref = useMemo(
    () =>
      ({
        focusFromPrevious: () => {
          const input = titleRef.current!;
          input.focus();
          input.setSelectionRange(0, 0);
        },
        focusFromNext: () => {
          if (field.type === "SELECT") {
            selectFieldOptionsRef.current!.focus("END");
          } else if (field.isDescriptionShown) {
            const textarea = descriptionRef.current!;
            textarea.focus();
            textarea.selectionStart = textarea.selectionEnd = 0;
          } else {
            const input = titleRef.current!;
            input.focus();
            input.selectionStart = input.selectionEnd = 0;
          }
        },
      } as PetitionComposeFieldRef),
    [field]
  );
  if (typeof ref === "function") {
    ref(_ref);
  } else if (ref) {
    ref.current = _ref;
  }

  return (
    <Box
      ref={elementRef}
      borderY="1px solid"
      borderColor="gray.200"
      marginY="-1px"
      aria-current={isActive ? "true" : "false"}
      position="relative"
      sx={{
        ...(isDragging &&
          generateCssStripe({ size: "1rem", color: "gray.50" })),
      }}
      onFocus={onFocus}
      {...props}
    >
      <Box
        ref={previewRef}
        display="flex"
        flexDirection="row"
        opacity={isDragging ? 0 : 1}
        minHeight="102px"
        backgroundColor={isActive ? "purple.50" : "white"}
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
            backgroundColor: isActive ? "purple.50" : "gray.50",
            ".field-actions": {
              display: "block",
            },
          },
        }}
      >
        {field.isFixed ? (
          <Box width="32px" />
        ) : (
          <Box
            ref={dragRef}
            display="flex"
            flexDirection="column"
            justifyContent="center"
            padding={2}
            width="32px"
            cursor={field.isFixed ? "unset" : "grab"}
            color="gray.400"
            _hover={{
              color: "gray.700",
            }}
            aria-label={intl.formatMessage({
              id: "petition.drag-to-sort-label",
              defaultMessage: "Drag to sort this petition fields",
            })}
          >
            <Tooltip
              label={intl.formatMessage({
                id: "generic.drag-to-sort",
                defaultMessage: "Drag to sort",
              })}
            >
              <DragHandleIcon role="presentation" />
            </Tooltip>
          </Box>
        )}
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
            relativeIndex={fieldRelativeIndex}
            as={field.isFixed ? "div" : "button"}
            onClick={field.isFixed ? undefined : onSettingsClick}
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
            ref={titleRef}
            aria-label={intl.formatMessage({
              id: "petition.field-title-label",
              defaultMessage: "Field title",
            })}
            placeholder={
              field.type === "HEADING"
                ? intl.formatMessage({
                    id: "petition.field-title-heading-placeholder",
                    defaultMessage:
                      "Enter an introductory title for this section...",
                  })
                : field.type === "FILE_UPLOAD"
                ? intl.formatMessage({
                    id: "petition.field-title-file-upload-placeholder",
                    defaultMessage: "Describe the file(s) that you need...",
                  })
                : intl.formatMessage({
                    id: "petition.field-title-generic-placeholder",
                    defaultMessage: "Ask for the information that you need...",
                  })
            }
            value={title ?? ""}
            width="100%"
            maxLength={500}
            border="none"
            paddingX={2}
            height={6}
            marginBottom={1}
            _placeholder={
              showError && !title ? { color: "red.500" } : undefined
            }
            _focus={{ boxShadow: "none" }}
            onChange={(event) => setTitle(event.target.value ?? null)}
            onBlur={() => {
              const trimmed = title?.trim() ?? null;
              setNativeValue(titleRef.current!, trimmed ?? "");
              if (field.title !== trimmed) {
                onFieldEdit({ title: trimmed });
              }
            }}
            onKeyDown={(event) => {
              switch (event.key) {
                case "ArrowDown":
                  event.preventDefault();
                  if (field.isDescriptionShown) {
                    descriptionRef.current!.focus();
                  } else if (field.type === "SELECT") {
                    selectFieldOptionsRef.current!.focus("START");
                  } else {
                    onFocusNextField();
                  }
                  break;
                case "ArrowUp":
                  event.preventDefault();
                  onFocusPrevField();
                  break;
              }
            }}
            onKeyUp={(event) => {
              switch (event.key) {
                case "Enter":
                  onAddField();
                  break;
              }
            }}
          />
          {field.isDescriptionShown ? (
            <GrowingTextarea
              id={`field-description-${field.id}`}
              ref={descriptionRef}
              placeholder={intl.formatMessage({
                id: "petition.field-description-placeholder",
                defaultMessage: "Add a description...",
              })}
              aria-label={intl.formatMessage({
                id: "petition.field-description-label",
                defaultMessage: "Field description",
              })}
              fontSize="sm"
              background="transparent"
              value={description ?? ""}
              maxLength={4000}
              border="none"
              height="20px"
              paddingX={2}
              paddingY={0}
              minHeight={0}
              rows={1}
              _focus={{
                boxShadow: "none",
              }}
              onChange={(event) => setDescription(event.target.value ?? null)}
              onBlur={() => {
                const trimmed = description?.trim() ?? null;
                setNativeValue(descriptionRef.current!, trimmed ?? "");
                if (field.description !== trimmed) {
                  onFieldEdit({ description: trimmed });
                }
              }}
              onKeyDown={(event) => {
                const textarea = event.target as HTMLTextAreaElement;
                const totalLines =
                  (textarea.value.match(/\n/g) ?? []).length + 1;
                const beforeCursor = textarea.value.substr(
                  0,
                  textarea.selectionStart
                );
                const currentLine = (beforeCursor.match(/\n/g) ?? []).length;
                switch (event.key) {
                  case "ArrowDown":
                    if (currentLine === totalLines - 1) {
                      if (field.type === "SELECT") {
                        selectFieldOptionsRef.current!.focus("START");
                      } else {
                        onFocusNextField();
                      }
                    }
                    break;
                  case "ArrowUp":
                    if (currentLine === 0) {
                      titleRef.current!.focus();
                    }
                    break;
                }
              }}
            />
          ) : null}
          {field.type === "SELECT" ? (
            <Box marginTop={1}>
              <SelectTypeFieldOptions
                ref={selectFieldOptionsRef}
                field={field}
                onFieldEdit={onFieldEdit}
                showError={showError}
                onKeyDown={(event) => {
                  const { editor } = selectFieldOptionsRef.current!;

                  if (editor.selection && isSelectionExpanded(editor)) {
                    return;
                  }
                  const anchor = editor.selection?.anchor;
                  if (!anchor) {
                    return;
                  }

                  switch (event.key) {
                    case "ArrowDown":
                      const atEnd = Point.equals(
                        anchor,
                        Editor.end(editor, [])
                      );
                      if (atEnd) {
                        onFocusNextField();
                      }
                      break;
                    case "ArrowUp":
                      const atStart = Point.equals(
                        anchor,
                        Editor.start(editor, [])
                      );
                      if (atStart) {
                        if (field.isDescriptionShown) {
                          descriptionRef.current!.focus();
                        } else {
                          titleRef.current!.focus();
                        }
                      }
                      break;
                  }
                }}
              />
            </Box>
          ) : null}
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
            onClick={onSettingsClick}
          />
          <IconButtonWithTooltip
            icon={<DeleteIcon />}
            disabled={field.isFixed}
            size="sm"
            variant="ghost"
            placement="bottom"
            color="gray.600"
            label={intl.formatMessage({
              id: "petition.field-delete-button",
              defaultMessage: "Delete field",
            })}
            onClick={onDeleteClick}
          />
        </Stack>
      </Box>
    </Box>
  );
});

export const PetitionComposeField = Object.assign(
  memo(_PetitionComposeField, (prevProps, nextProps) => {
    return (
      shallowEqualObjects(
        omit(prevProps, ["field"]),
        omit(nextProps, ["field"])
      ) && shallowEqualObjects(prevProps["field"], nextProps["field"])
    );
  }) as typeof _PetitionComposeField,
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
          isFixed
          isDescriptionShown @client
          ...SelectTypeFieldOptions_PetitionField
        }
        ${SelectTypeFieldOptions.fragments.PetitionField}
      `,
    },
  }
);

function useDragAndDrop(
  id: string,
  index: number,
  onMove?: (dragIndex: number, hoverIndex: number, dropped?: boolean) => void,
  type = "FIELD"
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

      if (type === "FIELD") {
        // Time to actually perform the action
        onMove?.(dragIndex, hoverIndex);

        // Note: we're mutating the monitor item here!
        // Generally it's better to avoid mutations,
        // but it's good here for the sake of performance
        // to avoid expensive index searches.
        item.index = hoverIndex;
      }
    },
  });

  const [{ isDragging }, dragRef, previewRef] = useDrag({
    item: { type, id, index },
    canDrag: () => type === "FIELD",
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
