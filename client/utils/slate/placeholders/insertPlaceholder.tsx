import { Editor, Transforms } from "slate";
import { Placeholder } from "./PlaceholderPlugin";

export function insertPlaceholder(editor: Editor, placeholder: Placeholder) {
  Transforms.insertNodes(editor, {
    type: "placeholder",
    placeholder: placeholder.value,
    children: [{ text: "" }],
  });

  Transforms.move(editor);
}
