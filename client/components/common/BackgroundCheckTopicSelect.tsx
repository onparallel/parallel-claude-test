import { BACKGROUND_CHECK_TOPICS } from "@parallel/utils/backgroundCheckTopics";
import { RefAttributes, useMemo } from "react";
import { entries, map, pipe, sortBy } from "remeda";
import { SimpleSelect, SimpleSelectInstance, SimpleSelectProps } from "./SimpleSelect";

export function BackgroundCheckTopicSelect(
  props: Omit<SimpleSelectProps<string, boolean>, "options"> &
    RefAttributes<SimpleSelectInstance<string, boolean>>,
) {
  const options = useMemo(() => {
    return pipe(
      BACKGROUND_CHECK_TOPICS,
      entries(),
      map(([value, label]) => ({ value, label })),
      sortBy((i) => i.label),
    );
  }, []);
  return <SimpleSelect options={options} {...props} />;
}
