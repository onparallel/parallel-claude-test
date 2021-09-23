import {
  Box,
  Portal,
  Text,
  Tooltip,
  useId,
  useMultiStyleConfig,
  usePopper,
} from "@chakra-ui/react";
import { chakraForwardRef } from "@parallel/chakra/utils";
import {
  PlaceholderOption,
  PlaceholderElement,
  PlaceholderMenu,
  usePlaceholderPlugin,
  PLACEHOLDER_TYPE,
} from "@parallel/utils/slate/placeholders/PlaceholderPlugin";
import { textWithPlaceholderToSlateNodes } from "@parallel/utils/slate/placeholders/textWithPlaceholderToSlateNodes";
import { useFixDeleteAll } from "@parallel/utils/slate/placeholders/useFixDeleteAll";
import { createSingleLinePlugin, useSingleLine } from "@parallel/utils/slate/SingleLinePlugin";
import { CustomEditor, SlateElement, SlateText } from "@parallel/utils/slate/types";
import { createHistoryPlugin, createReactPlugin, Plate, withPlate } from "@udecode/plate-core";
import { createParagraphPlugin, ELEMENT_PARAGRAPH } from "@udecode/plate-paragraph";
import {
  CSSProperties,
  KeyboardEvent,
  MouseEvent,
  useCallback,
  useImperativeHandle,
  useMemo,
} from "react";
import { useIntl } from "react-intl";
import { pipe } from "remeda";
import { createEditor, Editor, Transforms } from "slate";
import { ReactEditor } from "slate-react";

type PlaceholderInputValue = [PlaceholderInputBlock];

interface PlaceholderInputBlock extends SlateElement<"paragraph", PlaceholderInputBlockContent> {}

type PlaceholderInputBlockContent = SlateText | PlaceholderElement;

export type PlaceholderInputProps = {
  placeholders: PlaceholderOption[];
  value: string;
  isDisabled?: boolean;
  onChange: (value: string) => void;
};

export type PlaceholderInputRef = {
  focus: () => void;
};

function RenderElement({ attributes, nodeProps, styles, element, ...props }: any) {
  return <Text {...attributes} {...props} />;
}

const components = {
  [ELEMENT_PARAGRAPH]: RenderElement,
};

const options = {
  [ELEMENT_PARAGRAPH]: { type: "paragraph" },
};

export const PlaceholderInput = chakraForwardRef<"div", PlaceholderInputProps, PlaceholderInputRef>(
  ({ id, placeholder, placeholders, value, isDisabled, onChange, onKeyDown, ...props }, ref) => {
    const intl = useIntl();
    const {
      plugin,
      onAddPlaceholder,
      onChangePlaceholder,
      onKeyDownPlaceholder,
      onHighlightOption,
      selectedIndex,
      search,
      target,
      values,
    } = usePlaceholderPlugin(placeholders);
    const plugins = useMemo(
      () => [
        createReactPlugin(),
        createHistoryPlugin(),
        createParagraphPlugin(),
        createSingleLinePlugin(),
        plugin,
      ],
      [plugin]
    );
    const editor = useMemo<CustomEditor>(
      () => pipe(createEditor(), withPlate({ id, plugins, options, components })),
      []
    );

    useImperativeHandle(
      ref,
      () => ({
        focus: () => {
          ReactEditor.focus(editor);
          Transforms.select(editor, Editor.end(editor, []));
        },
      }),
      [editor]
    );

    const { onChangeSelection } = useSingleLine(editor);

    const { onKeyDown: onKeyDownFixDeleteAll } = useFixDeleteAll();

    const handleChange = useCallback(
      (value: PlaceholderInputValue) => {
        onChangePlaceholder(editor);
        onChangeSelection(editor.selection);
        onChange(slateNodesToTextWithPlaceholders(value));
      },
      [onChange, onChangePlaceholder, onChangeSelection, editor]
    );

    const handleKeyDown = useCallback(
      (event: KeyboardEvent<HTMLDivElement>) => {
        onKeyDownPlaceholder(event, editor);
        onKeyDownFixDeleteAll(event, editor);
        onKeyDown?.(event);
      },
      [onKeyDownPlaceholder, onKeyDownFixDeleteAll, onKeyDown]
    );

    const placeholderMenuId = useId(undefined, "placeholder-menu");
    const itemIdPrefix = useId(undefined, "placeholder-menu-item");
    const isOpen = Boolean(target && values.length > 0);

    const { field: inputStyleConfig } = useMultiStyleConfig("Input", props);
    const inputStyles = {
      ...inputStyleConfig,
      _focusWithin: (inputStyleConfig as any)._focus,
    } as any;

    const slateValue = useMemo(
      () => textWithPlaceholderToSlateNodes(value, placeholders) as PlaceholderInputValue,
      [value]
    );
    const selected = isOpen ? values[selectedIndex] : undefined;

    function onPlaceholderButtonClick(event: MouseEvent) {
      event.stopPropagation();
      Transforms.insertText(editor, "#", { at: editor.selection?.anchor });
      ReactEditor.focus(editor);
    }

    const { referenceRef, popperRef } = usePopper({
      placement: "bottom",
      gutter: 2,
      matchWidth: true,
    });

    const style = useMemo(
      () =>
        ({
          flex: 1,
          padding: "0 0.25rem",
          whiteSpace: "pre",
          overflow: "hidden",
        } as CSSProperties),
      []
    );

    return (
      <>
        <Box
          id={id}
          ref={referenceRef}
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
          <Plate
            id={id}
            editor={editor}
            plugins={plugins}
            options={options}
            components={components}
            value={slateValue}
            onChange={handleChange as any}
            editableProps={{
              readOnly: isDisabled,
              placeholder,
              style,
              onKeyDown: handleKeyDown,
              "aria-controls": placeholderMenuId,
              "aria-autocomplete": "list",
              "aria-activedescendant": selected ? `${itemIdPrefix}-${selected.value}` : undefined,
            }}
          />
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
            ref={popperRef}
            menuId={placeholderMenuId}
            itemIdPrefix={itemIdPrefix}
            search={search}
            values={values}
            selectedIndex={selectedIndex}
            visibility={isOpen ? "visible" : "hidden"}
            onAddPlaceholder={(placeholder) => onAddPlaceholder(editor, placeholder)}
            onHighlightOption={onHighlightOption}
          />
        </Portal>
      </>
    );
  }
);

function slateNodesToTextWithPlaceholders(value: PlaceholderInputValue) {
  return value[0].children
    .map((child) => {
      if ("type" in child) {
        return child.type === PLACEHOLDER_TYPE ? `#${child.placeholder}#` : "";
      } else {
        return child.text;
      }
    })
    .join("");
}
