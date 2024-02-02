import { gql } from "@apollo/client";
import { Box, Button, Center, HTMLChakraProps, Stack, Text } from "@chakra-ui/react";
import { PlusCircleIcon } from "@parallel/chakra/icons";
import {
  PetitionComposeFieldGroupChildren_PetitionFieldFragment,
  PetitionComposeFieldGroupChildren_UserFragment,
  PetitionFieldType,
} from "@parallel/graphql/__types";
import { assignRef } from "@parallel/utils/assignRef";
import { useMemoFactory } from "@parallel/utils/useMemoFactory";
import { usePetitionComposeFieldReorder } from "@parallel/utils/usePetitionComposeFieldReorder";
import { Fragment, useCallback, useRef, useState } from "react";
import { useDrop } from "react-dnd";
import { FormattedMessage } from "react-intl";
import { isDefined, zip } from "remeda";
import { AddFieldButton } from "../petition-common/AddFieldButton";
import { AddFieldPopover } from "./AddFieldPopover";
import { PetitionComposeDragActiveIndicator } from "./PetitionComposeDragActiveIndicator";
import {
  PetitionComposeField,
  PetitionComposeFieldProps,
  PetitionComposeFieldRef,
} from "./PetitionComposeField";
import { PetitionComposeFieldAttachment } from "./PetitionComposeFieldAttachment";
import { PetitionFieldOptionsListEditor } from "./PetitionFieldOptionsListEditor";
import { ReferencedFieldDialog } from "./dialogs/ReferencedFieldDialog";
import { PetitionFieldVisibilityEditor } from "./logic/PetitionFieldVisibilityEditor";
import { MultipleRefObject } from "@parallel/utils/useMultipleRefs";
import { useErrorDialog } from "../common/dialogs/ErrorDialog";

interface PetitionComposeFieldGroupChildrenProps
  extends Pick<
    PetitionComposeFieldProps,
    | "petition"
    | "onAddField"
    | "activeChildFieldId"
    | "showError"
    | "fieldProps"
    | "onUpdateFieldPositions"
    | "onLinkField"
    | "onUnlinkField"
  > {
  isReadOnly?: boolean;
  field: PetitionComposeFieldGroupChildren_PetitionFieldFragment;
  childrenFieldIndices: string[];
  fieldRefs: MultipleRefObject<PetitionComposeFieldRef>;
  user: PetitionComposeFieldGroupChildren_UserFragment;
}

export const FIELD_GROUP_EXCLUDED_FIELD_TYPES = ["FIELD_GROUP", "HEADING"] as PetitionFieldType[];

interface DragItem {
  index: number;
  id: string;
  type: string;
  fieldType: PetitionFieldType;
}

