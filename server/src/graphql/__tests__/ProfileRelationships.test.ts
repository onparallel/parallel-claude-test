import { gql } from "graphql-request";
import { Knex } from "knex";
import {
  Organization,
  Profile,
  ProfileRelationship,
  ProfileRelationshipType,
  ProfileType,
  User,
} from "../../db/__types";
import { KNEX } from "../../db/knex";
import { Mocks } from "../../db/repositories/__tests__/mocks";
import { IProfilesSetupService, PROFILES_SETUP_SERVICE } from "../../services/ProfilesSetupService";
import { toGlobalId } from "../../util/globalId";
import { TestClient, initServer } from "./server";

describe("GraphQL/Profile Relationships", () => {
  let mocks: Mocks;
  let testClient: TestClient;

  let individual: ProfileType;
  let legalEntity: ProfileType;
  let contract: ProfileType;

  let organization: Organization;
  let user: User;
  beforeAll(async () => {
    testClient = await initServer();
    const knex = testClient.container.get<Knex>(KNEX);
    const profilesSetup = testClient.container.get<IProfilesSetupService>(PROFILES_SETUP_SERVICE);
    mocks = new Mocks(knex);

    ({ organization, user } = await mocks.createSessionUserAndOrganization(() => ({
      status: "ROOT",
    })));

    await profilesSetup.createDefaultProfileTypes(organization.id, "TEST");
    await profilesSetup.createDefaultProfileRelationshipTypes(organization.id, "TEST");

    await mocks.createFeatureFlags([{ name: "PROFILES", default_value: true }]);

    individual = await mocks.knex
      .from("profile_type")
      .where({ org_id: organization.id, standard_type: "INDIVIDUAL", deleted_at: null })
      .first();

    legalEntity = await mocks.knex
      .from("profile_type")
      .where({ org_id: organization.id, standard_type: "LEGAL_ENTITY", deleted_at: null })
      .first();

    contract = await mocks.knex
      .from("profile_type")
      .where({ org_id: organization.id, standard_type: "CONTRACT", deleted_at: null })
      .first();
  });

  afterAll(async () => {
    await testClient.stop();
  });

  describe("profileRelationshipTypesWithDirection", () => {
    it("queries every possible relationship", async () => {
      const { errors, data } = await testClient.execute(gql`
        query {
          profileRelationshipTypesWithDirection {
            profileRelationshipType {
              id
              alias
              allowedLeftRightProfileTypeIds
              allowedRightLeftProfileTypeIds
            }
            direction
          }
        }
      `);

      expect(errors).toBeUndefined();
      expect(data?.profileRelationshipTypesWithDirection).toIncludeSameMembers([
        {
          direction: "RIGHT_LEFT",
          profileRelationshipType: {
            id: expect.any(String),
            alias: "p_parent__child",
            allowedLeftRightProfileTypeIds: [individual.id].map((id) =>
              toGlobalId("ProfileType", id),
            ),
            allowedRightLeftProfileTypeIds: [individual.id].map((id) =>
              toGlobalId("ProfileType", id),
            ),
          },
        },
        {
          direction: "LEFT_RIGHT",
          profileRelationshipType: {
            id: expect.any(String),
            alias: "p_parent__child",
            allowedLeftRightProfileTypeIds: [individual.id].map((id) =>
              toGlobalId("ProfileType", id),
            ),
            allowedRightLeftProfileTypeIds: [individual.id].map((id) =>
              toGlobalId("ProfileType", id),
            ),
          },
        },
        {
          direction: "RIGHT_LEFT",
          profileRelationshipType: {
            id: expect.any(String),
            alias: "p_family_member",
            allowedLeftRightProfileTypeIds: [individual.id].map((id) =>
              toGlobalId("ProfileType", id),
            ),
            allowedRightLeftProfileTypeIds: [individual.id].map((id) =>
              toGlobalId("ProfileType", id),
            ),
          },
        },
        {
          direction: "RIGHT_LEFT",
          profileRelationshipType: {
            id: expect.any(String),
            alias: "p_close_associate",
            allowedLeftRightProfileTypeIds: [individual.id].map((id) =>
              toGlobalId("ProfileType", id),
            ),
            allowedRightLeftProfileTypeIds: [individual.id].map((id) =>
              toGlobalId("ProfileType", id),
            ),
          },
        },
        {
          direction: "RIGHT_LEFT",
          profileRelationshipType: {
            id: expect.any(String),
            alias: "p_spouse",
            allowedLeftRightProfileTypeIds: [individual.id].map((id) =>
              toGlobalId("ProfileType", id),
            ),
            allowedRightLeftProfileTypeIds: [individual.id].map((id) =>
              toGlobalId("ProfileType", id),
            ),
          },
        },
        {
          direction: "RIGHT_LEFT",
          profileRelationshipType: {
            id: expect.any(String),
            alias: "p_legal_representative__legally_represented",
            allowedLeftRightProfileTypeIds: [individual.id, legalEntity.id].map((id) =>
              toGlobalId("ProfileType", id),
            ),
            allowedRightLeftProfileTypeIds: [individual.id, legalEntity.id].map((id) =>
              toGlobalId("ProfileType", id),
            ),
          },
        },
        {
          direction: "LEFT_RIGHT",
          profileRelationshipType: {
            id: expect.any(String),
            alias: "p_legal_representative__legally_represented",
            allowedLeftRightProfileTypeIds: [individual.id, legalEntity.id].map((id) =>
              toGlobalId("ProfileType", id),
            ),
            allowedRightLeftProfileTypeIds: [individual.id, legalEntity.id].map((id) =>
              toGlobalId("ProfileType", id),
            ),
          },
        },
        {
          direction: "RIGHT_LEFT",
          profileRelationshipType: {
            id: expect.any(String),
            alias: "p_legal_guardian__legally_guarded",
            allowedLeftRightProfileTypeIds: [individual.id].map((id) =>
              toGlobalId("ProfileType", id),
            ),
            allowedRightLeftProfileTypeIds: [individual.id].map((id) =>
              toGlobalId("ProfileType", id),
            ),
          },
        },
        {
          direction: "LEFT_RIGHT",
          profileRelationshipType: {
            id: expect.any(String),
            alias: "p_legal_guardian__legally_guarded",
            allowedLeftRightProfileTypeIds: [individual.id].map((id) =>
              toGlobalId("ProfileType", id),
            ),
            allowedRightLeftProfileTypeIds: [individual.id].map((id) =>
              toGlobalId("ProfileType", id),
            ),
          },
        },
        {
          direction: "RIGHT_LEFT",
          profileRelationshipType: {
            id: expect.any(String),
            alias: "p_director__managed_by",
            allowedLeftRightProfileTypeIds: [individual.id].map((id) =>
              toGlobalId("ProfileType", id),
            ),
            allowedRightLeftProfileTypeIds: [legalEntity.id].map((id) =>
              toGlobalId("ProfileType", id),
            ),
          },
        },
        {
          direction: "RIGHT_LEFT",
          profileRelationshipType: {
            id: expect.any(String),
            alias: "p_shareholder__participated_in_by",
            allowedLeftRightProfileTypeIds: [individual.id, legalEntity.id].map((id) =>
              toGlobalId("ProfileType", id),
            ),
            allowedRightLeftProfileTypeIds: [legalEntity.id].map((id) =>
              toGlobalId("ProfileType", id),
            ),
          },
        },
        {
          direction: "RIGHT_LEFT",
          profileRelationshipType: {
            id: expect.any(String),
            alias: "p_beneficial_owner__direct_or_indirect_property",
            allowedLeftRightProfileTypeIds: [individual.id].map((id) =>
              toGlobalId("ProfileType", id),
            ),
            allowedRightLeftProfileTypeIds: [legalEntity.id].map((id) =>
              toGlobalId("ProfileType", id),
            ),
          },
        },
        {
          direction: "LEFT_RIGHT",
          profileRelationshipType: {
            id: expect.any(String),
            alias: "p_contract__counterparty",
            allowedLeftRightProfileTypeIds: [contract.id].map((id) =>
              toGlobalId("ProfileType", id),
            ),
            allowedRightLeftProfileTypeIds: [individual.id, legalEntity.id].map((id) =>
              toGlobalId("ProfileType", id),
            ),
          },
        },
        {
          direction: "LEFT_RIGHT",
          profileRelationshipType: {
            id: expect.any(String),
            alias: "p_director__managed_by",
            allowedLeftRightProfileTypeIds: [individual.id].map((id) =>
              toGlobalId("ProfileType", id),
            ),
            allowedRightLeftProfileTypeIds: [legalEntity.id].map((id) =>
              toGlobalId("ProfileType", id),
            ),
          },
        },
        {
          direction: "LEFT_RIGHT",
          profileRelationshipType: {
            id: expect.any(String),
            alias: "p_shareholder__participated_in_by",
            allowedLeftRightProfileTypeIds: [individual.id, legalEntity.id].map((id) =>
              toGlobalId("ProfileType", id),
            ),
            allowedRightLeftProfileTypeIds: [legalEntity.id].map((id) =>
              toGlobalId("ProfileType", id),
            ),
          },
        },
        {
          direction: "LEFT_RIGHT",
          profileRelationshipType: {
            id: expect.any(String),
            alias: "p_beneficial_owner__direct_or_indirect_property",
            allowedLeftRightProfileTypeIds: [individual.id].map((id) =>
              toGlobalId("ProfileType", id),
            ),
            allowedRightLeftProfileTypeIds: [legalEntity.id].map((id) =>
              toGlobalId("ProfileType", id),
            ),
          },
        },
        {
          direction: "RIGHT_LEFT",
          profileRelationshipType: {
            id: expect.any(String),
            alias: "p_parent_company__subsidiary",
            allowedLeftRightProfileTypeIds: [legalEntity.id].map((id) =>
              toGlobalId("ProfileType", id),
            ),
            allowedRightLeftProfileTypeIds: [legalEntity.id].map((id) =>
              toGlobalId("ProfileType", id),
            ),
          },
        },
        {
          direction: "LEFT_RIGHT",
          profileRelationshipType: {
            id: expect.any(String),
            alias: "p_parent_company__subsidiary",
            allowedLeftRightProfileTypeIds: [legalEntity.id].map((id) =>
              toGlobalId("ProfileType", id),
            ),
            allowedRightLeftProfileTypeIds: [legalEntity.id].map((id) =>
              toGlobalId("ProfileType", id),
            ),
          },
        },
        {
          direction: "RIGHT_LEFT",
          profileRelationshipType: {
            id: expect.any(String),
            alias: "p_main_office__branch_office",
            allowedLeftRightProfileTypeIds: [legalEntity.id].map((id) =>
              toGlobalId("ProfileType", id),
            ),
            allowedRightLeftProfileTypeIds: [legalEntity.id].map((id) =>
              toGlobalId("ProfileType", id),
            ),
          },
        },
        {
          direction: "LEFT_RIGHT",
          profileRelationshipType: {
            id: expect.any(String),
            alias: "p_main_office__branch_office",
            allowedLeftRightProfileTypeIds: [legalEntity.id].map((id) =>
              toGlobalId("ProfileType", id),
            ),
            allowedRightLeftProfileTypeIds: [legalEntity.id].map((id) =>
              toGlobalId("ProfileType", id),
            ),
          },
        },
        {
          direction: "RIGHT_LEFT",
          profileRelationshipType: {
            id: expect.any(String),
            alias: "p_associated_company",
            allowedLeftRightProfileTypeIds: [legalEntity.id].map((id) =>
              toGlobalId("ProfileType", id),
            ),
            allowedRightLeftProfileTypeIds: [legalEntity.id].map((id) =>
              toGlobalId("ProfileType", id),
            ),
          },
        },
        {
          direction: "RIGHT_LEFT",
          profileRelationshipType: {
            id: expect.any(String),
            alias: "p_main_contract__annex",
            allowedLeftRightProfileTypeIds: [contract.id].map((id) =>
              toGlobalId("ProfileType", id),
            ),
            allowedRightLeftProfileTypeIds: [contract.id].map((id) =>
              toGlobalId("ProfileType", id),
            ),
          },
        },
        {
          direction: "LEFT_RIGHT",
          profileRelationshipType: {
            id: expect.any(String),
            alias: "p_main_contract__annex",
            allowedLeftRightProfileTypeIds: [contract.id].map((id) =>
              toGlobalId("ProfileType", id),
            ),
            allowedRightLeftProfileTypeIds: [contract.id].map((id) =>
              toGlobalId("ProfileType", id),
            ),
          },
        },
        {
          direction: "RIGHT_LEFT",
          profileRelationshipType: {
            id: expect.any(String),
            alias: "p_addendum__amended_by",
            allowedLeftRightProfileTypeIds: [contract.id].map((id) =>
              toGlobalId("ProfileType", id),
            ),
            allowedRightLeftProfileTypeIds: [contract.id].map((id) =>
              toGlobalId("ProfileType", id),
            ),
          },
        },
        {
          direction: "LEFT_RIGHT",
          profileRelationshipType: {
            id: expect.any(String),
            alias: "p_addendum__amended_by",
            allowedLeftRightProfileTypeIds: [contract.id].map((id) =>
              toGlobalId("ProfileType", id),
            ),
            allowedRightLeftProfileTypeIds: [contract.id].map((id) =>
              toGlobalId("ProfileType", id),
            ),
          },
        },
        {
          direction: "RIGHT_LEFT",
          profileRelationshipType: {
            id: expect.any(String),
            alias: "p_contract__counterparty",
            allowedLeftRightProfileTypeIds: [contract.id].map((id) =>
              toGlobalId("ProfileType", id),
            ),
            allowedRightLeftProfileTypeIds: [individual.id, legalEntity.id].map((id) =>
              toGlobalId("ProfileType", id),
            ),
          },
        },

        {
          direction: "RIGHT_LEFT",
          profileRelationshipType: {
            id: expect.any(String),
            alias: "p_contact__contacted_via",
            allowedLeftRightProfileTypeIds: [individual.id].map((id) =>
              toGlobalId("ProfileType", id),
            ),
            allowedRightLeftProfileTypeIds: [individual.id, legalEntity.id].map((id) =>
              toGlobalId("ProfileType", id),
            ),
          },
        },
        {
          direction: "LEFT_RIGHT",
          profileRelationshipType: {
            id: expect.any(String),
            alias: "p_contact__contacted_via",
            allowedLeftRightProfileTypeIds: [individual.id].map((id) =>
              toGlobalId("ProfileType", id),
            ),
            allowedRightLeftProfileTypeIds: [individual.id, legalEntity.id].map((id) =>
              toGlobalId("ProfileType", id),
            ),
          },
        },
      ]);
    });

    it("queries every possible relationship with an individual", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          query ($otherSideProfileTypeId: GID) {
            profileRelationshipTypesWithDirection(otherSideProfileTypeId: $otherSideProfileTypeId) {
              direction
              profileRelationshipType {
                id
                alias
                allowedLeftRightProfileTypeIds
                allowedRightLeftProfileTypeIds
              }
            }
          }
        `,
        {
          otherSideProfileTypeId: toGlobalId("ProfileType", individual.id),
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.profileRelationshipTypesWithDirection).toIncludeSameMembers([
        {
          direction: "RIGHT_LEFT",
          profileRelationshipType: {
            id: expect.any(String),
            alias: "p_parent__child",
            allowedLeftRightProfileTypeIds: [individual.id].map((id) =>
              toGlobalId("ProfileType", id),
            ),
            allowedRightLeftProfileTypeIds: [individual.id].map((id) =>
              toGlobalId("ProfileType", id),
            ),
          },
        },
        {
          direction: "LEFT_RIGHT",
          profileRelationshipType: {
            id: expect.any(String),
            alias: "p_parent__child",
            allowedLeftRightProfileTypeIds: [individual.id].map((id) =>
              toGlobalId("ProfileType", id),
            ),
            allowedRightLeftProfileTypeIds: [individual.id].map((id) =>
              toGlobalId("ProfileType", id),
            ),
          },
        },
        {
          direction: "RIGHT_LEFT",
          profileRelationshipType: {
            id: expect.any(String),
            alias: "p_family_member",
            allowedLeftRightProfileTypeIds: [individual.id].map((id) =>
              toGlobalId("ProfileType", id),
            ),
            allowedRightLeftProfileTypeIds: [individual.id].map((id) =>
              toGlobalId("ProfileType", id),
            ),
          },
        },
        {
          direction: "RIGHT_LEFT",
          profileRelationshipType: {
            id: expect.any(String),
            alias: "p_close_associate",
            allowedLeftRightProfileTypeIds: [individual.id].map((id) =>
              toGlobalId("ProfileType", id),
            ),
            allowedRightLeftProfileTypeIds: [individual.id].map((id) =>
              toGlobalId("ProfileType", id),
            ),
          },
        },
        {
          direction: "RIGHT_LEFT",
          profileRelationshipType: {
            id: expect.any(String),
            alias: "p_spouse",
            allowedLeftRightProfileTypeIds: [individual.id].map((id) =>
              toGlobalId("ProfileType", id),
            ),
            allowedRightLeftProfileTypeIds: [individual.id].map((id) =>
              toGlobalId("ProfileType", id),
            ),
          },
        },
        {
          direction: "RIGHT_LEFT",
          profileRelationshipType: {
            id: expect.any(String),
            alias: "p_legal_representative__legally_represented",
            allowedLeftRightProfileTypeIds: [individual.id, legalEntity.id].map((id) =>
              toGlobalId("ProfileType", id),
            ),
            allowedRightLeftProfileTypeIds: [individual.id, legalEntity.id].map((id) =>
              toGlobalId("ProfileType", id),
            ),
          },
        },
        {
          direction: "LEFT_RIGHT",
          profileRelationshipType: {
            id: expect.any(String),
            alias: "p_legal_representative__legally_represented",
            allowedLeftRightProfileTypeIds: [individual.id, legalEntity.id].map((id) =>
              toGlobalId("ProfileType", id),
            ),
            allowedRightLeftProfileTypeIds: [individual.id, legalEntity.id].map((id) =>
              toGlobalId("ProfileType", id),
            ),
          },
        },
        {
          direction: "RIGHT_LEFT",
          profileRelationshipType: {
            id: expect.any(String),
            alias: "p_legal_guardian__legally_guarded",
            allowedLeftRightProfileTypeIds: [individual.id].map((id) =>
              toGlobalId("ProfileType", id),
            ),
            allowedRightLeftProfileTypeIds: [individual.id].map((id) =>
              toGlobalId("ProfileType", id),
            ),
          },
        },
        {
          direction: "LEFT_RIGHT",
          profileRelationshipType: {
            id: expect.any(String),
            alias: "p_legal_guardian__legally_guarded",
            allowedLeftRightProfileTypeIds: [individual.id].map((id) =>
              toGlobalId("ProfileType", id),
            ),
            allowedRightLeftProfileTypeIds: [individual.id].map((id) =>
              toGlobalId("ProfileType", id),
            ),
          },
        },
        {
          direction: "RIGHT_LEFT",
          profileRelationshipType: {
            id: expect.any(String),
            alias: "p_director__managed_by",
            allowedLeftRightProfileTypeIds: [individual.id].map((id) =>
              toGlobalId("ProfileType", id),
            ),
            allowedRightLeftProfileTypeIds: [legalEntity.id].map((id) =>
              toGlobalId("ProfileType", id),
            ),
          },
        },
        {
          direction: "RIGHT_LEFT",
          profileRelationshipType: {
            id: expect.any(String),
            alias: "p_shareholder__participated_in_by",
            allowedLeftRightProfileTypeIds: [individual.id, legalEntity.id].map((id) =>
              toGlobalId("ProfileType", id),
            ),
            allowedRightLeftProfileTypeIds: [legalEntity.id].map((id) =>
              toGlobalId("ProfileType", id),
            ),
          },
        },
        {
          direction: "RIGHT_LEFT",
          profileRelationshipType: {
            id: expect.any(String),
            alias: "p_beneficial_owner__direct_or_indirect_property",
            allowedLeftRightProfileTypeIds: [individual.id].map((id) =>
              toGlobalId("ProfileType", id),
            ),
            allowedRightLeftProfileTypeIds: [legalEntity.id].map((id) =>
              toGlobalId("ProfileType", id),
            ),
          },
        },
        {
          direction: "LEFT_RIGHT",
          profileRelationshipType: {
            id: expect.any(String),
            alias: "p_contract__counterparty",
            allowedLeftRightProfileTypeIds: [contract.id].map((id) =>
              toGlobalId("ProfileType", id),
            ),
            allowedRightLeftProfileTypeIds: [individual.id, legalEntity.id].map((id) =>
              toGlobalId("ProfileType", id),
            ),
          },
        },
        {
          direction: "RIGHT_LEFT",
          profileRelationshipType: {
            id: expect.any(String),
            alias: "p_contact__contacted_via",
            allowedLeftRightProfileTypeIds: [individual.id].map((id) =>
              toGlobalId("ProfileType", id),
            ),
            allowedRightLeftProfileTypeIds: [individual.id, legalEntity.id].map((id) =>
              toGlobalId("ProfileType", id),
            ),
          },
        },
        {
          direction: "LEFT_RIGHT",
          profileRelationshipType: {
            id: expect.any(String),
            alias: "p_contact__contacted_via",
            allowedLeftRightProfileTypeIds: [individual.id].map((id) =>
              toGlobalId("ProfileType", id),
            ),
            allowedRightLeftProfileTypeIds: [individual.id, legalEntity.id].map((id) =>
              toGlobalId("ProfileType", id),
            ),
          },
        },
      ]);
    });

    it("queries every possible relationship with a legal entity", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          query ($otherSideProfileTypeId: GID) {
            profileRelationshipTypesWithDirection(otherSideProfileTypeId: $otherSideProfileTypeId) {
              profileRelationshipType {
                id
                alias
                allowedLeftRightProfileTypeIds
                allowedRightLeftProfileTypeIds
              }
              direction
            }
          }
        `,
        {
          otherSideProfileTypeId: toGlobalId("ProfileType", legalEntity.id),
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.profileRelationshipTypesWithDirection).toIncludeSameMembers([
        {
          direction: "RIGHT_LEFT",
          profileRelationshipType: {
            id: expect.any(String),
            alias: "p_legal_representative__legally_represented",
            allowedLeftRightProfileTypeIds: [individual.id, legalEntity.id].map((id) =>
              toGlobalId("ProfileType", id),
            ),
            allowedRightLeftProfileTypeIds: [individual.id, legalEntity.id].map((id) =>
              toGlobalId("ProfileType", id),
            ),
          },
        },
        {
          direction: "LEFT_RIGHT",
          profileRelationshipType: {
            id: expect.any(String),
            alias: "p_legal_representative__legally_represented",
            allowedLeftRightProfileTypeIds: [individual.id, legalEntity.id].map((id) =>
              toGlobalId("ProfileType", id),
            ),
            allowedRightLeftProfileTypeIds: [individual.id, legalEntity.id].map((id) =>
              toGlobalId("ProfileType", id),
            ),
          },
        },
        {
          direction: "LEFT_RIGHT",
          profileRelationshipType: {
            id: expect.any(String),
            alias: "p_director__managed_by",
            allowedLeftRightProfileTypeIds: [individual.id].map((id) =>
              toGlobalId("ProfileType", id),
            ),
            allowedRightLeftProfileTypeIds: [legalEntity.id].map((id) =>
              toGlobalId("ProfileType", id),
            ),
          },
        },
        {
          direction: "RIGHT_LEFT",
          profileRelationshipType: {
            id: expect.any(String),
            alias: "p_shareholder__participated_in_by",
            allowedLeftRightProfileTypeIds: [individual.id, legalEntity.id].map((id) =>
              toGlobalId("ProfileType", id),
            ),
            allowedRightLeftProfileTypeIds: [legalEntity.id].map((id) =>
              toGlobalId("ProfileType", id),
            ),
          },
        },
        {
          direction: "LEFT_RIGHT",
          profileRelationshipType: {
            id: expect.any(String),
            alias: "p_shareholder__participated_in_by",
            allowedLeftRightProfileTypeIds: [individual.id, legalEntity.id].map((id) =>
              toGlobalId("ProfileType", id),
            ),
            allowedRightLeftProfileTypeIds: [legalEntity.id].map((id) =>
              toGlobalId("ProfileType", id),
            ),
          },
        },
        {
          direction: "LEFT_RIGHT",
          profileRelationshipType: {
            id: expect.any(String),
            alias: "p_beneficial_owner__direct_or_indirect_property",
            allowedLeftRightProfileTypeIds: [individual.id].map((id) =>
              toGlobalId("ProfileType", id),
            ),
            allowedRightLeftProfileTypeIds: [legalEntity.id].map((id) =>
              toGlobalId("ProfileType", id),
            ),
          },
        },
        {
          direction: "RIGHT_LEFT",
          profileRelationshipType: {
            id: expect.any(String),
            alias: "p_parent_company__subsidiary",
            allowedLeftRightProfileTypeIds: [legalEntity.id].map((id) =>
              toGlobalId("ProfileType", id),
            ),
            allowedRightLeftProfileTypeIds: [legalEntity.id].map((id) =>
              toGlobalId("ProfileType", id),
            ),
          },
        },
        {
          direction: "LEFT_RIGHT",
          profileRelationshipType: {
            id: expect.any(String),
            alias: "p_parent_company__subsidiary",
            allowedLeftRightProfileTypeIds: [legalEntity.id].map((id) =>
              toGlobalId("ProfileType", id),
            ),
            allowedRightLeftProfileTypeIds: [legalEntity.id].map((id) =>
              toGlobalId("ProfileType", id),
            ),
          },
        },
        {
          direction: "RIGHT_LEFT",
          profileRelationshipType: {
            id: expect.any(String),
            alias: "p_main_office__branch_office",
            allowedLeftRightProfileTypeIds: [legalEntity.id].map((id) =>
              toGlobalId("ProfileType", id),
            ),
            allowedRightLeftProfileTypeIds: [legalEntity.id].map((id) =>
              toGlobalId("ProfileType", id),
            ),
          },
        },
        {
          direction: "LEFT_RIGHT",
          profileRelationshipType: {
            id: expect.any(String),
            alias: "p_main_office__branch_office",
            allowedLeftRightProfileTypeIds: [legalEntity.id].map((id) =>
              toGlobalId("ProfileType", id),
            ),
            allowedRightLeftProfileTypeIds: [legalEntity.id].map((id) =>
              toGlobalId("ProfileType", id),
            ),
          },
        },
        {
          direction: "RIGHT_LEFT",
          profileRelationshipType: {
            id: expect.any(String),
            alias: "p_associated_company",
            allowedLeftRightProfileTypeIds: [legalEntity.id].map((id) =>
              toGlobalId("ProfileType", id),
            ),
            allowedRightLeftProfileTypeIds: [legalEntity.id].map((id) =>
              toGlobalId("ProfileType", id),
            ),
          },
        },
        {
          direction: "LEFT_RIGHT",
          profileRelationshipType: {
            id: expect.any(String),
            alias: "p_contract__counterparty",
            allowedLeftRightProfileTypeIds: [contract.id].map((id) =>
              toGlobalId("ProfileType", id),
            ),
            allowedRightLeftProfileTypeIds: [individual.id, legalEntity.id].map((id) =>
              toGlobalId("ProfileType", id),
            ),
          },
        },
        {
          direction: "LEFT_RIGHT",
          profileRelationshipType: {
            id: expect.any(String),
            alias: "p_contact__contacted_via",
            allowedLeftRightProfileTypeIds: [individual.id].map((id) =>
              toGlobalId("ProfileType", id),
            ),
            allowedRightLeftProfileTypeIds: [individual.id, legalEntity.id].map((id) =>
              toGlobalId("ProfileType", id),
            ),
          },
        },
      ]);
    });

    it("queries every possible relationship with a contract", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          query ($otherSideProfileTypeId: GID) {
            profileRelationshipTypesWithDirection(otherSideProfileTypeId: $otherSideProfileTypeId) {
              profileRelationshipType {
                id
                alias
                allowedLeftRightProfileTypeIds
                allowedRightLeftProfileTypeIds
              }
              direction
            }
          }
        `,
        {
          otherSideProfileTypeId: toGlobalId("ProfileType", contract.id),
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.profileRelationshipTypesWithDirection).toIncludeSameMembers([
        {
          direction: "RIGHT_LEFT",
          profileRelationshipType: {
            id: expect.any(String),
            alias: "p_main_contract__annex",
            allowedLeftRightProfileTypeIds: [contract.id].map((id) =>
              toGlobalId("ProfileType", id),
            ),
            allowedRightLeftProfileTypeIds: [contract.id].map((id) =>
              toGlobalId("ProfileType", id),
            ),
          },
        },
        {
          direction: "LEFT_RIGHT",
          profileRelationshipType: {
            id: expect.any(String),
            alias: "p_main_contract__annex",
            allowedLeftRightProfileTypeIds: [contract.id].map((id) =>
              toGlobalId("ProfileType", id),
            ),
            allowedRightLeftProfileTypeIds: [contract.id].map((id) =>
              toGlobalId("ProfileType", id),
            ),
          },
        },
        {
          direction: "RIGHT_LEFT",
          profileRelationshipType: {
            id: expect.any(String),
            alias: "p_addendum__amended_by",
            allowedLeftRightProfileTypeIds: [contract.id].map((id) =>
              toGlobalId("ProfileType", id),
            ),
            allowedRightLeftProfileTypeIds: [contract.id].map((id) =>
              toGlobalId("ProfileType", id),
            ),
          },
        },
        {
          direction: "LEFT_RIGHT",
          profileRelationshipType: {
            id: expect.any(String),
            alias: "p_addendum__amended_by",
            allowedLeftRightProfileTypeIds: [contract.id].map((id) =>
              toGlobalId("ProfileType", id),
            ),
            allowedRightLeftProfileTypeIds: [contract.id].map((id) =>
              toGlobalId("ProfileType", id),
            ),
          },
        },
        {
          direction: "RIGHT_LEFT",
          profileRelationshipType: {
            id: expect.any(String),
            alias: "p_contract__counterparty",
            allowedLeftRightProfileTypeIds: [contract.id].map((id) =>
              toGlobalId("ProfileType", id),
            ),
            allowedRightLeftProfileTypeIds: [individual.id, legalEntity.id].map((id) =>
              toGlobalId("ProfileType", id),
            ),
          },
        },
      ]);
    });
  });

  describe("createProfileRelationship", () => {
    let relationshipTypes: ProfileRelationshipType[];

    beforeAll(async () => {
      relationshipTypes = await mocks.knex
        .from("profile_relationship_type")
        .where({ org_id: organization.id, deleted_at: null })
        .select("*");
    });

    it("associates two individuals with parent__child relationship", async () => {
      const [individualA, individualB] = await mocks.createRandomProfiles(
        organization.id,
        individual.id,
        2,
      );

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($profileId: GID!, $relationships: [CreateProfileRelationshipInput!]!) {
            createProfileRelationship(profileId: $profileId, relationships: $relationships) {
              id
              relationships {
                leftSideProfile {
                  id
                }
                rightSideProfile {
                  id
                  relationships {
                    leftSideProfile {
                      id
                    }
                    rightSideProfile {
                      id
                    }
                    relationshipType {
                      alias
                    }
                  }
                }
                relationshipType {
                  alias
                }
              }
            }
          }
        `,
        {
          profileId: toGlobalId("Profile", individualA.id),
          relationships: [
            {
              profileId: toGlobalId("Profile", individualB.id),
              profileRelationshipTypeId: toGlobalId(
                "ProfileRelationshipType",
                relationshipTypes.find((type) => type.alias === "p_parent__child")!.id,
              ),
              direction: "LEFT_RIGHT",
            },
          ],
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.createProfileRelationship).toEqual({
        id: toGlobalId("Profile", individualA.id),
        relationships: [
          {
            leftSideProfile: {
              id: toGlobalId("Profile", individualA.id),
            },
            rightSideProfile: {
              id: toGlobalId("Profile", individualB.id),
              relationships: [
                {
                  leftSideProfile: {
                    id: toGlobalId("Profile", individualA.id),
                  },
                  rightSideProfile: {
                    id: toGlobalId("Profile", individualB.id),
                  },
                  relationshipType: {
                    alias: "p_parent__child",
                  },
                },
              ],
            },
            relationshipType: {
              alias: "p_parent__child",
            },
          },
        ],
      });
    });

    it("fails when passing a legal entity on a parent__child relationship", async () => {
      const [individualProfile, legalEntityProfile] = await mocks.createRandomProfiles(
        organization.id,
        1,
        2,
        (i) => ({
          profile_type_id: [individual.id, legalEntity.id][i],
        }),
      );

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($profileId: GID!, $relationships: [CreateProfileRelationshipInput!]!) {
            createProfileRelationship(profileId: $profileId, relationships: $relationships) {
              id
            }
          }
        `,
        {
          profileId: toGlobalId("Profile", individualProfile.id),
          relationships: [
            {
              profileId: toGlobalId("Profile", legalEntityProfile.id),
              profileRelationshipTypeId: toGlobalId(
                "ProfileRelationshipType",
                relationshipTypes.find((type) => type.alias === "p_parent__child")!.id,
              ),
              direction: "LEFT_RIGHT",
            },
          ],
        },
      );

      expect(errors).toContainGraphQLError("INVALID_PROFILE_RELATIONSHIP_TYPE_ERROR");
      expect(data).toBeNull();
    });

    it("associates individual/legal entity with a legal_representative__legally_represented relationship", async () => {
      const [individualProfile, legalEntityProfile] = await mocks.createRandomProfiles(
        organization.id,
        1,
        2,
        (i) => ({
          profile_type_id: [individual.id, legalEntity.id][i],
        }),
      );

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($profileId: GID!, $relationships: [CreateProfileRelationshipInput!]!) {
            createProfileRelationship(profileId: $profileId, relationships: $relationships) {
              id
              relationships {
                leftSideProfile {
                  id
                }
                rightSideProfile {
                  id
                  relationships {
                    leftSideProfile {
                      id
                    }
                    rightSideProfile {
                      id
                    }
                    relationshipType {
                      alias
                    }
                  }
                }
                relationshipType {
                  alias
                }
              }
            }
          }
        `,
        {
          profileId: toGlobalId("Profile", individualProfile.id),
          relationships: [
            {
              profileId: toGlobalId("Profile", legalEntityProfile.id),
              profileRelationshipTypeId: toGlobalId(
                "ProfileRelationshipType",
                relationshipTypes.find(
                  (type) => type.alias === "p_legal_representative__legally_represented",
                )!.id,
              ),
              direction: "LEFT_RIGHT",
            },
          ],
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.createProfileRelationship).toEqual({
        id: toGlobalId("Profile", individualProfile.id),
        relationships: [
          {
            leftSideProfile: {
              id: toGlobalId("Profile", individualProfile.id),
            },
            rightSideProfile: {
              id: toGlobalId("Profile", legalEntityProfile.id),
              relationships: [
                {
                  leftSideProfile: {
                    id: toGlobalId("Profile", individualProfile.id),
                  },
                  rightSideProfile: {
                    id: toGlobalId("Profile", legalEntityProfile.id),
                  },
                  relationshipType: {
                    alias: "p_legal_representative__legally_represented",
                  },
                },
              ],
            },
            relationshipType: {
              alias: "p_legal_representative__legally_represented",
            },
          },
        ],
      });
    });

    it("associates two individuals with a legal_representative__legally_represented relationship", async () => {
      const [individualA, individualB] = await mocks.createRandomProfiles(
        organization.id,
        individual.id,
        2,
      );

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($profileId: GID!, $relationships: [CreateProfileRelationshipInput!]!) {
            createProfileRelationship(profileId: $profileId, relationships: $relationships) {
              id
              relationships {
                leftSideProfile {
                  id
                }
                rightSideProfile {
                  id
                }
                relationshipType {
                  alias
                }
              }
            }
          }
        `,
        {
          profileId: toGlobalId("Profile", individualB.id),
          relationships: [
            {
              profileId: toGlobalId("Profile", individualA.id),
              profileRelationshipTypeId: toGlobalId(
                "ProfileRelationshipType",
                relationshipTypes.find(
                  (type) => type.alias === "p_legal_representative__legally_represented",
                )!.id,
              ),
              direction: "LEFT_RIGHT",
            },
          ],
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.createProfileRelationship).toEqual({
        id: toGlobalId("Profile", individualB.id),
        relationships: [
          {
            leftSideProfile: {
              id: toGlobalId("Profile", individualB.id),
            },
            rightSideProfile: {
              id: toGlobalId("Profile", individualA.id),
            },
            relationshipType: {
              alias: "p_legal_representative__legally_represented",
            },
          },
        ],
      });
    });

    it("fails when passing contract as left side of a legal_representative__legally_represented relationship", async () => {
      const [individualProfile, contractProfile] = await mocks.createRandomProfiles(
        organization.id,
        1,
        2,
        (i) => ({
          profile_type_id: [individual.id, contract.id][i],
        }),
      );

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($profileId: GID!, $relationships: [CreateProfileRelationshipInput!]!) {
            createProfileRelationship(profileId: $profileId, relationships: $relationships) {
              id
            }
          }
        `,
        {
          profileId: toGlobalId("Profile", contractProfile.id),
          relationships: [
            {
              profileId: toGlobalId("Profile", individualProfile.id),
              profileRelationshipTypeId: toGlobalId(
                "ProfileRelationshipType",
                relationshipTypes.find(
                  (type) => type.alias === "p_legal_representative__legally_represented",
                )!.id,
              ),
              direction: "LEFT_RIGHT",
            },
          ],
        },
      );

      expect(errors).toContainGraphQLError("INVALID_PROFILE_RELATIONSHIP_TYPE_ERROR");
      expect(data).toBeNull();
    });

    it("associates two legal entities with a parent_company__subsidiary relationship", async () => {
      const [legalEntityA, legalEntityB] = await mocks.createRandomProfiles(
        organization.id,
        legalEntity.id,
        2,
      );

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($profileId: GID!, $relationships: [CreateProfileRelationshipInput!]!) {
            createProfileRelationship(profileId: $profileId, relationships: $relationships) {
              id
              relationships {
                leftSideProfile {
                  id
                }
                rightSideProfile {
                  id
                }
                relationshipType {
                  alias
                }
              }
            }
          }
        `,
        {
          profileId: toGlobalId("Profile", legalEntityA.id),
          relationships: [
            {
              profileId: toGlobalId("Profile", legalEntityB.id),
              profileRelationshipTypeId: toGlobalId(
                "ProfileRelationshipType",
                relationshipTypes.find((type) => type.alias === "p_parent_company__subsidiary")!.id,
              ),
              direction: "LEFT_RIGHT",
            },
          ],
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.createProfileRelationship).toEqual({
        id: toGlobalId("Profile", legalEntityA.id),
        relationships: [
          {
            leftSideProfile: {
              id: toGlobalId("Profile", legalEntityA.id),
            },
            rightSideProfile: {
              id: toGlobalId("Profile", legalEntityB.id),
            },
            relationshipType: {
              alias: "p_parent_company__subsidiary",
            },
          },
        ],
      });
    });

    it("associates two contracts with a main_contract__annex relationship", async () => {
      const [contractA, contractB] = await mocks.createRandomProfiles(
        organization.id,
        contract.id,
        2,
      );

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($profileId: GID!, $relationships: [CreateProfileRelationshipInput!]!) {
            createProfileRelationship(profileId: $profileId, relationships: $relationships) {
              id
              relationships {
                leftSideProfile {
                  id
                }
                rightSideProfile {
                  id
                }
                relationshipType {
                  alias
                }
              }
            }
          }
        `,
        {
          profileId: toGlobalId("Profile", contractA.id),
          relationships: [
            {
              profileId: toGlobalId("Profile", contractB.id),
              profileRelationshipTypeId: toGlobalId(
                "ProfileRelationshipType",
                relationshipTypes.find((type) => type.alias === "p_main_contract__annex")!.id,
              ),
              direction: "LEFT_RIGHT",
            },
          ],
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.createProfileRelationship).toEqual({
        id: toGlobalId("Profile", contractA.id),
        relationships: [
          {
            leftSideProfile: {
              id: toGlobalId("Profile", contractA.id),
            },
            rightSideProfile: {
              id: toGlobalId("Profile", contractB.id),
            },
            relationshipType: {
              alias: "p_main_contract__annex",
            },
          },
        ],
      });
    });

    it("fails when passing two contracts on a contract__counterparty relationship", async () => {
      const [contractA, contractB] = await mocks.createRandomProfiles(
        organization.id,
        contract.id,
        2,
      );

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($profileId: GID!, $relationships: [CreateProfileRelationshipInput!]!) {
            createProfileRelationship(profileId: $profileId, relationships: $relationships) {
              id
            }
          }
        `,
        {
          profileId: toGlobalId("Profile", contractA.id),
          relationships: [
            {
              profileId: toGlobalId("Profile", contractB.id),
              profileRelationshipTypeId: toGlobalId(
                "ProfileRelationshipType",
                relationshipTypes.find((type) => type.alias === "p_contract__counterparty")!.id,
              ),
              direction: "LEFT_RIGHT",
            },
          ],
        },
      );

      expect(errors).toContainGraphQLError("INVALID_PROFILE_RELATIONSHIP_TYPE_ERROR");
      expect(data).toBeNull();
    });

    it("associates a contract with an individual on a contract__counterparty relationship", async () => {
      const [contractProfile, individualProfile] = await mocks.createRandomProfiles(
        organization.id,
        0,
        2,
        (i) => ({
          profile_type_id: [contract.id, individual.id][i],
        }),
      );

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($profileId: GID!, $relationships: [CreateProfileRelationshipInput!]!) {
            createProfileRelationship(profileId: $profileId, relationships: $relationships) {
              id
              relationships {
                leftSideProfile {
                  id
                }
                rightSideProfile {
                  id
                }
                relationshipType {
                  alias
                }
              }
            }
          }
        `,
        {
          profileId: toGlobalId("Profile", contractProfile.id),
          relationships: [
            {
              profileId: toGlobalId("Profile", individualProfile.id),
              profileRelationshipTypeId: toGlobalId(
                "ProfileRelationshipType",
                relationshipTypes.find((type) => type.alias === "p_contract__counterparty")!.id,
              ),
              direction: "LEFT_RIGHT",
            },
          ],
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.createProfileRelationship).toEqual({
        id: toGlobalId("Profile", contractProfile.id),
        relationships: [
          {
            leftSideProfile: {
              id: toGlobalId("Profile", contractProfile.id),
            },
            rightSideProfile: {
              id: toGlobalId("Profile", individualProfile.id),
            },
            relationshipType: {
              alias: "p_contract__counterparty",
            },
          },
        ],
      });
    });

    it("associates two non-standard profile types with a custom relationship", async () => {
      const [profileTypeA, profileTypeB] = await mocks.createRandomProfileTypes(organization.id, 2);
      const [customRelationshipType] = await mocks.knex
        .from("profile_relationship_type")
        .insert([
          {
            org_id: organization.id,
            alias: "custom_relationship",
            left_right_name: { en: "SideA->SideB", es: "LadoA->LadoB" },
            right_left_name: { en: "SideB->SideA", es: "LadoB->LadoA" },
            is_reciprocal: false,
          },
        ])
        .returning("*");

      await mocks.knex.from("profile_relationship_type_allowed_profile_type").insert([
        {
          org_id: organization.id,
          profile_relationship_type_id: customRelationshipType.id,
          direction: "LEFT_RIGHT",
          allowed_profile_type_id: profileTypeA.id,
        },
        {
          org_id: organization.id,
          profile_relationship_type_id: customRelationshipType.id,
          direction: "RIGHT_LEFT",
          allowed_profile_type_id: profileTypeB.id,
        },
      ]);

      const [profileA, profileB] = await mocks.createRandomProfiles(organization.id, 0, 2, (i) => ({
        profile_type_id: [profileTypeA.id, profileTypeB.id][i],
      }));

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($profileId: GID!, $relationships: [CreateProfileRelationshipInput!]!) {
            createProfileRelationship(profileId: $profileId, relationships: $relationships) {
              id
              relationships {
                leftSideProfile {
                  id
                }
                rightSideProfile {
                  id
                }
                relationshipType {
                  alias
                }
              }
            }
          }
        `,
        {
          profileId: toGlobalId("Profile", profileA.id),
          relationships: [
            {
              profileId: toGlobalId("Profile", profileB.id),
              profileRelationshipTypeId: toGlobalId(
                "ProfileRelationshipType",
                customRelationshipType.id,
              ),
              direction: "LEFT_RIGHT",
            },
          ],
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.createProfileRelationship).toEqual({
        id: toGlobalId("Profile", profileA.id),
        relationships: [
          {
            leftSideProfile: {
              id: toGlobalId("Profile", profileA.id),
            },
            rightSideProfile: {
              id: toGlobalId("Profile", profileB.id),
            },
            relationshipType: {
              alias: "custom_relationship",
            },
          },
        ],
      });
    });

    it("fails if one of the profiles is anonymized", async () => {
      const [profileA, profileB] = await mocks.createRandomProfiles(
        organization.id,
        individual.id,
        2,
        (i) => ({
          anonymized_at: i === 0 ? new Date() : null,
        }),
      );

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($profileId: GID!, $relationships: [CreateProfileRelationshipInput!]!) {
            createProfileRelationship(profileId: $profileId, relationships: $relationships) {
              id
            }
          }
        `,
        {
          profileId: toGlobalId("Profile", profileA.id),
          relationships: [
            {
              profileId: toGlobalId("Profile", profileB.id),
              profileRelationshipTypeId: toGlobalId(
                "ProfileRelationshipType",
                relationshipTypes.find((type) => type.alias === "p_parent__child")!.id,
              ),
              direction: "LEFT_RIGHT",
            },
          ],
        },
      );

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("fails if one of the profiles is scheduled for deletion", async () => {
      const [profileA, profileB] = await mocks.createRandomProfiles(
        organization.id,
        individual.id,
        2,
        (i) => ({
          status: i === 0 ? "DELETION_SCHEDULED" : "OPEN",
          deletion_scheduled_at: i === 0 ? new Date() : null,
        }),
      );

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($profileId: GID!, $relationships: [CreateProfileRelationshipInput!]!) {
            createProfileRelationship(profileId: $profileId, relationships: $relationships) {
              id
            }
          }
        `,
        {
          profileId: toGlobalId("Profile", profileA.id),
          relationships: [
            {
              profileId: toGlobalId("Profile", profileB.id),
              profileRelationshipTypeId: toGlobalId(
                "ProfileRelationshipType",
                relationshipTypes.find((type) => type.alias === "p_parent__child")!.id,
              ),
              direction: "LEFT_RIGHT",
            },
          ],
        },
      );

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("fails if user doesn't have permission to associate profiles", async () => {
      const [otherOrg] = await mocks.createRandomOrganizations(1);
      const [profileType] = await mocks.createRandomProfileTypes(otherOrg.id, 1, () => ({
        standard_type: "INDIVIDUAL",
      }));
      const [privateProfile] = await mocks.createRandomProfiles(otherOrg.id, profileType.id, 1);
      const [profile] = await mocks.createRandomProfiles(organization.id, individual.id, 1);
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($profileId: GID!, $relationships: [CreateProfileRelationshipInput!]!) {
            createProfileRelationship(profileId: $profileId, relationships: $relationships) {
              id
            }
          }
        `,
        {
          profileId: toGlobalId("Profile", privateProfile.id),
          relationships: [
            {
              profileId: toGlobalId("Profile", profile.id),
              profileRelationshipTypeId: toGlobalId(
                "ProfileRelationshipType",
                relationshipTypes.find(
                  (type) => type.alias === "p_legal_representative__legally_represented",
                )!.id,
              ),
              direction: "LEFT_RIGHT",
            },
          ],
        },
      );

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("fails when trying to associate same profile", async () => {
      const [profile] = await mocks.createRandomProfiles(organization.id, individual.id, 1);
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($profileId: GID!, $relationships: [CreateProfileRelationshipInput!]!) {
            createProfileRelationship(profileId: $profileId, relationships: $relationships) {
              id
            }
          }
        `,
        {
          profileId: toGlobalId("Profile", profile.id),
          relationships: [
            {
              profileId: toGlobalId("Profile", profile.id),
              profileRelationshipTypeId: toGlobalId(
                "ProfileRelationshipType",
                relationshipTypes.find(
                  (type) => type.alias === "p_legal_representative__legally_represented",
                )!.id,
              ),
              direction: "LEFT_RIGHT",
            },
          ],
        },
      );

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("fails when trying same association twice", async () => {
      const [individualA, individualB] = await mocks.createRandomProfiles(
        organization.id,
        individual.id,
        2,
      );

      const relationshipType = relationshipTypes.find((type) => type.alias === "p_parent__child")!;

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($profileId: GID!, $relationships: [CreateProfileRelationshipInput!]!) {
            createProfileRelationship(profileId: $profileId, relationships: $relationships) {
              id
            }
          }
        `,
        {
          profileId: toGlobalId("Profile", individualA.id),
          relationships: [
            {
              profileId: toGlobalId("Profile", individualB.id),
              profileRelationshipTypeId: toGlobalId("ProfileRelationshipType", relationshipType.id),
              direction: "LEFT_RIGHT",
            },
          ],
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.createProfileRelationship).toEqual({
        id: expect.any(String),
      });

      const { errors: errors2, data: data2 } = await testClient.execute(
        gql`
          mutation ($profileId: GID!, $relationships: [CreateProfileRelationshipInput!]!) {
            createProfileRelationship(profileId: $profileId, relationships: $relationships) {
              id
            }
          }
        `,
        {
          profileId: toGlobalId("Profile", individualA.id),
          relationships: [
            {
              profileId: toGlobalId("Profile", individualB.id),
              profileRelationshipTypeId: toGlobalId("ProfileRelationshipType", relationshipType.id),
              direction: "LEFT_RIGHT",
            },
          ],
        },
      );

      expect(errors2).toContainGraphQLError("PROFILES_ALREADY_ASSOCIATED_ERROR");
      expect(data2).toBeNull();
    });

    it("creates multiple relationships on a profile at once", async () => {
      const [individualAProfile, individualBProfile, legalEntityProfile, contractProfile] =
        await mocks.createRandomProfiles(organization.id, 0, 4, (i) => ({
          profile_type_id: [individual.id, individual.id, legalEntity.id, contract.id][i],
        }));

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($profileId: GID!, $relationships: [CreateProfileRelationshipInput!]!) {
            createProfileRelationship(profileId: $profileId, relationships: $relationships) {
              id
              relationships {
                leftSideProfile {
                  id
                }
                rightSideProfile {
                  id
                }
                relationshipType {
                  alias
                }
              }
            }
          }
        `,
        {
          profileId: toGlobalId("Profile", individualAProfile.id),
          relationships: [
            {
              profileId: toGlobalId("Profile", individualBProfile.id),
              profileRelationshipTypeId: toGlobalId(
                "ProfileRelationshipType",
                relationshipTypes.find((type) => type.alias === "p_parent__child")!.id,
              ),
              direction: "LEFT_RIGHT",
            },
            {
              profileId: toGlobalId("Profile", legalEntityProfile.id),
              profileRelationshipTypeId: toGlobalId(
                "ProfileRelationshipType",
                relationshipTypes.find(
                  (type) => type.alias === "p_legal_representative__legally_represented",
                )!.id,
              ),
              direction: "LEFT_RIGHT",
            },
            {
              profileId: toGlobalId("Profile", contractProfile.id),
              profileRelationshipTypeId: toGlobalId(
                "ProfileRelationshipType",
                relationshipTypes.find((type) => type.alias === "p_contract__counterparty")!.id,
              ),
              direction: "RIGHT_LEFT",
            },
          ],
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.createProfileRelationship).toEqual({
        id: toGlobalId("Profile", individualAProfile.id),
        relationships: [
          {
            leftSideProfile: {
              id: toGlobalId("Profile", individualAProfile.id),
            },
            rightSideProfile: {
              id: toGlobalId("Profile", individualBProfile.id),
            },
            relationshipType: {
              alias: "p_parent__child",
            },
          },
          {
            leftSideProfile: {
              id: toGlobalId("Profile", individualAProfile.id),
            },
            rightSideProfile: {
              id: toGlobalId("Profile", legalEntityProfile.id),
            },
            relationshipType: {
              alias: "p_legal_representative__legally_represented",
            },
          },
          {
            leftSideProfile: {
              id: toGlobalId("Profile", contractProfile.id),
            },
            rightSideProfile: {
              id: toGlobalId("Profile", individualAProfile.id),
            },
            relationshipType: {
              alias: "p_contract__counterparty",
            },
          },
        ],
      });
    });

    it("fails if trying to create the same relationship twice", async () => {
      const [individualAProfile, individualBProfile] = await mocks.createRandomProfiles(
        organization.id,
        0,
        2,
        (i) => ({
          profile_type_id: [individual.id, individual.id][i],
        }),
      );

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($profileId: GID!, $relationships: [CreateProfileRelationshipInput!]!) {
            createProfileRelationship(profileId: $profileId, relationships: $relationships) {
              id
            }
          }
        `,
        {
          profileId: toGlobalId("Profile", individualAProfile.id),
          relationships: [
            {
              profileId: toGlobalId("Profile", individualBProfile.id),
              profileRelationshipTypeId: toGlobalId(
                "ProfileRelationshipType",
                relationshipTypes.find((type) => type.alias === "p_parent__child")!.id,
              ),
              direction: "LEFT_RIGHT",
            },
            {
              profileId: toGlobalId("Profile", individualBProfile.id),
              profileRelationshipTypeId: toGlobalId(
                "ProfileRelationshipType",
                relationshipTypes.find((type) => type.alias === "p_parent__child")!.id,
              ),
              direction: "LEFT_RIGHT",
            },
          ],
        },
      );

      expect(errors).toContainGraphQLError("PROFILES_ALREADY_ASSOCIATED_ERROR");
      expect(data).toBeNull();
    });

    it("creates events on both profiles", async () => {
      const [individualA, individualB] = await mocks.createRandomProfiles(
        organization.id,
        individual.id,
        2,
      );

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($profileId: GID!, $relationships: [CreateProfileRelationshipInput!]!) {
            createProfileRelationship(profileId: $profileId, relationships: $relationships) {
              id
              relationships {
                leftSideProfile {
                  id
                  events(limit: 10, offset: 0) {
                    items {
                      type
                      data
                      profile {
                        id
                      }
                    }
                    totalCount
                  }
                }
                rightSideProfile {
                  id
                  events(limit: 10, offset: 0) {
                    items {
                      type
                      data
                      profile {
                        id
                      }
                    }
                    totalCount
                  }
                }
              }
            }
          }
        `,
        {
          profileId: toGlobalId("Profile", individualA.id),
          relationships: [
            {
              profileId: toGlobalId("Profile", individualB.id),
              profileRelationshipTypeId: toGlobalId(
                "ProfileRelationshipType",
                relationshipTypes.find((type) => type.alias === "p_parent__child")!.id,
              ),
              direction: "LEFT_RIGHT",
            },
          ],
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.createProfileRelationship).toEqual({
        id: toGlobalId("Profile", individualA.id),
        relationships: [
          {
            leftSideProfile: {
              id: toGlobalId("Profile", individualA.id),
              events: {
                totalCount: 1,
                items: [
                  {
                    profile: {
                      id: toGlobalId("Profile", individualA.id),
                    },
                    type: "PROFILE_RELATIONSHIP_CREATED",
                    data: {
                      userId: toGlobalId("User", user.id),
                      profileRelationshipId: expect.any(String),
                      relationshipAlias: "p_parent__child",
                    },
                  },
                ],
              },
            },
            rightSideProfile: {
              id: toGlobalId("Profile", individualB.id),
              events: {
                totalCount: 1,
                items: [
                  {
                    profile: {
                      id: toGlobalId("Profile", individualB.id),
                    },
                    type: "PROFILE_RELATIONSHIP_CREATED",
                    data: {
                      userId: toGlobalId("User", user.id),
                      profileRelationshipId: expect.any(String),
                      relationshipAlias: "p_parent__child",
                    },
                  },
                ],
              },
            },
          },
        ],
      });
    });

    it("creates only once when trying to create a reciprocal relationship twice with different directions", async () => {
      const [individualAProfile, individualBProfile] = await mocks.createRandomProfiles(
        organization.id,
        0,
        2,
        () => ({
          profile_type_id: individual.id,
        }),
      );

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($profileId: GID!, $relationships: [CreateProfileRelationshipInput!]!) {
            createProfileRelationship(profileId: $profileId, relationships: $relationships) {
              id
              relationships {
                relationshipType {
                  alias
                }
                rightSideProfile {
                  id
                }
              }
            }
          }
        `,
        {
          profileId: toGlobalId("Profile", individualAProfile.id),
          relationships: [
            {
              profileId: toGlobalId("Profile", individualBProfile.id),
              profileRelationshipTypeId: toGlobalId(
                "ProfileRelationshipType",
                relationshipTypes.find((type) => type.alias === "p_close_associate")!.id,
              ),
              direction: "LEFT_RIGHT",
            },
            {
              profileId: toGlobalId("Profile", individualBProfile.id),
              profileRelationshipTypeId: toGlobalId(
                "ProfileRelationshipType",
                relationshipTypes.find((type) => type.alias === "p_close_associate")!.id,
              ),
              direction: "RIGHT_LEFT",
            },
          ],
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.createProfileRelationship).toEqual({
        id: toGlobalId("Profile", individualAProfile.id),
        relationships: [
          {
            relationshipType: {
              alias: "p_close_associate",
            },
            rightSideProfile: {
              id: toGlobalId("Profile", individualBProfile.id),
            },
          },
        ],
      });
    });
  });

  describe("removeProfileRelationship", () => {
    let individualAProfile: Profile;
    let individualBProfile: Profile;
    let legalEntityProfile: Profile;

    let relationshipTypes: ProfileRelationshipType[];

    let legalRepresentativeRelationship: ProfileRelationship;
    let parentRelationship: ProfileRelationship;

    beforeAll(async () => {
      relationshipTypes = await mocks.knex
        .from("profile_relationship_type")
        .where({ org_id: organization.id, deleted_at: null })
        .select("*");
    });

    beforeEach(async () => {
      [individualAProfile, individualBProfile, legalEntityProfile] =
        await mocks.createRandomProfiles(organization.id, 0, 3, (i) => ({
          profile_type_id: [individual.id, individual.id, legalEntity.id][i],
        }));

      [legalRepresentativeRelationship, parentRelationship] = await mocks.knex
        .from("profile_relationship")
        .insert([
          {
            created_by_user_id: user.id,
            left_side_profile_id: individualAProfile.id,
            right_side_profile_id: legalEntityProfile.id,
            profile_relationship_type_id: relationshipTypes.find(
              (r) => r.alias === "p_legal_representative__legally_represented",
            )!.id,
            org_id: organization.id,
          },
          {
            created_by_user_id: user.id,
            left_side_profile_id: individualAProfile.id,
            right_side_profile_id: individualBProfile.id,
            profile_relationship_type_id: relationshipTypes.find(
              (r) => r.alias === "p_parent__child",
            )!.id,
            org_id: organization.id,
          },
        ])
        .returning("*");
    });

    it("disassociates two related profiles", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($profileId: GID!, $profileRelationshipIds: [GID!]!) {
            removeProfileRelationship(
              profileId: $profileId
              profileRelationshipIds: $profileRelationshipIds
            )
          }
        `,
        {
          profileId: toGlobalId("Profile", individualAProfile.id),
          profileRelationshipIds: [
            toGlobalId("ProfileRelationship", legalRepresentativeRelationship.id),
          ],
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.removeProfileRelationship).toEqual("SUCCESS");

      const { errors: queryErrors, data: queryData } = await testClient.execute(
        gql`
          query ($profileId: GID!) {
            profile(profileId: $profileId) {
              id
              relationships {
                id
                relationshipType {
                  alias
                }
              }
            }
          }
        `,
        {
          profileId: toGlobalId("Profile", individualAProfile.id),
        },
      );

      expect(queryErrors).toBeUndefined();
      expect(queryData?.profile).toEqual({
        id: toGlobalId("Profile", individualAProfile.id),
        relationships: [
          {
            id: toGlobalId("ProfileRelationship", parentRelationship.id),
            relationshipType: {
              alias: "p_parent__child",
            },
          },
        ],
      });
    });

    it("fails if trying to disassociate a private relationship", async () => {
      const [otherOrg] = await mocks.createRandomOrganizations(1);
      const [profileType] = await mocks.createRandomProfileTypes(otherOrg.id, 1, () => ({
        standard_type: "INDIVIDUAL",
      }));
      const [privateProfileA, privateProfileB] = await mocks.createRandomProfiles(
        otherOrg.id,
        profileType.id,
        2,
      );

      const [relationship] = await mocks.knex
        .from("profile_relationship")
        .insert({
          created_by_user_id: user.id,
          left_side_profile_id: privateProfileA.id,
          right_side_profile_id: privateProfileB.id,
          org_id: otherOrg.id,
          profile_relationship_type_id: relationshipTypes.find((r) => r.alias === "p_spouse")!.id,
        })
        .returning("*");

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($profileId: GID!, $profileRelationshipIds: [GID!]!) {
            removeProfileRelationship(
              profileId: $profileId
              profileRelationshipIds: $profileRelationshipIds
            )
          }
        `,
        {
          profileId: toGlobalId("Profile", privateProfileB.id),
          profileRelationshipIds: [toGlobalId("ProfileRelationship", relationship.id)],
        },
      );

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("creates events on both profiles", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($profileId: GID!, $profileRelationshipIds: [GID!]!) {
            removeProfileRelationship(
              profileId: $profileId
              profileRelationshipIds: $profileRelationshipIds
            )
          }
        `,
        {
          profileId: toGlobalId("Profile", legalEntityProfile.id),
          profileRelationshipIds: [
            toGlobalId("ProfileRelationship", legalRepresentativeRelationship.id),
          ],
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.removeProfileRelationship).toEqual("SUCCESS");

      const { errors: query1Errors, data: query1Data } = await testClient.execute(
        gql`
          query ($profileId: GID!) {
            profile(profileId: $profileId) {
              id
              events(limit: 10, offset: 0) {
                totalCount
                items {
                  type
                  data
                  profile {
                    id
                  }
                }
              }
            }
          }
        `,
        {
          profileId: toGlobalId("Profile", individualAProfile.id),
        },
      );

      expect(query1Errors).toBeUndefined();
      expect(query1Data?.profile).toEqual({
        id: toGlobalId("Profile", individualAProfile.id),
        events: {
          totalCount: 1,
          items: [
            {
              profile: {
                id: toGlobalId("Profile", individualAProfile.id),
              },
              type: "PROFILE_RELATIONSHIP_REMOVED",
              data: {
                userId: toGlobalId("User", user.id),
                profileRelationshipId: toGlobalId(
                  "ProfileRelationship",
                  legalRepresentativeRelationship.id,
                ),
                relationshipAlias: "p_legal_representative__legally_represented",
                reason: "REMOVED_BY_USER",
              },
            },
          ],
        },
      });

      const { errors: query2Errors, data: query2Data } = await testClient.execute(
        gql`
          query ($profileId: GID!) {
            profile(profileId: $profileId) {
              id
              events(limit: 10, offset: 0) {
                totalCount
                items {
                  type
                  data
                  profile {
                    id
                  }
                }
              }
            }
          }
        `,
        {
          profileId: toGlobalId("Profile", legalEntityProfile.id),
        },
      );

      expect(query2Errors).toBeUndefined();
      expect(query2Data?.profile).toEqual({
        id: toGlobalId("Profile", legalEntityProfile.id),
        events: {
          totalCount: 1,
          items: [
            {
              profile: {
                id: toGlobalId("Profile", legalEntityProfile.id),
              },
              type: "PROFILE_RELATIONSHIP_REMOVED",
              data: {
                userId: toGlobalId("User", user.id),
                profileRelationshipId: toGlobalId(
                  "ProfileRelationship",
                  legalRepresentativeRelationship.id,
                ),
                relationshipAlias: "p_legal_representative__legally_represented",
                reason: "REMOVED_BY_USER",
              },
            },
          ],
        },
      });
    });
  });

  describe("deleteProfile", () => {
    let closedIndividualProfile: Profile;
    let openIndividualProfile: Profile;

    let relationshipTypes: ProfileRelationshipType[];

    let parentRelationship: ProfileRelationship;

    beforeAll(async () => {
      relationshipTypes = await mocks.knex
        .from("profile_relationship_type")
        .where({ org_id: organization.id, deleted_at: null })
        .select("*");
    });

    beforeEach(async () => {
      [closedIndividualProfile, openIndividualProfile] = await mocks.createRandomProfiles(
        organization.id,
        individual.id,
        2,
        (i) => ({
          status: i === 0 ? "CLOSED" : "OPEN",
          closed_at: i === 0 ? new Date() : null,
        }),
      );

      [parentRelationship] = await mocks.knex
        .from("profile_relationship")
        .insert([
          {
            created_by_user_id: user.id,
            left_side_profile_id: closedIndividualProfile.id,
            right_side_profile_id: openIndividualProfile.id,
            profile_relationship_type_id: relationshipTypes.find(
              (r) => r.alias === "p_parent__child",
            )!.id,
            org_id: organization.id,
          },
        ])
        .returning("*");
    });

    it("removes profile relationships when deleting a closed profile", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($profileId: GID!) {
            deleteProfile(profileIds: [$profileId])
          }
        `,
        {
          profileId: toGlobalId("Profile", closedIndividualProfile.id),
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.deleteProfile).toEqual("SUCCESS");

      const { errors: queryErrors, data: queryData } = await testClient.execute(
        gql`
          query ($profileId: GID!) {
            profile(profileId: $profileId) {
              id
              status
              relationships {
                id
              }
              events(limit: 10, offset: 0) {
                totalCount
                items {
                  type
                  data
                  ... on ProfileRelationshipRemovedEvent {
                    user {
                      id
                    }
                    reason
                  }
                }
              }
            }
          }
        `,
        {
          profileId: toGlobalId("Profile", openIndividualProfile.id),
        },
      );

      expect(queryErrors).toBeUndefined();
      expect(queryData?.profile).toEqual({
        id: toGlobalId("Profile", openIndividualProfile.id),
        status: "OPEN",
        relationships: [],
        events: {
          totalCount: 1,
          items: [
            {
              type: "PROFILE_RELATIONSHIP_REMOVED",
              data: {
                userId: toGlobalId("User", user.id),
                profileRelationshipId: toGlobalId("ProfileRelationship", parentRelationship.id),
                relationshipAlias: "p_parent__child",
                reason: "PROFILE_DELETED",
              },
              user: {
                id: toGlobalId("User", user.id),
              },
              reason: "PROFILE_DELETED",
            },
          ],
        },
      });
    });
  });
});
