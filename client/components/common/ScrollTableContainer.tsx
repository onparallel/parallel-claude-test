import { chakraComponent } from "@parallel/chakra/utils";
import { ScrollShadows } from "./ScrollShadows";

export const ScrollTableContainer = chakraComponent<"div", {}>(({ ref, ...props }) => {
  return (
    <ScrollShadows
      ref={ref}
      direction="both"
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
