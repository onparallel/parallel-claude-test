import { add, Duration } from "date-fns";
import { inject, injectable } from "inversify";
import { intersection } from "remeda";
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
          // Amesto
          {
            orgId: 45326,
            profileTypes: [
              // COMPANIES
              {
                profileTypeId: 11357,
                statusProfileTypeFieldId: 198358,
                riskProfileTypeFieldId: 198345,
                lastKycDateProfileTypeFieldId: 199329,
                nextKycDateProfileTypeFieldId: 198607,
                dateIntervalsByRisk: {
                  HIGH: { years: 1 },
                  MEDIUM_HIGH: { years: 2 },
                  MEDIUM: { years: 2 },
                  // MEDIUM_LOW: null, they also have MEDIUM_LOW risk, but it's not used for kyc refresh
                  LOW: { years: 3 },
                },
                clientStatusValuesForKycRefresh: ["ACTIVE"],
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
                statusProfileTypeFieldId: 199180,
                riskProfileTypeFieldId: 200644,
                lastKycDateProfileTypeFieldId: 201428,
                nextKycDateProfileTypeFieldId: 199604,
                dateIntervalsByRisk: {
                  HIGH: { years: 1 },
                  MEDIUM: { years: 3 },
                  LOW: { years: 5 },
                },
                clientStatusValuesForKycRefresh: ["ACTIVE"],
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
                statusProfileTypeFieldId: 185731,
                riskProfileTypeFieldId: 133695,
                lastKycDateProfileTypeFieldId: 201490,
                nextKycDateProfileTypeFieldId: 201491,
                dateIntervalsByRisk: {
                  HIGH: { years: 1 },
                  MEDIUM: { years: 2 },
                  LOW: { years: 3 },
                },
                clientStatusValuesForKycRefresh: ["ACTIVE"],
              },
              // Companies
              {
                profileTypeId: 9781,
                statusProfileTypeFieldId: 185740,
                riskProfileTypeFieldId: 133714,
                lastKycDateProfileTypeFieldId: 201492,
                nextKycDateProfileTypeFieldId: 201493,
                dateIntervalsByRisk: {
                  HIGH: { years: 1 },
                  MEDIUM: { years: 2 },
                  LOW: { years: 3 },
                },
                clientStatusValuesForKycRefresh: ["ACTIVE"],
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

    if (
      intersection.multiset(event.data.profile_type_field_ids, [
        profileTypeConfig.statusProfileTypeFieldId,
        profileTypeConfig.riskProfileTypeFieldId,
        profileTypeConfig.lastKycDateProfileTypeFieldId,
      ]).length === 0
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
    );
    const riskValue = values.find(
      (v) => v?.profile_type_field_id === profileTypeConfig.riskProfileTypeFieldId,
    );
    const lastKycDateValue = values.find(
      (v) => v?.profile_type_field_id === profileTypeConfig.lastKycDateProfileTypeFieldId,
    );

    const nextRefreshDateInterval = riskValue
      ? profileTypeConfig.dateIntervalsByRisk[riskValue.content.value]
      : undefined;

    if (
      !statusValue ||
      !riskValue ||
      !lastKycDateValue ||
      !nextRefreshDateInterval ||
      !profileTypeConfig.clientStatusValuesForKycRefresh.includes(statusValue.content.value)
    ) {
      // missing required values or status is not a client status value for kyc refresh, set next kyc date to null
      const events = await this.profiles.updateProfileFieldValues(
        [
          {
            profileId: event.profile_id,
            profileTypeFieldId: profileTypeConfig.nextKycDateProfileTypeFieldId,
            type: "DATE",
            content: null,
            expiryDate: null,
          },
        ],
        event.org_id,
        { source: "PARALLEL_MONITORING" },
      );
      await this.profiles.createProfileUpdatedEvents(events, event.org_id, {
        source: "PARALLEL_MONITORING",
      });
      return;
    }

    const nextKycDate = add(new Date(lastKycDateValue.content.value), nextRefreshDateInterval)
      .toISOString()
      .split("T")[0];

    this.logger.debug("Updating KYC refresh date", {
      nextRefreshDateInterval,
      lastKycDate: lastKycDateValue.content.value,
      nextKycDate,
    });

    const events = await this.profiles.updateProfileFieldValues(
      [
        {
          profileId: event.profile_id,
          profileTypeFieldId: profileTypeConfig.nextKycDateProfileTypeFieldId,
          type: "DATE",
          content: { value: nextKycDate },
          expiryDate: nextKycDate,
        },
      ],
      event.org_id,
      { source: "PARALLEL_MONITORING" },
    );
    await this.profiles.createProfileUpdatedEvents(events, event.org_id, {
      source: "PARALLEL_MONITORING",
    });
  }
}
