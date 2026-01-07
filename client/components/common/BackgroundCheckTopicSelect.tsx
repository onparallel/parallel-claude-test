import { BACKGROUND_CHECK_TOPICS } from "@parallel/utils/backgroundCheckTopics";
import { forwardRef, useMemo } from "react";
import { entries, map, pipe, sortBy } from "remeda";
import { SimpleSelect, SimpleSelectInstance, SimpleSelectProps } from "./SimpleSelect";

export const BackgroundCheckTopicSelect = forwardRef<
  SimpleSelectInstance<string, boolean>,
  Omit<SimpleSelectProps<string, boolean>, "options">
>(function BackgroundCheckTopicSelect(props, ref) {
  const options = useMemo(() => {
    return pipe(
      BACKGROUND_CHECK_TOPICS,
      entries(),
      map(([value, label]) => ({ value, label })),
      sortBy((i) => i.label),
    );
  }, []);
  return <SimpleSelect ref={ref} options={options} {...props} />;
});
