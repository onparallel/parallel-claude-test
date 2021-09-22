import { PlaceholderElement } from "../placeholders/PlaceholderPlugin";
import { SlateElement, SlateText } from "../types";

export type RichTextEditorValue = (RichTextEditorBlock | RichTextEditorList)[];

interface RichTextEditorBlock
  extends SlateElement<"heading" | "subheading" | "paragraph", RichTextEditorBlockContent> {}

interface RichTextEditorList
  extends SlateElement<"numbered-list" | "bulleted-list", RichTextEditorListItem> {}

interface RichTextEditorListItem
  extends SlateElement<"list-item", RichTextEditorListItemChild | RichTextEditorList> {}

interface RichTextEditorListItemChild
  extends SlateElement<"list-item-child", RichTextEditorBlockContent> {}

interface RichTextEditorLink extends SlateElement<"link", RichTextEditorText> {
  url: string;
}

interface RichTextEditorText extends SlateText {
  bold?: boolean;
  underline?: boolean;
  italic?: boolean;
}

type RichTextEditorBlockContent = RichTextEditorText | PlaceholderElement | RichTextEditorLink;
