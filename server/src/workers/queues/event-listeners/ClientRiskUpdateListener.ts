import { inject, injectable } from "inversify";
import { firstBy, isNonNullish } from "remeda";
import { Profile, ProfileRelationship } from "../../../db/__types";
import {
  ProfileClosedEvent,
  ProfileFieldValueUpdatedEvent,
  ProfileRelationshipCreatedEvent,
  ProfileRelationshipRemovedEvent,
  ProfileReopenedEvent,
} from "../../../db/events/ProfileEvent";
import { ProfileRepository } from "../../../db/repositories/ProfileRepository";
import { EventListener } from "../EventProcessorQueue";

export const CLIENT_RISK_UPDATE_LISTENER = Symbol.for("CLIENT_RISK_UPDATE_LISTENER");

const CONFIG =
  process.env.ENV === "staging"
    ? [
        {
          // PARALLEL
          orgId: 1,
          riskValues: ["LOW", "MEDIUM", "HIGH"] as const,
          individual: {
            profileTypeId: 64,
            riskProfileTypeFieldId: 4380,
            globalRiskProfileTypeFieldId: 716,
          },
          legalEntity: {
            profileTypeId: 65,
            riskProfileTypeFieldId: 4381,
            globalRiskProfileTypeFieldId: 717,
          },
          file: {
            profileTypeId: 263,
            riskProfileTypeFieldId: 4383,
          },
          clientFileRelationshipTypeId: 797,
        },
      ]
    : process.env.ENV === "production"
      ? [
          {
            // ADLANTER
            orgId: 209,
            riskValues: ["LOW", "MEDIUM", "HIGH", "VERY_HIGH"] as const,
            individual: {
              profileTypeId: 5797,
              riskProfileTypeFieldId: 196647,
              globalRiskProfileTypeFieldId: 43281,
            },
            legalEntity: {
              profileTypeId: 5798,
              riskProfileTypeFieldId: 194540,
              globalRiskProfileTypeFieldId: 43300,
            },
            file: {
              profileTypeId: 11198,
              riskProfileTypeFieldId: 194202,
            },
            clientFileRelationshipTypeId: 34061,
          },
        ]
      : [];

