/** @jsx jsx */
import {
  PseudoBox,
  PseudoBoxProps,
  Stack,
  useFormControl,
  Text,
} from "@chakra-ui/core";
import { jsx } from "@emotion/core";
import {
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
  withList,
} from "@udecode/slate-plugins";
import { CSSProperties, memo, useMemo } from "react";
import { useIntl } from "react-intl";
import { pick } from "remeda";
import { createEditor, Node } from "slate";
import { withHistory } from "slate-history";
import { Slate, useSlate, withReact } from "slate-react";
import {
  IconButtonWithTooltip,
  IconButtonWithTooltipProps,
} from "./IconButtonWithTooltip";
import { useInputLikeStyles } from "../../utils/useInputLikeStyles";
import { withAutolist } from "../../utils/slate/withAutolist";
import { createElement } from "react";

function TextComponent({ element, attributes, styles, ...props }: any) {
  return createElement(Text, { ...props, ...attributes });
}

export const options = {
  p: {
    component: TextComponent,
    type: "paragraph",
    rootProps: {
      as: "p",
    },
  },
  bold: {
    component: TextComponent,
    type: MARK_BOLD,
    hotkey: "mod+b",
    rootProps: {
      as: "strong",
    },
  },
  italic: {
    component: TextComponent,
    type: MARK_ITALIC,
    hotkey: "mod+i",
    rootProps: {
      as: "em",
    },
  },
  underline: {
    component: TextComponent,
    type: MARK_UNDERLINE,
    hotkey: "mod+u",
    rootProps: {
      as: "u",
    },
  },
  ul: {
    component: TextComponent,
    type: "bulleted-list",
    rootProps: {
      as: "ul",
      paddingLeft: 6,
    },
  },
  ol: {
    component: TextComponent,
    type: "numbered-list",
    rootProps: {
      as: "ol",
      paddingLeft: 6,
    },
  },
  li: {
    component: TextComponent,
    type: "list-item",
    rootProps: {
      as: "li",
    },
  },
};

export const nodeTypes = {
  // elements
  typeP: "paragraph",
  typeUl: "bulleted-list",
  typeOl: "numbered-list",
  typeLi: "list-item",
  // marks
  typeBold: MARK_BOLD,
  typeItalic: MARK_ITALIC,
  typeUnderline: MARK_UNDERLINE,
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
        withAutolist(options)
      ),
    []
  );

  const inputStyles = useInputLikeStyles();
  const style = useMemo(
    () =>
      ({
        padding: "12px 16px",
        minHeight: "120px",
      } as CSSProperties),
    []
  );

  return (
    <PseudoBox
      aria-disabled={formControl.isDisabled}
      aria-invalid={formControl.isInvalid}
      {...inputStyles}
    >
      <Slate editor={editor} value={value} onChange={onChange as any}>
        <Toolbar disabled={formControl.isDisabled || formControl.isReadOnly} />
        <PseudoBox maxHeight="360px" overflow="auto">
          <EditablePlugins
            readOnly={formControl.isDisabled && formControl.isReadOnly}
            style={style}
            plugins={plugins}
            {...props}
          />
        </PseudoBox>
      </Slate>
    </PseudoBox>
  );
}

const Toolbar = memo(function _Toolbar({
  disabled,
  ...props
}: PseudoBoxProps & { disabled?: boolean }) {
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
        icon={"bold" as any}
        isDisabled={disabled}
        label={intl.formatMessage({
          id: "generic.richtext.bold",
          defaultMessage: "Bold",
        })}
      />
      <MarkButton
        type="italic"
        icon={"italic" as any}
        isDisabled={disabled}
        label={intl.formatMessage({
          id: "generic.richtext.italic",
          defaultMessage: "Italic",
        })}
      />
      <MarkButton
        type="underline"
        icon={"underline" as any}
        isDisabled={disabled}
        label={intl.formatMessage({
          id: "generic.richtext.underline",
          defaultMessage: "Underline",
        })}
      />
      <ListButton
        type="bulleted-list"
        icon={"list" as any}
        isDisabled={disabled}
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
      showDelay={300}
      variant={isActive ? "solid" : "ghost"}
      tabIndex={-1}
      onMouseDown={(event) => {
        event.preventDefault();
        toggleList(editor, {
          typeList: type,
          ...pick(nodeTypes, ["typeP", "typeLi", "typeUl", "typeOl"]),
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
      showDelay={300}
      variant={isActive ? "solid" : "ghost"}
      tabIndex={-1}
      onMouseDown={(event) => {
        event.preventDefault();
        toggleMark(editor, type);
      }}
      {...props}
    />
  );
}
