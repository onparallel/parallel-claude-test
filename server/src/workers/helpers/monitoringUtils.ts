import { subMonths, subYears } from "date-fns";
import { isDefined } from "remeda";
import { ProfileFieldValue } from "../../db/__types";
import { ProfileTypeFieldOptions } from "../../db/helpers/profileTypeFieldOptions";
import {
  EntityDetailsResponse,
  EntitySearchResponse,
} from "../../services/background-check-clients/BackgroundCheckClient";

/**
 * Determines if a date is within a specified frequency period before another date.
 *
 * @param fromDate - The starting date to check from.
 * @param toDate - The ending date to check against.
 * @param frequency - A string representing the frequency period, formatted as `${number}_${"MONTHS"|"YEARS"}`.
 * @returns true if fromDate is after the date obtained by subtracting the frequency period from toDate, otherwise false.
 */
function isWithinFrequencyPeriod(
  fromDate: Date,
  toDate: Date,
  frequency: `${number}_${"MONTHS" | "YEARS"}`,
) {
  const [amount, unit] = frequency.split("_");
  if (unit === "MONTHS") {
    return fromDate > subMonths(toDate, parseInt(amount));
  } else if (unit === "YEARS") {
    return fromDate > subYears(toDate, parseInt(amount));
  }

  return true;
}

function passesActivationCondition(
  activationCondition: NonNullable<
    ProfileTypeFieldOptions["BACKGROUND_CHECK"]["monitoring"]
  >["activationCondition"],
  selectValues: Pick<ProfileFieldValue, "profile_type_field_id" | "content">[],
) {
  if (isDefined(activationCondition)) {
    const selectValue = selectValues.find(
      (v) => v.profile_type_field_id === activationCondition.profileTypeFieldId,
    )?.content?.value;

    return isDefined(selectValue) && activationCondition.values.includes(selectValue);
  }

  return true;
}

export function requiresRefresh(currentDate: Date) {
  return (
    pfv: Pick<ProfileFieldValue, "created_at">,
    monitoring: ProfileTypeFieldOptions["BACKGROUND_CHECK"]["monitoring"],
    selectValues: Pick<ProfileFieldValue, "profile_type_field_id" | "content">[],
  ) => {
    if (!isDefined(monitoring)) {
      return false;
    }
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
        throw new Error(`ProfileFieldValue with profile_type_field_id ${selectValueId} not found`);
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
 * a difference between two entities is notifiable if:
 *  - the entity id or type has changed (its another entity)
 *  - the topics have changed in any way (more, less or different)
 *  - the sanctions have changed in any way (more, less or different)
 */
export function isNotifiableEntityDifference(a: EntityDetailsResponse, b: EntityDetailsResponse) {
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

/**
 * a difference between two searches is notifiable if:
 *  - the total count of results has increased
 *  - the ids of the results have changed (different results)
 */
export function isNotifiableSearchDifference(a: EntitySearchResponse, b: EntitySearchResponse) {
  if (a.totalCount < b.totalCount) {
    // new items have been found
    return true;
  }

  const idsA = a.items.map((i) => i.id).sort();
  const idsB = b.items.map((i) => i.id).sort();

  if (!idsB.every((id) => idsA.includes(id))) {
    // less or same amount of results as before, but with different ids
    return true;
  }

  return false;
}
