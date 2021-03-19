import { gql } from "@apollo/client";
import {
  Box,
  FormControl,
  FormLabel,
  IconButton,
  Input,
  Stack,
  Switch,
  Text,
  Tooltip,
} from "@chakra-ui/react";
import {
  ConditionFullIcon,
  CopyIcon,
  DeleteIcon,
  DragHandleIcon,
  SettingsIcon,
} from "@parallel/chakra/icons";
import { chakraForwardRef } from "@parallel/chakra/utils";
import {
  PetitionComposeField_PetitionFieldFragment,
  PetitionFieldVisibilityEditor_PetitionFieldFragment,
  UpdatePetitionFieldInput,
} from "@parallel/graphql/__types";
import { useAssignMemoRef } from "@parallel/utils/assignRef";
import { compareWithFragments } from "@parallel/utils/compareWithFragments";
import { generateCssStripe } from "@parallel/utils/css";
import { PetitionFieldIndex } from "@parallel/utils/fieldIndices";
import { setNativeValue } from "@parallel/utils/setNativeValue";
import { memo, useCallback, useRef, useState } from "react";
import { useDrag, useDrop, XYCoord } from "react-dnd";
import { FormattedMessage, useIntl } from "react-intl";
import { GrowingTextarea } from "../common/GrowingTextarea";
import { IconButtonWithTooltip } from "../common/IconButtonWithTooltip";
import { SmallPopover } from "../common/SmallPopover";
import { PetitionFieldTypeIndicator } from "../petition-common/PetitionFieldTypeIndicator";
import { PetitionFieldVisibilityEditor } from "./PetitionFieldVisibilityEditor";
import {
  SelectTypeFieldOptions,
  SelectTypeFieldOptionsRef,
} from "./SelectTypeFieldOptions";

export interface PetitionComposeFieldProps {
  field: PetitionComposeField_PetitionFieldFragment;
  fields: PetitionFieldVisibilityEditor_PetitionFieldFragment[];
  fieldIndex: PetitionFieldIndex;
  index: number;
  isActive: boolean;
  showError: boolean;
  onMove: (dragIndex: number, hoverIndex: number, dropped?: boolean) => void;
  onFieldEdit: (data: UpdatePetitionFieldInput) => void;
  onCloneField: () => void;
  onSettingsClick: () => void;
  onFieldVisibilityClick: () => void;
  onDeleteClick: () => void;
  onFocusNextField: () => void;
  onFocusPrevField: () => void;
  onAddField: () => void;
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
    fields,
    fieldIndex,
    index,
    isActive,
    showError,
    onMove,
    onFocus,
    onCloneField,
    onSettingsClick,
    onDeleteClick,
    onFieldEdit,
    onFieldVisibilityClick,
    onFocusNextField,
    onFocusPrevField,
    onAddField,
    ...props
  },
  ref
) {
  const intl = useIntl();
  const { elementRef, dragRef, previewRef, isDragging } = useDragAndDrop(
    field.id,
    index,
    onMove,
    field.isFixed ? "FIXED_FIELD" : "FIELD"
  );
  const canChangeVisibility =
    fields
      .slice(
        0,
        fields.findIndex((f) => f.id === field.id)
      )
      .filter((f) => !f.isReadOnly).length > 0;
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
              display: "flex",
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
              id: "component.petition-compose-field.drag-to-sort-label",
              defaultMessage: "Drag to sort this petition fields",
            })}
          >
            <DragHandleIcon role="presentation" />
          </Box>
        )}
        {field.optional ? null : (
          <Box marginX={-2} position="relative">
            <Tooltip
              placement="top"
              label={intl.formatMessage({
                id: "generic.required-field",
                defaultMessage: "Required field",
              })}
            >
              <Box
                width={4}
                height={4}
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
            fieldIndex={fieldIndex}
            as={field.isFixed ? "div" : "button"}
            onClick={field.isFixed ? undefined : onSettingsClick}
            marginTop="10px"
            alignSelf="flex-start"
          />
        </Box>
        <PetitionComposeFieldInner
          ref={ref}
          flex="1"
          paddingLeft={2}
          paddingTop={2}
          paddingBottom={10}
          paddingRight={4}
          field={field}
          fields={fields}
          showError={showError}
          onFieldEdit={onFieldEdit}
          onFocusNextField={onFocusNextField}
          onFocusPrevField={onFocusPrevField}
          onAddField={onAddField}
        />
        <PetitionComposeFieldActions
          field={field}
          canChangeVisibility={canChangeVisibility}
          onCloneField={onCloneField}
          onSettingsClick={onSettingsClick}
          onDeleteClick={onDeleteClick}
          onVisibilityClick={onFieldVisibilityClick}
          className="field-actions"
          position="absolute"
          bottom={0}
          right={2}
        />
      </Box>
    </Box>
  );
});

