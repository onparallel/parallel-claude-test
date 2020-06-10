import { ReactEditor } from "slate-react";
import { Placeholder } from "./PlaceholderPlugin";
import { textWithPlaceholderToSlateNodes } from "./textWithPlaceholderToSlateNodes";

export function withPlaceholders(placeholders: Placeholder[]) {
  return <T extends ReactEditor>(editor: T) => {
    const { insertFragment } = editor;

    editor.insertData = (data) => {
      const text = data.getData("text/plain");
      insertFragment(textWithPlaceholderToSlateNodes(text, placeholders));
    };

    return editor;
  };
}
