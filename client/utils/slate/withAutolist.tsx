import {
  toggleList,
  getTextFromBlockStartToAnchor,
} from "@udecode/slate-plugins";
import { Editor, Range, Transforms } from "slate";
import { nodeTypes } from "../../components/common/RichTextEditor";

export function withAutolist(
  options: Pick<typeof nodeTypes, "typeUl" | "typeOl" | "typeLi" | "typeP">
) {
  return <T extends Editor>(editor: T) => {
    // https://github.com/udecode/slate-plugins/blob/78b7dc4e230ef09b84f963cc51937d19ce0cf9a9/packages/slate-plugins/src/handlers/autoformat/withAutoformat.ts
    const { insertText } = editor;

    editor.insertText = (text) => {
      const { selection } = editor;

      const SPACE = " ";

      if (text === SPACE && selection && Range.isCollapsed(selection)) {
        const beforeTextEntry = getTextFromBlockStartToAnchor(editor);

        const SHORTCUTS: { [key: string]: string } = {
          "*": options.typeLi,
          "-": options.typeLi,
        };

        const type = SHORTCUTS[beforeTextEntry.text];
        if (type) {
          Transforms.select(editor, beforeTextEntry.range as Range);
          Transforms.delete(editor);

          toggleList(editor, { ...options, typeList: options.typeUl });
          return;
        }
      }

      insertText(text);
    };

    return editor;
  };
}
