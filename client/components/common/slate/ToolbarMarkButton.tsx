import { chakraForwardRef } from "@parallel/chakra/utils";
import { CustomEditor } from "@parallel/utils/slate/types";
import { getPreventDefaultHandler, isMarkActive, toggleMark } from "@udecode/plate-common";
import { ToolbarButton, ToolbarButtonProps } from "./ToolbarButton";

export interface ToolbarMarkButtonProps extends Omit<ToolbarButtonProps, "isToggeable" | "type"> {
  editor: CustomEditor;
  type: string;
}

export const ToolbarMarkButton = chakraForwardRef<"button", ToolbarMarkButtonProps>(
  function ToolbarMarkButton({ type, editor, ...props }, ref) {
    const isActive = isMarkActive(editor, type);
    return (
      <ToolbarButton
        ref={ref}
        onMouseDown={getPreventDefaultHandler(toggleMark, editor, type)}
        isToggleable
        isActive={isActive}
        {...props}
      />
    );
  }
);
