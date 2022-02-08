import { SharpIcon } from "@parallel/chakra/icons";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { CustomEditor } from "@parallel/utils/slate/types";
import { useUpdatingRef } from "@parallel/utils/useUpdatingRef";
import { getPreventDefaultHandler } from "@udecode/plate-common";
import { useCallback } from "react";
import { useIntl } from "react-intl";
import { Transforms } from "slate";
import { ReactEditor } from "slate-react";
import { ToolbarButton } from "./ToolbarButton";

export interface ToolbarPlaceholderButtonProps {
  editor: CustomEditor;
}

export const ToolbarPlaceholderButton = chakraForwardRef<"button", ToolbarPlaceholderButtonProps>(
  function ToolbarPlaceholderButton({ editor, ...props }, ref) {
    const intl = useIntl();
    const editorRef = useUpdatingRef(editor);
    const handleMouseDown = useCallback(
      getPreventDefaultHandler(() => {
        if (!editorRef.current.selection) {
          ReactEditor.focus(editorRef.current as any);
        }
        requestAnimationFrame(() => {
          Transforms.insertText(editorRef.current, "#", {
            at: editorRef.current.selection?.anchor,
          });
        });
      }),
      []
    );
    return (
      <ToolbarButton
        data-action="add-placeholder"
        icon={<SharpIcon fontSize="16px" />}
        label={intl.formatMessage({
          id: "component.rich-text-editor.personalize",
          defaultMessage: "Personalize",
        })}
        onMouseDown={handleMouseDown}
        {...props}
      />
    );
  }
);
