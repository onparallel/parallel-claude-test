import { type ReactNode, useCallback, useEffect } from "react";
import { type MenuListProps, components } from "react-select";
import { List, type RowComponentProps, useListRef } from "react-window";

const itemSize = 32;
const padding = 8;

interface MenuRowProps {
  items: ReactNode[];
}

function MenuRow({ index, style, items }: RowComponentProps<MenuRowProps>) {
  // First and last rows are padding spacers
  if (index === 0 || index === items.length + 1) {
    return <div style={style} />;
  }
  return <div style={style}>{items[index - 1]}</div>;
}

export function OptimizedMenuList(props: MenuListProps) {
  const { options, children, getValue, getStyles } = props;
  const style = getStyles("menuList", props);
  const value = getValue();

  const listRef = useListRef(null);

  const childrenArray = Array.isArray(children) ? children : [];
  const maxHeight =
    typeof (style as any)?.maxHeight === "number" ? (style as any).maxHeight : itemSize;

  // +2 for padding spacer rows at start and end
  const rowCount = childrenArray.length + 2;
  const totalContentHeight = childrenArray.length * itemSize + 2 * padding;
  const listHeight = Math.min(maxHeight, totalContentHeight);

  const getRowHeight = useCallback(
    (index: number) => (index === 0 || index === rowCount - 1 ? padding : itemSize),
    [rowCount],
  );

  // Find the first selected option by position in the options list
  useEffect(() => {
    const selectedValues = Array.isArray(value) ? value : [];
    const firstSelectedIndex =
      selectedValues.length > 0 && options
        ? Math.min(...selectedValues.map((v) => options.indexOf(v)).filter((i) => i >= 0))
        : -1;

    if (firstSelectedIndex >= 0) {
      // Wait one frame for the List to fully initialize its container element
      const rafId = requestAnimationFrame(() => {
        // +1 to account for the padding spacer row at the start
        listRef.current?.scrollToRow({ index: firstSelectedIndex + 1, align: "start" });
      });
      return () => cancelAnimationFrame(rafId);
    }
  }, [listRef]);

  if (childrenArray.length === 0) {
    return <components.NoOptionsMessage {...props} />;
  }

  return (
    <List<MenuRowProps>
      rowComponent={MenuRow}
      rowCount={rowCount}
      rowHeight={getRowHeight}
      rowProps={{ items: childrenArray }}
      listRef={listRef}
      style={{ height: listHeight }}
    />
  );
}
