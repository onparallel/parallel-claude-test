import {
  createFragmentMap,
  FragmentMap,
  isField,
  isInlineFragment,
} from "@apollo/client/utilities";
import { DocumentNode, SelectionSetNode, FragmentDefinitionNode, FieldNode } from "graphql";

/**
 * Creates a comparer function meant to be used with React.memo.
 * It will deep-compare props specified in `fragments` but it will only check
 * fields specified in the fragment.
 * It is useful when fragments are being composed in parent elements and these
 * props have other fields that don't affect the rendering of the component.
 * @param fragments A dictionary where the key is the name of the prop and the
 * value is the fragment document to use for it
 */
export function compareWithFragments<T>(fragments: Partial<{ [K in keyof T]: DocumentNode }>) {
  return (prev: Readonly<T>, next: Readonly<T>) => {
    const prevKeys = Object.keys(prev) as (keyof T)[];
    const nextKeys = Object.keys(prev);
    if (prevKeys.length !== nextKeys.length) {
      return false;
    }
    for (const key of prevKeys) {
      if (key in fragments) {
        const doc = fragments[key] as DocumentNode;
        const fragmentMap = createFragmentMap(doc.definitions as any);
        if (
          !checkSelectionSet(
            prev[key],
            next[key],
            (doc.definitions[0] as FragmentDefinitionNode).selectionSet,
            fragmentMap
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
  };
}

function checkSelectionSet(
  a: any,
  b: any,
  selectionSet: SelectionSetNode,
  fragmentMap: FragmentMap
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
