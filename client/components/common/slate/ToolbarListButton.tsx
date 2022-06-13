import { chakraForwardRef } from "@parallel/chakra/utils";
import { CustomEditor } from "@parallel/utils/slate/types";
import { getPreventDefaultHandler, someNode } from "@udecode/plate-common";
import { toggleList } from "@udecode/plate-list";
import { ToolbarButton, ToolbarButtonProps } from "./ToolbarButton";

export interface ToolbarListButtonProps extends Omit<ToolbarButtonProps, "isToggleable" | "type"> {
  editor: CustomEditor;
  type: string;
}

export const ToolbarListButton = chakraForwardRef<"button", ToolbarListButtonProps>(
  function ToolbarListButton({ type, editor, ...props }, ref) {
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