type PetitionComposeFieldInnerProps = Pick<
  PetitionComposeFieldProps,
  | "field"
  | "fields"
  | "showError"
  | "onFieldEdit"
  | "onFocusNextField"
  | "onFocusPrevField"
  | "onAddField"
>;

// This component was extracted so the whole PetitionComposeField doesn't rerender
// when the fieldIndex changes
const _PetitionComposeFieldInner = chakraForwardRef<
  "div",
  PetitionComposeFieldInnerProps,
  PetitionComposeFieldRef
>(function PetitionComposeFieldInner(
  {
    field,
    fields,
    showError,
    onFieldEdit,
    onFocusNextField,
    onFocusPrevField,
    onAddField,
    ...props
  },
  ref
) {
  const intl = useIntl();
  const [title, setTitle] = useState(field.title);
  const titleRef = useRef<HTMLInputElement>(null);
  const focusTitle = useCallback((atStart?: boolean) => {
    const input = titleRef.current!;
    input.focus();
    if (atStart) {
      input.setSelectionRange(0, 0);
    }
  }, []);

  const [description, setDescription] = useState(field.description);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const focusDescription = useCallback((atStart?: boolean) => {
    const textarea = descriptionRef.current!;
    textarea.focus();
    if (atStart) {
      textarea.selectionStart = textarea.selectionEnd = 0;
    }
  }, []);

  const selectFieldOptionsRef = useRef<SelectTypeFieldOptionsRef>(null);
  const focusSelectOptions = useCallback((atStart?: boolean) => {
    selectFieldOptionsRef.current?.focus(atStart ? "START" : undefined);
  }, []);

  useAssignMemoRef(
    ref,
    () =>
      ({
        focusFromPrevious: () => focusTitle(true),
        focusFromNext: () => {
          if (field.type === "SELECT") {
            focusSelectOptions(true);
          } else if (field.description) {
            focusDescription(true);
          } else {
            focusTitle(true);
          }
        },
      } as PetitionComposeFieldRef),
    [field]
  );

  return (
    <Box {...props}>
      <Stack direction="row" marginBottom={1}>
        <Box flex={1}>
          <Input
            id={`field-title-${field.id}`}
            ref={titleRef}
            aria-label={intl.formatMessage({
              id: "component.petition-compose-field.field-title-label",
              defaultMessage: "Field title",
            })}
            isTruncated
            placeholder={
              field.type === "HEADING"
                ? intl.formatMessage({
                    id:
                      "component.petition-compose-field.heading-title-placeholder",
                    defaultMessage:
                      "Enter an introductory title for this section...",
                  })
                : field.type === "FILE_UPLOAD"
                ? intl.formatMessage({
                    id:
                      "component.petition-compose-field.file-upload-title-placeholder",
                    defaultMessage: "Describe the file(s) that you need...",
                  })
                : intl.formatMessage({
                    id:
                      "component.petition-compose-field.generic-title-placeholder",
                    defaultMessage: "Ask for the information that you need...",
                  })
            }
            value={title ?? ""}
            width="100%"
            maxLength={500}
            border="none"
            paddingX={2}
            height={6}
            _placeholder={
              showError && !title ? { color: "red.500" } : undefined
            }
            _focus={{ boxShadow: "none" }}
            onChange={(event) => setTitle(event.target.value ?? null)}
            onBlur={() => {
              const trimmed = title?.trim() ?? null;
              setNativeValue(titleRef.current!, trimmed ?? "");
              titleRef.current!.selectionStart = titleRef.current!.selectionEnd = 0;
              if (field.title !== trimmed) {
                onFieldEdit({ title: trimmed });
              }
            }}
            onKeyDown={(event) => {
              switch (event.key) {
                case "ArrowDown":
                  event.preventDefault();
                  if (field.description) {
                    focusDescription(true);
                  } else if (field.type === "SELECT") {
                    focusSelectOptions(true);
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
        </Box>
        {field.isReadOnly ? null : (
          <FormControl
            className="field-actions"
            display="flex"
            alignItems="center"
            width="auto"
            height="24px"
          >
            <FormLabel
              htmlFor={`field-required-${field.id}`}
              fontWeight="normal"
              marginBottom="0"
            >
              <FormattedMessage
                id="petition.required-label"
                defaultMessage="Required"
              />
            </FormLabel>
            <Switch
              id={`field-required-${field.id}`}
              height="20px"
              isChecked={!field.optional}
              onChange={(event) =>
                onFieldEdit({ optional: !event.target.checked })
              }
            />
          </FormControl>
        )}
      </Stack>
      <GrowingTextarea
        ref={descriptionRef}
        id={`field-description-${field.id}`}
        className={"field-description"}
        placeholder={intl.formatMessage({
          id: "component.petition-compose-field.field-description-placeholder",
          defaultMessage: "Add a description...",
        })}
        aria-label={intl.formatMessage({
          id: "component.petition-compose-field.field-description-label",
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
          const totalLines = (textarea.value.match(/\n/g) ?? []).length + 1;
          const beforeCursor = textarea.value.substr(
            0,
            textarea.selectionStart
          );
          const currentLine = (beforeCursor.match(/\n/g) ?? []).length;
          switch (event.key) {
            case "ArrowDown":
              if (currentLine === totalLines - 1) {
                if (field.type === "SELECT") {
                  focusSelectOptions(true);
                } else {
                  onFocusNextField();
                }
              }
              break;
            case "ArrowUp":
              if (currentLine === 0) {
                focusTitle();
              }
              break;
          }
        }}
      />
      {field.type === "SELECT" ? (
        <Box marginTop={1}>
          <SelectTypeFieldOptions
            ref={selectFieldOptionsRef}
            field={field}
            onFieldEdit={onFieldEdit}
            showError={showError}
            onFocusNextField={onFocusNextField}
            onFocusDescription={focusDescription}
          />
        </Box>
      ) : null}
      {field.visibility ? (
        <Box
          marginTop={2}
          marginBottom={
            field.visibility && field.visibility.conditions.length < 5 ? -5 : 0
          }
        >
          <PetitionFieldVisibilityEditor
            showError={showError}
            fieldId={field.id}
            visibility={field.visibility as any}
            fields={fields}
            onVisibilityEdit={(visibility) => onFieldEdit({ visibility })}
          />
        </Box>
      ) : null}
    </Box>
  );
});

interface PetitionComposeFieldActionsProps
  extends Pick<
    PetitionComposeFieldProps,
    "field" | "onCloneField" | "onSettingsClick" | "onDeleteClick"
  > {
  canChangeVisibility: boolean;
  onVisibilityClick: () => void;
}

const _PetitionComposeFieldActions = chakraForwardRef<
  "div",
  PetitionComposeFieldActionsProps
>(function PetitionComposeFieldActions(
  {
    field,
    canChangeVisibility,
    onVisibilityClick,
    onCloneField,
    onSettingsClick,
    onDeleteClick,
    ...props
  },
  ref
) {
  const intl = useIntl();
  const hasCondition = field.visibility;
  return (
    <Stack ref={ref} direction="row" padding={1} {...props}>
      {canChangeVisibility || field.isFixed ? (
        <IconButtonWithTooltip
          icon={<ConditionFullIcon />}
          isDisabled={
            field.type === "HEADING" &&
            (field.isFixed || field.options.hasPageBreak)
          }
          size="sm"
          variant="ghost"
          placement="bottom"
          color={hasCondition ? "purple.500" : "gray.600"}
          label={
            hasCondition
              ? intl.formatMessage({
                  id: "component.petition-compose-field.remove-condition",
                  defaultMessage: "Remove condition",
                })
              : intl.formatMessage({
                  id: "component.petition-compose-field.add-condition",
                  defaultMessage: "Add condition",
                })
          }
          onClick={onVisibilityClick}
        />
      ) : (
        <SmallPopover
          placement="top"
          closeDelay={0}
          content={
            <Text fontSize="sm">
              <FormattedMessage
                id="component.petition-compose-field.conditions-not-enough-fields"
                defaultMessage="You can only add conditions based on previous fields. Add more fields to be able to set conditions between them."
              />
            </Text>
          }
        >
          <IconButton
            size="sm"
            // fake disabled look so popover still works
            opacity={0.4}
            cursor="not-allowed"
            backgroundColor="transparent"
            _hover={{ backgroundColor: "transparent" }}
            _active={{ backgroundColor: "transparent" }}
            as="div"
            icon={<ConditionFullIcon />}
            aria-label={intl.formatMessage({
              id: "component.petition-compose-field.add-condition",
              defaultMessage: "Add condition",
            })}
          />
        </SmallPopover>
      )}
      <IconButtonWithTooltip
        icon={<CopyIcon />}
        size="sm"
        variant="ghost"
        placement="bottom"
        color="gray.600"
        label={intl.formatMessage({
          id: "component.petition-compose-field.field-clone",
          defaultMessage: "Clone field",
        })}
        onClick={onCloneField}
      />
      <IconButtonWithTooltip
        icon={<SettingsIcon />}
        isDisabled={field.isFixed}
        size="sm"
        variant="ghost"
        placement="bottom"
        color="gray.600"
        label={intl.formatMessage({
          id: "component.petition-compose-field.field-settings",
          defaultMessage: "Field settings",
        })}
        onClick={onSettingsClick}
      />
      <IconButtonWithTooltip
        icon={<DeleteIcon />}
        isDisabled={field.isFixed}
        size="sm"
        variant="ghost"
        placement="bottom"
        color="gray.600"
        label={intl.formatMessage({
          id: "component.petition-compose-field.field-delete",
          defaultMessage: "Delete field",
        })}
        onClick={onDeleteClick}
      />
    </Stack>
  );
});

const fragments = {
  PetitionField: gql`
    fragment PetitionComposeField_PetitionField on PetitionField {
      id
      type
      title
      description
      optional
      multiple
      isFixed
      isReadOnly
      visibility
      ...SelectTypeFieldOptions_PetitionField
      ...PetitionFieldVisibilityEditor_PetitionField
    }
    ${SelectTypeFieldOptions.fragments.PetitionField}
    ${PetitionFieldVisibilityEditor.fragments.PetitionField}
  `,
};

const comparePetitionComposeFieldProps = compareWithFragments<any>({
  field: fragments.PetitionField,
  fields: PetitionFieldVisibilityEditor.fragments.PetitionField,
} as any);

const PetitionComposeFieldActions = memo(
  _PetitionComposeFieldActions,
  comparePetitionComposeFieldProps
) as typeof _PetitionComposeFieldActions;

const PetitionComposeFieldInner = memo(
  _PetitionComposeFieldInner,
  comparePetitionComposeFieldProps
) as typeof _PetitionComposeFieldInner;

export const PetitionComposeField = Object.assign(
  memo(
    _PetitionComposeField,
    comparePetitionComposeFieldProps
  ) as typeof _PetitionComposeField,
  { fragments }
);

interface DragItem {
  index: number;
  id: string;
  type: string;
}

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
    type: "FIELD",
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
