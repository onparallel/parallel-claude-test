import {
  Box,
  BoxProps,
  Stack,
  Text,
  useFormControl,
  useMultiStyleConfig,
} from "@chakra-ui/core";
import {
  BoldIcon,
  ItalicIcon,
  ListIcon,
  UnderlineIcon,
} from "@parallel/chakra/icons";
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
import { createElement, CSSProperties, memo, useMemo } from "react";
import { useIntl } from "react-intl";
import { createEditor, Node } from "slate";
import { withHistory } from "slate-history";
import { Slate, useSlate, withReact } from "slate-react";
import { withAutolist } from "../../utils/slate/withAutolist";
import {
  IconButtonWithTooltip,
  IconButtonWithTooltipProps,
} from "./IconButtonWithTooltip";
import { omit } from "remeda";

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

  const { field: inputStyleConfig } = useMultiStyleConfig("Input", props);
  const inputStyles = {
    ...omit(inputStyleConfig as any, [
      "pl",
      "pr",
      "paddingRight",
      "paddingLeft",
      "paddingY",
      "h",
      "height",
    ]),
    _focusWithin: (inputStyleConfig as any)._focus,
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
      aria-disabled={formControl.isDisabled}
      aria-invalid={formControl.isInvalid}
      {...inputStyles}
    >
      <Slate editor={editor} value={value} onChange={onChange as any}>
        <Toolbar disabled={formControl.isDisabled || formControl.isReadOnly} />
        <Box maxHeight="360px" overflow="auto">
          <EditablePlugins
            readOnly={formControl.isDisabled && formControl.isReadOnly}
            style={style}
            plugins={plugins}
            {...props}
          />
        </Box>
      </Slate>
    </Box>
  );
}

const Toolbar = memo(function _Toolbar({
  disabled,
  ...props
}: BoxProps & { disabled?: boolean }) {
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
        isDisabled={disabled}
        label={intl.formatMessage({
          id: "generic.richtext.bold",
          defaultMessage: "Bold",
        })}
      />
      <MarkButton
        type="italic"
        icon={<ItalicIcon />}
        isDisabled={disabled}
        label={intl.formatMessage({
          id: "generic.richtext.italic",
          defaultMessage: "Italic",
        })}
      />
      <MarkButton
        type="underline"
        icon={<UnderlineIcon />}
        isDisabled={disabled}
        label={intl.formatMessage({
          id: "generic.richtext.underline",
          defaultMessage: "Underline",
        })}
      />
      <ListButton
        type="bulleted-list"
        icon={<ListIcon />}
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
      variant={isActive ? "solid" : "ghost"}
      tabIndex={-1}
      onMouseDown={(event) => {
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
      onMouseDown={(event) => {
        event.preventDefault();
        toggleMark(editor, type);
      }}
      {...props}
    />
  );
}
