import {
  getNextIndex,
  getPreviousIndex,
  isPointAtWordEnd,
} from "@udecode/slate-plugins";
import { useCallback, useReducer } from "react";
import { Editor, Range, Transforms } from "slate";
import { insertPlaceholder } from "./insertPlaceholder";
import { Placeholder } from "./PlaceholderPlugin";

export function usePlaceholders(placeholders: Placeholder[] = []) {
  type PlaceholderState = {
    target: Range | null;
    index: number;
    search: string | null;
  };
  const [{ target, index, search }, dispatch] = useReducer(
    (
      state: PlaceholderState,
      action: (prevState: PlaceholderState) => PlaceholderState
    ) => action(state),
    {
      target: null,
      index: 0,
      search: null,
    }
  );
  const values = search
    ? placeholders.filter((c) =>
        c.label.toLowerCase().includes(search.toLowerCase())
      )
    : placeholders;

  const onAddPlaceholder = useCallback(
    (editor: Editor, placeholder: Placeholder) => {
      if (target !== null) {
        Transforms.select(editor, target);
        insertPlaceholder(editor, placeholder);
        dispatch((state) => ({ ...state, target: null }));
      }
    },
    [target]
  );

  const onKeyDownPlaceholder = useCallback(
    (e: any, editor: Editor) => {
      if (target) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          dispatch((state) => ({
            ...state,
            index: getNextIndex(index, values.length - 1),
          }));
        }
        if (e.key === "ArrowUp") {
          e.preventDefault();
          dispatch((state) => ({
            ...state,
            index: getPreviousIndex(index, values.length - 1),
          }));
        }
        if (e.key === "Escape") {
          e.preventDefault();
          dispatch((state) => ({ ...state, target: null }));
        }

        if (["Tab", "Enter"].includes(e.key)) {
          e.preventDefault();
          return onAddPlaceholder(editor, values[index]);
        }
      }
    },
    [values, index, target, onAddPlaceholder]
  );

  const onChangePlaceholder = useCallback((editor: Editor) => {
    const { selection } = editor;

    if (selection && Range.isCollapsed(selection)) {
      const cursor = Range.start(selection);
      const before = Editor.before(editor, cursor, { unit: "block" });
      const beforeRange = before && Editor.range(editor, before, cursor);
      const beforeText = beforeRange && Editor.string(editor, beforeRange);
      const match = !!beforeText && beforeText.match(/#([a-z-]*)$/);

      if (match && isPointAtWordEnd(editor, { at: cursor })) {
        // Get the range for the #xxx
        const beforeHash = Editor.before(editor, cursor, {
          unit: "character",
          distance: match ? match[0].length : 0,
        });
        const target = beforeHash && Editor.range(editor, beforeHash, cursor);
        const [, search] = match;
        dispatch(() => ({ target: target ?? null, search, index: 0 }));
        return;
      }
    }
    dispatch((state) => ({ ...state, target: null, search: null }));
  }, []);

  const onHighlightOption = useCallback((index: number) => {
    dispatch((state) => ({ ...state, index }));
  }, []);

  return {
    search,
    selectedIndex: index,
    target,
    values,
    onChangePlaceholder,
    onKeyDownPlaceholder,
    onAddPlaceholder,
    onHighlightOption,
  };
}
