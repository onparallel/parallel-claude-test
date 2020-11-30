import { gql } from "@apollo/client";
import {
  Box,
  BoxProps,
  ButtonProps,
  IconButton,
  Input,
  InputProps,
  Stack,
  TextareaProps,
  Tooltip,
} from "@chakra-ui/core";
import {
  AddIcon,
  CopyIcon,
  DeleteIcon,
  DragHandleIcon,
  SettingsIcon,
} from "@parallel/chakra/icons";
import {
  PetitionComposeField_PetitionFieldFragment,
  PetitionFieldType,
  UpdatePetitionFieldInput,
} from "@parallel/graphql/__types";
import { generateCssStripe } from "@parallel/utils/css";
import { setNativeValue } from "@parallel/utils/setNativeValue";
import {
  forwardRef,
  memo,
  MouseEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { useDrag, useDrop, XYCoord } from "react-dnd";
import { useIntl } from "react-intl";
import { omit } from "remeda";
import { shallowEqualObjects } from "shallow-equal";
import { GrowingTextarea } from "../common/GrowingTextarea";
import { IconButtonWithTooltip } from "../common/IconButtonWithTooltip";
import { PetitionFieldTypeIndicator } from "../petition-common/PetitionFieldTypeIndicator";
import { AddFieldPopover } from "./AddFieldPopover";
import { SelectTypeFieldOptionsTextarea } from "./SelectTypeFieldOptionsTextarea";

export type PetitionComposeFieldProps = {
  field: PetitionComposeField_PetitionFieldFragment;
  fieldRelativeIndex: number | string;
  index: number;
  isActive: boolean;
  isLast: boolean;
  showError: boolean;
  titleFieldProps: InputProps;
  descriptionFieldProps: TextareaProps;
  selectOptionsFieldProps: TextareaProps;
  onMove?: (dragIndex: number, hoverIndex: number, dropped?: boolean) => void;
  onFieldEdit: (data: UpdatePetitionFieldInput) => void;
  onAddField: (type: PetitionFieldType, position: number) => void;
  onCloneClick: (event: MouseEvent<HTMLButtonElement>) => void;
  onSettingsClick: (event: MouseEvent<HTMLButtonElement>) => void;
  onDeleteClick: (event: MouseEvent<HTMLButtonElement>) => void;
} & BoxProps;

interface DragItem {
  index: number;
  id: string;
  type: string;
}

export const PetitionComposeField = Object.assign(
  memo(
    function PetitionComposeField({
      field,
      fieldRelativeIndex,
      index,
      isActive,
      isLast,
      showError,
      titleFieldProps,
      descriptionFieldProps,
      selectOptionsFieldProps,
      onMove,
      onFocus,
      onAddField,
      onCloneClick,
      onSettingsClick,
      onFieldEdit,
      onDeleteClick,
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
        onMove,
        field.isFixed ? "FIXED_FIELD" : "FIELD"
      );
      const [title, setTitle] = useState(field.title);
      const titleRef = useRef<HTMLInputElement>(null);
      const [description, setDescription] = useState(field.description);
      const descriptionRef = useRef<HTMLTextAreaElement>(null);

      // to make sure 'description' is set to null on client
      useEffect(() => {
        if (!field.isDescriptionShown) {
          setDescription(null);
        }
      }, [field.isDescriptionShown]);
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
          {isActive && !field.isFixed ? (
            <AddFieldButton
              className="add-field-before"
              position="absolute"
              top="-1px"
              left="50%"
              transform="translate(-50%, -50%)"
              zIndex="1"
              onSelectFieldType={(type) => onAddField(type, index)}
            />
          ) : null}
          <Box
            ref={previewRef}
            display="flex"
            flexDirection="row"
            opacity={isDragging ? 0 : 1}
            position="relative"
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
                        defaultMessage:
                          "Ask for the information that you need...",
                      })
                }
                value={title ?? ""}
                width="100%"
                maxLength={100}
                border="none"
                paddingX={2}
                height={6}
                marginBottom={1}
                _placeholder={
                  showError && !title ? { color: "red.500" } : undefined
                }
                _focus={{
                  boxShadow: "none",
                }}
                onFocus={(event) => event.target.select()}
                onChange={(event) => setTitle(event.target.value ?? null)}
                onBlur={() => {
                  const trimmed = title?.trim() ?? null;
                  setNativeValue(titleRef.current!, trimmed ?? "");
                  if (field.title !== trimmed) {
                    onFieldEdit({ title: trimmed });
                  }
                }}
                {...titleFieldProps}
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
                  onChange={(event) =>
                    setDescription(event.target.value ?? null)
                  }
                  onBlur={() => {
                    const trimmed = description?.trim() ?? null;
                    setNativeValue(descriptionRef.current!, trimmed ?? "");
                    if (field.description !== trimmed) {
                      onFieldEdit({ description: trimmed });
                    }
                  }}
                  {...descriptionFieldProps}
                />
              ) : null}
              {field.type === "SELECT" ? (
                <SelectTypeFieldOptionsTextarea
                  field={field}
                  onFieldEdit={onFieldEdit}
                  showError={showError}
                  {...selectOptionsFieldProps}
                />
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
          {isActive && !isLast ? (
            <AddFieldButton
              className="add-field-after"
              position="absolute"
              bottom={0}
              left="50%"
              transform="translate(-50%, 50%)"
              zIndex="1"
              onSelectFieldType={(type) => onAddField(type, index + 1)}
            />
          ) : null}
        </Box>
      );
    },
    (prevProps, nextProps) => {
      return (
        shallowEqualObjects(
          omit(prevProps, ["field"]),
          omit(nextProps, ["field"])
        ) && shallowEqualObjects(prevProps["field"], nextProps["field"])
      );
    }
  ),
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
          ...SelectTypeFieldOptionsTextarea_PetitionField
        }
        ${SelectTypeFieldOptionsTextarea.fragments.PetitionField}
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

const AddFieldButton = forwardRef<
  HTMLButtonElement,
  ButtonProps & {
    onSelectFieldType: (type: PetitionFieldType) => void;
  }
>(function AddFieldButton(props, ref) {
  const intl = useIntl();
  return (
    <Tooltip
      label={intl.formatMessage({
        id: "petition.add-field-button",
        defaultMessage: "Add field",
      })}
    >
      <AddFieldPopover
        as={IconButton}
        label={intl.formatMessage({
          id: "petition.add-field-button",
          defaultMessage: "Add field",
        })}
        icon={<AddIcon />}
        size="xs"
        variant="outline"
        rounded="full"
        backgroundColor="white"
        borderColor="gray.200"
        color="gray.500"
        _hover={{
          borderColor: "gray.300",
          color: "gray.800",
        }}
        _active={{
          backgroundColor: "gray.50",
        }}
        ref={ref as any}
        {...props}
      />
    </Tooltip>
  );
});
