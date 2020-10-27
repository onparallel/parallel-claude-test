import {
  Box,
  BoxProps,
  Portal,
  Tooltip,
  useMultiStyleConfig,
  usePopper,
} from "@chakra-ui/core";
import {
  Placeholder,
  PlaceholderPlugin,
} from "@parallel/utils/slate/placeholders/PlaceholderPlugin";
import { slateNodesToTextWithPlaceholders } from "@parallel/utils/slate/placeholders/slateNodesToTextWithPlaceholders";
import { textWithPlaceholderToSlateNodes } from "@parallel/utils/slate/placeholders/textWithPlaceholderToSlateNodes";
import { useFixDeleteAll } from "@parallel/utils/slate/placeholders/useFixDeleteAll";
import { usePlaceholders } from "@parallel/utils/slate/placeholders/usePlaceholders";
import { withPlaceholders } from "@parallel/utils/slate/placeholders/withPlaceholders";
import { useId } from "@reach/auto-id";
import { EditablePlugins } from "@udecode/slate-plugins";
import { forwardRef, MouseEvent, useCallback, useMemo, useEffect } from "react";
import { useIntl } from "react-intl";
import { pipe } from "remeda";
import { createEditor, Editor, Transforms } from "slate";
import { withHistory } from "slate-history";
import { ReactEditor, Slate, withReact } from "slate-react";
import {
  useSingleLine,
  withSingleLine,
} from "@parallel/utils/slate/withSingleLine";
import { Card } from "./Card";

export type PlaceholderInputProps = {
  placeholders: Placeholder[];
  value: string;
  isDisabled?: boolean;
  onChange: (value: string) => void;
} & Omit<BoxProps, "onChange">;

export type PlaceholderInputRef = {
  focus: () => void;
};

export const PlaceholderInput = forwardRef<
  PlaceholderInputRef,
  PlaceholderInputProps
