import { prettifyTimezone } from "@parallel/utils/dates";
import { useMemo } from "react";
import { useIntl } from "react-intl";
import { concat, filter, groupBy, map, pipe, sort } from "remeda";
import { listTimeZones } from "timezone-support";
import { SimpleSelect, SimpleSelectProps } from "./SimpleSelect";

interface TimezoneSelectProps extends Omit<SimpleSelectProps, "options"> {}

export function TimezoneSelect({ value, onChange, ...props }: TimezoneSelectProps) {
  const intl = useIntl();
  const options = useMemo(() => {
    const timezones = listTimeZones();
    return pipe(
      timezones,
      filter((t) => t.includes("/") && !t.startsWith("Etc/")),
      groupBy((t) => t.split("/")[0]),
      Object.entries,
      map(([group, timezones]: [string, string[]]) => ({
        label: group,
        options: pipe(
          timezones,
          sort((a, b) => a.localeCompare(b)),
          map((t) => ({ label: prettifyTimezone(t), value: t })),
        ),
      })),
      sort((a, b) => a.label.localeCompare(b.label)),
      concat([
        {
          label: intl.formatMessage({
            id: "component.timezone-select.other",
            defaultMessage: "Other",
          }),
          options: pipe(
            timezones,
            filter((t) => !t.includes("/") || t.startsWith("Etc/")),
            sort((a, b) => a.localeCompare(b)),
            map((t) => ({ label: prettifyTimezone(t), value: t })),
          ),
        },
      ]),
    );
  }, []);

  return <SimpleSelect onChange={onChange} value={value} options={options} {...props} />;
}
