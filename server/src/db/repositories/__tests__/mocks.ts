import Knex from "knex";
import {
  CreateOrganization,
  Organization,
  CreateUser,
  User,
  CreatePetitionField,
  Petition,
  CreatePetition,
  PetitionField,
  PetitionFieldType
} from "../../__types";
import { range, last, flatMap } from "remeda";
import faker from "faker";
import { createReadStream } from "fs";

export class Mocks {
  constructor(private knex: Knex) {}

  async createRandomOrganizations(
    amount: number,
    builder?: (index: number) => Partial<Organization>
  ) {
    return await this.knex<Organization>("organization")
      .insert(
        range(0, amount).map<CreateOrganization>(index => {
          return {
            name: faker.company.companyName(),
            identifier: faker.random.alphaNumeric(10),
            status: "DEV",
            ...(builder && builder(index))
          };
        })
      )
      .returning("*");
  }

  async createRandomUsers(
    orgId: number,
    amount: number,
    builder?: (index: number) => Partial<User>
  ) {
    return await this.knex<User>("user")
      .insert(
        range(0, amount).map<CreateUser>(index => {
          const firstName = faker.name.firstName();
          const lastName = faker.name.lastName();
          return {
            org_id: orgId,
            first_name: firstName,
            last_name: lastName,
            email: faker.internet.email(firstName, lastName),
            cognito_id: faker.random.uuid(),
            ...(builder && builder(index))
          };
        })
      )
      .returning("*");
  }

  async createRandomPetitions(
    orgId: number,
    ownerId: number,
    amount: number,
    builder?: (index: number) => Partial<Petition>
  ) {
    return await this.knex<Petition>("petition")
      .insert(
        range(0, amount).map<CreatePetition>(index => {
          return {
            org_id: orgId,
            owner_id: ownerId,
            is_template: false,
            status: randomPetitionStatus(),
            name: faker.random.words(),
            locale: randomSupportedLocale(),
            ...(builder && builder(index))
          };
        })
      )
      .returning("*");
  }

  async createRandomPetitionFields(
    petitionId: number,
    amount: number,
    builder?: (index: number) => Partial<PetitionField>
  ) {
    return await this.knex<PetitionField>("petition_field")
      .insert(
        range(0, amount).map<CreatePetitionField>(index => {
          const type = randomPetitionFieldType();
          return {
            petition_id: petitionId,
            position: index,
            title: faker.random.words(),
            type: type,
            options: randomPetitionFieldOptions(type),
            ...(builder && builder(index))
          };
        })
      )
      .returning("*");
  }
}

function randomPetitionStatus() {
  return faker.random.arrayElement([
    "DRAFT",
    "SENDING",
    "PENDING",
    "COMPLETED"
  ] as const);
}

function randomPetitionFieldType() {
  return faker.random.arrayElement(["FILE_UPLOAD"] as const);
}

function randomSupportedLocale() {
  return faker.random.arrayElement(["en", "es"]);
}

function randomPetitionFieldOptions(type: PetitionFieldType) {
  switch (type) {
    case "FILE_UPLOAD": {
      return {
        accepts: [faker.random.arrayElement(["PDF", "IMAGE", "VIDEO", "WORD"])],
        multiple: faker.random.boolean()
      };
    }
  }
}
