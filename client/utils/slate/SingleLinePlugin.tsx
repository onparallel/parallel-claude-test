import { createPluginFactory, OnChange } from "@udecode/plate-core";
import { Transforms } from "slate";
import { ReactEditor } from "slate-react";
import { CustomEditor } from "./types";

const onChangeKeepCaretOnScreen: OnChange = (editor) => {
  return () => {
    setTimeout(() => {
      if (!editor.selection || !ReactEditor.isFocused(editor)) {
        return;
      }
      const editorDOM = ReactEditor.toDOMNode(editor, editor);
      if (!editorDOM) {
        return;
      }
      const padding = 5;
      const editorRects = editorDOM.getClientRects();
      const caretTextDom = ReactEditor.toDOMRange(editor, editor.selection);
      const caretTextRects = caretTextDom.getClientRects();
      if (caretTextRects.length > 0 && editorRects.length > 0) {
        const caretX = caretTextRects[0].left - editorRects[0].left + editorDOM.scrollLeft;
        if (caretX - editorDOM.clientWidth + padding > editorDOM.scrollLeft) {
          editorDOM.scrollTo(caretX - editorDOM.clientWidth + padding, 0);
        } else if (caretX - padding < editorDOM.scrollLeft) {
          editorDOM.scrollTo(caretX - padding, 0);
        }
      }
    });
  };
};

export const createSingleLinePlugin = createPluginFactory({
  key: "single-line",
  withOverrides: (editor: CustomEditor) => {
    const { normalizeNode } = editor;

    editor.normalizeNode = ([node, path]) => {
      if (path.length === 0) {
        if (editor.children.length > 1) {
          Transforms.mergeNodes(editor);
        }
      }
      return normalizeNode([node, path]);
    };

    return editor;
  },
  handlers: {
    onChange: onChangeKeepCaretOnScreen,
  },
});
