import { chakraForwardRef } from "@parallel/chakra/utils";
import { getPreventDefaultHandler, someNode, usePlateEditorRef } from "@udecode/plate-core";
import { toggleList } from "@udecode/plate-list";
import { ToolbarButton, ToolbarButtonProps } from "./ToolbarButton";

export interface ToolbarListButtonProps extends Omit<ToolbarButtonProps, "isToggleable" | "type"> {
  type: string;
}

export const ToolbarListButton = chakraForwardRef<"button", ToolbarListButtonProps>(
  function ToolbarListButton({ type, ...props }, ref) {
    const editor = usePlateEditorRef();
    const isActive = someNode(editor as any, { match: { type } });
    return (
      <ToolbarButton
        ref={ref}
        onMouseDown={getPreventDefaultHandler(toggleList, editor, { type })}
        isToggleable
        isActive={isActive}
        {...props}
      />
    );
  }
);