export function PetitionComposeFieldGroupChildren({
  isReadOnly,
  field,
  childrenFieldIndices,
  fieldRefs,
  showError,
  user,
  activeChildFieldId,
  petition,
  onAddField,
  fieldProps,
  onUpdateFieldPositions,
  onLinkField,
  onUnlinkField,
}: PetitionComposeFieldGroupChildrenProps) {
  const { fields: children, onFieldMove } = usePetitionComposeFieldReorder({
    fields: field.children?.filter(isDefined) ?? [],
    onUpdateFieldPositions: (fieldPositions) => {
      onUpdateFieldPositions(fieldPositions, field.id);
    },
    isFieldGroup: true,
  });

  // use drop to allow dropping fields into the group
  const [{ isOver, draggedFieldType }, drop] = useDrop<DragItem, unknown, any>(
    () => ({
      accept: ["FIELD"],
      drop(item: DragItem) {
        if (!FIELD_GROUP_EXCLUDED_FIELD_TYPES.includes(item.fieldType)) {
          onLinkField?.(field.id, [item.id]);
        }
      },
      collect: (monitor) => ({
        isOver: monitor.isOver(),
        draggedFieldType: monitor.getItem()?.fieldType,
      }),
    }),
    [],
  );
  const showErrorDialog = useErrorDialog();
  const handleAddNewField = async (type: PetitionFieldType) => {
    const childrenLength = field.children?.length ?? 0;
    if (
      (type === "DOW_JONES_KYC" || type === "BACKGROUND_CHECK") &&
      childrenLength === 0 &&
      !field.isInternal
    ) {
      try {
        await showErrorDialog({
          message: (
            <FormattedMessage
              id="component.petition-compose-field-group-children.first-child-is-internal-error"
              defaultMessage="The first field of a group cannot be internal if the group is not."
            />
          ),
        });
      } catch {}
    } else {
      onAddField(type, childrenLength + 1, field.id);
    }
  };

  const [hoveredFieldId, _setHoveredFieldId] = useState<string | null>(null);
  const hoveredFieldIdRef = useRef<string>(null);
  const hoveredFieldIdWhileMenuOpenedRef = useRef<string>(null);
  const setHoveredFieldId = useCallback(
    (fieldId: string | null) => {
      _setHoveredFieldId(fieldId);
      assignRef(hoveredFieldIdRef, fieldId);
    },
    [_setHoveredFieldId],
  );
  const [focusedFieldId, _setFocusedFieldId] = useState<string | null>(null);
  const focusedFieldIdRef = useRef<string>(null);
  const setFocusedFieldId = useCallback(
    (fieldId: string | null) => {
      _setFocusedFieldId(fieldId);
      assignRef(focusedFieldIdRef, fieldId);
    },
    [_setFocusedFieldId],
  );
  const isMenuOpenedRef = useRef(false);
  const timeoutRef = useRef<number>();
  const fieldMouseHandlers = useMemoFactory(
    (fieldId) =>
      ({
        onFocus(e) {
          e.stopPropagation();
          // see comment for onBlur below
          clearTimeout(timeoutRef.current);
          if (fieldId !== focusedFieldIdRef.current) {
            setFocusedFieldId(fieldId);
          }
        },
        onBlur() {
          /**
           * When moving from a field to another the following happens synchronously:
           * - old active field -> blur event
           * - new active field -> focus event
           * To prevent hiding and showing the settings which would cause a bit of flickering
           * we deactivate with a setTimeout that is cancelled on the focus event.
           * This way instead of oldActiveId -> null -> newActiveId we oldActiveId -> newActiveId
           * directly
           */
          timeoutRef.current = window.setTimeout(() => setFocusedFieldId(null));
        },
        onMouseMove() {
          if (!isMenuOpenedRef.current) {
            if (fieldId !== hoveredFieldIdRef.current) {
              setHoveredFieldId(fieldId);
            }
          } else {
            if (fieldId !== hoveredFieldIdWhileMenuOpenedRef.current) {
              assignRef(hoveredFieldIdWhileMenuOpenedRef, fieldId);
            }
          }
        },
        onMouseEnter() {
          clearTimeout(timeoutRef.current);
          if (!isMenuOpenedRef.current) {
            setHoveredFieldId(fieldId);
          } else {
            assignRef(hoveredFieldIdWhileMenuOpenedRef, fieldId);
          }
        },
        onMouseLeave() {
          // Something very similar to the focus/blur situation happens here, see comment
          // for the onBlur handler above.
          if (!isMenuOpenedRef.current) {
            timeoutRef.current = window.setTimeout(() => setHoveredFieldId(null));
          } else {
            assignRef(hoveredFieldIdWhileMenuOpenedRef, null);
          }
        },
      }) as HTMLChakraProps<"div">,
    [setHoveredFieldId, setFocusedFieldId],
  );

  const addButtonMouseHandlers = useMemoFactory(
    (fieldId) => ({
      onMouseEnter() {
        clearTimeout(timeoutRef.current);
      },
      onFocus() {
        clearTimeout(timeoutRef.current);
      },
      onSelectFieldType(type: PetitionFieldType) {
        if (isDefined(field.children)) {
          let position = field.children.findIndex((f) => f.id === fieldId);
          if (
            (type === "DOW_JONES_KYC" || type === "BACKGROUND_CHECK") &&
            field.children.length > 0 &&
            position === 0 &&
            !field.isInternal
          ) {
            position = 1;
          }
          onAddField(type, position, field.id);
        }
      },
      onOpen() {
        assignRef(isMenuOpenedRef, true);
      },
      onClose() {
        assignRef(isMenuOpenedRef, false);
        if (hoveredFieldIdRef.current !== hoveredFieldIdWhileMenuOpenedRef.current) {
          setHoveredFieldId(hoveredFieldIdWhileMenuOpenedRef.current);
        }
      },
      user,
    }),
    [field.children?.length],
  );

  const hasChildren = isDefined(field.children) && field.children.length > 0;
  const hasDropErrors = FIELD_GROUP_EXCLUDED_FIELD_TYPES.includes(draggedFieldType) && isOver;

  return (
    <Stack
      textStyle={isReadOnly ? "muted" : undefined}
      paddingBottom={hasChildren ? 12 : 6}
      paddingLeft={3}
      paddingRight={4}
    >
      <Stack
        borderRadius="md"
        outline={isOver || !hasChildren ? "2px dashed" : "1px solid"}
        outlineColor={hasDropErrors || (!hasChildren && showError) ? "red.500" : "gray.200"}
        spacing={0}
        position="relative"
        ref={drop}
      >
        {isOver ? (
          <PetitionComposeDragActiveIndicator
            showErrorMessage={hasDropErrors}
            omitBorder
            message={
              <Text fontSize="md" align="center" color="gray.500" fontWeight={400}>
                <FormattedMessage
                  id="component.petition-compose-field-group-children.drag-field-to-link-text"
                  defaultMessage="Drag fields here to add them to the group"
                />
              </Text>
            }
            errorMessage={
              <FormattedMessage
                id="component.petition-compose-field-group-children.drag-field-to-link-error"
                defaultMessage="This field can not be added to a group"
              />
            }
          />
        ) : null}

        {hasChildren ? (
          zip(children, childrenFieldIndices).map(([field, fieldIndex], i) => {
            const prevFieldId = children[i - 1]?.id ?? undefined;
            const showAddFieldButton = [field.id, prevFieldId].some(
              (id) => id === hoveredFieldId || id === focusedFieldId,
            );
            const isActive = field.id === activeChildFieldId;
            const { onSettingsClick, ...restFieldProps } = fieldProps!(field.id);
            const { onFocus, ...restMouseHandlers } = fieldMouseHandlers(field.id);

            return (
              <Fragment key={field.id}>
                {!isReadOnly && !isOver ? (
                  <Box
                    className="add-field-button-wrapper"
                    position="relative"
                    zIndex="1"
                    display={showAddFieldButton ? "block" : "none"}
                  >
                    <AddFieldButton
                      position="absolute"
                      bottom={0}
                      left="calc(50% - 14px)"
                      transform="translate(-50%, 50%)"
                      className="add-field-after-button"
                      data-testid="small-add-field-button"
                      colorScheme={
                        petition.__typename === "PetitionTemplate" ? "primary" : undefined
                      }
                      isFieldGroupChild
                      {...addButtonMouseHandlers(field.id)}
                    />
                  </Box>
                ) : null}
                <PetitionComposeField
                  ref={fieldRefs?.[field.id]}
                  borderTopRadius={i === 0 ? "md" : undefined}
                  borderBottomRadius={i === children.length - 1 ? "md" : undefined}
                  overflow="hidden"
                  id={`field-${field.id}`}
                  isReadOnly={isReadOnly}
                  showError={showError}
                  onMove={onFieldMove}
                  user={user}
                  field={field as any}
                  petition={petition}
                  fieldIndex={fieldIndex}
                  index={i}
                  onFocus={(e) => {
                    onFocus?.(e);
                    if (!isActive && activeChildFieldId) {
                      onSettingsClick();
                    }
                  }}
                  isActive={isActive}
                  onUpdateFieldPositions={onUpdateFieldPositions}
                  onSettingsClick={onSettingsClick}
                  onUnlinkField={onUnlinkField}
                  sx={{
                    ".field-actions-children": {
                      display: "none",
                    },
                    _active: {
                      backgroundColor: "primary.50",
                      ".field-actions-children": {
                        display: "flex",
                      },
                    },
                    _hover: {
                      "[draggable]": {
                        opacity: "1 !important",
                      },

                      backgroundColor: "gray.50",
                      ".field-actions-children": {
                        display: "flex",
                      },
                      _active: {
                        backgroundColor: "primary.50",
                      },
                    },
                  }}
                  {...restFieldProps}
                  {...restMouseHandlers}
                />
                {i === children.length - 1 && !isReadOnly && !isOver ? (
                  <Box
                    className="add-field-button-wrapper"
                    position="relative"
                    zIndex="1"
                    display={showAddFieldButton ? "block" : "none"}
                  >
                    <AddFieldButton
                      position="absolute"
                      bottom={0}
                      left="calc(50% - 14px)"
                      transform="translate(-50%, 50%)"
                      className="add-field-after-button"
                      data-testid="small-add-field-button"
                      colorScheme={
                        petition.__typename === "PetitionTemplate" ? "primary" : undefined
                      }
                      isFieldGroupChild
                      {...addButtonMouseHandlers(field.id)}
                      onSelectFieldType={handleAddNewField}
                    />
                  </Box>
                ) : null}
              </Fragment>
            );
          })
        ) : (
          <Center paddingY={6} paddingX={4}>
            <Text fontSize="md" align="center" color="gray.500">
              <FormattedMessage
                id="component.petition-compose-field-group-children.drag-field-to-link-text"
                defaultMessage="Drag fields here to add them to the group"
              />
            </Text>
          </Center>
        )}
      </Stack>
      {!hasChildren ? (
        <AddFieldPopover
          as={Button}
          leftIcon={<PlusCircleIcon position="relative" top="-1px" />}
          isDisabled={isReadOnly}
          fontWeight="normal"
          variant="outline"
          size="sm"
          fontSize="md"
          alignSelf="center"
          transform="translateX(-14px)"
          isFieldGroupChild
          onSelectFieldType={handleAddNewField}
          user={user}
        >
          <FormattedMessage
            id="component.petition-compose-field-group-children.add-field"
            defaultMessage="Add field"
          />
        </AddFieldPopover>
      ) : null}
    </Stack>
  );
}

