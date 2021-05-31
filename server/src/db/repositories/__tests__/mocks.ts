import faker from "faker";
import { Knex } from "knex";
import { range } from "remeda";
import { hash, random } from "../../../util/token";
import {
  Contact,
  CreateContact,
  CreateFeatureFlag,
  CreateFileUpload,
  CreateOrganization,
  CreatePetition,
  CreatePetitionAccess,
  CreatePetitionField,
  CreatePetitionFieldReply,
  CreateTag,
  CreateUser,
  CreateUserGroup,
  FileUpload,
  Organization,
  Petition,
  PetitionAccess,
  PetitionEventSubscription,
  PetitionField,
  PetitionFieldReply,
  PetitionFieldType,
  PetitionPermission,
  PetitionPermissionType,
  Tag,
  User,
  UserAuthenticationToken,
  UserGroup,
  UserGroupMember,
} from "../../__types";

export class Mocks {
  constructor(public knex: Knex) {}

  async loadUserPermissionsByPetitionId(
    id: number
  ): Promise<PetitionPermission[]> {
    const { rows: permissions } = await this.knex.raw(
      /* sql */ `SELECT * from petition_permission where petition_id = ? and deleted_at is null`,
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

    await this.knex<PetitionPermission>("petition_permission").insert(
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
          name: faker.random.words(3),
          organization_id: orgId,
          ...builder?.(index),
        }))
      )
      .returning("*");
  }

  async tagPetitions(petitionIds: number[], tagId: number) {
    await this.knex("petition_tag").insert(
      petitionIds.map((petitionId) => ({
        petition_id: petitionId,
        tag_id: tagId,
      }))
    );
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
    permissionType: PetitionPermissionType
  ) {
    return await this.knex<PetitionPermission>("petition_permission")
      .insert(
        petitionIds.map((petitionId) => ({
          petition_id: petitionId,
          user_id: toUserId,
          type: permissionType,
        }))
      )
      .returning("*");
  }

  async clearSharedPetitions() {
    return await this.knex<PetitionPermission>("petition_permission")
      .whereNot("type", "OWNER")
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

  async createUserGroups(
    amount: number,
    orgId: number,
    builder?: (i: number) => Partial<UserGroup>
  ) {
    return await this.knex<UserGroup>("user_group").insert(
      range(0, amount).map<CreateUserGroup>((index) => ({
        name: faker.name.jobArea(),
        org_id: orgId,
        ...builder?.(index),
      })),
      "*"
    );
  }

  async insertUserGroupMembers(userGroupId: number, userIds: number[]) {
    return await this.knex<UserGroupMember>("user_group_member").insert(
      userIds.map((userId) => ({
        user_group_id: userGroupId,
        user_id: userId,
      })),
      "*"
    );
  }

  async sharePetitionWithGroups(petitionId: number, userGroupIds: number[]) {
    await this.knex<PetitionPermission>("petition_permission").insert(
      userGroupIds.map((groupId) => ({
        petition_id: petitionId,
        user_group_id: groupId,
        type: "WRITE",
      }))
    );

    const members = await this.knex<UserGroupMember>("user_group_member")
      .whereNull("deleted_at")
      .whereIn("user_group_id", userGroupIds);

    await this.knex<PetitionPermission>("petition_permission").insert(
      members.map((m) => ({
        petition_id: petitionId,
        from_user_group_id: m.user_group_id,
        user_id: m.user_id,
        type: "WRITE",
      }))
    );
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
        placeholder: faker.random.words(3),
      };
    }
    case "SHORT_TEXT": {
      return {
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
