import { MouseEvent, useEffect, useMemo, useRef, useState } from "react";

interface SelectionState {
  selection: {
    [id: string]: boolean;
  };
  lastSelected: string | null;
}

/**
 * This hook encapsulates the logic for handling the selection of rows on a
 * table.
 */
export function useSelectionState<T>(rows: T[], rowKeyProp: keyof T) {
  const [{ selection }, setState] = useState<SelectionState>({
    selection: Object.fromEntries(
      rows.map((r) => {
        const key = r[rowKeyProp] as any;
        return [key, false];
      })
    ),
    lastSelected: null,
  });

  const initial = useRef(true);
  useEffect(() => {
    // skip first to avoid a re-render
    if (initial.current) {
      initial.current = false;
      return;
    }
    // Reset selected state when rows change
    setState({
      lastSelected: null,
      selection: Object.fromEntries(
        rows.map((r) => {
          const key = r[rowKeyProp] as any;
          return [key, selection[key] ?? false];
        })
      ),
    });
  }, [rows, rowKeyProp]);

  return {
    selection,
    ...useMemo(
      () => ({
        selected: rows.filter((r) => selection[r[rowKeyProp] as any]),
        allSelected: rows.every((r) => selection[r[rowKeyProp] as any]),
        anySelected: rows.some((r) => selection[r[rowKeyProp] as any]),
      }),
      [selection, rowKeyProp]
    ),

    ...useMemo(() => {
      // click fires twice, once on the label and another one on the input
      let timeout: any;
      return {
        toggle: function (key: string, event: MouseEvent) {
          event.stopPropagation();
          event.persist();
          if (timeout) {
            clearTimeout(timeout);
          }
          timeout = setTimeout(() => {
            setState((previous) => {
              const keys = [key];
              if (previous.lastSelected && event?.shiftKey) {
                // range selection
                const lastIndex = rows.findIndex(
                  (r) => (r[rowKeyProp] as any) === previous.lastSelected
                );
                const index = rows.findIndex(
                  (r) => (r[rowKeyProp] as any) === key
                );
                if (lastIndex >= 0 && index >= 0) {
                  for (
                    let i = lastIndex;
                    index > lastIndex ? i < index : i > index;
                    index > lastIndex ? i++ : i--
                  ) {
                    keys.push(rows[i][rowKeyProp] as any);
                  }
                }
              }
              return {
                lastSelected: key,
                selection: {
                  ...previous.selection,
                  ...Object.fromEntries(
                    keys.map((k) => [k, !previous.selection[key]])
                  ),
                },
              };
            });
          });
        },
        toggleAll: function () {
          setState(({ selection }) => {
            const _allSelected = rows.every(
              (r) => selection[r[rowKeyProp] as any]
            );
            return {
              lastSelected: null,
              selection: Object.fromEntries(
                rows.map((r) => [r[rowKeyProp], !_allSelected])
              ),
            };
          });
        },
        toggleBy: function (predicate: (row: T) => boolean) {
          setState({
            lastSelected: null,
            selection: Object.fromEntries(
              rows.map((r) => [r[rowKeyProp], predicate(r)])
            ),
          });
        },
      };
    }, [rows, rowKeyProp]),
  };
}
