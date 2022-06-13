import { SharpIcon } from "@parallel/chakra/icons";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { CustomEditor } from "@parallel/utils/slate/types";
import { useUpdatingRef } from "@parallel/utils/useUpdatingRef";
import { getPreventDefaultHandler } from "@udecode/plate-common";
import { focusEditor, insertText } from "@udecode/plate-core";
import { useCallback } from "react";
import { useIntl } from "react-intl";
import { ToolbarButton, ToolbarButtonProps } from "./ToolbarButton";

export interface ToolbarPlaceholderButtonProps
  extends Omit<ToolbarButtonProps, "isToggeable" | "type" | "label" | "icon"> {
  editor: CustomEditor;
}

export const ToolbarPlaceholderButton = chakraForwardRef<"button", ToolbarPlaceholderButtonProps>(
  function ToolbarPlaceholderButton({ editor, ...props }, ref) {
    const intl = useIntl();
    const editorRef = useUpdatingRef(editor);
    const handleMouseDown = useCallback(
      getPreventDefaultHandler(() => {
        if (!editorRef.current.selection) {
          focusEditor(editorRef.current as any);
        }
        requestAnimationFrame(() => {
          insertText(editorRef.current, "#", {
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
