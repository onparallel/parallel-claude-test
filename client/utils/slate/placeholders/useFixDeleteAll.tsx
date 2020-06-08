import { useCallback } from "react";
import { Editor, Transforms } from "slate";

export function useFixDeleteAll() {
  const onKeyDown = useCallback((e: any, editor: Editor) => {
    const { selection } = editor;
    if (e.key === "Backspace" && selection) {
      const start = Editor.before(editor, selection.anchor);
      const end = Editor.after(editor, selection.focus);
      if (!start && !end) {
        Transforms.delete(editor);
        Transforms.delete(editor);
        Transforms.setNodes(editor, { type: "paragraph" });
      }
    }
  }, []);
  return { onKeyDown };
}
