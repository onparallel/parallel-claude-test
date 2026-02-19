import { chakraComponent } from "@parallel/chakra/utils";
import { getPreventDefaultHandler } from "@parallel/utils/events";
import { someNode, usePlateEditorRef } from "@udecode/plate-common";
import { toggleList } from "@udecode/plate-list";
import { ToolbarButton, ToolbarButtonProps } from "./ToolbarButton";

export interface ToolbarListButtonProps extends Omit<ToolbarButtonProps, "isToggleable" | "type"> {
  type: string;
}

export const ToolbarListButton = chakraComponent<"button", ToolbarListButtonProps>(
  function ToolbarListButton({ ref, type, ...props }) {
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
  },
);
