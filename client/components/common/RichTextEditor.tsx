import {
  IconButton,
  PseudoBox,
  PseudoBoxProps,
  Stack,
  Tooltip,
  useColorMode,
  useTheme
} from "@chakra-ui/core";
import { useFocus } from "@parallel/utils/useFocus";
import isHotkey from "is-hotkey";
import React, {
  KeyboardEvent,
  memo,
  TextareaHTMLAttributes,
  useCallback,
  useMemo,
  CSSProperties
} from "react";
import { useIntl } from "react-intl";
import { createEditor, Editor, Node, Transforms } from "slate";
import { withHistory } from "slate-history";
import {
  Editable,
  RenderElementProps,
  RenderLeafProps,
  Slate,
  useSlate,
  withReact
} from "slate-react";
import { get } from "styled-system";
import {
  IconButtonWithTooltip,
  IconButtonWithTooltipProps
} from "./IconButtonWithTooltip";

const HOTKEYS = {
  "mod+b": "bold",
  "mod+i": "italic",
  "mod+u": "underline"
} as const;

const LIST_TYPES = ["numbered-list", "bulleted-list"];

export type RichTextEditorProps = {
  value: RichTextEditorContent;
  onChange: (value: RichTextEditorContent) => void;
} & Omit<TextareaHTMLAttributes<HTMLDivElement>, "value" | "onChange">;

export type RichTextEditorContent = Node[];

export function RichTextEditor({
  value,
  onChange,
  style: editorStyle,
  ...props
}: RichTextEditorProps) {
  const editor = useMemo(() => withHistory(withReact(createEditor())), []);
  const onKeyDown = useCallback((event: KeyboardEvent) => {
    for (const [hotkey, mark] of Object.entries(HOTKEYS)) {
      if (isHotkey(hotkey, event.nativeEvent)) {
        event.preventDefault();
        toggleMark(editor, mark);
      }
    }
  }, []);
  const [focused, focusBind] = useFocus(props);
  const styles = useStyles({ focused, disabled: props.disabled });

  return (
    <PseudoBox {...styles}>
      <Slate editor={editor} value={value} onChange={onChange}>
        <Toolbar />
        <PseudoBox>
          <MemoEditable
            renderElement={renderElement}
            renderLeaf={renderLeaf}
            onKeyDown={onKeyDown}
            style={{
              ...editorStyle,
              padding: "8px 16px"
            }}
            {...props}
            {...focusBind}
          />
        </PseudoBox>
      </Slate>
    </PseudoBox>
  );
}

const MemoEditable = memo(Editable);

const Toolbar = memo(function _Toolbar(props: PseudoBoxProps) {
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
        format="bold"
        icon={"bold" as any}
        label={intl.formatMessage({
          id: "generic.richtext.bold",
          defaultMessage: "Bold"
        })}
      />
      <MarkButton
        format="italic"
        icon={"italic" as any}
        label={intl.formatMessage({
          id: "generic.richtext.italic",
          defaultMessage: "Italic"
        })}
      />
      <MarkButton
        format="underline"
        icon={"underline" as any}
        label={intl.formatMessage({
          id: "generic.richtext.underline",
          defaultMessage: "Underline"
        })}
      />
      <BlockButton
        format="bulleted-list"
        icon={"list" as any}
        label={intl.formatMessage({
          id: "generic.richtext.list",
          defaultMessage: "Bullet list"
        })}
      />
    </Stack>
  );
});

function toggleBlock(editor: Editor, format: string) {
  const isActive = isBlockActive(editor, format);
  const isList = LIST_TYPES.includes(format);

  Transforms.unwrapNodes(editor, {
    match: n => LIST_TYPES.includes(n.type),
    split: true
  });

  Transforms.setNodes(editor, {
    type: isActive ? "paragraph" : isList ? "list-item" : format
  });

  if (!isActive && isList) {
    const block = { type: format, children: [] };
    Transforms.wrapNodes(editor, block);
  }
}

function toggleMark(editor: Editor, format: string) {
  const isActive = isMarkActive(editor, format);

  if (isActive) {
    Editor.removeMark(editor, format);
  } else {
    Editor.addMark(editor, format, true);
  }
}

function isBlockActive(editor: Editor, format: string) {
  const matches = Editor.nodes(editor, {
    match: n => n.type === format
  });
  return Array.from(matches).length > 0;
}

