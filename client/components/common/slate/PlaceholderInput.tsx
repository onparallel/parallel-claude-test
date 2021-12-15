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
import { PlaceholderMenu } from "@parallel/components/common/slate/PlaceholderMenu";
import {
  PlaceholderElement,
  PlaceholderOption,
  PLACEHOLDER_TYPE,
  usePlaceholderPlugin,
} from "@parallel/utils/slate/placeholders/PlaceholderPlugin";
import { textWithPlaceholderToSlateNodes } from "@parallel/utils/slate/placeholders/textWithPlaceholderToSlateNodes";
import { createSingleLinePlugin } from "@parallel/utils/slate/SingleLinePlugin";
import { CustomEditor, SlateElement, SlateText } from "@parallel/utils/slate/types";
import { useConstant } from "@parallel/utils/useConstant";
import {
  createHistoryPlugin,
  createPlugins,
  createReactPlugin,
  Plate,
  withPlate,
} from "@udecode/plate-core";
import { createParagraphPlugin } from "@udecode/plate-paragraph";
import { CSSProperties, MouseEvent, useImperativeHandle, useMemo } from "react";
import { useIntl } from "react-intl";
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

export const PlaceholderInput = chakraForwardRef<"div", PlaceholderInputProps, PlaceholderInputRef>(
  ({ id, placeholder, placeholders, value, isDisabled, onChange, ...props }, ref) => {
    const intl = useIntl();
    const { plugin, onAddPlaceholder, onHighlightOption, index, search, target, values } =
      usePlaceholderPlugin(placeholders);
    const plugins = useConstant(() =>
      createPlugins([
        createReactPlugin(),
        createHistoryPlugin(),
        createParagraphPlugin({ type: "paragraph", component: RenderElement }),
        createSingleLinePlugin(),
        plugin,
      ])
    );
    const editor = useMemo<CustomEditor>(() => withPlate(createEditor(), { id, plugins }), []);

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
    const selected = isOpen ? values[index] : undefined;

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
            value={slateValue}
            onChange={(value) =>
              onChange(slateNodesToTextWithPlaceholders(value as PlaceholderInputValue))
            }
            editableProps={{
              readOnly: isDisabled,
              placeholder,
              style,
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
            isOpen={isOpen}
            ref={popperRef}
            menuId={placeholderMenuId}
            itemIdPrefix={itemIdPrefix}
            search={search}
            values={values}
            highlightedIndex={index}
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
