import {
  createFragmentMap,
  FragmentMap,
  isField,
  isInlineFragment,
} from "@apollo/client/utilities";
import { DocumentNode, FieldNode, FragmentDefinitionNode, SelectionSetNode } from "graphql";
import { ComponentProps, ComponentType, memo } from "react";
import { assert } from "ts-essentials";

/**
 * Memoizes the component using a comparer function that takes into account
 * the fragments for its props.
 * It will deep-compare props specified in `fragments` but it will only check
 * fields specified in the fragment.
 * It is useful when fragments are being composed in parent elements and these
 * props have other fields that don't affect the rendering of the component.
 * @param Component The component to memoize
 * @param fragments A dictionary where the key is the name of the prop and the
 * value is the fragment document to use for it
 */
export function memoWithFragments<T extends ComponentType<any>>(
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Component: T,
  fragments: Partial<Record<keyof ComponentProps<T>, DocumentNode>>,
): T {
  return memo(Component, (prev: Readonly<ComponentProps<T>>, next: Readonly<ComponentProps<T>>) => {
    const prevKeys = Object.keys(prev) as (keyof ComponentProps<T>)[];
    const nextKeys = Object.keys(prev);
    if (prevKeys.length !== nextKeys.length) {
      return false;
    }
    for (const key of prevKeys) {
      if (key in fragments) {
        const doc = fragments[key as keyof typeof fragments]!;
        const fragmentMap = createFragmentMap(doc.definitions as any);
        if (
          !checkSelectionSet(
            prev[key],
            next[key],
            (doc.definitions[0] as FragmentDefinitionNode).selectionSet,
            fragmentMap,
          )
        ) {
          return false;
        }
      } else {
        if (prev[key] !== next[key]) {
          return false;
        }
      }
    }
    return true;
  }) as unknown as T;
}

function checkSelectionSet(
  a: any,
  b: any,
  selectionSet: SelectionSetNode,
  fragmentMap: FragmentMap,
) {
  if (a === b) {
    return true;
  }
  if (Array.isArray(a)) {
    if (a.length !== b.length) {
      return false;
    }
    for (let i = 0; i < a.length; i++) {
      if (!checkSelectionSet(a[i], b[i], selectionSet, fragmentMap)) {
        return false;
      }
    }
  } else {
    for (const selection of selectionSet.selections) {
      if (isField(selection)) {
        if (!checkField(a, b, selection, fragmentMap)) {
          return false;
        }
      } else if (isInlineFragment(selection)) {
        if (!checkSelectionSet(a, b, selection.selectionSet, fragmentMap)) {
          return false;
        }
      } else {
        assert(
          selection.name.value in fragmentMap,
          `Using fragment ...${selection.name.value} spread but fragment has not been included`,
        );
        const fragment = fragmentMap[selection.name.value];
        if (!checkSelectionSet(a, b, fragment.selectionSet, fragmentMap)) {
          return false;
        }
      }
    }
  }
  return true;
}

function checkField(a: any, b: any, field: FieldNode, fragmentMap: FragmentMap) {
  const key = field.alias?.value ?? field.name.value;
  if (!field.selectionSet) {
    return a?.[key] === b?.[key];
  } else {
    return checkSelectionSet(a?.[key], b?.[key], field.selectionSet, fragmentMap);
  }
}
