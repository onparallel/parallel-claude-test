import { ReactEditor } from "slate-react";
import { Placeholder } from "./PlaceholderPlugin";
import { textWithPlaceholderToSlateNodes } from "./textWithPlaceholderToSlateNodes";
import { pipe, withInlineVoid } from "@udecode/slate-plugins";

export function withPlaceholders(placeholders: Placeholder[]) {
  return <T extends ReactEditor>(editor: T) =>
    pipe(
      editor,
      withInlineVoid({
        inlineTypes: ["placeholder"],
        voidTypes: ["placeholder"],
      }),
      (editor: T) => {
        editor.insertData = (data) => {
          const text = data.getData("text/plain");
          editor.insertFragment(
            textWithPlaceholderToSlateNodes(text, placeholders)
          );
        };
        return editor;
      }
    );
}
