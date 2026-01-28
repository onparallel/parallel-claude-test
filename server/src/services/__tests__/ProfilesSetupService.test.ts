import { Container } from "inversify";
import { Knex } from "knex";
import { indexBy, pick } from "remeda";
import { createTestContainer } from "../../../test/testContainer";
import { Organization, User } from "../../db/__types";
import { KNEX } from "../../db/knex";
import { Mocks } from "../../db/repositories/__tests__/mocks";
import { deleteAllData } from "../../util/knexUtils";
import { IProfilesSetupService, PROFILES_SETUP_SERVICE } from "../ProfilesSetupService";

describe("ProfilesSetupService", () => {
  let container: Container;
  let knex: Knex;
  let mocks: Mocks;

  let organization: Organization;
  let user: User;

  let profilesSetup: IProfilesSetupService;

  async function loadProfileTypes() {
    return await knex
      .from("profile_type")
      .where({ org_id: organization.id, deleted_at: null })
      .select("*");
  }

  async function loadRelationshipTypes() {
    return await knex
      .from("profile_relationship_type")
      .where({ org_id: organization.id, deleted_at: null })
      .select("*");
  }

  async function loadAllowedRelationships() {
    return await knex
      .from("profile_relationship_type_allowed_profile_type")
      .where({ org_id: organization.id, deleted_at: null })
      .select("*");
  }

  beforeAll(async () => {
    container = await createTestContainer();
    knex = container.get(KNEX);
    mocks = new Mocks(knex);

    profilesSetup = container.get<IProfilesSetupService>(PROFILES_SETUP_SERVICE);

    ({ organization, user } = await mocks.createSessionUserAndOrganization());
  });

  afterAll(async () => {
    await deleteAllData(knex);
    await knex.destroy();
  });

  it("should incrementally create profile types with their allowed relationships between other standard types", async () => {
    let profileTypes = await loadProfileTypes();
    let relationshipTypes = await loadRelationshipTypes();
    let allowedRelationships = await loadAllowedRelationships();

    // make sure db is empty
    expect(profileTypes).toHaveLength(0);
    expect(relationshipTypes).toHaveLength(0);
    expect(allowedRelationships).toHaveLength(0);

    // create individual
    await profilesSetup.createIndividualProfileType(
      { org_id: organization.id, name: { en: "Individual" }, name_plural: { en: "Individuals" } },
      `User:${user.id}`,
    );

    profileTypes = await loadProfileTypes();
    relationshipTypes = await loadRelationshipTypes();
    allowedRelationships = await loadAllowedRelationships();

    expect(profileTypes).toMatchObject([
      {
        id: expect.any(Number),
        standard_type: "INDIVIDUAL",
        name: { en: "Individual" },
        name_plural: { en: "Individuals" },
        icon: "PERSON",
        org_id: organization.id,
      },
    ]);

    const individualProfileTypeId = profileTypes[0].id;

    // expected to be every relationship between individuals
    expect(relationshipTypes.map(pick(["id", "alias"]))).toIncludeSameMembers([
      { id: expect.any(Number), alias: "p_parent__child" },
      { id: expect.any(Number), alias: "p_family_member" },
      { id: expect.any(Number), alias: "p_close_associate" },
      { id: expect.any(Number), alias: "p_spouse" },
      { id: expect.any(Number), alias: "p_legal_representative__legally_represented" },
      { id: expect.any(Number), alias: "p_legal_guardian__legally_guarded" },
      { id: expect.any(Number), alias: "p_contact__contacted_via" },
    ]);

    let relationshipsByAlias = indexBy(relationshipTypes, (r) => r.alias!);
    expect(
      allowedRelationships.map(
        pick(["allowed_profile_type_id", "direction", "profile_relationship_type_id"]),
      ),
    ).toIncludeSameMembers([
      {
        allowed_profile_type_id: individualProfileTypeId,
        direction: "LEFT_RIGHT",
        profile_relationship_type_id: relationshipsByAlias["p_parent__child"].id,
      },
      {
        allowed_profile_type_id: individualProfileTypeId,
        direction: "RIGHT_LEFT",
        profile_relationship_type_id: relationshipsByAlias["p_parent__child"].id,
      },
      {
        allowed_profile_type_id: individualProfileTypeId,
        direction: "LEFT_RIGHT",
        profile_relationship_type_id: relationshipsByAlias["p_family_member"].id,
      },
      {
        allowed_profile_type_id: individualProfileTypeId,
        direction: "RIGHT_LEFT",
        profile_relationship_type_id: relationshipsByAlias["p_family_member"].id,
      },
      {
        allowed_profile_type_id: individualProfileTypeId,
        direction: "LEFT_RIGHT",
        profile_relationship_type_id: relationshipsByAlias["p_close_associate"].id,
      },
      {
        allowed_profile_type_id: individualProfileTypeId,
        direction: "RIGHT_LEFT",
        profile_relationship_type_id: relationshipsByAlias["p_close_associate"].id,
      },
      {
        allowed_profile_type_id: individualProfileTypeId,
        direction: "LEFT_RIGHT",
        profile_relationship_type_id: relationshipsByAlias["p_spouse"].id,
      },
      {
        allowed_profile_type_id: individualProfileTypeId,
        direction: "RIGHT_LEFT",
        profile_relationship_type_id: relationshipsByAlias["p_spouse"].id,
      },
      {
        allowed_profile_type_id: individualProfileTypeId,
        direction: "LEFT_RIGHT",
        profile_relationship_type_id:
          relationshipsByAlias["p_legal_representative__legally_represented"].id,
      },
      {
        allowed_profile_type_id: individualProfileTypeId,
        direction: "RIGHT_LEFT",
        profile_relationship_type_id:
          relationshipsByAlias["p_legal_representative__legally_represented"].id,
      },
      {
        allowed_profile_type_id: individualProfileTypeId,
        direction: "LEFT_RIGHT",
        profile_relationship_type_id: relationshipsByAlias["p_legal_guardian__legally_guarded"].id,
      },
      {
        allowed_profile_type_id: individualProfileTypeId,
        direction: "RIGHT_LEFT",
        profile_relationship_type_id: relationshipsByAlias["p_legal_guardian__legally_guarded"].id,
      },
      {
        allowed_profile_type_id: individualProfileTypeId,
        direction: "LEFT_RIGHT",
        profile_relationship_type_id: relationshipsByAlias["p_contact__contacted_via"].id,
      },
      {
        allowed_profile_type_id: individualProfileTypeId,
        direction: "RIGHT_LEFT",
        profile_relationship_type_id: relationshipsByAlias["p_contact__contacted_via"].id,
      },
    ]);

    // create legal entity
    await profilesSetup.createLegalEntityProfileType(
      { org_id: organization.id, name: { en: "Company" }, name_plural: { en: "Companies" } },
      `User:${user.id}`,
    );

    profileTypes = await loadProfileTypes();
    relationshipTypes = await loadRelationshipTypes();
    allowedRelationships = await loadAllowedRelationships();

    expect(
      profileTypes.map(pick(["id", "standard_type", "name", "name_plural", "icon", "org_id"])),
    ).toIncludeSameMembers([
      {
        id: expect.any(Number),
        standard_type: "INDIVIDUAL",
        name: { en: "Individual" },
        name_plural: { en: "Individuals" },
        icon: "PERSON",
        org_id: organization.id,
      },
      {
        id: expect.any(Number),
        standard_type: "LEGAL_ENTITY",
        name: { en: "Company" },
        name_plural: { en: "Companies" },
        icon: "BUILDING",
        org_id: organization.id,
      },
    ]);

    const legalEntityProfileTypeId = profileTypes.find(
      (pt) => pt.standard_type === "LEGAL_ENTITY",
    )!.id;

    // expected to be every relationship between individuals and legal entities
    expect(relationshipTypes.map(pick(["id", "alias"]))).toIncludeSameMembers([
      { id: expect.any(Number), alias: "p_parent__child" },
      { id: expect.any(Number), alias: "p_family_member" },
      { id: expect.any(Number), alias: "p_close_associate" },
      { id: expect.any(Number), alias: "p_spouse" },
      { id: expect.any(Number), alias: "p_legal_representative__legally_represented" },
      { id: expect.any(Number), alias: "p_legal_guardian__legally_guarded" },
      { id: expect.any(Number), alias: "p_contact__contacted_via" },
      // all new from here
      { id: expect.any(Number), alias: "p_director__managed_by" },
      { id: expect.any(Number), alias: "p_shareholder__participated_in_by" },
      { id: expect.any(Number), alias: "p_beneficial_owner__direct_or_indirect_property" },
      { id: expect.any(Number), alias: "p_parent_company__subsidiary" },
      { id: expect.any(Number), alias: "p_main_office__branch_office" },
      { id: expect.any(Number), alias: "p_associated_company" },
    ]);

    relationshipsByAlias = indexBy(relationshipTypes, (r) => r.alias!);

    expect(
      allowedRelationships.map(
        pick(["allowed_profile_type_id", "direction", "profile_relationship_type_id"]),
      ),
    ).toIncludeSameMembers([
      {
        allowed_profile_type_id: individualProfileTypeId,
        direction: "LEFT_RIGHT",
        profile_relationship_type_id: relationshipsByAlias["p_parent__child"].id,
      },
      {
        allowed_profile_type_id: individualProfileTypeId,
        direction: "RIGHT_LEFT",
        profile_relationship_type_id: relationshipsByAlias["p_parent__child"].id,
      },
      {
        allowed_profile_type_id: individualProfileTypeId,
        direction: "LEFT_RIGHT",
        profile_relationship_type_id: relationshipsByAlias["p_family_member"].id,
      },
      {
        allowed_profile_type_id: individualProfileTypeId,
        direction: "RIGHT_LEFT",
        profile_relationship_type_id: relationshipsByAlias["p_family_member"].id,
      },
      {
        allowed_profile_type_id: individualProfileTypeId,
        direction: "LEFT_RIGHT",
        profile_relationship_type_id: relationshipsByAlias["p_close_associate"].id,
      },
      {
        allowed_profile_type_id: individualProfileTypeId,
        direction: "RIGHT_LEFT",
        profile_relationship_type_id: relationshipsByAlias["p_close_associate"].id,
      },
      {
        allowed_profile_type_id: individualProfileTypeId,
        direction: "LEFT_RIGHT",
        profile_relationship_type_id: relationshipsByAlias["p_spouse"].id,
      },
      {
        allowed_profile_type_id: individualProfileTypeId,
        direction: "RIGHT_LEFT",
        profile_relationship_type_id: relationshipsByAlias["p_spouse"].id,
      },
      {
        allowed_profile_type_id: individualProfileTypeId,
        direction: "LEFT_RIGHT",
        profile_relationship_type_id:
          relationshipsByAlias["p_legal_representative__legally_represented"].id,
      },
      {
        allowed_profile_type_id: individualProfileTypeId,
        direction: "RIGHT_LEFT",
        profile_relationship_type_id:
          relationshipsByAlias["p_legal_representative__legally_represented"].id,
      },
      {
        allowed_profile_type_id: individualProfileTypeId,
        direction: "LEFT_RIGHT",
        profile_relationship_type_id: relationshipsByAlias["p_legal_guardian__legally_guarded"].id,
      },
      {
        allowed_profile_type_id: individualProfileTypeId,
        direction: "RIGHT_LEFT",
        profile_relationship_type_id: relationshipsByAlias["p_legal_guardian__legally_guarded"].id,
      },
      {
        allowed_profile_type_id: individualProfileTypeId,
        direction: "LEFT_RIGHT",
        profile_relationship_type_id: relationshipsByAlias["p_contact__contacted_via"].id,
      },
      {
        allowed_profile_type_id: individualProfileTypeId,
        direction: "RIGHT_LEFT",
        profile_relationship_type_id: relationshipsByAlias["p_contact__contacted_via"].id,
      },
      // all new from here
      {
        allowed_profile_type_id: legalEntityProfileTypeId,
        direction: "LEFT_RIGHT",
        profile_relationship_type_id:
          relationshipsByAlias["p_legal_representative__legally_represented"].id,
      },
      {
        allowed_profile_type_id: legalEntityProfileTypeId,
        direction: "RIGHT_LEFT",
        profile_relationship_type_id:
          relationshipsByAlias["p_legal_representative__legally_represented"].id,
      },
      {
        allowed_profile_type_id: individualProfileTypeId,
        direction: "LEFT_RIGHT",
        profile_relationship_type_id: relationshipsByAlias["p_director__managed_by"].id,
      },
      {
        allowed_profile_type_id: legalEntityProfileTypeId,
        direction: "RIGHT_LEFT",
        profile_relationship_type_id: relationshipsByAlias["p_director__managed_by"].id,
      },
      {
        allowed_profile_type_id: individualProfileTypeId,
        direction: "LEFT_RIGHT",
        profile_relationship_type_id: relationshipsByAlias["p_shareholder__participated_in_by"].id,
      },
      {
        allowed_profile_type_id: legalEntityProfileTypeId,
        direction: "LEFT_RIGHT",
        profile_relationship_type_id: relationshipsByAlias["p_shareholder__participated_in_by"].id,
      },
      {
        allowed_profile_type_id: legalEntityProfileTypeId,
        direction: "RIGHT_LEFT",
        profile_relationship_type_id: relationshipsByAlias["p_shareholder__participated_in_by"].id,
      },
      {
        allowed_profile_type_id: individualProfileTypeId,
        direction: "LEFT_RIGHT",
        profile_relationship_type_id:
          relationshipsByAlias["p_beneficial_owner__direct_or_indirect_property"].id,
      },
      {
        allowed_profile_type_id: legalEntityProfileTypeId,
        direction: "RIGHT_LEFT",
        profile_relationship_type_id:
          relationshipsByAlias["p_beneficial_owner__direct_or_indirect_property"].id,
      },
      {
        allowed_profile_type_id: legalEntityProfileTypeId,
        direction: "LEFT_RIGHT",
        profile_relationship_type_id: relationshipsByAlias["p_parent_company__subsidiary"].id,
      },
      {
        allowed_profile_type_id: legalEntityProfileTypeId,
        direction: "RIGHT_LEFT",
        profile_relationship_type_id: relationshipsByAlias["p_parent_company__subsidiary"].id,
      },
      {
        allowed_profile_type_id: legalEntityProfileTypeId,
        direction: "LEFT_RIGHT",
        profile_relationship_type_id: relationshipsByAlias["p_main_office__branch_office"].id,
      },
      {
        allowed_profile_type_id: legalEntityProfileTypeId,
        direction: "RIGHT_LEFT",
        profile_relationship_type_id: relationshipsByAlias["p_main_office__branch_office"].id,
      },
      {
        allowed_profile_type_id: legalEntityProfileTypeId,
        direction: "LEFT_RIGHT",
        profile_relationship_type_id: relationshipsByAlias["p_associated_company"].id,
      },
      {
        allowed_profile_type_id: legalEntityProfileTypeId,
        direction: "RIGHT_LEFT",
        profile_relationship_type_id: relationshipsByAlias["p_associated_company"].id,
      },
      {
        allowed_profile_type_id: legalEntityProfileTypeId,
        direction: "RIGHT_LEFT",
        profile_relationship_type_id: relationshipsByAlias["p_contact__contacted_via"].id,
      },
    ]);

    // create contract
    await profilesSetup.createContractProfileType(
      { org_id: organization.id, name: { en: "Contract" }, name_plural: { en: "Contracts" } },
      `User:${user.id}`,
    );

    profileTypes = await loadProfileTypes();
    relationshipTypes = await loadRelationshipTypes();
    allowedRelationships = await loadAllowedRelationships();

    expect(
      profileTypes.map(pick(["id", "standard_type", "name", "name_plural", "icon", "org_id"])),
    ).toIncludeSameMembers([
      {
        id: expect.any(Number),
        standard_type: "INDIVIDUAL",
        name: { en: "Individual" },
        name_plural: { en: "Individuals" },
        icon: "PERSON",
        org_id: organization.id,
      },
      {
        id: expect.any(Number),
        standard_type: "LEGAL_ENTITY",
        name: { en: "Company" },
        name_plural: { en: "Companies" },
        icon: "BUILDING",
        org_id: organization.id,
      },
      {
        id: expect.any(Number),
        standard_type: "CONTRACT",
        name: { en: "Contract" },
        name_plural: { en: "Contracts" },
        icon: "DOCUMENT",
        org_id: organization.id,
      },
    ]);

    const contractProfileTypeId = profileTypes.find((pt) => pt.standard_type === "CONTRACT")!.id;

    // expected to be every relationship between individuals and legal entities
    expect(relationshipTypes.map(pick(["id", "alias"]))).toIncludeSameMembers([
      { id: expect.any(Number), alias: "p_parent__child" },
      { id: expect.any(Number), alias: "p_family_member" },
      { id: expect.any(Number), alias: "p_close_associate" },
      { id: expect.any(Number), alias: "p_spouse" },
      { id: expect.any(Number), alias: "p_legal_representative__legally_represented" },
      { id: expect.any(Number), alias: "p_legal_guardian__legally_guarded" },
      { id: expect.any(Number), alias: "p_contact__contacted_via" },
      { id: expect.any(Number), alias: "p_director__managed_by" },
      { id: expect.any(Number), alias: "p_shareholder__participated_in_by" },
      { id: expect.any(Number), alias: "p_beneficial_owner__direct_or_indirect_property" },
      { id: expect.any(Number), alias: "p_parent_company__subsidiary" },
      { id: expect.any(Number), alias: "p_main_office__branch_office" },
      { id: expect.any(Number), alias: "p_associated_company" },
      // all new from here
      { id: expect.any(Number), alias: "p_contract__counterparty" },
      { id: expect.any(Number), alias: "p_main_contract__annex" },
      { id: expect.any(Number), alias: "p_addendum__amended_by" },
    ]);

    relationshipsByAlias = indexBy(relationshipTypes, (r) => r.alias!);

    expect(
      allowedRelationships.map(
        pick(["allowed_profile_type_id", "direction", "profile_relationship_type_id"]),
      ),
    ).toIncludeSameMembers([
      {
        allowed_profile_type_id: individualProfileTypeId,
        direction: "LEFT_RIGHT",
        profile_relationship_type_id: relationshipsByAlias["p_parent__child"].id,
      },
      {
        allowed_profile_type_id: individualProfileTypeId,
        direction: "RIGHT_LEFT",
        profile_relationship_type_id: relationshipsByAlias["p_parent__child"].id,
      },
      {
        allowed_profile_type_id: individualProfileTypeId,
        direction: "LEFT_RIGHT",
        profile_relationship_type_id: relationshipsByAlias["p_family_member"].id,
      },
      {
        allowed_profile_type_id: individualProfileTypeId,
        direction: "RIGHT_LEFT",
        profile_relationship_type_id: relationshipsByAlias["p_family_member"].id,
      },
      {
        allowed_profile_type_id: individualProfileTypeId,
        direction: "LEFT_RIGHT",
        profile_relationship_type_id: relationshipsByAlias["p_close_associate"].id,
      },
      {
        allowed_profile_type_id: individualProfileTypeId,
        direction: "RIGHT_LEFT",
        profile_relationship_type_id: relationshipsByAlias["p_close_associate"].id,
      },
      {
        allowed_profile_type_id: individualProfileTypeId,
        direction: "LEFT_RIGHT",
        profile_relationship_type_id: relationshipsByAlias["p_spouse"].id,
      },
      {
        allowed_profile_type_id: individualProfileTypeId,
        direction: "RIGHT_LEFT",
        profile_relationship_type_id: relationshipsByAlias["p_spouse"].id,
      },
      {
        allowed_profile_type_id: individualProfileTypeId,
        direction: "LEFT_RIGHT",
        profile_relationship_type_id:
          relationshipsByAlias["p_legal_representative__legally_represented"].id,
      },
      {
        allowed_profile_type_id: individualProfileTypeId,
        direction: "RIGHT_LEFT",
        profile_relationship_type_id:
          relationshipsByAlias["p_legal_representative__legally_represented"].id,
      },
      {
        allowed_profile_type_id: individualProfileTypeId,
        direction: "LEFT_RIGHT",
        profile_relationship_type_id: relationshipsByAlias["p_legal_guardian__legally_guarded"].id,
      },
      {
        allowed_profile_type_id: individualProfileTypeId,
        direction: "RIGHT_LEFT",
        profile_relationship_type_id: relationshipsByAlias["p_legal_guardian__legally_guarded"].id,
      },
      {
        allowed_profile_type_id: individualProfileTypeId,
        direction: "LEFT_RIGHT",
        profile_relationship_type_id: relationshipsByAlias["p_contact__contacted_via"].id,
      },
      {
        allowed_profile_type_id: individualProfileTypeId,
        direction: "RIGHT_LEFT",
        profile_relationship_type_id: relationshipsByAlias["p_contact__contacted_via"].id,
      },
      {
        allowed_profile_type_id: legalEntityProfileTypeId,
        direction: "LEFT_RIGHT",
        profile_relationship_type_id:
          relationshipsByAlias["p_legal_representative__legally_represented"].id,
      },
      {
        allowed_profile_type_id: legalEntityProfileTypeId,
        direction: "RIGHT_LEFT",
        profile_relationship_type_id:
          relationshipsByAlias["p_legal_representative__legally_represented"].id,
      },
      {
        allowed_profile_type_id: individualProfileTypeId,
        direction: "LEFT_RIGHT",
        profile_relationship_type_id: relationshipsByAlias["p_director__managed_by"].id,
      },
      {
        allowed_profile_type_id: legalEntityProfileTypeId,
        direction: "RIGHT_LEFT",
        profile_relationship_type_id: relationshipsByAlias["p_director__managed_by"].id,
      },
      {
        allowed_profile_type_id: individualProfileTypeId,
        direction: "LEFT_RIGHT",
        profile_relationship_type_id: relationshipsByAlias["p_shareholder__participated_in_by"].id,
      },
      {
        allowed_profile_type_id: legalEntityProfileTypeId,
        direction: "LEFT_RIGHT",
        profile_relationship_type_id: relationshipsByAlias["p_shareholder__participated_in_by"].id,
      },
      {
        allowed_profile_type_id: legalEntityProfileTypeId,
        direction: "RIGHT_LEFT",
        profile_relationship_type_id: relationshipsByAlias["p_shareholder__participated_in_by"].id,
      },
      {
        allowed_profile_type_id: individualProfileTypeId,
        direction: "LEFT_RIGHT",
        profile_relationship_type_id:
          relationshipsByAlias["p_beneficial_owner__direct_or_indirect_property"].id,
      },
      {
        allowed_profile_type_id: legalEntityProfileTypeId,
        direction: "RIGHT_LEFT",
        profile_relationship_type_id:
          relationshipsByAlias["p_beneficial_owner__direct_or_indirect_property"].id,
      },
      {
        allowed_profile_type_id: legalEntityProfileTypeId,
        direction: "LEFT_RIGHT",
        profile_relationship_type_id: relationshipsByAlias["p_parent_company__subsidiary"].id,
      },
      {
        allowed_profile_type_id: legalEntityProfileTypeId,
        direction: "RIGHT_LEFT",
        profile_relationship_type_id: relationshipsByAlias["p_parent_company__subsidiary"].id,
      },
      {
        allowed_profile_type_id: legalEntityProfileTypeId,
        direction: "LEFT_RIGHT",
        profile_relationship_type_id: relationshipsByAlias["p_main_office__branch_office"].id,
      },
      {
        allowed_profile_type_id: legalEntityProfileTypeId,
        direction: "RIGHT_LEFT",
        profile_relationship_type_id: relationshipsByAlias["p_main_office__branch_office"].id,
      },
      {
        allowed_profile_type_id: legalEntityProfileTypeId,
        direction: "LEFT_RIGHT",
        profile_relationship_type_id: relationshipsByAlias["p_associated_company"].id,
      },
      {
        allowed_profile_type_id: legalEntityProfileTypeId,
        direction: "RIGHT_LEFT",
        profile_relationship_type_id: relationshipsByAlias["p_associated_company"].id,
      },
      {
        allowed_profile_type_id: legalEntityProfileTypeId,
        direction: "RIGHT_LEFT",
        profile_relationship_type_id: relationshipsByAlias["p_contact__contacted_via"].id,
      },
      // all new from here
      {
        allowed_profile_type_id: contractProfileTypeId,
        direction: "LEFT_RIGHT",
        profile_relationship_type_id: relationshipsByAlias["p_contract__counterparty"].id,
      },
      {
        allowed_profile_type_id: individualProfileTypeId,
        direction: "RIGHT_LEFT",
        profile_relationship_type_id: relationshipsByAlias["p_contract__counterparty"].id,
      },
      {
        allowed_profile_type_id: legalEntityProfileTypeId,
        direction: "RIGHT_LEFT",
        profile_relationship_type_id: relationshipsByAlias["p_contract__counterparty"].id,
      },
      {
        allowed_profile_type_id: contractProfileTypeId,
        direction: "LEFT_RIGHT",
        profile_relationship_type_id: relationshipsByAlias["p_main_contract__annex"].id,
      },
      {
        allowed_profile_type_id: contractProfileTypeId,
        direction: "RIGHT_LEFT",
        profile_relationship_type_id: relationshipsByAlias["p_main_contract__annex"].id,
      },
      {
        allowed_profile_type_id: contractProfileTypeId,
        direction: "LEFT_RIGHT",
        profile_relationship_type_id: relationshipsByAlias["p_addendum__amended_by"].id,
      },
      {
        allowed_profile_type_id: contractProfileTypeId,
        direction: "RIGHT_LEFT",
        profile_relationship_type_id: relationshipsByAlias["p_addendum__amended_by"].id,
      },
    ]);

    // create matter
    await profilesSetup.createMatterProfileType(
      { org_id: organization.id, name: { en: "Matter" }, name_plural: { en: "Matters" } },
      `User:${user.id}`,
    );

    profileTypes = await loadProfileTypes();
    relationshipTypes = await loadRelationshipTypes();
    allowedRelationships = await loadAllowedRelationships();

    expect(
      profileTypes.map(pick(["id", "standard_type", "name", "name_plural", "icon", "org_id"])),
    ).toIncludeSameMembers([
      {
        id: expect.any(Number),
        standard_type: "INDIVIDUAL",
        name: { en: "Individual" },
        name_plural: { en: "Individuals" },
        icon: "PERSON",
        org_id: organization.id,
      },
      {
        id: expect.any(Number),
        standard_type: "LEGAL_ENTITY",
        name: { en: "Company" },
        name_plural: { en: "Companies" },
        icon: "BUILDING",
        org_id: organization.id,
      },
      {
        id: expect.any(Number),
        standard_type: "CONTRACT",
        name: { en: "Contract" },
        name_plural: { en: "Contracts" },
        icon: "DOCUMENT",
        org_id: organization.id,
      },
      {
        id: expect.any(Number),
        standard_type: "MATTER",
        name: { en: "Matter" },
        name_plural: { en: "Matters" },
        icon: "CLIPBOARD",
        org_id: organization.id,
      },
    ]);

    const matterProfileTypeId = profileTypes.find((pt) => pt.standard_type === "MATTER")!.id;

    // expected to be every relationship between individuals and legal entities
    expect(relationshipTypes.map(pick(["id", "alias"]))).toIncludeSameMembers([
      { id: expect.any(Number), alias: "p_parent__child" },
      { id: expect.any(Number), alias: "p_family_member" },
      { id: expect.any(Number), alias: "p_close_associate" },
      { id: expect.any(Number), alias: "p_spouse" },
      { id: expect.any(Number), alias: "p_legal_representative__legally_represented" },
      { id: expect.any(Number), alias: "p_legal_guardian__legally_guarded" },
      { id: expect.any(Number), alias: "p_contact__contacted_via" },
      { id: expect.any(Number), alias: "p_director__managed_by" },
      { id: expect.any(Number), alias: "p_shareholder__participated_in_by" },
      { id: expect.any(Number), alias: "p_beneficial_owner__direct_or_indirect_property" },
      { id: expect.any(Number), alias: "p_parent_company__subsidiary" },
      { id: expect.any(Number), alias: "p_main_office__branch_office" },
      { id: expect.any(Number), alias: "p_associated_company" },
      { id: expect.any(Number), alias: "p_contract__counterparty" },
      { id: expect.any(Number), alias: "p_main_contract__annex" },
      { id: expect.any(Number), alias: "p_addendum__amended_by" },
      // all new from here
      { id: expect.any(Number), alias: "p_client__matter" },
      { id: expect.any(Number), alias: "p_participant__matter" },
      { id: expect.any(Number), alias: "p_payer__matter" },
      { id: expect.any(Number), alias: "p_contact__matter" },
    ]);

    relationshipsByAlias = indexBy(relationshipTypes, (r) => r.alias!);

    expect(
      allowedRelationships.map(
        pick(["allowed_profile_type_id", "direction", "profile_relationship_type_id"]),
      ),
    ).toIncludeSameMembers([
      {
        allowed_profile_type_id: individualProfileTypeId,
        direction: "LEFT_RIGHT",
        profile_relationship_type_id: relationshipsByAlias["p_parent__child"].id,
      },
      {
        allowed_profile_type_id: individualProfileTypeId,
        direction: "RIGHT_LEFT",
        profile_relationship_type_id: relationshipsByAlias["p_parent__child"].id,
      },
      {
        allowed_profile_type_id: individualProfileTypeId,
        direction: "LEFT_RIGHT",
        profile_relationship_type_id: relationshipsByAlias["p_family_member"].id,
      },
      {
        allowed_profile_type_id: individualProfileTypeId,
        direction: "RIGHT_LEFT",
        profile_relationship_type_id: relationshipsByAlias["p_family_member"].id,
      },
      {
        allowed_profile_type_id: individualProfileTypeId,
        direction: "LEFT_RIGHT",
        profile_relationship_type_id: relationshipsByAlias["p_close_associate"].id,
      },
      {
        allowed_profile_type_id: individualProfileTypeId,
        direction: "RIGHT_LEFT",
        profile_relationship_type_id: relationshipsByAlias["p_close_associate"].id,
      },
      {
        allowed_profile_type_id: individualProfileTypeId,
        direction: "LEFT_RIGHT",
        profile_relationship_type_id: relationshipsByAlias["p_spouse"].id,
      },
      {
        allowed_profile_type_id: individualProfileTypeId,
        direction: "RIGHT_LEFT",
        profile_relationship_type_id: relationshipsByAlias["p_spouse"].id,
      },
      {
        allowed_profile_type_id: individualProfileTypeId,
        direction: "LEFT_RIGHT",
        profile_relationship_type_id:
          relationshipsByAlias["p_legal_representative__legally_represented"].id,
      },
      {
        allowed_profile_type_id: individualProfileTypeId,
        direction: "RIGHT_LEFT",
        profile_relationship_type_id:
          relationshipsByAlias["p_legal_representative__legally_represented"].id,
      },
      {
        allowed_profile_type_id: individualProfileTypeId,
        direction: "LEFT_RIGHT",
        profile_relationship_type_id: relationshipsByAlias["p_legal_guardian__legally_guarded"].id,
      },
      {
        allowed_profile_type_id: individualProfileTypeId,
        direction: "RIGHT_LEFT",
        profile_relationship_type_id: relationshipsByAlias["p_legal_guardian__legally_guarded"].id,
      },
      {
        allowed_profile_type_id: individualProfileTypeId,
        direction: "LEFT_RIGHT",
        profile_relationship_type_id: relationshipsByAlias["p_contact__contacted_via"].id,
      },
      {
        allowed_profile_type_id: individualProfileTypeId,
        direction: "RIGHT_LEFT",
        profile_relationship_type_id: relationshipsByAlias["p_contact__contacted_via"].id,
      },
      {
        allowed_profile_type_id: legalEntityProfileTypeId,
        direction: "LEFT_RIGHT",
        profile_relationship_type_id:
          relationshipsByAlias["p_legal_representative__legally_represented"].id,
      },
      {
        allowed_profile_type_id: legalEntityProfileTypeId,
        direction: "RIGHT_LEFT",
        profile_relationship_type_id:
          relationshipsByAlias["p_legal_representative__legally_represented"].id,
      },
      {
        allowed_profile_type_id: individualProfileTypeId,
        direction: "LEFT_RIGHT",
        profile_relationship_type_id: relationshipsByAlias["p_director__managed_by"].id,
      },
      {
        allowed_profile_type_id: legalEntityProfileTypeId,
        direction: "RIGHT_LEFT",
        profile_relationship_type_id: relationshipsByAlias["p_director__managed_by"].id,
      },
      {
        allowed_profile_type_id: individualProfileTypeId,
        direction: "LEFT_RIGHT",
        profile_relationship_type_id: relationshipsByAlias["p_shareholder__participated_in_by"].id,
      },
      {
        allowed_profile_type_id: legalEntityProfileTypeId,
        direction: "LEFT_RIGHT",
        profile_relationship_type_id: relationshipsByAlias["p_shareholder__participated_in_by"].id,
      },
      {
        allowed_profile_type_id: legalEntityProfileTypeId,
        direction: "RIGHT_LEFT",
        profile_relationship_type_id: relationshipsByAlias["p_shareholder__participated_in_by"].id,
      },
      {
        allowed_profile_type_id: individualProfileTypeId,
        direction: "LEFT_RIGHT",
        profile_relationship_type_id:
          relationshipsByAlias["p_beneficial_owner__direct_or_indirect_property"].id,
      },
      {
        allowed_profile_type_id: legalEntityProfileTypeId,
        direction: "RIGHT_LEFT",
        profile_relationship_type_id:
          relationshipsByAlias["p_beneficial_owner__direct_or_indirect_property"].id,
      },
      {
        allowed_profile_type_id: legalEntityProfileTypeId,
        direction: "LEFT_RIGHT",
        profile_relationship_type_id: relationshipsByAlias["p_parent_company__subsidiary"].id,
      },
      {
        allowed_profile_type_id: legalEntityProfileTypeId,
        direction: "RIGHT_LEFT",
        profile_relationship_type_id: relationshipsByAlias["p_parent_company__subsidiary"].id,
      },
      {
        allowed_profile_type_id: legalEntityProfileTypeId,
        direction: "LEFT_RIGHT",
        profile_relationship_type_id: relationshipsByAlias["p_main_office__branch_office"].id,
      },
      {
        allowed_profile_type_id: legalEntityProfileTypeId,
        direction: "RIGHT_LEFT",
        profile_relationship_type_id: relationshipsByAlias["p_main_office__branch_office"].id,
      },
      {
        allowed_profile_type_id: legalEntityProfileTypeId,
        direction: "LEFT_RIGHT",
        profile_relationship_type_id: relationshipsByAlias["p_associated_company"].id,
      },
      {
        allowed_profile_type_id: legalEntityProfileTypeId,
        direction: "RIGHT_LEFT",
        profile_relationship_type_id: relationshipsByAlias["p_associated_company"].id,
      },
      {
        allowed_profile_type_id: legalEntityProfileTypeId,
        direction: "RIGHT_LEFT",
        profile_relationship_type_id: relationshipsByAlias["p_contact__contacted_via"].id,
      },
      {
        allowed_profile_type_id: contractProfileTypeId,
        direction: "LEFT_RIGHT",
        profile_relationship_type_id: relationshipsByAlias["p_contract__counterparty"].id,
      },
      {
        allowed_profile_type_id: individualProfileTypeId,
        direction: "RIGHT_LEFT",
        profile_relationship_type_id: relationshipsByAlias["p_contract__counterparty"].id,
      },
      {
        allowed_profile_type_id: legalEntityProfileTypeId,
        direction: "RIGHT_LEFT",
        profile_relationship_type_id: relationshipsByAlias["p_contract__counterparty"].id,
      },
      {
        allowed_profile_type_id: contractProfileTypeId,
        direction: "LEFT_RIGHT",
        profile_relationship_type_id: relationshipsByAlias["p_main_contract__annex"].id,
      },
      {
        allowed_profile_type_id: contractProfileTypeId,
        direction: "RIGHT_LEFT",
        profile_relationship_type_id: relationshipsByAlias["p_main_contract__annex"].id,
      },
      {
        allowed_profile_type_id: contractProfileTypeId,
        direction: "LEFT_RIGHT",
        profile_relationship_type_id: relationshipsByAlias["p_addendum__amended_by"].id,
      },
      {
        allowed_profile_type_id: contractProfileTypeId,
        direction: "RIGHT_LEFT",
        profile_relationship_type_id: relationshipsByAlias["p_addendum__amended_by"].id,
      },
      // all new from here
      {
        allowed_profile_type_id: individualProfileTypeId,
        direction: "LEFT_RIGHT",
        profile_relationship_type_id: relationshipsByAlias["p_client__matter"].id,
      },
      {
        allowed_profile_type_id: legalEntityProfileTypeId,
        direction: "LEFT_RIGHT",
        profile_relationship_type_id: relationshipsByAlias["p_client__matter"].id,
      },
      {
        allowed_profile_type_id: matterProfileTypeId,
        direction: "RIGHT_LEFT",
        profile_relationship_type_id: relationshipsByAlias["p_client__matter"].id,
      },
      {
        allowed_profile_type_id: individualProfileTypeId,
        direction: "LEFT_RIGHT",
        profile_relationship_type_id: relationshipsByAlias["p_participant__matter"].id,
      },
      {
        allowed_profile_type_id: legalEntityProfileTypeId,
        direction: "LEFT_RIGHT",
        profile_relationship_type_id: relationshipsByAlias["p_participant__matter"].id,
      },
      {
        allowed_profile_type_id: matterProfileTypeId,
        direction: "RIGHT_LEFT",
        profile_relationship_type_id: relationshipsByAlias["p_participant__matter"].id,
      },
      {
        allowed_profile_type_id: individualProfileTypeId,
        direction: "LEFT_RIGHT",
        profile_relationship_type_id: relationshipsByAlias["p_payer__matter"].id,
      },
      {
        allowed_profile_type_id: legalEntityProfileTypeId,
        direction: "LEFT_RIGHT",
        profile_relationship_type_id: relationshipsByAlias["p_payer__matter"].id,
      },
      {
        allowed_profile_type_id: matterProfileTypeId,
        direction: "RIGHT_LEFT",
        profile_relationship_type_id: relationshipsByAlias["p_payer__matter"].id,
      },
      {
        allowed_profile_type_id: individualProfileTypeId,
        direction: "LEFT_RIGHT",
        profile_relationship_type_id: relationshipsByAlias["p_contact__matter"].id,
      },
      {
        allowed_profile_type_id: matterProfileTypeId,
        direction: "RIGHT_LEFT",
        profile_relationship_type_id: relationshipsByAlias["p_contact__matter"].id,
      },
    ]);
  });
});
