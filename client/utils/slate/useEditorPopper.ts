import { usePopper, UsePopperProps } from "@chakra-ui/react";
import { getNode } from "@udecode/plate-common";
import { useEffect } from "react";
import { isDefined } from "remeda";
import { Range } from "slate";
import { ReactEditor } from "slate-react";
import { Maybe } from "../types";
import { useUpdatingRef } from "../useUpdatingRef";
import { CustomEditor } from "./types";

export function useEditorPopper(editor: CustomEditor, target: Maybe<Range>, props: UsePopperProps) {
  const editorRef = useUpdatingRef(editor);
  const { referenceRef, ...popper } = usePopper(props);

  useEffect(() => {
    reposition();
    document.addEventListener("scroll", reposition, true);
    return () => document.removeEventListener("scroll", reposition, true);

    function reposition() {
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
      if (!props?.enabled || !isDefined(target)) {
        return;
      }
      const { path, offset } = target.anchor!;
      const editor = editorRef.current!;
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
      referenceRef({ getBoundingClientRect: () => rect, contextElement: node });
      popper.forceUpdate?.();
    }
  }, [props?.enabled, target?.anchor.path, target?.anchor.offset]);
  return popper;
}
