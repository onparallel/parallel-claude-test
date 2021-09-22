import { SPEditor } from "@udecode/plate-core";
import { BaseEditor } from "slate";
import { HistoryEditor } from "slate-history";
import { ReactEditor } from "slate-react";

export type SlateElement<TType extends string, TChild> = {
  type: TType;
  children: TChild[];
};

export type SlateText = {
  text: string;
};

export type CustomEditor = BaseEditor & ReactEditor & HistoryEditor & SPEditor;

declare module "slate" {
  interface CustomTypes {
    Editor: CustomEditor;
  }
}
