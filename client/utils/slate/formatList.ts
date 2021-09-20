import { getParent } from "@udecode/plate-common";
import { isElement } from "@udecode/plate-core";
import { toggleList } from "@udecode/plate-list";
import { CustomEditor } from "./types";

export function formatList(editor: CustomEditor, elementType: string) {
  if (editor.selection) {
    const parentEntry = getParent(editor, editor.selection);
    if (!parentEntry) return;
    const [node] = parentEntry;
    if (isElement(node)) {
      toggleList(editor, { type: elementType });
    }
  }
}