>(({ placeholders, value, isDisabled, onChange, ...props }, ref) => {
  const intl = useIntl();
  const editor = useMemo(
    () =>
      pipe(
        createEditor(),
        withReact,
        withHistory,
        withSingleLine,
        withPlaceholders(placeholders)
      ),
    [placeholders]
  );

  const plugins = useMemo(() => {
    return [PlaceholderPlugin(placeholders)];
  }, [placeholders]);

  const _ref = useMemo(
    () => ({
      focus: () => {
        ReactEditor.focus(editor);
        Transforms.select(editor, Editor.end(editor, []));
      },
    }),
    [editor]
  );
  if (typeof ref === "function") {
    ref(_ref);
  } else if (ref) {
    ref.current = _ref;
  }

  const { onChangeSelection } = useSingleLine(editor);

  const {
    onAddPlaceholder,
    onChangePlaceholder,
    onKeyDownPlaceholder,
    onHighlightOption,
    selectedIndex,
    search,
    target,
    values,
  } = usePlaceholders(placeholders);

  const { onKeyDown: onKeyDownFixDeleteAll } = useFixDeleteAll();

  const handleChange = useCallback(
    (value) => {
      onChangePlaceholder(editor);
      onChangeSelection(editor.selection);
      onChange(slateNodesToTextWithPlaceholders(value));
    },
    [onChange, onChangePlaceholder, onChangeSelection]
  );

  const placeholderMenuId = `placeholder-menu-${useId()}`;
  const itemIdPrefix = `placeholder-menu-item-${useId()}`;
  const isOpen = Boolean(target && values.length > 0);

  const { field: inputStyleConfig } = useMultiStyleConfig("Input", props);
  const inputStyles = {
    ...inputStyleConfig,
    _focusWithin: (inputStyleConfig as any)._focus,
  } as any;

  const slateValue = useMemo(
    () => [
      {
        type: "paragraph",
        children: textWithPlaceholderToSlateNodes(value, placeholders),
      },
    ],
    [value]
  );
  const selected = isOpen ? values[selectedIndex] : undefined;

  function onPlaceholderButtonClick(event: MouseEvent) {
    event.stopPropagation();
    Transforms.insertText(editor, "#", { at: editor.selection?.anchor });
    ReactEditor.focus(editor);
  }

  const { popper, reference } = usePopper({
    forceUpdate: isOpen,
    placement: "bottom",
    gutter: 2,
  });

  useEffect(() => {
    if (isOpen) {
      popper.ref.current!.style.width = `${
        reference.ref.current!.offsetWidth
      }px`;
    }
  }, [isOpen]);

  return (
    <>
      <Box
        ref={reference.ref as any}
        role="combobox"
        aria-owns={placeholderMenuId}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-disabled={isDisabled}
        display="flex"
        alignItems="center"
        {...inputStyles}
        {...props}
      >
        <Slate editor={editor} value={slateValue} onChange={handleChange}>
          <EditablePlugins
            plugins={plugins}
            readOnly={isDisabled}
            onKeyDown={[onKeyDownPlaceholder, onKeyDownFixDeleteAll]}
            onKeyDownDeps={[selectedIndex, search, target]}
            style={{
              flex: 1,
              padding: "0 0.25rem",
              whiteSpace: "pre",
              overflow: "hidden",
            }}
            aria-controls={placeholderMenuId}
            aria-autocomplete="list"
            aria-activedescendant={
              selected ? `${itemIdPrefix}-${selected.value}` : undefined
            }
          />
        </Slate>
        <Tooltip
          label={intl.formatMessage({
            id: "component.placeholder-input.hint",
            defaultMessage: "Press # to add replaceable placeholders",
          })}
          placement="top"
        >
          <Box
            as="button"
            display="inline-block"
            border="1px solid"
            borderBottomWidth="3px"
            color="gray.600"
            borderColor="gray.300"
            borderRadius="sm"
            textTransform="uppercase"
            fontSize="xs"
            paddingX={1}
            marginLeft={1}
            cursor="default"
            _hover={{
              borderColor: "gray.400",
              color: "gray.900",
            }}
            _active={{
              borderBottomWidth: "1px",
            }}
            animation="border-bottom-width 150ms ease"
            onClick={onPlaceholderButtonClick}
          >
            <Box as="span" aria-hidden="true">
              #
            </Box>
          </Box>
        </Tooltip>
      </Box>
      <Portal>
        <PlaceholderMenu
          menuId={placeholderMenuId}
          itemIdPrefix={itemIdPrefix}
          values={values}
          selectedIndex={selectedIndex}
          ref={popper.ref}
          hidden={!isOpen}
          style={popper.style as any}
          onAddPlaceholder={(placeholder) =>
            onAddPlaceholder(editor, placeholder)
          }
          onHighlightOption={onHighlightOption}
        />
      </Portal>
    </>
  );
});

const PlaceholderMenu = forwardRef<
  HTMLDivElement,
  {
    menuId: string;
    itemIdPrefix: string;
    values: Placeholder[];
    selectedIndex: number;
    onAddPlaceholder: (placeholder: Placeholder) => void;
    onHighlightOption: (index: number) => void;
  } & BoxProps
>(function PlaceholderMenu(
  {
    menuId,
    itemIdPrefix,
    values,
    selectedIndex,
    onAddPlaceholder,
    onHighlightOption,
    ...props
  },
  ref
) {
  return (
    <Card
      ref={ref}
      id={menuId}
      role="listbox"
      overflow="auto"
      maxHeight="180px"
      paddingY={1}
      {...props}
    >
      {values.map((placeholder, index) => {
        const isSelected = index === selectedIndex;
        return (
          <Box
            key={placeholder.value}
            id={`${itemIdPrefix}-${placeholder.value}`}
            role="option"
            aria-selected={isSelected ? "true" : undefined}
            backgroundColor={isSelected ? "gray.100" : "white"}
            paddingX={4}
            paddingY={1}
            cursor="pointer"
            onMouseDown={() => onAddPlaceholder(placeholder)}
            onMouseEnter={() => onHighlightOption(index)}
          >
            {placeholder.label}
          </Box>
        );
      })}
    </Card>
  );
});
