import { faker } from "@faker-js/faker";
import { Knex } from "knex";
import { range } from "remeda";
import { USER_COGNITO_ID } from "../../../../test/mocks";
import { IEncryptionService } from "../../../services/EncryptionService";
import { defaultPdfDocumentTheme } from "../../../util/PdfDocumentTheme";
import { unMaybeArray } from "../../../util/arrays";
import { fullName } from "../../../util/fullName";
import { toGlobalId } from "../../../util/globalId";
import { generateEDKeyPair } from "../../../util/keyPairs";
import { removeNotDefined } from "../../../util/remedaExtensions";
import { safeJsonParse } from "../../../util/safeJsonParse";
import { titleize } from "../../../util/strings";
import { hash, random } from "../../../util/token";
import { MaybeArray, Replace } from "../../../util/types";
import {
  Contact,
  ContactAuthentication,
  ContactLocale,
  ContactLocaleValues,
  CreateContact,
  CreateFeatureFlag,
  CreateFeatureFlagOverride,
  CreateFileUpload,
  CreateOrgIntegration,
  CreateOrganization,
  CreateOrganizationTheme,
  CreatePetition,
  CreatePetitionAccess,
  CreatePetitionAttachment,
  CreatePetitionEventSubscription,
  CreatePetitionField,
  CreatePetitionFieldReply,
  CreateTag,
  CreateTemporaryFile,
  CreateUser,
  CreateUserData,
  CreateUserGroup,
  CreateUserGroupPermission,
  EmailLog,
  EventSubscriptionSignatureKey,
  FeatureFlagName,
  FileUpload,
  OrgIntegration,
  Organization,
  OrganizationTheme,
  OrganizationUsageLimit,
  OrganizationUsageLimitName,
  Petition,
  PetitionAccess,
  PetitionAttachment,
  PetitionAttachmentType,
  PetitionEvent,
  PetitionEventSubscription,
  PetitionEventType,
  PetitionEventTypeValues,
  PetitionField,
  PetitionFieldAttachment,
  PetitionFieldComment,
  PetitionFieldReply,
  PetitionFieldType,
  PetitionMessage,
  PetitionPermission,
  PetitionPermissionType,
  PetitionReminder,
  PetitionSignatureRequest,
  PetitionStatus,
  PetitionUserNotification,
  Profile,
  ProfileType,
  ProfileTypeField,
  ProfileTypeFieldType,
  ProfileTypeFieldTypeValues,
  PublicPetitionLink,
  Tag,
  TaskName,
  TemplateDefaultPermission,
  TemporaryFile,
  User,
  UserAuthenticationToken,
  UserData,
  UserGroup,
  UserGroupMember,
  UserGroupPermissionName,
  UserLocale,
  UserLocaleValues,
  UserPetitionEventLog,
} from "../../__types";
import { Task } from "../TaskRepository";

export class Mocks {
  constructor(public knex: Knex) {}

  async loadUserPermissionsByPetitionId(id: number): Promise<PetitionPermission[]> {
    const { rows: permissions } = await this.knex.raw(
      /* sql */ `SELECT * from petition_permission where petition_id = ? and deleted_at is null`,
      [id],
    );

    return permissions;
  }

  async loadPetition(id: number): Promise<Petition> {
    const {
      rows: [petition],
    } = await this.knex.raw(
      /* sql */ `SELECT * from petition where id = ? and deleted_at is null`,
      [id],
    );
    return petition;
  }

  async loadUserData(id: number) {
    const [data] = await this.knex
      .from<UserData>("user_data")
      .whereNull("deleted_at")
      .where("id", id)
      .select("*");

    return data;
  }

  async createSessionUserAndOrganization(orgBuilder?: () => Partial<Organization>) {
    const [organization] = await this.createRandomOrganizations(1, () => ({
      name: "Parallel",
      status: "DEV",
      ...orgBuilder?.(),
    }));
    const [user] = await this.createRandomUsers(
      organization.id,
      1,
      () => ({
        is_org_owner: true,
      }),
      () => ({ cognito_id: USER_COGNITO_ID, first_name: "Harvey", last_name: "Specter" }),
    );

    return { user, organization };
  }

