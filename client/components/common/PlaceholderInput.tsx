import {
  Box,
  Portal,
  Tooltip,
  useId,
  useMultiStyleConfig,
  usePopper,
} from "@chakra-ui/react";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { useAssignMemoRef } from "@parallel/utils/assignRef";
import {
  Placeholder,
  PlaceholderMenu,
  PlaceholderPlugin,
} from "@parallel/utils/slate/placeholders/PlaceholderPlugin";
import { slateNodesToTextWithPlaceholders } from "@parallel/utils/slate/placeholders/slateNodesToTextWithPlaceholders";
import { textWithPlaceholderToSlateNodes } from "@parallel/utils/slate/placeholders/textWithPlaceholderToSlateNodes";
import { useFixDeleteAll } from "@parallel/utils/slate/placeholders/useFixDeleteAll";
import { usePlaceholders } from "@parallel/utils/slate/placeholders/usePlaceholders";
import { withPlaceholders } from "@parallel/utils/slate/placeholders/withPlaceholders";
import {
  useSingleLine,
  withSingleLine,
} from "@parallel/utils/slate/withSingleLine";
import { EditablePlugins } from "@udecode/slate-plugins";
import { MouseEvent, useCallback, useEffect, useMemo } from "react";
import { useIntl } from "react-intl";
import { pipe } from "remeda";
import { createEditor, Editor, Transforms } from "slate";
import { withHistory } from "slate-history";
import { ReactEditor, Slate, withReact } from "slate-react";

export type PlaceholderInputProps = {
  placeholders: Placeholder[];
  value: string;
  isDisabled?: boolean;
  onChange: (value: string) => void;
};

export type PlaceholderInputRef = {
  focus: () => void;
};

export const PlaceholderInput = chakraForwardRef<
  "div",
  PlaceholderInputProps,
  PlaceholderInputRef
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

  useAssignMemoRef(
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

  const placeholderMenuId = useId(undefined, "placeholder-menu");
  const itemIdPrefix = useId(undefined, "placeholder-menu-item");
  const isOpen = Boolean(target && values.length > 0);

  const { field: inputStyleConfig } = useMultiStyleConfig("Input", props);
  const inputStyles = {
    ...inputStyleConfig,
    _focusWithin: (inputStyleConfig as any)._focus,
  } as any;

  const slateValue = useMemo(
    () => textWithPlaceholderToSlateNodes(value, placeholders),
    [value]
  );
  const selected = isOpen ? values[selectedIndex] : undefined;

  function onPlaceholderButtonClick(event: MouseEvent) {
    event.stopPropagation();
    Transforms.insertText(editor, "#", { at: editor.selection?.anchor });
    ReactEditor.focus(editor);
  }

  const { getPopperProps, getReferenceProps, forceUpdate, state } = usePopper({
    placement: "bottom",
    gutter: 2,
  });

  useEffect(() => {
    if (isOpen) {
      const { popper, reference } = state!.elements;
      popper.style.width = `${(reference as HTMLDivElement).offsetWidth}px`;
    }
    forceUpdate?.();
  }, [isOpen, forceUpdate]);

  return (
    <>
      <Box
        role="combobox"
        aria-owns={placeholderMenuId}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-disabled={isDisabled}
        display="flex"
        alignItems="center"
        {...getReferenceProps({ ...props, ...inputStyles })}
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
          visibility={isOpen ? "visible" : "hidden"}
          onAddPlaceholder={(placeholder) =>
            onAddPlaceholder(editor, placeholder)
          }
          onHighlightOption={onHighlightOption}
          {...(getPopperProps() as any)}
        />
      </Portal>
    </>
  );
});