@injectable()
export class ClientRiskUpdateListener
  implements
    EventListener<
      | "PROFILE_FIELD_VALUE_UPDATED"
      | "PROFILE_RELATIONSHIP_CREATED"
      | "PROFILE_RELATIONSHIP_REMOVED"
      | "PROFILE_CLOSED"
      | "PROFILE_REOPENED"
    >
{
  public readonly types: (
    | "PROFILE_FIELD_VALUE_UPDATED"
    | "PROFILE_RELATIONSHIP_CREATED"
    | "PROFILE_RELATIONSHIP_REMOVED"
    | "PROFILE_CLOSED"
    | "PROFILE_REOPENED"
  )[] = [
    "PROFILE_FIELD_VALUE_UPDATED",
    "PROFILE_RELATIONSHIP_CREATED",
    "PROFILE_RELATIONSHIP_REMOVED",
    "PROFILE_CLOSED",
    "PROFILE_REOPENED",
  ];

  constructor(@inject(ProfileRepository) private profiles: ProfileRepository) {}

  public async handle(
    event:
      | ProfileFieldValueUpdatedEvent
      | ProfileRelationshipCreatedEvent
      | ProfileRelationshipRemovedEvent
      | ProfileClosedEvent
      | ProfileReopenedEvent,
  ) {
    const profile = await this.profiles.loadProfile(event.profile_id);
    if (!profile) {
      return;
    }

    for (const config of CONFIG) {
      if (event.org_id !== config.orgId) {
        continue;
      }

      if (
        // the risk value was updated on a client or a file
        (event.type === "PROFILE_FIELD_VALUE_UPDATED" &&
          [
            config.individual.riskProfileTypeFieldId,
            config.legalEntity.riskProfileTypeFieldId,
            config.file.riskProfileTypeFieldId,
          ].includes(event.data.profile_type_field_id)) ||
        // a relationship between a client and a file was created or removed
        ((event.type === "PROFILE_RELATIONSHIP_CREATED" ||
          event.type === "PROFILE_RELATIONSHIP_REMOVED") &&
          event.data.profile_relationship_type_id === config.clientFileRelationshipTypeId &&
          // there will be 2 events of this type, one for each side of the relationship
          // we just need to handle one side, as handling both could result in race condition errors
          [config.individual.profileTypeId, config.legalEntity.profileTypeId].includes(
            profile.profile_type_id,
          )) ||
        // a file was closed or reopened
        ((event.type === "PROFILE_CLOSED" || event.type === "PROFILE_REOPENED") &&
          profile.profile_type_id === config.file.profileTypeId)
      ) {
        await this.updateGlobalClientRisk(profile, event.org_id, config);
      }
    }
  }

  private async updateGlobalClientRisk(
    profile: Profile,
    orgId: number,
    config: (typeof CONFIG)[number],
  ) {
    const relationships = await this.profiles.loadProfileRelationshipsByProfileId(profile.id);

    let client: Profile | null = profile;
    if (profile.profile_type_id === config.file.profileTypeId) {
      client = await this.getClientFromFile(
        profile.id,
        relationships,
        config.clientFileRelationshipTypeId,
      );
    }

    // client should be an INDIVIDUAL or LEGAL_ENTITY
    if (
      !client ||
      ![config.individual.profileTypeId, config.legalEntity.profileTypeId].includes(
        client.profile_type_id,
      )
    ) {
      return;
    }

    const clientFileProfileIds = relationships
      .filter(
        (r) =>
          r.profile_relationship_type_id === config.clientFileRelationshipTypeId &&
          r.left_side_profile_id === client.id,
      )
      .map((r) => r.right_side_profile_id);

    // get every related FILE OPEN profile of the client
    const clientFileProfiles = (await this.profiles.loadProfile(clientFileProfileIds))
      .filter((p) => p?.status === "OPEN")
      .filter(isNonNullish);

    const [individualRisk, individualGlobalRisk, companyRisk, companyGlobalRisk, ...fileRisks] =
      await this.profiles.loadProfileFieldValue([
        {
          profileId: client.id,
          profileTypeFieldId: config.individual.riskProfileTypeFieldId,
        },
        {
          profileId: client.id,
          profileTypeFieldId: config.individual.globalRiskProfileTypeFieldId,
        },
        { profileId: client.id, profileTypeFieldId: config.legalEntity.riskProfileTypeFieldId },
        {
          profileId: client.id,
          profileTypeFieldId: config.legalEntity.globalRiskProfileTypeFieldId,
        },
        ...clientFileProfiles.map((p) => ({
          profileId: p.id,
          profileTypeFieldId: config.file.riskProfileTypeFieldId,
        })),
      ]);

    // get the max risk of the client, between its "individual" value and the risk of every of its FILEs
    const maxRisk = firstBy(
      [
        individualRisk?.content?.value ?? null,
        companyRisk?.content?.value ?? null,
        ...fileRisks.map((v) => v?.content?.value ?? null),
      ].filter(isNonNullish),
      [(v) => config.riskValues.indexOf(v), "desc"],
    );

    if (!maxRisk) {
      return;
    }

    const globalRisk =
      individualGlobalRisk?.content?.value ?? companyGlobalRisk?.content?.value ?? null;

    // if the max risk is different from the global risk, update the global risk
    if (maxRisk !== globalRisk) {
      await this.profiles.updateProfileFieldValues(
        [
          {
            profileId: client.id,
            profileTypeFieldId:
              client.profile_type_id === config.individual.profileTypeId
                ? config.individual.globalRiskProfileTypeFieldId
                : config.legalEntity.globalRiskProfileTypeFieldId,
            type: "SELECT",
            content: { value: maxRisk },
          },
        ],
        null,
        orgId,
      );
    }
  }

  private async getClientFromFile(
    fileProfileId: number,
    relationships: ProfileRelationship[],
    clientFileRelationshipTypeId: number,
  ) {
    const clientFileRelationship = relationships.find(
      (r) =>
        r.profile_relationship_type_id === clientFileRelationshipTypeId &&
        r.right_side_profile_id === fileProfileId,
    );
    if (!clientFileRelationship) {
      return null;
    }
    return await this.profiles.loadProfile(clientFileRelationship.left_side_profile_id);
  }
}
