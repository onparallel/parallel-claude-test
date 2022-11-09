import { useMetadata } from "./withMetadata";

export function useDateInputProps() {
  const { browserName } = useMetadata();

  return (date: string) => ({
    paddingRight: 1.5,
    "&::-webkit-calendar-picker-indicator": {
      color: "transparent",
      background: "transparent",
    },
    ...(browserName === "Safari" // Safari does stupid things
      ? {
          color: "gray.800",
          ...(date ? {} : { "&:not(:focus)": { color: "rgba(0,0,0,0.3)" } }),
        }
      : {}),
  });
}
