import { gql } from "@apollo/client";
import { Box, Button, Center, Stack, Text } from "@chakra-ui/react";
import { PlusCircleIcon } from "@parallel/chakra/icons";
import {
  PetitionComposeFieldGroupChildren_PetitionFieldFragment,
  PetitionComposeFieldGroupChildren_UserFragment,
  PetitionFieldType,
} from "@parallel/graphql/__types";
import { MultipleRefObject } from "@parallel/utils/useMultipleRefs";
import { usePetitionComposeFieldReorder } from "@parallel/utils/usePetitionComposeFieldReorder";
import { useState } from "react";
import { useDrop } from "react-dnd";
import { FormattedMessage } from "react-intl";
import { isDefined, zip } from "remeda";
import { useErrorDialog } from "../common/dialogs/ErrorDialog";
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
  const handleAddNewField = async (type: PetitionFieldType, position?: number) => {
    const childrenLength = field.children?.length ?? 0;
    let _position = position ?? childrenLength + 1;
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
      // If the grouop has fields and they try to add to first position, we add it to the second position
      if (
        (type === "DOW_JONES_KYC" || type === "BACKGROUND_CHECK") &&
        childrenLength > 0 &&
        position === 0 &&
        !field.isInternal
      ) {
        _position = 1;
      }
      onAddField(type, _position, field.id);
    }
  };

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
            const isActive = field.id === activeChildFieldId;
            const { onSettingsClick, ...restFieldProps } = fieldProps!(field.id);

            return (
              <PetitionComposeFieldWrapper
                key={field.id}
                index={i}
                isTemplate={petition.__typename === "PetitionTemplate"}
                hideAddButtons={isReadOnly || isOver}
                onAddNewField={handleAddNewField}
                user={user}
              >
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
                  onFocus={() => {
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
                />
              </PetitionComposeFieldWrapper>
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

function PetitionComposeFieldWrapper({
  user,
  isTemplate,
  index,
  onAddNewField,
  hideAddButtons,
  children,
  ...props
}: {
  user: PetitionComposeFieldGroupChildren_UserFragment;
  isTemplate: boolean;
  index: number;
  onAddNewField: (type: PetitionFieldType, position?: number) => void;
  hideAddButtons?: boolean;
  children: React.ReactNode;
}) {
  const [showAddFieldButton, setShowAddFieldButton] = useState(false);

  return (
    <Box
      {...props}
      sx={{
        "&:hover, &:focus-within": {
          ".add-field-button-wrapper": {
            visibility: "visible",
          },
          ".field-actions-children": {
            display: "flex",
          },
        },
      }}
      onFocus={(e) => {
        e.stopPropagation();
        setShowAddFieldButton(true);
      }}
      onBlur={() => {
        setShowAddFieldButton(false);
      }}
    >
      {!hideAddButtons ? (
        <Box
          className="add-field-button-wrapper"
          position="relative"
          zIndex="1"
          sx={{
            visibility: showAddFieldButton ? "visible" : "hidden",
            "& :hover, & :focus-within": {
              visibility: "visible",
            },
          }}
        >
          <AddFieldButton
            position="absolute"
            bottom={0}
            left="calc(50% - 14px)"
            transform="translate(-50%, 50%)"
            className="add-field-after-button"
            data-testid="small-add-field-button"
            colorScheme={isTemplate ? "primary" : undefined}
            isFieldGroupChild
            onSelectFieldType={(type) => onAddNewField(type, index)}
            user={user}
            onOpen={() => {
              setShowAddFieldButton(true);
            }}
          />
        </Box>
      ) : null}
      {children}
      {!hideAddButtons ? (
        <Box
          className="add-field-button-wrapper"
          position="relative"
          zIndex="1"
          sx={{
            visibility: showAddFieldButton ? "visible" : "hidden",
            "& :hover, & :focus-within": {
              visibility: "visible",
            },
          }}
        >
          <AddFieldButton
            position="absolute"
            bottom={0}
            left="calc(50% - 14px)"
            transform="translate(-50%, 50%)"
            className="add-field-after-button"
            data-testid="small-add-field-button"
            colorScheme={isTemplate ? "primary" : undefined}
            isFieldGroupChild
            onSelectFieldType={(type) => onAddNewField(type, index + 1)}
            user={user}
            onOpen={() => {
              setShowAddFieldButton(true);
            }}
          />
        </Box>
      ) : null}
    </Box>
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