  async createRandomOrganizations(
    amount: number,
    builder?: (index: number) => Partial<Organization>,
  ) {
    const orgs = await this.knex<Organization>("organization")
      .insert(
        range(0, amount).map<CreateOrganization>((index) => {
          return {
            name: faker.company.name(),
            status: "DEV",
            ...builder?.(index),
          };
        }),
      )
      .returning("*");

    if (orgs.length > 0) {
      await this.knex("organization_theme").insert(
        range(0, orgs.length).map<CreateOrganizationTheme>((index) => {
          const orgBuilderData = builder?.(index);
          return {
            type: "PDF_DOCUMENT",
            is_default: true,
            data: defaultPdfDocumentTheme,
            name: "Default",
            org_id: orgs[index].id,
            created_at: orgBuilderData?.created_at ?? undefined,
          };
        }),
      );

      const userGroups = await this.knex("user_group").insert(
        range(0, orgs.length).map<CreateUserGroup>((index) => ({
          org_id: orgs[index].id,
          name: "",
          localizable_name: { en: "All users", es: "Todos los usuarios" },
          type: "ALL_USERS",
        })),
        "*",
      );

      if (userGroups.length > 0) {
        await this.knex("user_group_permission").insert(
          [
            "PETITIONS:CHANGE_PATH",
            "PETITIONS:CREATE_TEMPLATES",
            "INTEGRATIONS:CRUD_API",
            "PROFILES:SUBSCRIBE_PROFILES",
            "PETITIONS:CREATE_PETITIONS",
            "PROFILES:CREATE_PROFILES",
            "PROFILES:CLOSE_PROFILES",
            "PROFILES:LIST_PROFILES",
            "PROFILE_ALERTS:LIST_ALERTS",
            "CONTACTS:LIST_CONTACTS",
            "USERS:LIST_USERS",
            "TEAMS:LIST_TEAMS",
          ].flatMap((name) =>
            userGroups.map((userGroup) => ({
              user_group_id: userGroup.id,
              effect: "GRANT",
              name: name as UserGroupPermissionName,
            })),
          ),
        );
      }
    }

    return orgs;
  }

  async createRandomUsers(
    orgId: number,
    amount?: number,
    userBuilder?: (index: number) => Partial<User>,
    userDataBuilder?: (index: number) => Partial<UserData>,
  ) {
    const userDatas = await this.knex<UserData>("user_data").insert(
      range(0, amount || 1).map<CreateUserData>((index) => {
        const firstName = faker.person.firstName();
        const lastName = faker.person.lastName();
        return {
          first_name: firstName,
          last_name: lastName,
          email: faker.internet.email({ firstName, lastName }).toLowerCase(),
          cognito_id: faker.string.uuid(),
          preferred_locale: randomUserPreferredLocale(),
          ...userDataBuilder?.(index),
        };
      }),
      "*",
    );

    const users = await this.knex<User>("user")
      .insert(
        range(0, amount || 1).map<CreateUser>((index) => {
          const userData = userDatas[index];
          return {
            user_data_id: userData.id,
            org_id: orgId,
            ...userBuilder?.(index),
          };
        }),
      )
      .returning("*");

    const [allUsersGroup] = await this.knex
      .from<UserGroup>("user_group")
      .where({ type: "ALL_USERS", org_id: orgId })
      .select("*");

    if (!allUsersGroup) {
      throw new Error(`Organization:${orgId} does not have an ALL_USERS group`);
    }

    if (users.length > 0) {
      await this.knex.from("user_group_member").insert(
        users.map((user) => ({
          user_id: user.id,
          user_group_id: allUsersGroup.id,
        })),
      );
    }
    return users;
  }

  async createFeatureFlags(featureFlags: CreateFeatureFlag[]) {
    await this.knex.into("feature_flag").insert(featureFlags);
  }

  async updateFeatureFlag(name: FeatureFlagName, value: boolean) {
    await this.knex.from("feature_flag").where({ name }).update({ default_value: value });
  }

  async createFeatureFlagOverride(
    featureFlag: FeatureFlagName,
    override: Pick<CreateFeatureFlagOverride, "user_id" | "org_id" | "value">,
  ) {
    await this.knex.into("feature_flag_override").insert({
      feature_flag_name: featureFlag,
      ...override,
    });
  }

  async createRandomContacts(
    orgId: number,
    amount: number,
    builder?: (index: number) => Partial<Contact>,
  ) {
    return await this.knex<Contact>("contact")
      .insert(
        range(0, amount).map<CreateContact>((index) => {
          const firstName = faker.person.firstName();
          const lastName = faker.person.lastName();
          return {
            org_id: orgId,
            first_name: firstName,
            last_name: lastName,
            email: faker.internet.email({ firstName, lastName }).toLowerCase(),
            ...builder?.(index),
          };
        }),
      )
      .returning("*");
  }

  async createRandomPetitions(
    orgId: number,
    ownerId: number,
    amount?: number,
    builder?: (index: number) => Partial<Petition>,
    permissionBuilder?: (index: number) => Partial<PetitionPermission>,
  ) {
    const [theme] = await this.knex("organization_theme")
      .where({
        type: "PDF_DOCUMENT",
        is_default: true,
        org_id: orgId,
        deleted_at: null,
      })
      .select("*");
    const petitions = await this.knex<Petition>("petition")
      .insert(
        range(0, amount || 1).map<CreatePetition>((index) => {
          const locale = randomContactLocale();
          return {
            org_id: orgId,
            is_template: false,
            status: builder?.(index).is_template ? null : randomPetitionStatus(),
            name: faker.word.words(),
            recipient_locale: locale,
            document_organization_theme_id: theme.id,
            ...builder?.(index),
          };
        }),
      )
      .returning("*");

    await this.knex<PetitionPermission>("petition_permission").insert(
      petitions.map(({ id }, index) => ({
        created_by: `User:${ownerId}`,
        petition_id: id,
        user_id: ownerId,
        ...permissionBuilder?.(index),
      })),
    );

    return petitions;
  }

