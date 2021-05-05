import { pipe, withInlineVoid } from "@udecode/slate-plugins";
import { CustomEditor } from "../types";
import { Placeholder } from "./PlaceholderPlugin";
import { textWithPlaceholderToSlateNodes } from "./textWithPlaceholderToSlateNodes";

export function withPlaceholders(placeholders: Placeholder[]) {
  return <T extends CustomEditor>(editor: T) =>
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
