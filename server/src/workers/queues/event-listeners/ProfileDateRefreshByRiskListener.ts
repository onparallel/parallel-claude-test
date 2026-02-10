import { add, Duration } from "date-fns";
import { inject, injectable } from "inversify";
import { intersection, isNonNullish } from "remeda";
import { assert } from "ts-essentials";
import {
  ProfileFieldExpiryUpdatedEvent,
  ProfileFieldValueUpdatedEvent,
  ProfileUpdatedEvent,
} from "../../../db/events/ProfileEvent";
import { ProfileRepository } from "../../../db/repositories/ProfileRepository";
import { ILogger, LOGGER } from "../../../services/Logger";
import { EventListener } from "../EventProcessorQueue";

export const PROFILE_DATE_REFRESH_BY_RISK_LISTENER = Symbol.for(
  "PROFILE_DATE_REFRESH_BY_RISK_LISTENER",
);

interface Config {
  orgId: number;
  profileTypes: {
    profileTypeId: number;
    /**
     *  optionally trigger update if a SELECT property on the profile type has any of the values in the triggerUpdateValues array.
     * if not provided, the listener will not check this property and will update the date fields regardless of the SELECT value.
     */
    triggerUpdateProfileTypeField?: number;
    triggerUpdateValues?: string[];
    /** the risk property on the profile type that will be used to calculate the next date based on the value */
    riskProfileTypeFieldId: number;
    dateProfileTypeFields: {
      /** base date to use for the calculation of the next date */
      lastDateProfileTypeFieldId: number;
      /** date field to update with the next date */
      nextDateProfileTypeFieldId: number;
      /** intervals to use for the calculation of the next date based on the risk value */
      dateIntervalsByRisk: Record<string, Duration>;
    }[];
  }[];
}