  async createRandomTemplates(
    orgId: number,
    ownerId: number,
    amount?: number,
    builder?: (index: number) => Partial<Petition>,
    permissionBuilder?: (index: number) => Partial<PetitionPermission>,
  ) {
    const [theme] = await this.knex("organization_theme")
      .where({
        type: "PDF_DOCUMENT",
        is_default: true,
        org_id: orgId,
        deleted_at: null,
      })
      .select("*");
    const petitions = await this.knex<Petition>("petition")
      .insert(
        range(0, amount || 1).map<CreatePetition>((index) => {
          const locale = randomContactLocale();
          return {
            org_id: orgId,
            is_template: true,
            status: null,
            name: faker.word.words(),
            recipient_locale: locale,
            document_organization_theme_id: theme.id,
            ...builder?.(index),
          };
        }),
      )
      .returning("*");

    await this.knex<PetitionPermission>("petition_permission").insert(
      petitions.map(({ id }, index) => ({
        created_by: `User:${ownerId}`,
        petition_id: id,
        user_id: ownerId,
        ...permissionBuilder?.(index),
      })),
    );

    return petitions;
  }

  async createRandomPetitionFields(
    petitionId: number,
    amount: number,
    builder?: (index: number) => Partial<PetitionField>,
  ) {
    const [{ count }] = await this.knex("petition_field")
      .where("petition_id", petitionId)
      .whereNull("deleted_at")
      .select<{ count: number }[]>(this.knex.raw(`count(*)::int as count`));

    return await this.knex<PetitionField>("petition_field")
      .insert(
        range(0, amount).map<CreatePetitionField>((index) => {
          const data = builder?.(index) ?? {};
          const type = data.type ?? randomPetitionFieldType();
          return {
            petition_id: petitionId,
            position: data.position ?? (count as number) + index,
            title: faker.word.words(),
            type: type,
            options: randomPetitionFieldOptions(type),
            ...removeNotDefined(data),
          };
        }),
      )
      .returning("*");
  }

  async createRandomTextReply(
    textFieldId: number,
    accessId?: number,
    amount?: number,
    builder?: (index: number) => Partial<PetitionFieldReply>,
  ) {
    return await this.knex<PetitionFieldReply>("petition_field_reply")
      .insert(
        range(0, amount || 1).map<CreatePetitionFieldReply>((index) => {
          return {
            petition_field_id: textFieldId,
            content: { value: faker.lorem.words(10) },
            type: "TEXT",
            petition_access_id: accessId,
            ...builder?.(index),
          };
        }),
      )
      .returning("*");
  }

  async createRandomNumberReply(
    numberFieldId: number,
    accessId?: number,
    amount?: number,
    builder?: (index: number) => Partial<PetitionFieldReply>,
    min?: number,
    max?: number,
  ) {
    return await this.knex<PetitionFieldReply>("petition_field_reply")
      .insert(
        range(0, amount || 1).map<CreatePetitionFieldReply>((index) => {
          return {
            petition_field_id: numberFieldId,
            content: {
              value: faker.number.int({
                min,
                max,
              }),
            },
            type: "NUMBER",
            petition_access_id: accessId,
            ...builder?.(index),
          };
        }),
      )
      .returning("*");
  }

  async createRandomDateReply(
    dateFieldId: number,
    accessId?: number,
    amount?: number,
    builder?: (index: number) => Partial<PetitionFieldReply>,
  ) {
    return await this.knex<PetitionFieldReply>("petition_field_reply")
      .insert(
        range(0, amount || 1).map<CreatePetitionFieldReply>((index) => {
          return {
            petition_field_id: dateFieldId,
            content: {
              value: faker.date.soon({ days: 10 }).toISOString().substring(0, 10),
            },
            type: "DATE",
            petition_access_id: accessId,
            ...builder?.(index),
          };
        }),
      )
      .returning("*");
  }

  async createRandomDatetimeReply(
    dateFieldId: number,
    accessId?: number,
    amount?: number,
    builder?: (index: number) => Partial<PetitionFieldReply>,
  ) {
    return await this.knex<PetitionFieldReply>("petition_field_reply")
      .insert(
        range(0, amount || 1).map<CreatePetitionFieldReply>((index) => {
          const value = faker.date.soon({ days: 10 }).toISOString();
          return {
            petition_field_id: dateFieldId,
            content: {
              value,
              datetime: value.substring(0, 16),
              timezone: "Europe/Madrid",
            },
            type: "DATE_TIME",
            petition_access_id: accessId,
            ...builder?.(index),
          };
        }),
      )
      .returning("*");
  }

