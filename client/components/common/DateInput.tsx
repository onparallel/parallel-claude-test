import { Input, InputProps } from "@chakra-ui/react";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { useMetadata } from "@parallel/utils/withMetadata";

export const DateInput = chakraForwardRef<"input", InputProps>(function DateInput(
  { sx, ...props },
  ref,
) {
  const { browserName } = useMetadata();

  return (
    <Input
      ref={ref}
      type="date"
      {...props}
      sx={{
        paddingRight: 1.5,
        "&::-webkit-calendar-picker-indicator": {
          color: "transparent",
          background: "transparent",
        },
        ...(browserName === "Safari" // Safari does stupid things
          ? {
              color: "gray.800",
              ...(props.value ? {} : { "&:not(:focus)": { color: "rgba(0,0,0,0.3)" } }),
            }
          : {}),
        ...sx,
      }}
    />
  );
});
