import { chakraForwardRef } from "@parallel/chakra/utils";
import { ScrollShadows } from "./ScrollShadows";

export const ScrollTableContainer = chakraForwardRef<"div", {}>((props, ref) => {
  return (
    <ScrollShadows
      ref={ref}
      shadowTop={false}
      overflow="auto"
      flex={1}
      minHeight="82px"
      {...props}
      sx={{
        "thead > tr": {
          position: "sticky",
          top: 0,
          zIndex: 1,
        },
        "tbody > tr": {
          position: "relative",
          zIndex: 0,
        },
        ...props.sx,
      }}
    />
  );
});