  async createRandomPhoneReply(
    phoneFieldId: number,
    accessId?: number,
    amount?: number,
    builder?: (index: number) => Partial<PetitionFieldReply>,
  ) {
    const phoneNumbers = [
      "+44 7911 123456",
      "+1-212-456-7890",
      "+37060112345",
      "+442012341234",
      "+1-541-754-3010",
      "+49-89-636-48018",
      "+34 625 15 54 81",
      "+7 (952) 814 16 48",
    ];

    return await this.knex<PetitionFieldReply>("petition_field_reply")
      .insert(
        range(0, amount || 1).map<CreatePetitionFieldReply>((index) => {
          return {
            petition_field_id: phoneFieldId,
            content: {
              value: phoneNumbers[Math.floor(Math.random() * phoneNumbers.length)],
            },
            type: "PHONE",
            petition_access_id: accessId,
            ...builder?.(index),
          };
        }),
      )
      .returning("*");
  }

  async createRandomFileUploadReply(
    fieldId: number,
    accessId?: number,
    amount?: number,
    builder?: (index: number) => Partial<PetitionFieldReply>,
    fileUploadBuilder?: (index: number) => Partial<FileUpload>,
  ) {
    const fileUploads = await this.createRandomFileUpload(amount, fileUploadBuilder);
    return await this.knex<PetitionFieldReply>("petition_field_reply")
      .insert(
        range(0, amount || 1).map<CreatePetitionFieldReply>((index) => {
          return {
            petition_field_id: fieldId,
            content: { file_upload_id: fileUploads[index].id },
            type: "FILE_UPLOAD",
            petition_access_id: accessId,
            ...builder?.(index),
          };
        }),
      )
      .returning("*");
  }

  async createFieldGroupReply(
    fieldId: number,
    accessId?: number,
    amount?: number,
    builder?: (index: number) => Partial<PetitionFieldReply>,
  ) {
    return await this.knex<PetitionFieldReply>("petition_field_reply")
      .insert(
        range(0, amount || 1).map<CreatePetitionFieldReply>((index) => {
          return {
            petition_field_id: fieldId,
            content: {},
            type: "FIELD_GROUP",
            petition_access_id: accessId,
            ...builder?.(index),
          };
        }),
      )
      .returning("*");
  }

  async createRandomFileUpload(amount?: number, builder?: (index: number) => Partial<FileUpload>) {
    return await this.knex<FileUpload>("file_upload")
      .insert(
        range(0, amount || 1).map<CreateFileUpload>((index) => ({
          content_type: "application/pdf",
          filename: "file.pdf",
          path: random(16),
          size: "100",
          upload_complete: true,
          ...builder?.(index),
        })),
      )
      .returning("*");
  }

  async createRandomEsTaxDocumentsReply(
    fieldId: number,
    accessId?: number,
    amount?: number,
    builder?: (index: number) => Partial<PetitionFieldReply>,
  ) {
    const fileUploads = await this.createRandomFileUpload(amount);
    return await this.knex<PetitionFieldReply>("petition_field_reply")
      .insert(
        range(0, amount || 1).map<CreatePetitionFieldReply>((index) => {
          return {
            petition_field_id: fieldId,
            type: "ES_TAX_DOCUMENTS",
            content: {
              file_upload_id: fileUploads[index].id,
              request: { model: { type: "AEAT_IRPF_DATOS_FISCALES" } },
              json_contents: {},
              bankflip_session_id: random(16),
            },
            petition_access_id: accessId,
            ...builder?.(index),
          };
        }),
      )
      .returning("*");
  }

  async createRandomTemporaryFile(
    amount?: number,
    builder?: (index: number) => Partial<TemporaryFile>,
  ) {
    return await this.knex<TemporaryFile>("temporary_file")
      .insert(
        range(0, amount || 1).map<CreateTemporaryFile>((index) => ({
          content_type: "application/pdf",
          filename: "file.pdf",
          path: random(16),
          size: "100",
          ...builder?.(index),
        })),
      )
      .returning("*");
  }

  async createPetitionFieldAttachment(fieldId: number, amount?: number, files?: FileUpload[]) {
    const fileUploads = files ?? (await this.createRandomFileUpload(amount));
    return await this.knex<PetitionFieldAttachment>("petition_field_attachment")
      .insert(
        fileUploads.map((file) => ({
          file_upload_id: file.id,
          petition_field_id: fieldId,
        })),
      )
      .returning("*");
  }

