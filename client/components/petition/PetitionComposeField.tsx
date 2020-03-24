/** @jsx jsx */
import {
  Box,
  Editable,
  EditableInput,
  EditablePreview,
  Icon,
  PseudoBox,
  Stack,
  Tooltip,
  useTheme,
  VisuallyHidden,
} from "@chakra-ui/core";
import { css, jsx } from "@emotion/core";
import {
  PetitionComposeField_PetitionFieldFragment,
  UpdatePetitionFieldInput,
} from "@parallel/graphql/__types";
import { generateCssStripe } from "@parallel/utils/css";
import { gql } from "apollo-boost";
import { MouseEvent, useCallback, useRef, KeyboardEvent } from "react";
import { useDrag, useDrop, XYCoord } from "react-dnd";
import { useIntl } from "react-intl";
import { IconButtonWithTooltip } from "../common/IconButtonWithTooltip";
import { PetitionFieldTypeIndicator } from "./PetitionFieldTypeIndicator";

export type PetitionComposeFieldProps = {
  field: PetitionComposeField_PetitionFieldFragment;
  index: number;
  active: boolean;
  onMove?: (dragIndex: number, hoverIndex: number, dropped?: boolean) => void;
  onFieldEdit: (data: UpdatePetitionFieldInput) => void;
  onSettingsClick: (event: MouseEvent<HTMLButtonElement>) => void;
  onDeleteClick: (event: MouseEvent<HTMLButtonElement>) => void;
  onTitleKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
};

interface DragItem {
  index: number;
  id: string;
  type: string;
}

export function PetitionComposeField({
  field,
  index,
  active,
  onMove,
  onSettingsClick,
  onFieldEdit,
  onDeleteClick,
  onTitleKeyDown,
}: PetitionComposeFieldProps) {
  const intl = useIntl();
  const labels = {
    required: intl.formatMessage({
      id: "generic.required-field",
      defaultMessage: "Required field",
    }),
  };
  const { colors } = useTheme();
  const { elementRef, dragRef, previewRef, isDragging } = useDragAndDrop(
    field.id,
    index,
    onMove
  );

  const handleTitleSubmit = useCallback(
    function (value) {
      if (value !== field.title) {
        onFieldEdit({ title: value || null });
      }
    },
    [field, onFieldEdit]
  );

  const handleDescriptionSubmit = useCallback(
    function (value) {
      if (value !== field.description) {
        onFieldEdit({ description: value || null });
      }
    },
    [field, onFieldEdit]
  );

  return (
    <Box
      ref={elementRef}
      borderY="1px solid"
      borderColor="gray.200"
      marginTop="-1px"
      aria-current={active ? "true" : "false"}
      css={
        isDragging
          ? generateCssStripe({ size: "1rem", color: colors.gray[50] })
          : null
      }
    >
      <PseudoBox
        ref={previewRef}
        display="flex"
        flexDirection="row"
        opacity={isDragging ? 0 : 1}
        position="relative"
        css={css`
          & {
            background-color: ${active ? colors.purple[50] : colors.white};
            [draggable] {
              opacity: 0;
              transition: opacity 150ms;
            }
            .field-actions {
              display: none;
            }
          }
          &:hover {
            [draggable] {
              opacity: 1;
            }
          }
          &:hover,
          &:focus-within {
            background-color: ${active ? colors.purple[50] : colors.gray[50]};
            .field-actions {
              display: block;
            }
          }
        `}
      >
        <PseudoBox
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
          <Icon name="drag-handle" focusable={false} role="presentation" />
        </PseudoBox>
        {field.optional ? null : (
          <Box marginX={-2} position="relative">
            <Tooltip
              placement="top"
              zIndex={1000}
              showDelay={300}
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
            onClick={onSettingsClick}
            marginTop="10px"
            alignSelf="flex-start"
          />
        </Box>
        <Box
          flex="1"
          paddingLeft={4}
          paddingTop={2}
          paddingBottom={10}
          paddingRight={2}
        >
          <Editable
            defaultValue={field.title ?? ""}
            placeholder={intl.formatMessage({
              id: "petition.field-title-placeholder",
              defaultMessage: "Enter a field title",
            })}
            aria-label={intl.formatMessage({
              id: "petition.field-title-label",
              defaultMessage: "Field title",
            })}
            onSubmit={handleTitleSubmit}
          >
            {({ onRequestEdit }: { onRequestEdit: () => void }) => (
              <>
                <EditablePreview width="100%" />
                <EditableInput
                  _focus={{ outline: "none" }}
                  onKeyDown={onTitleKeyDown}
                />
                <VisuallyHidden
                  id={`field-title-${field.id}`}
                  onClick={onRequestEdit}
                />
              </>
            )}
          </Editable>
          <Editable
            fontSize="sm"
            defaultValue={field.description ?? ""}
            placeholder={intl.formatMessage({
              id: "petition.field-description-placeholder",
              defaultMessage: "Add a description...",
            })}
            aria-label={intl.formatMessage({
              id: "petition.field-description-label",
              defaultMessage: "Field description",
            })}
            onSubmit={handleDescriptionSubmit}
          >
            <EditablePreview width="100%" />
            <EditableInput _focus={{ outline: "none" }} />
          </Editable>
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
            icon="settings"
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
            icon="delete"
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
      </PseudoBox>
    </Box>
  );
}

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

PetitionComposeField.fragments = {
  petitionField: gql`
    fragment PetitionComposeField_PetitionField on PetitionField {
      id
      type
      title
      description
      optional
    }
  `,
};
