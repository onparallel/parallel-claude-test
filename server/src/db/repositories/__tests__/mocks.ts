import faker from "faker";
import { Knex } from "knex";
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
  PetitionUser,
  PetitionFieldReply,
  CreatePetitionFieldReply,
  UserAuthenticationToken,
  PetitionUserPermissionType,
  PetitionEventSubscription,
  CreateFeatureFlag,
  FileUpload,
  CreateFileUpload,
  Tag,
  CreateTag,
} from "../../__types";
import { hash, random } from "../../../util/token";

export class Mocks {
  constructor(public knex: Knex) {}

  async loadUserPermissionsByPetitionId(id: number): Promise<PetitionUser[]> {
    const {
      rows: permissions,
    } = await this.knex.raw(
      /* sql */ `SELECT * from petition_user where petition_id = ? and deleted_at is null`,
      [id]
    );

    return permissions;
  }

  async loadPetition(id: number): Promise<Petition> {
    const {
      rows: [petition],
    } = await this.knex.raw(
      /* sql */ `SELECT * from petition where id = ? and deleted_at is null`,
      [id]
    );
    return petition;
  }

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
            cognito_id: faker.datatype.uuid(),
            ...builder?.(index),
          };
        })
      )
      .returning("*");
  }

  async createFeatureFlags(featureFlags: CreateFeatureFlag[]) {
    await this.knex.into("feature_flag").insert(featureFlags);
  }

  async createRandomContacts(
    orgId: number,
    amount: number,
    builder?: (index: number) => Partial<Contact>
  ) {
    return await this.knex<Contact>("contact")
      .insert(
        range(0, amount).map<CreateContact>((index) => {
          const firstName = faker.name.firstName();
          const lastName = faker.name.lastName();
          return {
            org_id: orgId,
            first_name: firstName,
            last_name: lastName,
            email: faker.internet.email(firstName, lastName).toLowerCase(),
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
    const petitions = await this.knex<Petition>("petition")
      .insert(
        range(0, amount).map<CreatePetition>((index) => {
          return {
            org_id: orgId,
            is_template: false,
            status: randomPetitionStatus(),
            name: faker.random.words(),
            locale: randomSupportedLocale(),
            ...builder?.(index),
          };
        })
      )
      .returning("*");

    await this.knex<PetitionUser>("petition_user").insert(
      petitions.map(({ id }) => ({
        created_by: `User:${ownerId}`,
        petition_id: id,
        user_id: ownerId,
      }))
    );

    return petitions;
  }

  async createRandomPetitionFields(
    petitionId: number,
    amount: number,
    builder?: (index: number) => Partial<PetitionField>
  ) {
    return await this.knex<PetitionField>("petition_field")
      .insert(
        range(0, amount).map<CreatePetitionField>((index) => {
          const data = builder?.(index) ?? {};
          const type = data.type ?? randomPetitionFieldType();
          return {
            petition_id: petitionId,
            position: index,
            title: faker.random.words(),
            type: type,
            options: randomPetitionFieldOptions(type),
            ...data,
          };
        })
      )
      .returning("*");
  }

  async createRandomTextReply(
    textFieldId: number,
    access_id: number,
    amount?: number,
    builder?: (index: number) => Partial<PetitionFieldReply>
  ) {
    return await this.knex<PetitionFieldReply>("petition_field_reply")
      .insert(
        range(0, amount || 1).map<CreatePetitionFieldReply>((index) => {
          return {
            petition_field_id: textFieldId,
            content: { text: faker.lorem.words(10) },
            type: "TEXT",
            petition_access_id: access_id,
            ...builder?.(index),
          };
        })
      )
      .returning("*");
  }

  async createRandomFileUpload(
    amount?: number,
    builder?: (index: number) => Partial<FileUpload>
  ) {
    return await this.knex<FileUpload>("file_upload")
      .insert(
        range(0, amount || 1).map<CreateFileUpload>((index) => ({
          content_type: "application/pdf",
          filename: "file.pdf",
          path: random(16),
          size: "100",
          upload_complete: true,
          ...builder?.(index),
        }))
      )
      .returning("*");
  }

  async createRandomFileReply(
    fieldId: number,
    amount?: number,
    builder?: (index: number) => Partial<PetitionFieldReply>
  ) {
    return await this.knex<PetitionFieldReply>("petition_field_reply")
      .insert(
        range(0, amount || 1).map<CreatePetitionFieldReply>((index) => {
          return {
            petition_field_id: fieldId,
            type: "FILE_UPLOAD",
            content: { file_upload_id: 1 },
            ...builder?.(index),
          };
        })
      )
      .returning("*");
  }

  async createRandomTags(
    orgId: number,
    amount?: number,
    builder?: (index: number) => Partial<Tag>
  ) {
    return await this.knex<Tag>("tag")
      .insert(
        range(0, amount || 1).map<CreateTag>((index) => ({
          color: "#000000",
          name: faker.random.words(),
          organization_id: orgId,
          ...builder?.(index),
        }))
      )
      .returning("*");
  }

  async createPetitionAccess(
    petitionId: number,
    ownerId: number,
    contactIds: number[],
    createdByUserId: number
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
          created_by: `User:${createdByUserId}`,
        }))
      )
      .returning("*");
  }

  async sharePetitions(
    petitionIds: number[],
    toUserId: number,
    permissionType: PetitionUserPermissionType
  ) {
    return await this.knex<PetitionUser>("petition_user")
      .insert(
        petitionIds.map((petitionId) => ({
          petition_id: petitionId,
          user_id: toUserId,
          permission_type: permissionType,
        }))
      )
      .returning("*");
  }

  async clearSharedPetitions() {
    return await this.knex<PetitionUser>("petition_user")
      .whereNot("permission_type", "OWNER")
      .delete();
  }

  async createUserAuthToken(tokenName: string, userId: number) {
    const apiKey = random(48);
    return await this.knex<UserAuthenticationToken>("user_authentication_token")
      .insert({
        token_name: tokenName,
        token_hash: await hash(apiKey, ""),
        user_id: userId,
        created_by: `User:${userId}`,
      })
      .returning("*");
  }

  async clearUserAuthTokens() {
    return await this.knex<UserAuthenticationToken>(
      "user_authentication_token"
    ).delete();
  }

  async createSubscriptions(
    petitionIds: number[],
    endpoint: string,
    userId: number
  ) {
    return await this.knex<PetitionEventSubscription>(
      "petition_event_subscription"
    )
      .insert(
        petitionIds.map((petitionId) => ({
          petition_id: petitionId,
          user_id: userId,
          endpoint,
        }))
      )
      .returning("*");
  }

  async clearSubscriptions() {
    await this.knex("petition_event_subscription").delete();
  }
}

function randomPetitionStatus() {
  return faker.random.arrayElement(["DRAFT", "PENDING", "COMPLETED"] as const);
}

function randomPetitionFieldType() {
  return faker.random.arrayElement<PetitionFieldType>([
    "FILE_UPLOAD",
    "TEXT",
    "SELECT",
  ]);
}

function randomSupportedLocale() {
  return faker.random.arrayElement(["en", "es"]);
}

function randomPetitionFieldOptions(type: PetitionFieldType) {
  switch (type) {
    case "FILE_UPLOAD": {
      return {
        accepts: [faker.random.arrayElement(["PDF", "IMAGE", "VIDEO"])],
        multiple: faker.datatype.boolean(),
      };
    }
    case "TEXT": {
      return {
        multiline: faker.datatype.boolean(),
        placeholder: faker.random.words(3),
      };
    }
    case "SELECT": {
      return {
        values: ["Option 1", "Option 2", "Option 3"],
      };
    }
    default:
      return {};
  }
}
