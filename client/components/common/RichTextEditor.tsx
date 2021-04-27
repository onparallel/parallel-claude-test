import {
  Box,
  BoxProps,
  Portal,
  Stack,
  Text,
  useFormControl,
  useId,
  useMultiStyleConfig,
} from "@chakra-ui/react";
import {
  BoldIcon,
  ItalicIcon,
  ListIcon,
  SharpIcon,
  UnderlineIcon,
} from "@parallel/chakra/icons";
import {
  Placeholder,
  PlaceholderMenu,
  PlaceholderPlugin,
} from "@parallel/utils/slate/placeholders/PlaceholderPlugin";
import { usePlaceholders } from "@parallel/utils/slate/placeholders/usePlaceholders";
import { withPlaceholders } from "@parallel/utils/slate/placeholders/withPlaceholders";
import { ValueProps } from "@parallel/utils/ValueProps";
import {
  AutoformatRule,
  BoldPlugin,
  EditablePlugins,
  EditablePluginsProps,
  getNode,
  isMarkActive,
  ItalicPlugin,
  ListPlugin,
  MARK_BOLD,
  MARK_ITALIC,
  MARK_UNDERLINE,
  pipe,
  someNode,
  toggleList,
  toggleMark,
  UnderlinePlugin,
  unwrapList,
  withAutoformat,
  withList,
} from "@udecode/slate-plugins";
import {
  createElement,
  CSSProperties,
  forwardRef,
  memo,
  MouseEvent,
  RefObject,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from "react";
import { useIntl } from "react-intl";
import { omit, pick } from "remeda";
import { createEditor, Editor, Node, Range, Transforms } from "slate";
import { withHistory } from "slate-history";
import { ReactEditor, Slate, useSlate, withReact } from "slate-react";
import {
  IconButtonWithTooltip,
  IconButtonWithTooltipProps,
} from "./IconButtonWithTooltip";

function RenderComponent({
  element,
  leaf,
  attributes,
  htmlAttributes,
  styles,
  ...props
}: any) {
  return createElement(Text, {
    ...props,
    ...attributes,
    ...htmlAttributes,
    sx: styles?.root,
  });
}

export const options = {
  p: {
    component: RenderComponent,
    type: "paragraph",
    rootProps: {
      as: "p",
    },
  },
  bold: {
    component: RenderComponent,
    type: MARK_BOLD,
    hotkey: "mod+b",
    rootProps: {
      as: "strong",
    },
  },
  italic: {
    component: RenderComponent,
    type: MARK_ITALIC,
    hotkey: "mod+i",
    rootProps: {
      as: "em",
    },
  },
  underline: {
    component: RenderComponent,
    type: MARK_UNDERLINE,
    hotkey: "mod+u",
    rootProps: {
      as: "u",
    },
  },
  ul: {
    component: RenderComponent,
    type: "bulleted-list",
    rootProps: {
      as: "ul",
    },
  },
  ol: {
    component: RenderComponent,
    type: "numbered-list",
    rootProps: {
      as: "ol",
    },
  },
  li: {
    component: RenderComponent,
    type: "list-item",
    rootProps: {
      as: "li",
    },
  },
};

export interface RichTextEditorProps
  extends ValueProps<RichTextEditorValue, false>,
    EditablePluginsProps {
  isDisabled?: boolean;
  isInvalid?: boolean;
  isRequired?: boolean;
  isReadOnly?: boolean;
  placeholderOptions?: Placeholder[];
}

export type RichTextEditorValue = Node[];

export interface RichTextEditorInstance {
  focus(): void;
}

export const RichTextEditor = forwardRef<
  RichTextEditorInstance,
  RichTextEditorProps
>(function RichTextEditor(
  {
    value,
    onChange,
    isDisabled,
    isInvalid,
    isRequired,
    isReadOnly,
    onKeyDown: _onKeyDown,
    placeholderOptions = [],
    ...props
  },
  ref
) {
  const plugins = useMemo(
    () => [
      BoldPlugin(options),
      ItalicPlugin(options),
      UnderlinePlugin(options),
      ListPlugin(options),
      PlaceholderPlugin(placeholderOptions),
    ],
    [placeholderOptions]
  );
  const formControl = useFormControl({
    isDisabled,
    isInvalid,
    isRequired,
    isReadOnly,
  });
  const editor = useMemo(
    () =>
      pipe(
        createEditor(),
        withHistory,
        withReact,
        withList(options),
        withAutoformat({
          rules: [
            {
              type: options.li.type,
              markup: ["*", "-"],
              preFormat: (editor: Editor) => unwrapList(editor, options),
              format: (editor) => {
                toggleList(editor, { ...options, typeList: options.ul.type });
              },
            },
          ] as AutoformatRule[],
        }),
        withPlaceholders(placeholderOptions)
      ),
    []
  );

  useImperativeHandle(
    ref,
    () => ({
      focus: () => {
        ReactEditor.focus(editor);
      },
    }),
    [editor]
  );

  const { field: inputStyleConfig } = useMultiStyleConfig("Input", props);
  const inputStyles = {
    ...omit(inputStyleConfig as any, [
      "px",
      "pl",
      "pr",
      "paddingX",
      "paddingRight",
      "paddingLeft",
      "paddingY",
      "h",
      "height",
      "_focus",
      "_invalid",
    ]),
    _focusWithin: (inputStyleConfig as any)._focus,
    _invalid: (inputStyleConfig as any)._invalid,
  } as any;
  const style = useMemo(
    () =>
      ({
        padding: "12px 16px",
        minHeight: "120px",
      } as CSSProperties),
    []
  );

  const {
    onAddPlaceholder,
    onChangePlaceholder,
    onKeyDownPlaceholder,
    onHighlightOption,
    selectedIndex,
    search,
    target,
    values,
  } = usePlaceholders(placeholderOptions);

  const isMenuOpen = Boolean(target && values.length > 0);
  const selected = isMenuOpen ? values[selectedIndex] : undefined;

  const handleChange = useCallback(
    (value) => {
      onChangePlaceholder(editor);
      onChange(value);
    },
    [onChange, onChangePlaceholder]
  );

  const placeholderMenuId = useId(undefined, "rte-placeholder-menu");
  const itemIdPrefix = useId(undefined, "rte-placeholder-menu-item");

  const menuRef = useRef<HTMLElement>(null);
  useRepositionPlaceholderMenu(isMenuOpen, target, editor, menuRef);

  return (
    <Box
      {...pick(formControl, [
        "aria-invalid",
        "aria-required",
        "aria-readonly",
        "aria-describedby",
      ])}
      {...inputStyles}
    >
      <Slate editor={editor} value={value} onChange={handleChange}>
        <Toolbar
          isDisabled={formControl.disabled || formControl.readOnly}
          hasPlaceholders={placeholderOptions.length > 0}
        />
        <Box maxHeight="360px" overflow="auto">
          <EditablePlugins
            readOnly={formControl.disabled || formControl.readOnly}
            onKeyDown={[onKeyDownPlaceholder]}
            onKeyDownDeps={[selectedIndex, search, target]}
            style={style}
            plugins={plugins}
            aria-controls={placeholderMenuId}
            aria-autocomplete="list"
            aria-activedescendant={
              selected ? `${itemIdPrefix}-${selected.value}` : undefined
            }
            {...props}
          />
        </Box>
      </Slate>
      <Portal>
        <PlaceholderMenu
          ref={menuRef as any}
          menuId={placeholderMenuId}
          itemIdPrefix={itemIdPrefix}
          search={search}
          values={values}
          selectedIndex={selectedIndex}
          hidden={!isMenuOpen}
          onAddPlaceholder={(placeholder) =>
            onAddPlaceholder(editor, placeholder)
          }
          onHighlightOption={onHighlightOption}
          width="fit-content"
          position="relative"
        />
      </Portal>
    </Box>
  );
});

interface ToolbarProps extends BoxProps {
  isDisabled?: boolean;
  hasPlaceholders?: boolean;
}

const Toolbar = memo(function _Toolbar({
  isDisabled,
  hasPlaceholders,
  ...props
}: ToolbarProps) {
  const intl = useIntl();
  return (
    <Stack
      direction="row"
      {...props}
      borderBottom="1px solid"
      borderColor="gray.200"
      padding={1}
    >
      <MarkButton
        type="bold"
        icon={<BoldIcon />}
        isDisabled={isDisabled}
        label={intl.formatMessage({
          id: "generic.richtext.bold",
          defaultMessage: "Bold",
        })}
      />
      <MarkButton
        type="italic"
        icon={<ItalicIcon />}
        isDisabled={isDisabled}
        label={intl.formatMessage({
          id: "generic.richtext.italic",
          defaultMessage: "Italic",
        })}
      />
      <MarkButton
        type="underline"
        icon={<UnderlineIcon />}
        isDisabled={isDisabled}
        label={intl.formatMessage({
          id: "generic.richtext.underline",
          defaultMessage: "Underline",
        })}
      />
      <ListButton
        type="bulleted-list"
        icon={<ListIcon />}
        isDisabled={isDisabled}
        label={intl.formatMessage({
          id: "generic.richtext.list",
          defaultMessage: "Bullet list",
        })}
      />
      {hasPlaceholders ? (
        <PlaceholderButton
          icon={<SharpIcon />}
          isDisabled={isDisabled}
          label={intl.formatMessage({
            id: "generic.richtext.personalize",
            defaultMessage: "Personalize",
          })}
        />
      ) : null}
    </Stack>
  );
});

function useRepositionPlaceholderMenu(
  isMenuOpen: boolean,
  target: Range | null,
  editor: ReactEditor,
  menuRef: RefObject<HTMLElement>
) {
  useEffect(() => {
    if (isMenuOpen && target) {
      reposition();
      document.addEventListener("scroll", reposition, true);
      return () => document.removeEventListener("scroll", reposition, true);
    }
    function reposition() {
      const { path, offset } = target!.anchor;

      const node = ReactEditor.toDOMNode(editor, getNode(editor, path)!);
      const clone = node.cloneNode() as HTMLElement;
      clone.textContent = node.textContent!.slice(0, offset);
      clone.style.position = "fixed";
      clone.style.visibility = "hidden";
      const rect = node.getBoundingClientRect();
      node.parentElement!.appendChild(clone);
      const cloneRect = clone.getBoundingClientRect();
      node.parentElement!.removeChild(clone);
      menuRef.current!.style.top = `${rect.bottom + 5}px`;
      menuRef.current!.style.left = `${rect.left + cloneRect.width}px`;
    }
  }, [isMenuOpen, target?.anchor]);
}

function ListButton({
  type,
  ...props
}: {
  type: string;
} & Omit<IconButtonWithTooltipProps, "type">) {
  const editor = useSlate();
  const isActive = someNode(editor, { match: { type } });
  return (
    <IconButtonWithTooltip
      placement="bottom"
      variant={isActive ? "solid" : "ghost"}
      tabIndex={-1}
      onMouseDown={(event: MouseEvent) => {
        event.preventDefault();
        toggleList(editor, {
          typeList: type,
          ...options,
        });
      }}
      {...props}
    />
  );
}

function MarkButton({
  type,
  ...props
}: {
  type: string;
} & Omit<IconButtonWithTooltipProps, "type">) {
  const editor = useSlate();
  const isActive = isMarkActive(editor, type);
  return (
    <IconButtonWithTooltip
      placement="bottom"
      variant={isActive ? "solid" : "ghost"}
      tabIndex={-1}
      onMouseDown={(event: MouseEvent) => {
        event.preventDefault();
        toggleMark(editor, type);
      }}
      {...props}
    />
  );
}

function PlaceholderButton(props: IconButtonWithTooltipProps) {
  const editor = useSlate();
  return (
    <IconButtonWithTooltip
      placement="bottom"
      variant="ghost"
      tabIndex={-1}
      onMouseDown={(event: MouseEvent) => {
        event.preventDefault();
        if (!editor.selection) {
          ReactEditor.focus(editor);
        }
        setTimeout(() => {
          Transforms.insertText(editor, "#", { at: editor.selection?.anchor });
        }, 0);
      }}
      {...props}
    />
  );
}