function isMarkActive(editor: Editor, format: string) {
  const marks = Editor.marks(editor);
  return marks ? marks[format] === true : false;
}

function renderElement({ attributes, children, element }: RenderElementProps) {
  switch (element.type) {
    case "bulleted-list":
      return (
        <ul {...attributes} style={{ paddingLeft: "20px" }}>
          {children}
        </ul>
      );
    case "list-item":
      return <li {...attributes}>{children}</li>;
    case "numbered-list":
      return <ol {...attributes}>{children}</ol>;
    default:
      return <p {...attributes}>{children}</p>;
  }
}

function renderLeaf({ attributes, children, leaf }: RenderLeafProps) {
  if (leaf.bold) {
    children = <strong>{children}</strong>;
  }

  if (leaf.italic) {
    children = <em>{children}</em>;
  }

  if (leaf.underline) {
    children = <u>{children}</u>;
  }

  const style: CSSProperties = {};
  if (!leaf.placeholder) {
    style.verticalAlign = "text-top";
  }
  return (
    <span style={style} {...attributes}>
      {children}
    </span>
  );
}

type BlockButtonProps = IconButtonWithTooltipProps & {
  format: string;
};

function BlockButton({ format, icon, ...props }: BlockButtonProps) {
  const editor = useSlate();
  return (
    <IconButtonWithTooltip
      placement="bottom"
      showDelay={300}
      icon={icon as any}
      variant={isBlockActive(editor, format) ? "solid" : "ghost"}
      onMouseDown={event => {
        event.preventDefault();
        toggleBlock(editor, format);
      }}
      {...props}
    />
  );
}

type MarkButtonProps = IconButtonWithTooltipProps & {
  format: string;
};

function MarkButton({ format, icon, ...props }: MarkButtonProps) {
  const editor = useSlate();
  return (
    <IconButtonWithTooltip
      placement="bottom"
      showDelay={300}
      icon={icon as any}
      variant={isMarkActive(editor, format) ? "solid" : "ghost"}
      onMouseDown={event => {
        event.preventDefault();
        toggleMark(editor, format);
      }}
      {...props}
    />
  );
}

function useStyles({
  focused,
  disabled
}: {
  focused?: boolean;
  disabled?: boolean;
}) {
  const theme = useTheme();
  const { colorMode } = useColorMode();
  return useMemo(() => {
    const focusBorderColor = "blue.500";
    const errorBorderColor = "red.500";
    const bg = { light: "white", dark: "whiteAlpha.100" };
    const borderColor = { light: "inherit", dark: "whiteAlpha.50" };
    const hoverColor = { light: "gray.300", dark: "whiteAlpha.200" };

    /**
     * styled-system's get takes 3 args
     * - object or array to read from
     * - key to get
     * - fallback value
     */
    const _focusBorderColor = get(
      theme.colors,
      focusBorderColor,
      focusBorderColor // If color doesn't exist in theme, use it's raw value
    );
    const _errorBorderColor = get(
      theme.colors,
      errorBorderColor,
      errorBorderColor
    );

    return {
      rounded: "md",
      border: "1px",
      borderColor: borderColor[colorMode],
      bg: bg[colorMode],
      _hover: {
        borderColor: hoverColor[colorMode]
      },
      ...(focused
        ? {
            borderColor: _focusBorderColor,
            boxShadow: `0 0 0 1px ${_focusBorderColor}`,
            _hover: {
              borderColor: _focusBorderColor
            }
          }
        : {}),
      ...(disabled
        ? {
            borderColor: borderColor[colorMode],
            bg: bg[colorMode],
            opacity: 0.4,
            cursor: "not-allowed",
            _hover: {
              borderColor: _focusBorderColor,
              boxShadow: `0 0 0 1px ${_focusBorderColor}`
            }
          }
        : {})
      // _invalid: {
      //   borderColor: _errorBorderColor,
      //   boxShadow: `0 0 0 1px ${_errorBorderColor}`
      // }
    };
  }, [focused, disabled]);
}

export function isEmptyContent(content: RichTextEditorContent) {
  return (
    content?.length === 1 &&
    content[0].children?.length === 1 &&
    content[0].children[0]?.text === ""
  );
}
