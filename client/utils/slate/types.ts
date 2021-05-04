import { BaseEditor, BaseElement, BaseText } from "slate";
import { HistoryEditor } from "slate-history";
import { ReactEditor } from "slate-react";

type SimpleElement<T extends string> = BaseElement & { type: T };

export interface ParagraphElement extends SimpleElement<"paragraph"> {}
export interface BulletedListElement extends SimpleElement<"bulleted-list"> {}
export interface ListItemElement extends SimpleElement<"list-item"> {}
export interface PlaceholderElement extends SimpleElement<"placeholder"> {
  placeholder: string;
}

export type CustomElement =
  | ParagraphElement
  | BulletedListElement
  | ListItemElement
  | PlaceholderElement;

export interface CustomText extends BaseText {
  bold?: boolean;
  underline?: boolean;
  italic?: boolean;
}

declare module "slate" {
  interface CustomTypes {
    Editor: BaseEditor & ReactEditor & HistoryEditor;
    Element: CustomElement;
    Text: CustomText;
  }
}