  async createPetitionAttachment(
    petitionId: number,
    type: PetitionAttachmentType,
    amount?: number,
    builder?: (i: number) => Partial<PetitionAttachment>,
    builderFileUploads?: (i: number) => Partial<FileUpload>,
  ) {
    const fileUploads = await this.createRandomFileUpload(amount ?? 1, builderFileUploads);

    const [{ position }] = await this.knex
      .from("petition_attachment")
      .where({ petition_id: petitionId, type, deleted_at: null })
      .select(this.knex.raw(`coalesce(max("position") + 1, 0) as position`));

    return await this.knex<PetitionAttachment>("petition_attachment")
      .insert(
        range(0, amount || 1).map<CreatePetitionAttachment>((i) => ({
          petition_id: petitionId,
          file_upload_id: fileUploads[i].id,
          type,
          position: position + i,
          ...builder?.(i),
        })),
      )
      .returning("*");
  }

  async createRandomFileReply(
    fieldId: number,
    amount?: number,
    builder?: (index: number) => Partial<PetitionFieldReply>,
  ) {
    const fileUploads = await this.createRandomFileUpload(amount || 1);
    return await this.knex<PetitionFieldReply>("petition_field_reply")
      .insert(
        range(0, amount || 1).map<CreatePetitionFieldReply>((index) => {
          return {
            petition_field_id: fieldId,
            type: "FILE_UPLOAD",
            content: { file_upload_id: fileUploads[index].id },
            ...builder?.(index),
          };
        }),
      )
      .returning("*");
  }

  async createRandomTags(
    orgId: number,
    amount?: number,
    builder?: (index: number) => Partial<Tag>,
  ) {
    return await this.knex<Tag>("tag")
      .insert(
        range(0, amount || 1).map<CreateTag>((index) => ({
          color: "#000000",
          name: faker.word.words(3),
          organization_id: orgId,
          ...builder?.(index),
        })),
      )
      .returning("*");
  }

  async tagPetitions(petitionIds: number[], tagId: number) {
    await this.knex("petition_tag").insert(
      petitionIds.map((petitionId) => ({
        petition_id: petitionId,
        tag_id: tagId,
      })),
    );
  }

