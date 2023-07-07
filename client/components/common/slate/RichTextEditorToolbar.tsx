import { Stack } from "@chakra-ui/react";
import {
  BoldIcon,
  ItalicIcon,
  ListIcon,
  OrderedListIcon,
  UnderlineIcon,
} from "@parallel/chakra/icons";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { useIntl } from "react-intl";
import { ToolbarHeadingButton } from "./ToolbarHeadingButton";
import { ToolbarLinkButton } from "./ToolbarLinkButton";
import { ToolbarListButton } from "./ToolbarListButton";
import { ToolbarMarkButton } from "./ToolbarMarkButton";
import { ToolbarPlaceholderButton } from "./ToolbarPlaceholderButton";

interface RichTextEditorToolbarProps {
  isDisabled?: boolean;
  hasPlaceholders?: boolean;
  hasHeadingButton?: boolean;
  hasListButtons?: boolean;
}

export const RichTextEditorToolbar = chakraForwardRef<"div", RichTextEditorToolbarProps>(
  function RichTextEditorToolbar(
    { isDisabled, hasPlaceholders, hasHeadingButton = true, hasListButtons = true, ...props },
    ref,
  ) {
    const intl = useIntl();
    return (
      <Stack
        ref={ref}
        direction="row"
        borderBottom="1px solid"
        borderColor="gray.200"
        padding={1}
        {...props}
      >
        {hasHeadingButton ? <ToolbarHeadingButton disabled={isDisabled} /> : null}
        <ToolbarMarkButton
          type="bold"
          icon={<BoldIcon fontSize="16px" />}
          isDisabled={isDisabled}
          label={intl.formatMessage({
            id: "component.rich-text-editor.bold",
            defaultMessage: "Bold",
          })}
        />
        <ToolbarMarkButton
          type="italic"
          icon={<ItalicIcon fontSize="16px" />}
          isDisabled={isDisabled}
          label={intl.formatMessage({
            id: "component.rich-text-editor.italic",
            defaultMessage: "Italic",
          })}
        />
        <ToolbarMarkButton
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
              type="bulleted-list"
              icon={<ListIcon fontSize="16px" />}
              isDisabled={isDisabled}
              label={intl.formatMessage({
                id: "component.rich-text-editor.list",
                defaultMessage: "Bullet list",
              })}
            />
            <ToolbarListButton
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
        {hasPlaceholders ? <ToolbarPlaceholderButton isDisabled={isDisabled} /> : null}
        <ToolbarLinkButton isDisabled={isDisabled} />
      </Stack>
    );
  },
);
