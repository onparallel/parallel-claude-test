import faker from "faker";
import Knex from "knex";
import { range } from "remeda";
import {
  CreateOrganization,
  CreatePetition,
  CreatePetitionField,
  CreateUser,
  Organization,
  Petition,
  PetitionField,
  PetitionFieldType,
  User,
  PetitionAccess,
  CreatePetitionAccess,
  Contact,
  CreateContact,
} from "../../__types";
import { random } from "../../../util/token";

export class Mocks {
  constructor(private knex: Knex) {}

  async createRandomOrganizations(
    amount: number,
    builder?: (index: number) => Partial<Organization>
  ) {
    return await this.knex<Organization>("organization")
      .insert(
        range(0, amount).map<CreateOrganization>((index) => {
          return {
            name: faker.company.companyName(),
            identifier: faker.random.alphaNumeric(10),
            status: "DEV",
            ...builder?.(index),
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
        range(0, amount).map<CreateUser>((index) => {
          const firstName = faker.name.firstName();
          const lastName = faker.name.lastName();
          return {
            org_id: orgId,
            first_name: firstName,
            last_name: lastName,
            email: faker.internet.email(firstName, lastName),
            cognito_id: faker.random.uuid(),
            ...builder?.(index),
          };
        })
      )
      .returning("*");
  }

  async createRandomContacts(
    orgId: number,
    ownerId: number,
    amount: number,
    builder?: (index: number) => Partial<Contact>
  ) {
    return await this.knex<Contact>("contact")
      .insert(
        range(0, amount).map<CreateContact>((index) => {
          const firstName = faker.name.firstName();
          const lastName = faker.name.lastName();
          return {
            owner_id: ownerId,
            org_id: orgId,
            first_name: firstName,
            last_name: lastName,
            email: faker.internet.email(firstName, lastName),
            ...builder?.(index),
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
        range(0, amount).map<CreatePetition>((index) => {
          return {
            org_id: orgId,
            owner_id: ownerId,
            is_template: false,
            status: randomPetitionStatus(),
            name: faker.random.words(),
            locale: randomSupportedLocale(),
            ...builder?.(index),
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
        range(0, amount).map<CreatePetitionField>((index) => {
          const type = randomPetitionFieldType();
          return {
            petition_id: petitionId,
            position: index,
            title: faker.random.words(),
            type: type,
            options: randomPetitionFieldOptions(type),
            ...builder?.(index),
          };
        })
      )
      .returning("*");
  }

  async createPetitionAccess(
    petitionId: number,
    ownerId: number,
    contactIds: number[]
  ) {
    return await this.knex<PetitionAccess>("petition_access")
      .insert(
        contactIds.map<CreatePetitionAccess>((contactId) => ({
          petition_id: petitionId,
          granter_id: ownerId,
          contact_id: contactId,
          status: "ACTIVE",
          keycode: random(16),
          reminders_left: 10,
        }))
      )
      .returning("*");
  }
}

function randomPetitionStatus() {
  return faker.random.arrayElement(["DRAFT", "PENDING", "COMPLETED"] as const);
}

function randomPetitionFieldType() {
  return faker.random.arrayElement(["FILE_UPLOAD", "TEXT"] as const);
}

function randomSupportedLocale() {
  return faker.random.arrayElement(["en", "es"]);
}

function randomPetitionFieldOptions(type: PetitionFieldType) {
  switch (type) {
    case "FILE_UPLOAD": {
      return {
        accepts: [faker.random.arrayElement(["PDF", "IMAGE", "VIDEO"])],
        multiple: faker.random.boolean(),
      };
    }
    case "TEXT": {
      return {
        multiline: faker.random.boolean(),
        placeholder: faker.random.words(3),
      };
    }
  }
}
