import { PEditor } from "@udecode/plate-core";
import { BaseEditor, BaseElement, BaseText } from "slate";
import { HistoryEditor } from "slate-history";
import { ReactEditor } from "slate-react";

export type CustomEditor = BaseEditor & ReactEditor & HistoryEditor & PEditor;
export interface SlateElement<TType extends string, TChild extends CustomElement | SlateText>
  extends BaseElement {
  type: TType;
  children: TChild[];
}

export interface SlateText extends BaseText {}

type CustomElement = SlateElement<string, CustomElement | SlateText>;
type CustomText = SlateText;

declare module "slate" {
  interface CustomTypes {
    Editor: CustomEditor;
    Element: CustomElement;
    Text: CustomText;
  }
}