const CONFIG: Config[] =
  process.env.ENV === "staging"
    ? [
        {
          // PARALLEL
          orgId: 1,
          profileTypes: [
            {
              profileTypeId: 267,
              triggerUpdateProfileTypeField: 4498,
              triggerUpdateValues: ["KYC_REFRESH"],
              riskProfileTypeFieldId: 4499,
              dateProfileTypeFields: [
                {
                  lastDateProfileTypeFieldId: 4500,
                  nextDateProfileTypeFieldId: 4501,
                  dateIntervalsByRisk: {
                    HIGH: { years: 1 },
                    MEDIUM: { years: 3 },
                    LOW: { years: 5 },
                  },
                },
              ],
            },
          ],
        },
      ]
    : process.env.ENV === "production"
      ? [
          // DEMO (Compliance & Legal)
          {
            orgId: 45041,
            profileTypes: [
              //INDIVIDUALS
              {
                profileTypeId: 10480,
                triggerUpdateProfileTypeField: 188993,
                triggerUpdateValues: ["APPROVED", "ACTIVE"],
                riskProfileTypeFieldId: 149549,
                dateProfileTypeFields: [
                  {
                    lastDateProfileTypeFieldId: 200648,
                    nextDateProfileTypeFieldId: 200649,
                    dateIntervalsByRisk: {
                      HIGH: { years: 1 },
                      MEDIUM_HIGH: { years: 2 },
                      MEDIUM: { years: 3 },
                      MEDIUM_LOW: { years: 4 },
                      LOW: { years: 5 },
                    },
                  },
                ],
              },
              // COMPANIES
              {
                profileTypeId: 10481,
                triggerUpdateProfileTypeField: 189002,
                riskProfileTypeFieldId: 149568,
                triggerUpdateValues: ["APPROVED", "ACTIVE"],
                dateProfileTypeFields: [
                  {
                    lastDateProfileTypeFieldId: 200554,
                    nextDateProfileTypeFieldId: 160769,
                    dateIntervalsByRisk: {
                      HIGH: { years: 1 },
                      MEDIUM_HIGH: { years: 2 },
                      MEDIUM: { years: 3 },
                      MEDIUM_LOW: { years: 4 },
                      LOW: { years: 5 },
                    },
                  },
                ],
              },
            ],
          },
          // Osborne Clarke
          {
            orgId: 45322,
            profileTypes: [
              //INDIVIDUALS
              {
                profileTypeId: 11341,
                triggerUpdateProfileTypeField: 197959,
                triggerUpdateValues: ["APPROVED", "ACTIVE"],
                riskProfileTypeFieldId: 197952,
                dateProfileTypeFields: [
                  {
                    lastDateProfileTypeFieldId: 200647,
                    nextDateProfileTypeFieldId: 198553,
                    dateIntervalsByRisk: {
                      HIGH: { years: 1 },
                      MEDIUM_HIGH: { years: 2 },
                      MEDIUM: { years: 3 },
                      MEDIUM_LOW: { years: 4 },
                      LOW: { years: 5 },
                    },
                  },
                ],
              },
              // COMPANIES
              {
                profileTypeId: 11342,
                triggerUpdateProfileTypeField: 197991,
                triggerUpdateValues: ["APPROVED", "ACTIVE"],
                riskProfileTypeFieldId: 197978,
                dateProfileTypeFields: [
                  {
                    lastDateProfileTypeFieldId: 200646,
                    nextDateProfileTypeFieldId: 198554,
                    dateIntervalsByRisk: {
                      HIGH: { years: 1 },
                      MEDIUM_HIGH: { years: 2 },
                      MEDIUM: { years: 3 },
                      MEDIUM_LOW: { years: 4 },
                      LOW: { years: 5 },
                    },
                  },
                ],
              },
            ],
          },
          // Amesto
          {
            orgId: 45326,
            profileTypes: [
              // COMPANIES
              {
                profileTypeId: 11357,
                triggerUpdateProfileTypeField: 198358,
                triggerUpdateValues: ["ACTIVE"],
                riskProfileTypeFieldId: 198345,
                dateProfileTypeFields: [
                  {
                    lastDateProfileTypeFieldId: 199329,
                    nextDateProfileTypeFieldId: 198607,
                    dateIntervalsByRisk: {
                      HIGH: { years: 1 },
                      MEDIUM_HIGH: { years: 2 },
                      MEDIUM: { years: 2 },
                      // MEDIUM_LOW: null, they also have MEDIUM_LOW risk, but it's not used for kyc refresh
                      LOW: { years: 3 },
                    },
                  },
                ],
              },
            ],
          },
          // Easy EP
          {
            orgId: 45332,
            profileTypes: [
              // COMPANIES
              {
                profileTypeId: 11380,
                triggerUpdateProfileTypeField: 199180,
                triggerUpdateValues: ["ACTIVE"],
                riskProfileTypeFieldId: 200644,
                dateProfileTypeFields: [
                  {
                    lastDateProfileTypeFieldId: 201428,
                    nextDateProfileTypeFieldId: 199604,
                    dateIntervalsByRisk: {
                      HIGH: { years: 1 },
                      MEDIUM: { years: 3 },
                      LOW: { years: 5 },
                    },
                  },
                ],
              },
            ],
          },
          // Aldea Ventures
          {
            orgId: 44807,
            profileTypes: [
              // Individuals
              {
                profileTypeId: 9780,
                triggerUpdateProfileTypeField: 185731,
                triggerUpdateValues: ["ACTIVE"],
                riskProfileTypeFieldId: 133695,
                dateProfileTypeFields: [
                  {
                    lastDateProfileTypeFieldId: 201490,
                    nextDateProfileTypeFieldId: 201491,
                    dateIntervalsByRisk: {
                      HIGH: { years: 1 },
                      MEDIUM: { years: 2 },
                      LOW: { years: 3 },
                    },
                  },
                ],
              },
              // Companies
              {
                profileTypeId: 9781,
                triggerUpdateProfileTypeField: 185740,
                triggerUpdateValues: ["ACTIVE"],
                riskProfileTypeFieldId: 133714,
                dateProfileTypeFields: [
                  {
                    lastDateProfileTypeFieldId: 201492,
                    nextDateProfileTypeFieldId: 201493,
                    dateIntervalsByRisk: {
                      HIGH: { years: 1 },
                      MEDIUM: { years: 2 },
                      LOW: { years: 3 },
                    },
                  },
                ],
              },
            ],
          },
          // Addleshaw Goddard
          {
            orgId: 45316,
            profileTypes: [
              // Individuals
              {
                profileTypeId: 11321,
                triggerUpdateProfileTypeField: 197392,
                triggerUpdateValues: ["ACTIVE"],
                riskProfileTypeFieldId: 197385,
                dateProfileTypeFields: [
                  {
                    lastDateProfileTypeFieldId: 201690,
                    nextDateProfileTypeFieldId: 201689,
                    dateIntervalsByRisk: {
                      HIGH: { years: 1 },
                      MEDIUM: { years: 4 },
                      LOW: { years: 5 },
                    },
                  },
                ],
              },
              // Companies
              {
                profileTypeId: 11322,
                triggerUpdateProfileTypeField: 197424,
                triggerUpdateValues: ["ACTIVE"],
                riskProfileTypeFieldId: 197411,
                dateProfileTypeFields: [
                  {
                    lastDateProfileTypeFieldId: 201691,
                    nextDateProfileTypeFieldId: 201692,
                    dateIntervalsByRisk: {
                      HIGH: { years: 1 },
                      MEDIUM: { years: 4 },
                      LOW: { years: 5 },
                    },
                  },
                ],
              },
            ],
          },
          // Ability 5
          {
            orgId: 45335,
            profileTypes: [
              // Portfolio companies
              {
                profileTypeId: 11389,
                triggerUpdateProfileTypeField: 200545,
                triggerUpdateValues: ["activo"],
                riskProfileTypeFieldId: 199507,
                dateProfileTypeFields: [
                  {
                    lastDateProfileTypeFieldId: 200543,
                    nextDateProfileTypeFieldId: 200544,
                    dateIntervalsByRisk: {
                      HIGH: { years: 1 },
                      MEDIUM: { years: 3 },
                      LOW: { years: 5 },
                    },
                  },
                ],
              },
            ],
          },
          // Pérez-Llorca
          {
            orgId: 45303,
            profileTypes: [
              // Individual
              {
                profileTypeId: 11281,
                riskProfileTypeFieldId: 196197,
                dateProfileTypeFields: [
                  {
                    lastDateProfileTypeFieldId: 201589,
                    nextDateProfileTypeFieldId: 201588,
                    dateIntervalsByRisk: {
                      HIGH: { years: 4 },
                      MEDIUM: { years: 3 },
                      LOW: { years: 1 },
                    },
                  },
                ],
              },
              // Company
              {
                profileTypeId: 11282,
                riskProfileTypeFieldId: 196223,
                dateProfileTypeFields: [
                  {
                    lastDateProfileTypeFieldId: 201590,
                    nextDateProfileTypeFieldId: 201583,
                    dateIntervalsByRisk: {
                      HIGH: { years: 4 },
                      MEDIUM: { years: 3 },
                      LOW: { years: 1 },
                    },
                  },
                  {
                    lastDateProfileTypeFieldId: 201591,
                    nextDateProfileTypeFieldId: 201584,
                    dateIntervalsByRisk: {
                      HIGH: { years: 4 },
                      MEDIUM: { years: 3 },
                      LOW: { years: 1 },
                    },
                  },
                ],
              },
            ],
          },
        ]
      : [];

