import { Input, InputProps } from "@chakra-ui/react";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { useMetadata } from "@parallel/utils/withMetadata";
import { ChangeEvent } from "react";

export const DateInput = chakraForwardRef<"input", InputProps>(function DateInput(
  { sx, onChange, ...props },
  ref,
) {
  const { browserName } = useMetadata();

  return (
    <Input
      ref={ref}
      type="date"
      max="9999-12-31"
      onChange={
        onChange &&
        ((e: ChangeEvent<HTMLInputElement>) => {
          const value = e.target.value;
          if (value.match(/^\d{5}/)) {
            e.target.value = value.replace(/^\d{5,}/, (x) => x.slice(0, 4));
          }
          onChange(e);
        })
      }
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
