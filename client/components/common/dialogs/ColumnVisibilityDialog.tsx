import { Box, Center, HStack, HTMLChakraProps, List, ListItem, Stack } from "@chakra-ui/react";
import { DragHandleIcon, EyeIcon, EyeOffIcon } from "@parallel/chakra/icons";
import { Button, Text } from "@parallel/components/ui";
import { Reorder, useDragControls } from "framer-motion";
import { useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { isNonNullish } from "remeda";
import { IconButtonWithTooltip } from "../IconButtonWithTooltip";
import { TableColumn } from "../Table";
import { ConfirmDialog } from "./ConfirmDialog";
import { DialogProps, useDialog } from "./DialogProvider";

interface ColumnVisibilityDialogProps<T extends string> {
  columns: TableColumn<any, any, any>[];
  selection: T[];
}

function ColumnVisibilityDialog<T extends string>({
  columns,
  selection: initialSelection,
  ...props
}: DialogProps<ColumnVisibilityDialogProps<T>, T[]>) {
  const [currentSelection, setCurrentSelection] = useState(
    initialSelection.filter((key) => columns.some((c) => c.key === key)),
  );

  const notVisible = columns.filter((c) => !c.isFixed && !currentSelection.includes(c.key as T));
  return (
    <ConfirmDialog
      scrollBehavior="inside"
      {...props}
      header={
        <FormattedMessage
          id="component.column-visibility-dialog.header"
          defaultMessage="Choose the columns you want to see"
        />
      }
      body={
        <Stack>
          <Stack as="section">
            <HStack>
              <Text
                as="h2"
                flex="1"
                textTransform="uppercase"
                fontSize="sm"
                color="gray.600"
                fontWeight="semibold"
              >
                <FormattedMessage
                  id="component.column-visibility-dialog.visible-columns"
                  defaultMessage="Visible columns"
                />
              </Text>
              <Button
                variant="outline"
                size="sm"
                fontWeight={400}
                onClick={() => setCurrentSelection([])}
              >
                <FormattedMessage
                  id="component.column-visibility-dialog.hide-all"
                  defaultMessage="Hide all"
                />
              </Button>
            </HStack>
            <Stack as="ol" listStyleType="none">
              {columns
                .filter((c) => c.isFixed)
                .map((c) => {
                  return (
                    <Box as="li" key={c.key}>
                      <ColumnItem column={c} isVisible={true} />
                    </Box>
                  );
                })}
            </Stack>
            <List
              listStyleType="none"
              as={Reorder.Group}
              axis="y"
              values={currentSelection}
              onReorder={setCurrentSelection as any}
              spacing={2}
            >
              {currentSelection.map((key) => {
                const column = columns.find((c) => c.key === key);
                return isNonNullish(column) ? (
                  <ReorderColumnItem
                    key={column.key}
                    column={column}
                    onHide={() =>
                      setCurrentSelection((selection) => selection.filter((c) => c !== key))
                    }
                  />
                ) : null;
              })}
            </List>
          </Stack>
          <Stack as="section">
            <HStack>
              <Text
                as="h2"
                flex="1"
                textTransform="uppercase"
                fontSize="sm"
                color="gray.600"
                fontWeight="semibold"
              >
                <FormattedMessage
                  id="component.column-visibility-dialog.hidden-columns"
                  defaultMessage="Hidden columns"
                />
              </Text>
              <Button
                variant="outline"
                size="sm"
                fontWeight={400}
                onClick={() =>
                  setCurrentSelection((selection) => [
                    ...selection,
                    ...columns
                      .filter((c) => !c.isFixed && !currentSelection.includes(c.key as T))
                      .map((c) => c.key as T),
                  ])
                }
                disabled={notVisible.length === 0}
              >
                <FormattedMessage
                  id="component.column-visibility-dialog.show-all"
                  defaultMessage="Show all"
                />
              </Button>
            </HStack>
            {notVisible.length === 0 ? (
              <Text textStyle="hint" textAlign="center" fontSize="sm">
                <FormattedMessage
                  id="component.column-visibility-dialog.all-columns-visible"
                  defaultMessage="All columns are visible"
                />
              </Text>
            ) : (
              <Stack as="ul" listStyleType="none">
                {notVisible.map((c) => {
                  return (
                    <Box as="li" key={c.key}>
                      <ColumnItem
                        column={c}
                        isVisible={false}
                        onToggleVisibility={() =>
                          setCurrentSelection((selection) => [...selection, c.key as T])
                        }
                      />
                    </Box>
                  );
                })}
              </Stack>
            )}
          </Stack>
        </Stack>
      }
      confirm={
        <Button colorPalette="primary" onClick={() => props.onResolve(currentSelection)}>
          <FormattedMessage id="generic.apply" defaultMessage="Apply" />
        </Button>
      }
    />
  );
}

function ReorderColumnItem({ column, onHide }: { column: TableColumn<any>; onHide: () => void }) {
  const dragControls = useDragControls();
  const [isDragged, setIsDragged] = useState(false);
  return (
    <ListItem
      as={Reorder.Item}
      key={column.key}
      value={column.key}
      dragListener={false}
      dragControls={dragControls}
      rounded="md"
      background="white"
      overflow="hidden"
      dragTransition={{ bounceStiffness: 600 }}
      onDrag={() => setIsDragged(true)}
      onDragEnd={() => setIsDragged(false)}
      data-grabbed={isDragged ? true : undefined}
      _grabbed={{
        boxShadow: "md",
      }}
      position="relative"
    >
      <ColumnItem
        isDraggable
        column={column}
        isVisible={true}
        onToggleVisibility={onHide}
        dragHandleProps={{
          onPointerDown: (e) => dragControls.start(e),
        }}
      />
    </ListItem>
  );
}

function ColumnItem({
  column,
  isVisible,
  isDraggable,
  dragHandleProps,
  onToggleVisibility,
}: {
  column: TableColumn<any>;
  isVisible: boolean;
  isDraggable?: boolean;
  dragHandleProps?: HTMLChakraProps<"div">;
  onToggleVisibility?: () => void;
}) {
  const intl = useIntl();
  return (
    <HStack padding={1} height={8} paddingStart={isDraggable ? 1 : 7}>
      <Center cursor="grab" display={isDraggable ? "block" : "none"} {...dragHandleProps}>
        <DragHandleIcon display="block" color="gray.400" role="presentation" pointerEvents="none" />
      </Center>
      <Box flex={1} userSelect="none" noOfLines={1}>
        {typeof column.label === "string" ? column.label : column.label(intl)}
      </Box>
      {column.isFixed ? null : (
        <IconButtonWithTooltip
          variant="ghost"
          label={
            isVisible
              ? intl.formatMessage({
                  id: "generic.hide",
                  defaultMessage: "Hide",
                })
              : intl.formatMessage({
                  id: "generic.show",
                  defaultMessage: "Show",
                })
          }
          size="xs"
          icon={isVisible ? <EyeIcon /> : <EyeOffIcon />}
          onClick={onToggleVisibility}
        />
      )}
    </HStack>
  );
}

export function useColumnVisibilityDialog() {
  return useDialog(ColumnVisibilityDialog) as <T extends string>(
    props: ColumnVisibilityDialogProps<T>,
  ) => Promise<T[]>;
}
