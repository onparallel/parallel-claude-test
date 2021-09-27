import { usePopper, UsePopperProps } from "@chakra-ui/react";
import { VirtualElement } from "@popperjs/core";
import { getNode } from "@udecode/plate-common";
import { useWindowScroll } from "beautiful-react-hooks";
import { useEffect } from "react";
import { Range } from "slate";
import { ReactEditor } from "slate-react";
import { Maybe } from "../types";
import { useUpdatingRef } from "../useUpdatingRef";
import { CustomEditor } from "./types";

export function useEditorPopper(
  editor?: CustomEditor,
  range?: Maybe<Range>,
  props?: UsePopperProps
) {
  const editorRef = useUpdatingRef(editor);
  const rangeRef = useUpdatingRef(range);
  const propsRef = useUpdatingRef(props);
  const { referenceRef, ...popper } = usePopper(props);

  function reposition() {
    const editor = editorRef.current;
    const range = rangeRef.current;
    const props = propsRef.current;
    if (editor && range && props?.enabled) {
      referenceRef(getVirtualElement(editor, range));
      popper.forceUpdate();
    }
  }
  useWindowScroll(reposition);
  useEffect(reposition, [
    editor?.id,
    props?.enabled,
    range?.anchor.path.join(","),
    range?.anchor.offset,
  ]);
  return popper;
}

function getVirtualElement(editor: CustomEditor, range: Range): VirtualElement {
  /**
   * The main idea of this function is to place the placeholders menu next to the #.
   * This function gets the node of the piece of text where the anchor is.
   * This node will always be a span.
   * We create a "fake" paragraph and we insert the text of the node but:
   * - We insert a span with all the previous text before and including the #.
   * - We add a marginLeft to this span to ensure it overlaps the text in the real editor.
   * - We add an empty span which we will use as the needle to position the menu
   * We insert this fake paragraph and we compute the boundingClientRect of the second
   * children which we will use to create a popper virtual element.
   */
  const { path, offset } = range.anchor;
  const node = ReactEditor.toDOMNode(editor, getNode(editor, path)!);
  const parentRect = (node.parentNode! as HTMLElement).getBoundingClientRect();
  const fake = document.createElement("div");
  fake.style.visibility = "hidden";
  const prefix = document.createElement("span");
  const style = window.getComputedStyle(node.offsetParent!);
  prefix.style.marginLeft = `${node.offsetLeft - parseInt(style.paddingLeft)}px`;
  prefix.innerText = node.textContent!.slice(0, offset + 1);
  fake.appendChild(prefix);
  const _target = document.createElement("span");
  fake.appendChild(_target);
  fake.style.position = "fixed";
  fake.style.top = `${parentRect.top}px`;
  fake.style.left = `${parentRect.left}px`;
  fake.style.width = `${parentRect.width}px`;
  node.parentElement!.appendChild(fake);
  const rect = _target.getBoundingClientRect();
  node.parentElement!.removeChild(fake);
  return { getBoundingClientRect: () => rect, contextElement: node };
}
