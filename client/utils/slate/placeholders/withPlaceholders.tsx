import { Editor, Range, Transforms } from "slate";
import { ReactEditor } from "slate-react";
import { insertPlaceholder } from "./insertPlaceholder";
import { Placeholder } from "./PlaceholderPlugin";
import { textWithPlaceholderToSlateNodes } from "./textWithPlaceholderToSlateNodes";

export function withPlaceholders(placeholders: Placeholder[]) {
  return <T extends ReactEditor>(editor: T) => {
    const { insertFragment, insertText } = editor;

    editor.insertData = (data) => {
      const text = data.getData("text/plain");
      insertFragment(textWithPlaceholderToSlateNodes(text, placeholders));
    };

    editor.insertText = (text) => {
      const { selection } = editor;
      if (text === "#" && selection && Range.isCollapsed(selection)) {
        const cursor = Range.start(selection);
        const before = Editor.before(editor, cursor, { unit: "block" });
        const beforeRange = before && Editor.range(editor, before, cursor);
        const beforeText = beforeRange && Editor.string(editor, beforeRange);
        const match = !!beforeText && beforeText.match(/#([a-z-]*)$/);
        const placeholder =
          match && placeholders.find((p) => p.value === match[1]);
        if (placeholder) {
          const beforePlaceholder = Editor.before(editor, cursor, {
            unit: "character",
            distance: match ? match[0].length : 0,
          });
          const range =
            beforePlaceholder &&
            Editor.range(editor, beforePlaceholder, cursor);
          Transforms.select(editor, range!);
          insertPlaceholder(editor, placeholder);
          return;
        }
      }
      insertText(text);
    };

    return editor;
  };
}
