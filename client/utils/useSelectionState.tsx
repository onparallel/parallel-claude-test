import { MouseEvent, useMemo, useState } from "react";
import { isDefined } from "remeda";
import { debounce } from "./debounce";
import { getKey, KeyProp } from "./keyProp";
import { useEffectSkipFirst } from "./useEffectSkipFirst";
import { useUpdatingRef } from "./useUpdatingRef";

export type Selection = Record<string, boolean>;

interface SelectionState {
  selection: Selection;
  lastSelected: string | null;
}

/**
 * This hook encapsulates the logic for handling the selection of rows on a
 * table.
 */
export function useSelectionState<T>(items: T[], keyProp: KeyProp<T>) {
  const [{ selection }, setState] = useState<SelectionState>({
    selection: Object.fromEntries(
      items.map((r) => {
        return [getKey(r, keyProp), false];
      })
    ),
    lastSelected: null,
  });
  const keyPropRef = useUpdatingRef(keyProp);

  useEffectSkipFirst(() => {
    // Reset selected state when rows change
    setState({
      lastSelected: null,
      selection: Object.fromEntries(
        items.map((r) => {
          const key = getKey(r, keyPropRef.current);
          return [key, selection[key] ?? false];
        })
      ),
    });
  }, [items.map((r) => getKey(r, keyProp)).join(",")]);

  return {
    selection,
    ...useMemo(
      () => ({
        selected: items.filter((r) => selection[getKey(r, keyPropRef.current)]),
        allSelected: items.every((r) => selection[getKey(r, keyPropRef.current)]),
        anySelected: items.some((r) => selection[getKey(r, keyPropRef.current)]),
      }),
      [selection]
    ),

    ...useMemo(() => {
      // click fires twice, once on the label and another one on the input
      const toggle = debounce((key: string, shiftKey: boolean) => {
        setState((previous) => {
          const keys = [key];
          if (previous.lastSelected && shiftKey) {
            // range selection
            const lastIndex = items.findIndex(
              (r) => getKey(r, keyPropRef.current) === previous.lastSelected
            );
            const index = items.findIndex((r) => getKey(r, keyPropRef.current) === key);
            if (lastIndex >= 0 && index >= 0) {
              for (
                let i = lastIndex;
                index > lastIndex ? i < index : i > index;
                index > lastIndex ? i++ : i--
              ) {
                keys.push(getKey(items[i], keyPropRef.current) as any);
              }
            }
          }
          return {
            lastSelected: key,
            selection: {
              ...previous.selection,
              ...Object.fromEntries(keys.map((k) => [k, !previous.selection[key]])),
            },
          };
        });
      });
      const toggleAll = debounce(() => {
        setState(({ selection }) => {
          const _allSelected = items.every((r) => selection[getKey(r, keyPropRef.current)]);
          return {
            lastSelected: null,
            selection: Object.fromEntries(
              items.map((r) => [getKey(r, keyPropRef.current), !_allSelected])
            ),
          };
        });
      });
      return {
        toggle: function (key: string, event: MouseEvent) {
          event.stopPropagation();
          event.persist();
          toggle(key, event.shiftKey);
        },
        toggleAll,
        toggleBy: function (predicate: (row: T) => boolean) {
          setState({
            lastSelected: null,
            selection: Object.fromEntries(
              items.map((r) => [getKey(r, keyPropRef.current), predicate(r)])
            ),
          });
        },
      };
    }, [items, keyProp]),
  };
}

export function useSelection<T>(items: T[] | undefined, keyProp: KeyProp<T>) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const selectedRows = useMemo(
    () => selectedIds.map((id) => items?.find((r) => getKey(r, keyProp) === id)).filter(isDefined),
    [selectedIds, (items ?? []).map((r) => getKey(r, keyProp)).join(",")]
  );
  return {
    selectedIds,
    selectedRows,
    selectedIdsRef: useUpdatingRef(selectedIds),
    selectedRowsRef: useUpdatingRef(selectedRows),
    onChangeSelectedIds: setSelectedIds,
  };
}
