import { Stack } from "@chakra-ui/react";
import {
  BoldIcon,
  ItalicIcon,
  ListIcon,
  OrderedListIcon,
  UnderlineIcon,
} from "@parallel/chakra/icons";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { usePlateEditorRef } from "@udecode/plate-core";
import { useIntl } from "react-intl";
import { ToolbarHeadingButton } from "./ToolbarHeadingButton";
import { ToolbarLinkButton } from "./ToolbarLinkButton";
import { ToolbarListButton } from "./ToolbarListButton";
import { ToolbarMarkButton } from "./ToolbarMarkButton";
import { ToolbarPlaceholderButton } from "./ToolbarPlaceholderButton";

interface RichTextEditorToolbarProps {
  editorId: string;
  isDisabled?: boolean;
  hasPlaceholders?: boolean;
  hasHeadingButton?: boolean;
  hasListButtons?: boolean;
}

export const RichTextEditorToolbar = chakraForwardRef<"div", RichTextEditorToolbarProps>(
  function RichTextEditorToolbar(
    {
      editorId,
      isDisabled,
      hasPlaceholders,
      hasHeadingButton = true,
      hasListButtons = true,
      ...props
    },
    ref
  ) {
    const intl = useIntl();
    const editor = usePlateEditorRef(editorId)!;
    return (
      <Stack
        ref={ref}
        direction="row"
        borderBottom="1px solid"
        borderColor="gray.200"
        padding={1}
        {...props}
      >
        {hasHeadingButton ? <ToolbarHeadingButton editor={editor} disabled={isDisabled} /> : null}
        <ToolbarMarkButton
          editor={editor}
          type="bold"
          icon={<BoldIcon fontSize="16px" />}
          isDisabled={isDisabled}
          label={intl.formatMessage({
            id: "component.rich-text-editor.bold",
            defaultMessage: "Bold",
          })}
        />
        <ToolbarMarkButton
          editor={editor}
          type="italic"
          icon={<ItalicIcon fontSize="16px" />}
          isDisabled={isDisabled}
          label={intl.formatMessage({
            id: "component.rich-text-editor.italic",
            defaultMessage: "Italic",
          })}
        />
        <ToolbarMarkButton
          editor={editor}
          type="underline"
          icon={<UnderlineIcon fontSize="16px" />}
          isDisabled={isDisabled}
          label={intl.formatMessage({
            id: "component.rich-text-editor.underline",
            defaultMessage: "Underline",
          })}
        />
        {hasListButtons ? (
          <>
            <ToolbarListButton
              editor={editor}
              type="bulleted-list"
              icon={<ListIcon fontSize="16px" />}
              isDisabled={isDisabled}
              label={intl.formatMessage({
                id: "component.rich-text-editor.list",
                defaultMessage: "Bullet list",
              })}
            />
            <ToolbarListButton
              editor={editor}
              type="numbered-list"
              icon={<OrderedListIcon fontSize="16px" />}
              isDisabled={isDisabled}
              label={intl.formatMessage({
                id: "component.rich-text-editor.ordered-list",
                defaultMessage: "Numbered list",
              })}
            />
          </>
        ) : null}
        {hasPlaceholders ? (
          <ToolbarPlaceholderButton editor={editor} isDisabled={isDisabled} />
        ) : null}
        <ToolbarLinkButton editor={editor} isDisabled={isDisabled} />
      </Stack>
    );
  }
);
