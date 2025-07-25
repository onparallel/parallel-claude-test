import { subDays, subMonths, subYears } from "date-fns";
import { isNonNullish } from "remeda";
import { ProfileFieldValue } from "../../db/__types";
import { EntityDetailsResponse } from "../../services/BackgroundCheckService";
import { ProfileTypeFieldMonitoring } from "../../services/ProfileTypeFieldService";

/**
 * Determines if a date is within a specified frequency period before another date.
 *
 * @param fromDate - The starting date to check from.
 * @param toDate - The ending date to check against.
 * @param frequency - A string representing the frequency period, formatted as `${number}_${"MONTHS"|"YEARS"|"DAYS"}`.
 * @returns true if fromDate is after the date obtained by subtracting the frequency period from toDate, otherwise false.
 */
function isWithinFrequencyPeriod(
  fromDate: Date,
  toDate: Date,
  frequency: `${number}_${"MONTHS" | "YEARS" | "DAYS"}`,
) {
  const [amount, unit] = frequency.split("_");
  if (unit === "MONTHS") {
    return fromDate > subMonths(toDate, parseInt(amount));
  } else if (unit === "YEARS") {
    return fromDate > subYears(toDate, parseInt(amount));
  } else if (unit === "DAYS") {
    return fromDate > subDays(toDate, parseInt(amount));
  }

  return true;
}

function passesActivationCondition(
  activationCondition: ProfileTypeFieldMonitoring["activationCondition"],
  selectValues: Pick<ProfileFieldValue, "profile_type_field_id" | "content">[],
) {
  if (isNonNullish(activationCondition)) {
    const selectValue = selectValues.find(
      (v) => v.profile_type_field_id === activationCondition.profileTypeFieldId,
    )?.content?.value;

    return isNonNullish(selectValue) && activationCondition.values.includes(selectValue);
  }

  return true;
}

export function requiresRefresh(currentDate: Date) {
  return (
    pfv: Pick<ProfileFieldValue, "created_at">,
    monitoring: ProfileTypeFieldMonitoring,
    selectValues: Pick<ProfileFieldValue, "profile_type_field_id" | "content">[],
  ) => {
    if (!passesActivationCondition(monitoring.activationCondition, selectValues)) {
      return false;
    }

    if (monitoring.searchFrequency.type === "FIXED") {
      return !isWithinFrequencyPeriod(
        pfv.created_at,
        currentDate,
        monitoring.searchFrequency.frequency,
      );
    } else if (monitoring.searchFrequency.type === "VARIABLE") {
      const selectValueId = monitoring.searchFrequency.profileTypeFieldId;
      const selectPfv = selectValues.find((sv) => sv.profile_type_field_id === selectValueId);
      if (!selectPfv) {
        // the SELECT property referenced in monitoring is not found (not replied, deleted, etc)
        return false;
      }
      const frequency = monitoring.searchFrequency.options.find(
        (option) => option.value === selectPfv.content.value,
      )?.frequency;

      if (!frequency) {
        throw new Error(`Frequency not found for value ${selectPfv.content.value}`);
      }

      return !isWithinFrequencyPeriod(pfv.created_at, currentDate, frequency);
    } else {
      throw new Error("Invalid search frequency type");
    }
  };
}

/**
 * a difference between two entities is relevant if:
 *  - the entity id or type has changed (its another entity)
 *  - the topics have changed in any way (more, less or different)
 *  - the sanctions have changed in any way (more, less or different)
 */
export function isRelevantEntityDifference(a: EntityDetailsResponse, b: EntityDetailsResponse) {
  if (a.id !== b.id) {
    return true;
  }

  if (a.type !== b.type) {
    return true;
  }

  const topicsA = (a.properties.topics ?? []).sort().join(",");
  const topicsB = (b.properties.topics ?? []).sort().join(",");
  if (topicsA !== topicsB) {
    return true;
  }

  const sanctionsA = (a.properties.sanctions ?? [])
    .map((s) => s.id)
    .sort()
    .join(",");
  const sanctionsB = (b.properties.sanctions ?? [])
    .map((s) => s.id)
    .sort()
    .join(",");
  if (sanctionsA !== sanctionsB) {
    return true;
  }

  return false;
}
