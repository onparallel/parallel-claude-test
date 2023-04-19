import { chakraForwardRef } from "@parallel/chakra/utils";
import { getPreventDefaultHandler } from "@parallel/utils/events";
import { isMarkActive, toggleMark, usePlateEditorRef } from "@udecode/plate-common";
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
        onMouseDown={getPreventDefaultHandler(toggleMark, editor as any, { key: type })}
        isToggleable
        isActive={isActive}
        {...props}
      />
    );
  }
);
