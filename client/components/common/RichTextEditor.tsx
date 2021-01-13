import {
  Box,
  BoxProps,
  Stack,
  Text,
  useFormControl,
  useMultiStyleConfig,
} from "@chakra-ui/react";
import {
  BoldIcon,
  ItalicIcon,
  ListIcon,
  UnderlineIcon,
} from "@parallel/chakra/icons";
import {
  AutoformatRule,
  BoldPlugin,
  EditablePlugins,
  EditablePluginsProps,
  isMarkActive,
  isNodeTypeIn,
  ItalicPlugin,
  ListPlugin,
  MARK_BOLD,
  MARK_ITALIC,
  MARK_UNDERLINE,
  pipe,
  toggleList,
  toggleMark,
  UnderlinePlugin,
  unwrapList,
  withAutoformat,
  withList,
} from "@udecode/slate-plugins";
import { createElement, CSSProperties, memo, MouseEvent, useMemo } from "react";
import { useIntl } from "react-intl";
import { omit, pick } from "remeda";
import { createEditor, Editor, Node } from "slate";
import { withHistory } from "slate-history";
import { Slate, useSlate, withReact } from "slate-react";
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

const plugins = [
  BoldPlugin(options),
  ItalicPlugin(options),
  UnderlinePlugin(options),
  ListPlugin(options),
];

export type RichTextEditorProps = {
  isDisabled?: boolean;
  isInvalid?: boolean;
  isRequired?: boolean;
  isReadOnly?: boolean;
  value: RichTextEditorContent;
  onChange: (value: RichTextEditorContent) => void;
} & EditablePluginsProps;

export type RichTextEditorContent = Node[];

export function RichTextEditor({
  value,
  onChange,
  isDisabled,
  isInvalid,
  isRequired,
  isReadOnly,
  onKeyDown: _onKeyDown,
  ...props
}: RichTextEditorProps) {
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
        })
      ),
    []
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
      <Slate editor={editor} value={value} onChange={onChange as any}>
        <Toolbar isDisabled={formControl.disabled || formControl.readOnly} />
        <Box maxHeight="360px" overflow="auto">
          <EditablePlugins
            readOnly={formControl.disabled || formControl.readOnly}
            style={style}
            plugins={plugins}
            {...props}
          />
        </Box>
      </Slate>
    </Box>
  );
}

interface ToolbarProps extends BoxProps {
  isDisabled?: boolean;
}

const Toolbar = memo(function _Toolbar({ isDisabled, ...props }: ToolbarProps) {
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
  const isActive = isNodeTypeIn(editor, type);
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
