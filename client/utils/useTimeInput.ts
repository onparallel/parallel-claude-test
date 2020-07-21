import { useState, ChangeEvent, useEffect, useCallback } from "react";

/**
 * Make sure input[type="time"] works in all browsers.
 * Currently not supported on Safari
 */
export function useTimeInput(
  time: string,
  options: { onChange?: (value: string) => void } = {}
) {
  const [value, setValue] = useState(time);

  useEffect(() => setValue(time), [time]);

  return {
    value,
    onChange: useCallback(
      (event: ChangeEvent<HTMLInputElement>) => {
        const time = event.target.value;
        // Return an empty string when time is not valid, like FF or Chrome
        options?.onChange?.(time.match(/([01]\d|2[0-3]):[0-5]\d/) ? time : "");
        setValue(time);
      },
      [options?.onChange]
    ),
  };
}
