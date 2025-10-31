import { add, Duration } from "date-fns";
import { inject, injectable } from "inversify";
import { assert } from "ts-essentials";
import { ProfileUpdatedEvent } from "../../../db/events/ProfileEvent";
import { ProfileRepository } from "../../../db/repositories/ProfileRepository";
import { ILogger, LOGGER } from "../../../services/Logger";
import { EventListener } from "../EventProcessorQueue";

export const KYC_REFRESH_DATE_UPDATE_LISTENER = Symbol.for("KYC_REFRESH_DATE_UPDATE_LISTENER");

interface Config {
  orgId: number;
  profileTypes: {
    profileTypeId: number;
    statusProfileTypeFieldId: number;
    riskProfileTypeFieldId: number;
    lastKycDateProfileTypeFieldId: number;
    nextKycDateProfileTypeFieldId: number;
    clientStatusValuesForKycRefresh: string[];
    dateIntervalsByRisk: Record<string, Duration>;
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
              statusProfileTypeFieldId: 4498,
              riskProfileTypeFieldId: 4499,
              lastKycDateProfileTypeFieldId: 4500,
              nextKycDateProfileTypeFieldId: 4501,
              clientStatusValuesForKycRefresh: ["KYC_REFRESH"],
              dateIntervalsByRisk: {
                HIGH: { years: 1 },
                MEDIUM: { years: 3 },
                LOW: { years: 5 },
              },
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
                statusProfileTypeFieldId: 188993,
                riskProfileTypeFieldId: 149549,
                lastKycDateProfileTypeFieldId: 200648,
                nextKycDateProfileTypeFieldId: 200649,
                dateIntervalsByRisk: {
                  HIGH: { years: 1 },
                  MEDIUM_HIGH: { years: 2 },
                  MEDIUM: { years: 3 },
                  MEDIUM_LOW: { years: 4 },
                  LOW: { years: 5 },
                },
                clientStatusValuesForKycRefresh: ["APPROVED", "ACTIVE"],
              },
              // COMPANIES
              {
                profileTypeId: 10481,
                statusProfileTypeFieldId: 189002,
                riskProfileTypeFieldId: 149568,
                lastKycDateProfileTypeFieldId: 200554,
                nextKycDateProfileTypeFieldId: 160769,
                dateIntervalsByRisk: {
                  HIGH: { years: 1 },
                  MEDIUM_HIGH: { years: 2 },
                  MEDIUM: { years: 3 },
                  MEDIUM_LOW: { years: 4 },
                  LOW: { years: 5 },
                },

                clientStatusValuesForKycRefresh: ["APPROVED", "ACTIVE"],
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
                statusProfileTypeFieldId: 197959,
                riskProfileTypeFieldId: 197952,
                lastKycDateProfileTypeFieldId: 200647,
                nextKycDateProfileTypeFieldId: 198553,
                dateIntervalsByRisk: {
                  HIGH: { years: 1 },
                  MEDIUM_HIGH: { years: 2 },
                  MEDIUM: { years: 3 },
                  MEDIUM_LOW: { years: 4 },
                  LOW: { years: 5 },
                },
                clientStatusValuesForKycRefresh: ["APPROVED", "ACTIVE"],
              },
              // COMPANIES
              {
                profileTypeId: 11342,
                statusProfileTypeFieldId: 197991,
                riskProfileTypeFieldId: 197978,
                lastKycDateProfileTypeFieldId: 200646,
                nextKycDateProfileTypeFieldId: 198554,
                dateIntervalsByRisk: {
                  HIGH: { years: 1 },
                  MEDIUM_HIGH: { years: 2 },
                  MEDIUM: { years: 3 },
                  MEDIUM_LOW: { years: 4 },
                  LOW: { years: 5 },
                },

                clientStatusValuesForKycRefresh: ["APPROVED", "ACTIVE"],
              },
            ],
          },
        ]
      : [];

@injectable()
export class KycRefreshDateUpdateListener implements EventListener<"PROFILE_UPDATED"> {
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

    // get every PROFILE_FIELD_VALUE_UPDATED events for this profile down to the previous PROFILE_UPDATED
    // this way we can see the reasons of the PROFILE_UPDATED event and value if an update is required
    const previousEvents = await this.profiles.getProfileEvents(event.profile_id, {
      type: "PROFILE_FIELD_VALUE_UPDATED",
      before: { eventId: event.id },
      after: { type: "PROFILE_UPDATED" },
    });

    if (
      !previousEvents.find((e) =>
        [
          profileTypeConfig.statusProfileTypeFieldId,
          profileTypeConfig.riskProfileTypeFieldId,
          profileTypeConfig.lastKycDateProfileTypeFieldId,
        ].includes(e.data.profile_type_field_id),
      )
    ) {
      // no update comes from status or risk field, skip
      return;
    }

    // update comes from status or risk field, load required values to make sure all are present
    const values = await this.profiles.loadProfileFieldValue(
      [
        profileTypeConfig.statusProfileTypeFieldId,
        profileTypeConfig.riskProfileTypeFieldId,
        profileTypeConfig.lastKycDateProfileTypeFieldId,
      ].map((profileTypeFieldId) => ({ profileId: profile.id, profileTypeFieldId })),
    );

    const statusValue = values.find(
      (v) => v?.profile_type_field_id === profileTypeConfig.statusProfileTypeFieldId,
    )!;
    const riskValue = values.find(
      (v) => v?.profile_type_field_id === profileTypeConfig.riskProfileTypeFieldId,
    )!;
    const lastKycDateValue = values.find(
      (v) => v?.profile_type_field_id === profileTypeConfig.lastKycDateProfileTypeFieldId,
    )!;

    if (
      !statusValue ||
      !riskValue ||
      !lastKycDateValue ||
      !profileTypeConfig.clientStatusValuesForKycRefresh.includes(statusValue.content.value)
    ) {
      // missing required values or status is not a client status value for kyc refresh, set next kyc date to null
      await this.profiles.updateProfileFieldValues(
        [
          {
            profileId: event.profile_id,
            profileTypeFieldId: profileTypeConfig.nextKycDateProfileTypeFieldId,
            type: "DATE",
            content: null,
            expiryDate: null,
          },
        ],
        null,
        event.org_id,
        "PARALLEL_MONITORING",
      );

      return;
    }

    const nextRefreshDateInterval = profileTypeConfig.dateIntervalsByRisk[riskValue.content.value];
    assert(nextRefreshDateInterval, "Next refresh date value not found");

    const nextKycDate = add(new Date(lastKycDateValue.content.value), nextRefreshDateInterval)
      .toISOString()
      .split("T")[0];

    this.logger.debug("Updating KYC refresh date", {
      nextRefreshDateInterval,
      lastKycDate: lastKycDateValue.content.value,
      nextKycDate,
    });

    await this.profiles.updateProfileFieldValues(
      [
        {
          profileId: event.profile_id,
          profileTypeFieldId: profileTypeConfig.nextKycDateProfileTypeFieldId,
          type: "DATE",
          content: { value: nextKycDate },
          expiryDate: nextKycDate,
        },
      ],
      null,
      event.org_id,
      "PARALLEL_MONITORING",
    );
  }
}