/**
 * This listener is responsible for automatically updating profile date fields based on the updated risk value and other optional properties.
 */
@injectable()
export class ProfileDateRefreshByRiskListener implements EventListener<"PROFILE_UPDATED"> {
  public readonly types: "PROFILE_UPDATED"[] = ["PROFILE_UPDATED"];

  constructor(
    @inject(ProfileRepository) private profiles: ProfileRepository,
    @inject(LOGGER) private logger: ILogger,
  ) {}

  public async handle(event: ProfileUpdatedEvent) {
    const config = CONFIG.find((c) => c.orgId === event.org_id);
    if (!config) {
      return;
    }

    const profile = await this.profiles.loadProfile(event.profile_id);
    if (!profile) {
      return;
    }

    const profileTypeConfig = config.profileTypes.find(
      (pt) => pt.profileTypeId === profile.profile_type_id,
    );

    if (!profileTypeConfig) {
      return;
    }

    if (isNonNullish(profileTypeConfig.triggerUpdateProfileTypeField)) {
      assert(
        isNonNullish(profileTypeConfig.triggerUpdateValues),
        "triggerUpdateValues is required if triggerUpdateProfileTypeField is provided",
      );
    }

    // accumulate events to be created at the end
    const accumulatedEvents: (
      | ProfileFieldValueUpdatedEvent<true>
      | ProfileFieldExpiryUpdatedEvent<true>
    )[] = [];

    for (const dateFields of profileTypeConfig.dateProfileTypeFields) {
      // if status, risk or last date are updated on this event, we need to calculate the next date based on risk value
      if (
        intersection.multiset(
          event.data.profile_type_field_ids,
          [
            profileTypeConfig.triggerUpdateProfileTypeField,
            profileTypeConfig.riskProfileTypeFieldId,
            dateFields.lastDateProfileTypeFieldId,
          ].filter(isNonNullish),
        ).length === 0
      ) {
        // no update comes from watched fields, skip
        continue;
      }

      // update comes from status or risk field, load required values to make sure all are present
      const values = await this.profiles.loadProfileFieldValue(
        [
          profileTypeConfig.triggerUpdateProfileTypeField,
          profileTypeConfig.riskProfileTypeFieldId,
          dateFields.lastDateProfileTypeFieldId,
        ]
          .filter(isNonNullish)
          .map((profileTypeFieldId) => ({ profileId: profile.id, profileTypeFieldId })),
      );

      const triggerUpdateValue = values.find(
        (v) => v?.profile_type_field_id === profileTypeConfig.triggerUpdateProfileTypeField,
      );
      const riskValue = values.find(
        (v) => v?.profile_type_field_id === profileTypeConfig.riskProfileTypeFieldId,
      );
      const lastDateValue = values.find(
        (v) => v?.profile_type_field_id === dateFields.lastDateProfileTypeFieldId,
      );

      const nextRefreshDateInterval = riskValue
        ? dateFields.dateIntervalsByRisk[riskValue.content.value]
        : undefined;

      if (
        (isNonNullish(profileTypeConfig.triggerUpdateProfileTypeField) && !triggerUpdateValue) ||
        !riskValue ||
        !lastDateValue ||
        !nextRefreshDateInterval ||
        (isNonNullish(profileTypeConfig.triggerUpdateValues) &&
          isNonNullish(triggerUpdateValue) &&
          !profileTypeConfig.triggerUpdateValues.includes(triggerUpdateValue.content.value))
      ) {
        // missing required values or triggerUpdateValue is not a valid value for date refresh, set next date to null
        const valueEvents = await this.profiles.updateProfileFieldValues(
          [
            {
              profileId: event.profile_id,
              profileTypeFieldId: dateFields.nextDateProfileTypeFieldId,
              type: "DATE",
              content: null,
              expiryDate: null,
            },
          ],
          event.org_id,
          { source: "PARALLEL_MONITORING" },
        );

        accumulatedEvents.push(...valueEvents);

        continue;
      }

      const nextDate = add(new Date(lastDateValue.content.value), nextRefreshDateInterval)
        .toISOString()
        .split("T")[0];

      this.logger.debug("Updating refresh date", {
        nextRefreshDateInterval,
        lastDate: lastDateValue.content.value,
        nextDate,
      });

      const valueEvents = await this.profiles.updateProfileFieldValues(
        [
          {
            profileId: event.profile_id,
            profileTypeFieldId: dateFields.nextDateProfileTypeFieldId,
            type: "DATE",
            content: { value: nextDate },
            expiryDate: nextDate,
          },
        ],
        event.org_id,
        { source: "PARALLEL_MONITORING" },
      );

      accumulatedEvents.push(...valueEvents);
    }

    await this.profiles.createProfileUpdatedEvents(accumulatedEvents, event.org_id, {
      source: "PARALLEL_MONITORING",
    });
  }
}
