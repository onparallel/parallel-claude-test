import {
  Box,
  BoxProps,
  Portal,
  Stack,
  Text,
  useFormControl,
  useId,
  useMultiStyleConfig,
  usePopper,
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
import { CustomElement } from "@parallel/utils/slate/types";
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
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
} from "react";
import { useIntl } from "react-intl";
import { omit, pick } from "remeda";
import { createEditor, Editor, Transforms } from "slate";
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

export type RichTextEditorValue = CustomElement[];

export interface RichTextEditorInstance {
  focus(): void;
}

export const RichTextEditor = forwardRef<
  RichTextEditorInstance,
  RichTextEditorProps
>(function RichTextEditor(
  {
    id,
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
    id,
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
        minHeight: "120px !important",
        color: isDisabled ? "#A0AEC0" : undefined,
      } as CSSProperties),
    [isDisabled]
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

  const { referenceRef, popperRef, forceUpdate } = usePopper({
    placement: "bottom-start",
    enabled: isMenuOpen,
  });
  useEffect(() => {
    if (isMenuOpen && target) {
      reposition();
      document.addEventListener("scroll", reposition, true);
      return () => document.removeEventListener("scroll", reposition, true);
    }
    function reposition() {
      /**
       * The main idea of this function is to place the placeholders menu next to the #.
       * This function gets the node of the piece of text where the anchor is.
       * This node will always be a span.
       * We create a "fake" paragraph and we insert the text of the node but:
       * - We insert a span with all the previous text before and including the #.
       * - We add a marginLeft to this span to ensure it overlaps the text in the real editor.
       * - We add an empty span which we will use as the needle to position the menu
       * We insert this fake paragraph and we compute the boundingClientRect of the second
       * children which we will use to create a popper virtual element.
       */
      const { path, offset } = target!.anchor;

      const node = ReactEditor.toDOMNode(editor, getNode(editor, path)!);
      const parentRect = (
        node.parentNode! as HTMLElement
      ).getBoundingClientRect();
      const fake = document.createElement("div");
      fake.style.visibility = "hidden";
      const prefix = document.createElement("span");
      const style = window.getComputedStyle(node.offsetParent!);
      prefix.style.marginLeft = `${
        node.offsetLeft - parseInt(style.paddingLeft)
      }px`;
      prefix.innerText = node.textContent!.slice(0, offset + 1);
      fake.appendChild(prefix);
      const _target = document.createElement("span");
      fake.appendChild(_target);
      fake.style.position = "fixed";
      fake.style.top = `${parentRect.top}px`;
      fake.style.left = `${parentRect.left}px`;
      fake.style.width = `${parentRect.width}px`;
      node.parentElement!.appendChild(fake);
      const rect = _target.getBoundingClientRect();
      node.parentElement!.removeChild(fake);
      referenceRef({ getBoundingClientRect: () => rect, contextElement: node });
      forceUpdate?.();
    }
  }, [isMenuOpen, target?.anchor.offset]);

  return (
    <Box
      {...pick(formControl, [
        "aria-invalid",
        "aria-required",
        "aria-readonly",
        "aria-describedby",
      ])}
      {...inputStyles}
      overflow="hidden"
    >
      <Slate editor={editor} value={value} onChange={handleChange}>
        <Toolbar
          height="40px"
          isDisabled={formControl.disabled || formControl.readOnly}
          hasPlaceholders={placeholderOptions.length > 0}
        />
        <Box
          maxHeight="250px"
          overflow="auto"
          sx={{
            '[contenteditable="false"]': {
              width: "auto !important",
            },
            "& > div": {
              minHeight: "120px !important",
            },
          }}
        >
          <EditablePlugins
            id={formControl.id}
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
          ref={popperRef}
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
          opacity={isMenuOpen ? 1 : 0}
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
        size="sm"
        icon={<BoldIcon fontSize="16px" />}
        isDisabled={isDisabled}
        label={intl.formatMessage({
          id: "generic.richtext.bold",
          defaultMessage: "Bold",
        })}
      />
      <MarkButton
        type="italic"
        size="sm"
        icon={<ItalicIcon fontSize="16px" />}
        isDisabled={isDisabled}
        label={intl.formatMessage({
          id: "generic.richtext.italic",
          defaultMessage: "Italic",
        })}
      />
      <MarkButton
        type="underline"
        size="sm"
        icon={<UnderlineIcon fontSize="16px" />}
        isDisabled={isDisabled}
        label={intl.formatMessage({
          id: "generic.richtext.underline",
          defaultMessage: "Underline",
        })}
      />
      <ListButton
        type="bulleted-list"
        size="sm"
        icon={<ListIcon fontSize="16px" />}
        isDisabled={isDisabled}
        label={intl.formatMessage({
          id: "generic.richtext.list",
          defaultMessage: "Bullet list",
        })}
      />
      {hasPlaceholders ? (
        <PlaceholderButton
          size="sm"
          icon={<SharpIcon fontSize="16px" />}
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
          ReactEditor.focus(editor as any);
        }
        setTimeout(() => {
          Transforms.insertText(editor, "#", { at: editor.selection?.anchor });
        }, 0);
      }}
      {...props}
    />
  );
}
