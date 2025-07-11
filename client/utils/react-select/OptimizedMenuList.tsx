import { forwardRef } from "react";
import { MenuListProps, components } from "react-select";
import { FixedSizeList } from "react-window";
const itemSize = 32;
const padding = 8;

export function OptimizedMenuList(props: MenuListProps) {
  const { options, children, getValue, getStyles } = props;
  const style = getStyles("menuList", props);
  const value = getValue();
  const selectedValue = Array.isArray(value) && value.length > 0 ? value[0] : null;

  // Calculate initial offset safely
  const initialOffset =
    selectedValue && options ? options.indexOf(selectedValue) * itemSize + padding : 0;

  // Calculate height safely
  const childrenArray = Array.isArray(children) ? children : [];
  const maxHeight =
    typeof (style as any)?.maxHeight === "number" ? (style as any).maxHeight : itemSize;
  const calculatedHeight = childrenArray.length * itemSize + 2 * padding;

  // If there are no options, render the NoOptionsMessage
  if (childrenArray.length === 0) {
    return <components.NoOptionsMessage {...props} />;
  }

  return (
    <FixedSizeList
      width=""
      height={Math.min(maxHeight, calculatedHeight)}
      itemCount={childrenArray.length}
      itemSize={itemSize}
      initialScrollOffset={initialOffset}
      innerElementType={InnerElementType}
    >
      {({ index, style }) => (
        <div style={{ ...style, top: `${(style.top as number) + padding}px` }}>
          {childrenArray[index]}
        </div>
      )}
    </FixedSizeList>
  );
}

const InnerElementType = forwardRef<HTMLDivElement, any>(function InnerElementType(
  { style, ...props },
  ref,
) {
  const height = typeof style?.height === "number" ? style.height : itemSize;

  return (
    <div
      ref={ref}
      style={{
        ...style,
        overflow: "hidden",
        height: height + padding * 2,
      }}
      {...props}
    />
  );
});
