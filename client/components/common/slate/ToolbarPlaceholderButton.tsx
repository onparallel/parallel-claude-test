import { BracesIcon } from "@parallel/chakra/icons";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { getPreventDefaultHandler } from "@parallel/utils/events";
import { ELEMENT_PLACEHOLDER_INPUT } from "@parallel/utils/slate/PlaceholderPlugin";
import { useUpdatingRef } from "@parallel/utils/useUpdatingRef";
import { focusEditor, insertNode, usePlateEditorRef } from "@udecode/plate-common";
import { isSelectionInMentionInput } from "@udecode/plate-mention";
import { useCallback } from "react";
import { useIntl } from "react-intl";
import { ToolbarButton, ToolbarButtonProps } from "./ToolbarButton";

export interface ToolbarPlaceholderButtonProps
  extends Omit<ToolbarButtonProps, "isToggeable" | "type" | "label" | "icon"> {}

export const ToolbarPlaceholderButton = chakraForwardRef<"button", ToolbarPlaceholderButtonProps>(
  function ToolbarPlaceholderButton({ ...props }, ref) {
    const intl = useIntl();
    const editor = usePlateEditorRef();
    const editorRef = useUpdatingRef(editor);
    const handleMouseDown = useCallback(
      getPreventDefaultHandler(() => {
        focusEditor(editorRef.current as any);
        if (!isSelectionInMentionInput(editorRef.current)) {
          requestAnimationFrame(() => {
            insertNode(editorRef.current, {
              type: ELEMENT_PLACEHOLDER_INPUT,
              children: [{ text: "" }],
              trigger: "{",
            });
          });
        }
      }),
      []
    );
    return (
      <ToolbarButton
        ref={ref}
        data-action="add-placeholder"
        icon={<BracesIcon fontSize="16px" />}
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
