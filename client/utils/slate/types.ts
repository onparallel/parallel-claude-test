import { PlateEditor, TDescendant, TElement, TText } from "@udecode/plate-core";

export type CustomEditor<Value extends SlateElement[] = SlateElement[]> = PlateEditor<Value>;

export interface SlateElement<
  TType extends string = string,
  TChild extends TDescendant = TDescendant
> extends TElement {
  type: TType;
  children: TChild[];
}

export interface SlateText extends TText {}
