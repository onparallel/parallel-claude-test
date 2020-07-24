import {
  Box,
  PseudoBox,
  PseudoBoxProps,
  useTheme,
  Tooltip,
} from "@chakra-ui/core";
import Popper, { PopperProps } from "@chakra-ui/core/dist/Popper";
import {
  Placeholder,
  PlaceholderPlugin,
} from "@parallel/utils/slate/placeholders/PlaceholderPlugin";
import { slateNodesToTextWithPlaceholders } from "@parallel/utils/slate/placeholders/slateNodesToTextWithPlaceholders";
import { textWithPlaceholderToSlateNodes } from "@parallel/utils/slate/placeholders/textWithPlaceholderToSlateNodes";
import { useFixDeleteAll } from "@parallel/utils/slate/placeholders/useFixDeleteAll";
import { usePlaceholders } from "@parallel/utils/slate/placeholders/usePlaceholders";
import { withPlaceholders } from "@parallel/utils/slate/placeholders/withPlaceholders";
import { useInputLikeStyles } from "@parallel/utils/useInputLikeStyles";
import { useId } from "@reach/auto-id";
import { EditablePlugins } from "@udecode/slate-plugins";
import { forwardRef, useCallback, useMemo, useRef, MouseEvent } from "react";
import { pipe } from "remeda";
import { createEditor, Editor, Transforms } from "slate";
import { withHistory } from "slate-history";
import { ReactEditor, Slate, withReact } from "slate-react";
import {
  useSingleLine,
  withSingleLine,
} from "../../utils/slate/withSingleLine";
import { Card } from "./Card";
import { useIntl } from "react-intl";

export type PlaceholderInputProps = {
  placeholders: Placeholder[];
  value: string;
  isDisabled?: boolean;
  onChange: (value: string) => void;
} & Omit<PseudoBoxProps, "onChange">;

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

  const wrapper = useRef<HTMLElement>();
  const placeholderMenuId = `placeholder-menu-${useId()}`;
  const itemIdPrefix = `placeholder-menu-item-${useId()}`;
  const isOpen = Boolean(target && values.length > 0);
  const styles = useInputLikeStyles();

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

  const hint = intl.formatMessage({
    id: "component.placeholder-input.hint",
    defaultMessage: "Press # to add replaceable placeholders",
  });

  return (
    <>
      <PseudoBox
        ref={wrapper}
        role="combobox"
        aria-owns={placeholderMenuId}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-disabled={isDisabled}
        height={10}
        display="flex"
        alignItems="center"
        paddingLeft={3}
        paddingRight={2}
        {...styles}
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
        <Tooltip label={hint} aria-label={hint} zIndex={1500} placement="top">
          <PseudoBox
            as="button"
            display="inline-block"
            border="1px solid"
            borderBottomWidth="3px"
            color="gray.600"
            borderColor="gray.300"
            rounded="sm"
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
          </PseudoBox>
        </Tooltip>
      </PseudoBox>
      <PlaceholderMenu
        menuId={placeholderMenuId}
        itemIdPrefix={itemIdPrefix}
        values={values}
        selectedIndex={selectedIndex}
        isOpen={isOpen}
        anchor={wrapper.current}
        onAddPlaceholder={(placeholder) =>
          onAddPlaceholder(editor, placeholder)
        }
        onHighlightOption={onHighlightOption}
      />
    </>
  );
});

function PlaceholderMenu({
  menuId,
  itemIdPrefix,
  anchor,
  values,
  selectedIndex,
  isOpen,
  onAddPlaceholder,
  onHighlightOption,
}: {
  menuId: string;
  itemIdPrefix: string;
  anchor: PopperProps["anchorEl"];
  values: Placeholder[];
  selectedIndex: number;
  isOpen: boolean;
  onAddPlaceholder: (placeholder: Placeholder) => void;
  onHighlightOption: (index: number) => void;
}) {
  const theme = useTheme();
  const popperOptions = useMemo(() => {
    const setWidth = ({ instance: { reference, popper } }: any) => {
      popper.style.width = `${reference.offsetWidth}px`;
    };
    return { onCreate: setWidth, onUpdate: setWidth };
  }, []);
  return (
    <Popper
      usePortal
      isOpen={isOpen}
      anchorEl={anchor}
      placement="bottom-start"
      popperOptions={popperOptions}
      hasArrow={false}
      zIndex={theme.zIndices.popover}
    >
      <Card
        id={menuId}
        role="listbox"
        overflow="auto"
        maxHeight="180px"
        paddingY={1}
      >
        {values.map((placeholder, index) => {
          const isSelected = index === selectedIndex;
          return (
            <PseudoBox
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
            </PseudoBox>
          );
        })}
      </Card>
    </Popper>
  );
}
