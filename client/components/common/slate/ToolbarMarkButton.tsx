import { chakraForwardRef } from "@parallel/chakra/utils";
import { getPreventDefaultHandler, isMarkActive, toggleMark } from "@udecode/plate-common";
import { usePlateEditorRef } from "@udecode/plate-core";
import { ToolbarButton, ToolbarButtonProps } from "./ToolbarButton";

export interface ToolbarMarkButtonProps extends Omit<ToolbarButtonProps, "isToggeable" | "type"> {
  type: string;
}

export const ToolbarMarkButton = chakraForwardRef<"button", ToolbarMarkButtonProps>(
  function ToolbarMarkButton({ type, ...props }, ref) {
    const editor = usePlateEditorRef();
    const isActive = isMarkActive(editor as any, type);
    return (
      <ToolbarButton
        ref={ref}
        onMouseDown={getPreventDefaultHandler(toggleMark, editor as any, type)}
        isToggleable
        isActive={isActive}
        {...props}
      />
    );
  }
);
