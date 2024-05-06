import { gql } from "@apollo/client";
import { Box, Button, Center, IconButton, Stack, Text } from "@chakra-ui/react";
import { AddIcon, PlusCircleIcon } from "@parallel/chakra/icons";
import {
  PetitionComposeFieldGroupChildren_PetitionFieldFragment,
  PetitionComposeFieldGroupChildren_UserFragment,
  PetitionFieldType,
} from "@parallel/graphql/__types";
import { MultipleRefObject } from "@parallel/utils/useMultipleRefs";
import { usePetitionComposeFieldReorder } from "@parallel/utils/usePetitionComposeFieldReorder";
import { useState } from "react";
import { useDrop } from "react-dnd";
import { FormattedMessage, useIntl } from "react-intl";
import { isDefined, zip } from "remeda";
import { PetitionComposeDragActiveIndicator } from "./PetitionComposeDragActiveIndicator";
import {
  PetitionComposeField,
  PetitionComposeFieldProps,
  PetitionComposeFieldRef,
} from "./PetitionComposeField";
import { PetitionComposeFieldAttachment } from "./PetitionComposeFieldAttachment";
import { PetitionComposeNewFieldPlaceholder } from "./PetitionComposeNewFieldPlaceholder";
import { PetitionFieldOptionsListEditor } from "./PetitionFieldOptionsListEditor";
import { ReferencedFieldDialog } from "./dialogs/ReferencedFieldDialog";
import { PetitionFieldVisibilityEditor } from "./logic/PetitionFieldVisibilityEditor";
import { useAddNewFieldPlaceholderContext } from "./AddNewFieldPlaceholderProvider";

interface PetitionComposeFieldGroupChildrenProps
  extends Pick<
    PetitionComposeFieldProps,
    | "petition"
    | "activeChildFieldId"
    | "showError"
    | "fieldProps"
    | "onUpdateFieldPositions"
    | "onLinkField"
    | "onUnlinkField"
    | "showAddField"
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
  fieldProps,
  onUpdateFieldPositions,
  onLinkField,
  onUnlinkField,
  showAddField,
}: PetitionComposeFieldGroupChildrenProps) {
  const { fields: children, onFieldMove } = usePetitionComposeFieldReorder({
    fields: field.children?.filter(isDefined) ?? [],
    onUpdateFieldPositions: (fieldPositions) => {
      onUpdateFieldPositions(fieldPositions, field.id);
    },
    isFieldGroup: true,
  });

  const { newFieldPlaceholderFieldId, newFieldPlaceholderParentFieldId } =
    useAddNewFieldPlaceholderContext();

  const parentFieldId = field.id;

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
    [newFieldPlaceholderFieldId],
  );

  const hasChildren = isDefined(field.children) && field.children.length > 0;
  const hasDropErrors = FIELD_GROUP_EXCLUDED_FIELD_TYPES.includes(draggedFieldType) && isOver;
  const newFieldPlaceholderIndex = children.findIndex((f) => f.id === newFieldPlaceholderFieldId);
  return (
    <Stack
      textStyle={isReadOnly ? "muted" : undefined}
      paddingBottom={hasChildren ? 12 : 6}
      paddingStart={3}
      paddingEnd={4}
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
                onAddNewField={(linkToPreviousField: boolean) => {
                  const fieldIdToLink = linkToPreviousField
                    ? children[i - 1]?.id ?? undefined
                    : field.id;
                  showAddField?.(fieldIdToLink, parentFieldId);
                }}
                newFieldPlaceholderIndex={
                  newFieldPlaceholderParentFieldId !== parentFieldId
                    ? undefined
                    : newFieldPlaceholderIndex !== -1
                      ? newFieldPlaceholderIndex + 1
                      : 0
                }
              >
                {i === 0 &&
                newFieldPlaceholderParentFieldId === parentFieldId &&
                !newFieldPlaceholderFieldId ? (
                  <PetitionComposeNewFieldPlaceholder
                    borderTop="none"
                    borderBottom="1px solid"
                    borderBottomColor="gray.200"
                    isGroupChild={true}
                    isTemplate={petition.__typename === "PetitionTemplate"}
                  />
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
                  onFocus={() => {
                    if (!isActive && activeChildFieldId) {
                      onSettingsClick();
                    }
                  }}
                  isActive={isActive}
                  onUpdateFieldPositions={onUpdateFieldPositions}
                  onSettingsClick={onSettingsClick}
                  onUnlinkField={onUnlinkField}
                  showAddField={showAddField}
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
                {newFieldPlaceholderFieldId === field.id ? (
                  <PetitionComposeNewFieldPlaceholder
                    isGroupChild={true}
                    isTemplate={petition.__typename === "PetitionTemplate"}
                  />
                ) : null}
              </PetitionComposeFieldWrapper>
            );
          })
        ) : newFieldPlaceholderParentFieldId === parentFieldId ? (
          <PetitionComposeNewFieldPlaceholder
            borderTop="none"
            isGroupChild={true}
            isTemplate={petition.__typename === "PetitionTemplate"}
          />
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
      {!hasChildren && newFieldPlaceholderParentFieldId !== parentFieldId ? (
        <Button
          leftIcon={<PlusCircleIcon />}
          isDisabled={isReadOnly}
          fontWeight="normal"
          variant="outline"
          size="sm"
          fontSize="md"
          alignSelf="center"
          transform="translateX(-14px)"
          onClick={() => showAddField?.(undefined, parentFieldId)}
        >
          <FormattedMessage
            id="component.petition-compose-field-list.add-field"
            defaultMessage="Add field"
          />
        </Button>
      ) : null}
    </Stack>
  );
}

function PetitionComposeFieldWrapper({
  isTemplate,
  index,
  onAddNewField,
  hideAddButtons,
  newFieldPlaceholderIndex,
  children,
  ...props
}: {
  isTemplate: boolean;
  index: number;
  onAddNewField: (linkToPreviousField: boolean) => void;
  hideAddButtons?: boolean;
  newFieldPlaceholderIndex?: number;
  children: React.ReactNode;
}) {
  const intl = useIntl();
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
      {!hideAddButtons && newFieldPlaceholderIndex !== index ? (
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
          <IconButton
            position="absolute"
            bottom={0}
            insetStart="calc(50% - 14px)"
            transform="translate(-50%, 50%)"
            className="add-field-after-button"
            data-testid="small-add-field-button"
            colorScheme={isTemplate ? "primary" : undefined}
            onClick={() => onAddNewField(true)}
            aria-label={intl.formatMessage({
              id: "component.add-field-button.label",
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
          />
        </Box>
      ) : null}
      {children}
      {!hideAddButtons && newFieldPlaceholderIndex !== index + 1 ? (
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
          <IconButton
            position="absolute"
            bottom={0}
            insetStart="calc(50% - 14px)"
            transform="translate(-50%, 50%)"
            className="add-field-after-button"
            data-testid="small-add-field-button"
            colorScheme={isTemplate ? "primary" : undefined}
            onClick={() => onAddNewField(false)}
            aria-label={intl.formatMessage({
              id: "component.add-field-button.label",
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
      hasBackgroundCheck: hasFeatureFlag(featureFlag: BACKGROUND_CHECK)
    }
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