  async createPetitionAccess(
    petitionId: number,
    ownerId: number,
    contactIds: number[] | null[],
    createdByUserId: number,
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
        })),
      )
      .returning("*");
  }

  async sharePetitions(
    petitionIds: number[],
    toUserId: number,
    permissionType: PetitionPermissionType,
    builder?: () => Partial<PetitionPermission>,
  ) {
    return await this.knex<PetitionPermission>("petition_permission")
      .insert(
        petitionIds.map((petitionId) => ({
          petition_id: petitionId,
          user_id: toUserId,
          type: permissionType,
          ...builder?.(),
        })),
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
    const [auth] = await this.knex<UserAuthenticationToken>("user_authentication_token")
      .insert({
        token_name: tokenName,
        token_hash: await hash(apiKey, ""),
        user_id: userId,
        created_by: `User:${userId}`,
      })
      .returning("*");

    return { apiKey, auth };
  }

  async clearUserAuthTokens() {
    return await this.knex<UserAuthenticationToken>("user_authentication_token").delete();
  }

  async createUserGroups(
    amount: number,
    orgId: number,
    permissions: MaybeArray<Omit<CreateUserGroupPermission, "user_group_id">> = [],
    builder?: (i: number) => Partial<UserGroup>,
  ) {
    const groups = await this.knex<UserGroup>("user_group").insert(
      range(0, amount).map<CreateUserGroup>((index) => ({
        name: faker.person.jobArea(),
        org_id: orgId,
        ...builder?.(index),
      })),
      "*",
    );

    if (unMaybeArray(permissions).length > 0 && groups.length > 0) {
      await this.knex("user_group_permission").insert(
        unMaybeArray(permissions).flatMap((permission) =>
          groups.map((group) => ({ ...permission, user_group_id: group.id })),
        ),
      );
    }

    return groups;
  }

  async insertUserGroupMembers(userGroupId: number, userIds: number[]) {
    return await this.knex<UserGroupMember>("user_group_member").insert(
      userIds.map((userId) => ({
        user_group_id: userGroupId,
        user_id: userId,
      })),
      "*",
    );
  }

  async sharePetitionWithGroups(
    petitionId: number,
    userGroupIds: number[],
    permissionType?: PetitionPermissionType,
  ) {
    await this.knex<PetitionPermission>("petition_permission").insert(
      userGroupIds.map((groupId) => ({
        petition_id: petitionId,
        user_group_id: groupId,
        type: permissionType ?? "WRITE",
      })),
    );

    const members = await this.knex<UserGroupMember>("user_group_member")
      .whereNull("deleted_at")
      .whereIn("user_group_id", userGroupIds);

    await this.knex<PetitionPermission>("petition_permission").insert(
      members.map((m) => ({
        petition_id: petitionId,
        from_user_group_id: m.user_group_id,
        user_id: m.user_id,
        type: permissionType ?? "WRITE",
      })),
    );
  }

  async automaticShareTemplateWithUsers(templateId: number, userIds: number[]) {
    await this.knex<PetitionPermission>("template_default_permission").insert(
      userIds.map((userId, i) => ({
        template_id: templateId,
        user_id: userId,
        type: "WRITE",
      })),
    );
  }

  async automaticShareTemplateWithGroups(templateId: number, userGroupIds: number[]) {
    await this.knex<PetitionPermission>("template_default_permission").insert(
      userGroupIds.map((groupId, i) => ({
        template_id: templateId,
        user_group_id: groupId,
        type: "WRITE",
      })),
    );
  }

  async createContactAuthentication(contactId: number) {
    const cookieValue = random(48);
    await this.knex<ContactAuthentication>("contact_authentication").insert({
      contact_id: contactId,
      cookie_value_hash: await hash(cookieValue, contactId.toString()),
    });
    return cookieValue;
  }

  async clearUserNotifications() {
    return await this.knex<PetitionUserNotification>("petition_user_notification").delete();
  }

  createRandomCommentContent() {
    return range(0, faker.number.int({ min: 1, max: 5 })).map(() => ({
      type: "paragraph" as const,
      children: [{ text: faker.lorem.words() }],
    }));
  }

  async createRandomCommentsFromUser(
    userId: number,
    petitionFieldId: number,
    petitionId: number,
    amount?: number,
    builder?: (index: number) => Partial<PetitionFieldComment>,
  ) {
    const content = this.createRandomCommentContent();
    return await this.knex<PetitionFieldComment>("petition_field_comment")
      .insert(
        range(0, amount || 1).map((i) => ({
          content_json: this.knex.raw("?::jsonb", JSON.stringify(content)),
          user_id: userId,
          petition_field_id: petitionFieldId,
          petition_id: petitionId,
          ...builder?.(i),
        })),
      )
      .returning("*");
  }

  async mentionUserInComment(userId: number, commentId: number) {
    const [user] = await this.knex<User>("user").where("id", userId).select("*");
    const [userData] = await this.knex<UserData>("user_data")
      .where("id", user.user_data_id)
      .select("*");

    const userName = fullName(userData.first_name, userData.last_name);
    const [comment] = await this.knex<PetitionFieldComment>("petition_field_comment")
      .where("id", commentId)
      .select("*");

    const newContentJson = (safeJsonParse(comment.content_json) ?? []).concat({
      type: "paragraph",
      children: [
        {
          type: "mention",
          mention: toGlobalId("User", userId),
          children: [{ text: userName }],
        },
      ],
    });

    await this.knex<PetitionFieldComment>("petition_field_comment")
      .update({
        content_json: this.knex.raw("?::jsonb", JSON.stringify(newContentJson)),
      })
      .where("id", commentId)
      .returning("*");
  }

  async mentionUserGroupInComment(userGroupId: number, commentId: number) {
    const [userGroup] = await this.knex<UserGroup>("user_group")
      .where("id", userGroupId)
      .select("*");

    const [comment] = await this.knex<PetitionFieldComment>("petition_field_comment")
      .where("id", commentId)
      .select("*");

    const newContentJson = (safeJsonParse(comment.content_json) ?? []).concat({
      type: "paragraph",
      children: [
        {
          type: "mention",
          mention: toGlobalId("UserGroup", userGroupId),
          children: [{ text: userGroup.name }],
        },
      ],
    });

    await this.knex<PetitionFieldComment>("petition_field_comment")
      .update({
        content_json: this.knex.raw("?::jsonb", JSON.stringify(newContentJson)),
      })
      .where("id", commentId)
      .returning("*");
  }

  async createRandomCommentsFromAccess(
    petitionAccessId: number,
    petitionFieldId: number,
    petitionId: number,
    amount?: number,
    builder?: (index: number) => Partial<PetitionFieldComment>,
  ) {
    const content = this.createRandomCommentContent();
    return await this.knex<PetitionFieldComment>("petition_field_comment")
      .insert(
        range(0, amount || 1).map((i) => ({
          content_json: this.knex.raw("?::jsonb", JSON.stringify(content)),
          petition_access_id: petitionAccessId,
          petition_field_id: petitionFieldId,
          petition_id: petitionId,
          ...builder?.(i),
        })),
      )
      .returning("*");
  }

  async createRandomPetitionMessage(
    petitionId: number,
    petitionAccessId: number,
    senderId: number,
    builder?: () => Partial<PetitionMessage>,
  ) {
    return await this.knex<PetitionMessage>("petition_message")
      .insert({
        email_body: faker.lorem.paragraphs(),
        email_subject: faker.lorem.words(),
        petition_access_id: petitionAccessId,
        petition_id: petitionId,
        sender_id: senderId,
        status: "PROCESSED",
        ...builder?.(),
      })
      .returning("*");
  }

  async createRandomPetitionReminder(
    petitionAccessId: number,
    senderId: number,
    builder?: () => Partial<PetitionReminder>,
  ) {
    return await this.knex<PetitionReminder>("petition_reminder").insert({
      email_body: faker.lorem.paragraphs(),
      petition_access_id: petitionAccessId,
      sender_id: senderId,
      status: "PROCESSED",
      type: "MANUAL",
      ...builder?.(),
    });
  }

  async createRandomEmailLog(amount?: number) {
    return await this.knex<EmailLog>("email_log")
      .insert(
        range(0, amount || 1).map(() => ({
          to: faker.internet.email(),
          from: faker.internet.email(),
          subject: faker.lorem.words(),
          text: faker.lorem.paragraphs(),
          html: faker.lorem.paragraphs(),
          track_opens: false,
          created_at: new Date(),
          created_from: faker.internet.email(),
        })),
      )
      .returning("*");
  }

  async createRandomPublicPetitionLink(
    templateId: number,
    builder?: () => Partial<PublicPetitionLink>,
  ) {
    const [data] = await this.knex<PublicPetitionLink>("public_petition_link")
      .insert({
        template_id: templateId,
        description: faker.lorem.paragraph(),
        title: faker.lorem.words(),
        is_active: true,
        slug: faker.lorem.words(3).replaceAll(" ", "-").toLowerCase(),
        ...builder?.(),
      })
      .returning("*");

    return data;
  }

  async createTemplateDefaultOwner(templateId: number, userId: number) {
    const [row] = await this.knex<TemplateDefaultPermission>("template_default_permission")
      .insert({
        type: "OWNER",
        user_id: userId,
        template_id: templateId,
        is_subscribed: true,
      })
      .returning("*");
    return row;
  }

  async createOrganizationUsageLimit(
    orgId: number,
    limitName: OrganizationUsageLimitName,
    limit: number,
  ) {
    const [row] = await this.knex<OrganizationUsageLimit>("organization_usage_limit")
      .insert({ limit, limit_name: limitName, org_id: orgId, period: "P1M" as any })
      .returning("*");
    return row;
  }

  async createOrgIntegration(
    data: MaybeArray<Replace<CreateOrgIntegration, { name?: string | null }>>,
  ) {
    const dataArr = unMaybeArray(data).map((d) => ({
      ...d,
      name: d.name ?? titleize(d.provider),
    }));
    if (dataArr.length === 0) {
      return [];
    }
    return await this.knex<OrgIntegration>("org_integration").insert(dataArr, "*");
  }

  async createEventSubscription(data: MaybeArray<CreatePetitionEventSubscription>) {
    const dataArr = unMaybeArray(data);
    if (dataArr.length === 0) {
      return [];
    }
    return await this.knex<PetitionEventSubscription>("petition_event_subscription").insert(
      dataArr.map((d) => ({
        ...d,
        event_types: d.event_types ? this.knex.raw(`?::json`, JSON.stringify(d.event_types)) : null,
      })),
      "*",
    );
  }

  async createTask<TName extends TaskName>(data: Partial<Task<TName>>) {
    const [task] = await this.knex<Task<TName>>("task").insert(data, "*");
    return task;
  }

  async createCheckboxReply(
    fieldId: number,
    userOrAccess: { userId?: number; accessId?: number },
    value: string[],
  ) {
    const [reply] = await this.knex
      .from<PetitionFieldReply>("petition_field_reply")
      .insert({
        content: { value },
        petition_field_id: fieldId,
        ...(userOrAccess.userId
          ? { user_id: userOrAccess.userId! }
          : { petition_access_id: userOrAccess.accessId! }),
        status: "PENDING",
        type: "CHECKBOX",
      })
      .returning("*");

    return reply;
  }

  async createRandomPetitionEvents(
    userId: number,
    petitionId: number,
    amount: number,
    types?: PetitionEventType[],
  ) {
    const eventTypes = types ?? PetitionEventTypeValues;
    const petitionEvents = await this.knex<PetitionEvent>("petition_event")
      .insert(
        range(0, amount || 1).map(() => ({
          type: eventTypes[Math.floor(Math.random() * eventTypes.length)],
          data: {},
          petition_id: petitionId,
        })),
      )
      .returning("*");

    await this.knex<UserPetitionEventLog>("user_petition_event_log")
      .insert(
        petitionEvents.map((e) => ({
          petition_event_id: e.id,
          user_id: userId,
        })),
      )
      .returning("*");

    return petitionEvents;
  }

  async createRandomPetitionSignatureRequest(
    petitionId: number,
    builder?: () => Partial<PetitionSignatureRequest>,
  ) {
    return await this.knex<PetitionSignatureRequest>("petition_signature_request").insert(
      {
        petition_id: petitionId,
        status: "PROCESSED",
        signature_config: {
          orgIntegrationId: 1,
          signersInfo: [],
          timezone: "Europe/Madrid",
          title: "sign this!",
          allowAdditionalSigners: true,
          review: false,
        },
        data: {},
        event_logs: [],
        ...builder?.(),
      },
      "*",
    );
  }

  async createOrganizationThemes(
    orgId: number,
    amount?: number,
    builder?: (i: number) => Partial<OrganizationTheme>,
  ) {
    return await this.knex<OrganizationTheme>("organization_theme")
      .insert(
        range(0, amount || 1).map((i) => ({
          org_id: orgId,
          name: faker.person.jobDescriptor(),
          data: defaultPdfDocumentTheme,
          is_default: false,
          ...builder?.(i),
        })),
      )
      .returning("*");
  }

  async createEventSubscriptionSignatureKey(
    subscriptionId: number,
    encryption: IEncryptionService,
    amount?: number,
  ) {
    return await this.knex<EventSubscriptionSignatureKey>(
      "event_subscription_signature_key",
    ).insert(
      range(0, amount || 1).map(() => {
        const { privateKey, publicKey } = generateEDKeyPair();
        return {
          event_subscription_id: subscriptionId,
          public_key: publicKey.toString("base64"),
          private_key: encryption.encrypt(privateKey.toString("base64"), "base64"),
        };
      }),
      "*",
    );
  }

  async createRandomProfileTypes(
    orgId: number,
    amount?: number,
    builder?: (i: number) => Partial<ProfileType>,
  ) {
    return await this.knex<ProfileType>("profile_type").insert(
      range(0, amount || 1).map((i) => ({
        org_id: orgId,
        name: this.knex.raw(
          "?::jsonb",
          JSON.stringify({ es: faker.word.words(2), en: faker.word.words(2) }),
        ),
        ...builder?.(i),
      })),
      "*",
    );
  }

  async createRandomProfileTypeFields(
    orgId: number,
    profileTypeId: number,
    amount?: number,
    builder?: (i: number) => Partial<ProfileTypeField>,
  ) {
    const [{ max }] = await this.knex("profile_type_field")
      .where("profile_type_id", profileTypeId)
      .whereNull("deleted_at")
      .max("position");

    return await this.knex<ProfileTypeField>("profile_type_field").insert(
      range(0, amount || 1).map((i) => {
        const type = randomProfileTypeFieldType();
        return {
          profile_type_id: profileTypeId,
          position: (max ?? -1) + 1 + i,
          name: this.knex.raw(
            "?::jsonb",
            JSON.stringify({ es: faker.word.words(2), en: faker.word.words(2) }),
          ),
          type,
          options: randomProfileTypeFieldOptions(type),
          ...builder?.(i),
        };
      }),
      "*",
    );
  }

  async createRandomProfiles(
    orgId: number,
    profileTypeId: number,
    amount?: number,
    builder?: (i: number) => Partial<Profile>,
  ) {
    return await this.knex<Profile>("profile").insert(
      range(0, amount || 1).map((i) => ({
        name: faker.word.words(2),
        org_id: orgId,
        profile_type_id: profileTypeId,
        ...builder?.(i),
      })),
      "*",
    );
  }
}