PetitionComposeFieldGroupChildren.fragments = {
  User: gql`
    fragment PetitionComposeFieldGroupChildren_User on User {
      id
      ...AddFieldPopover_User
    }
    ${AddFieldPopover.fragments.User}
  `,
  // Can't reference PetitionComposeField because it generates a recursive dependency
  PetitionField: gql`
    fragment PetitionComposeFieldGroupChildren_PetitionField on PetitionField {
      id
      visibility
      isInternal
      children {
        id
        type
        title
        description
        optional
        multiple
        isFixed
        isInternal
        isReadOnly
        visibility
        math
        attachments {
          ...PetitionComposeFieldAttachment_PetitionFieldAttachment
        }
        parent {
          id
        }
        ...PetitionFieldOptionsListEditor_PetitionField
        ...PetitionFieldVisibilityEditor_PetitionField
        ...ReferencedFieldDialog_PetitionField
        ...usePetitionComposeFieldReorder_PetitionField
      }
      ...ReferencedFieldDialog_PetitionField
    }
    ${usePetitionComposeFieldReorder.fragments.PetitionField}
    ${PetitionFieldOptionsListEditor.fragments.PetitionField}
    ${PetitionComposeFieldAttachment.fragments.PetitionFieldAttachment}
    ${PetitionFieldVisibilityEditor.fragments.PetitionField}
    ${ReferencedFieldDialog.fragments.PetitionField}
  `,
};
