import { forwardRef } from "react";
import {
  components,
  GroupTypeBase,
  MenuListComponentProps,
  OptionTypeBase,
} from "react-select";
import { FixedSizeList } from "react-window";

const itemSize = 32;
const padding = 8;

export function OptimizedMenuList<
  OptionType extends OptionTypeBase,
  IsMulti extends boolean,
  GroupType extends GroupTypeBase<OptionType> = GroupTypeBase<OptionType>
>(props: MenuListComponentProps<OptionType, IsMulti, GroupType>) {
  const { options, children, getValue, getStyles } = props;
  const style = getStyles("menuList", props);
  const [value] = getValue();
  const initialOffset = options.indexOf(value) * itemSize + padding;
  return (
    <FixedSizeList
      width=""
      height={Math.min(
        (style as any).maxHeight,
        (children as any[]).length * itemSize + 2 * padding
      )}
      itemCount={(children as any[]).length ?? 0}
      itemSize={itemSize}
      initialScrollOffset={initialOffset}
      innerElementType={InnerElementType}
    >
      {({ index, style }) => (
        <div style={{ ...style, top: `${(style.top as number) + padding}px` }}>
          {(children as any[])[index]}
        </div>
      )}
    </FixedSizeList>
  );
}

const InnerElementType = forwardRef<HTMLDivElement, any>(
  function InnerElementType({ style, ...props }, ref) {
    return (
      <div
        ref={ref}
        style={{
          ...style,
          overflow: "hidden",
          height: style.height + padding * 2,
        }}
        {...props}
      />
    );
  }
);