function randomPetitionStatus() {
  return faker.helpers.arrayElement<PetitionStatus>(["DRAFT", "PENDING", "COMPLETED"]);
}

function randomPetitionFieldType() {
  return faker.helpers.arrayElement<PetitionFieldType>(["FILE_UPLOAD", "TEXT", "SELECT"]);
}

function randomContactLocale() {
  return faker.helpers.arrayElement<ContactLocale>(ContactLocaleValues);
}

function randomUserPreferredLocale() {
  return faker.helpers.arrayElement<UserLocale>(UserLocaleValues);
}

function randomProfileTypeFieldType() {
  return faker.helpers.arrayElement<ProfileTypeFieldType>(ProfileTypeFieldTypeValues);
}

function randomProfileTypeFieldOptions(type: ProfileTypeFieldType) {
  switch (type) {
    case "DATE": {
      return { useReplyAsExpiryDate: faker.datatype.boolean() };
    }
    default: {
      return {};
    }
  }
}

function randomPetitionFieldOptions(type: PetitionFieldType) {
  switch (type) {
    case "FILE_UPLOAD": {
      return {
        accepts: [faker.helpers.arrayElement(["PDF", "IMAGE", "VIDEO"])],
        multiple: faker.datatype.boolean(),
      };
    }
    case "TEXT": {
      return {
        placeholder: faker.word.words(3),
      };
    }
    case "SHORT_TEXT": {
      return {
        placeholder: faker.word.words(3),
      };
    }
    case "SELECT": {
      return {
        values: ["Option 1", "Option 2", "Option 3"],
      };
    }
    case "CHECKBOX": {
      return {
        values: ["A", "B", "C"],
        limit: { type: "UNLIMITED" },
      };
    }
    case "DYNAMIC_SELECT": {
      return {
        labels: ["Country", "City"],
        values: [
          ["Spain", ["Madrid", "Barcelona", "Sevilla"]],
          ["France", ["Paris", "Lyon"]],
          ["Italy", ["Rome", "Milan", "Venice"]],
        ],
      };
    }
    default:
      return {};
  }
}
