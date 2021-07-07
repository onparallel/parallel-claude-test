import { Knex } from "knex";
import { createTestContainer } from "../../../test/testContainer";
import { WorkerContext } from "../../context";
import { KNEX } from "../../db/knex";
import { Mocks } from "../../db/repositories/__tests__/mocks";
import {
  Organization,
  Petition,
  PetitionAccess,
  PetitionField,
  PetitionUserNotification,
  User,
} from "../../db/__types";
import { userNotificationsListener } from "../event-listeners/user-notifications-listener";

describe("Worker - User Notifications Listener", () => {
  let ctx: WorkerContext;
  let knex: Knex;
  let mocks: Mocks;

  let users: User[];
  let organization: Organization;
  let petition: Petition;
  let field: PetitionField;
  let access: PetitionAccess;

  beforeAll(async () => {
    const container = createTestContainer();
    ctx = container.get<WorkerContext>(WorkerContext);
    knex = container.get<Knex>(KNEX);
    mocks = new Mocks(knex);

    [organization] = await mocks.createRandomOrganizations(1);
    users = await mocks.createRandomUsers(organization.id, 2);
    [petition] = await mocks.createRandomPetitions(
      organization.id,
      users[0].id,
      1
    );

    [field] = await mocks.createRandomPetitionFields(petition.id, 1, () => ({
      type: "SHORT_TEXT",
    }));

    await mocks.sharePetitions([petition.id], users[1].id, "READ");

    const [contact] = await mocks.createRandomContacts(organization.id, 1);
    [access] = await mocks.createPetitionAccess(
      petition.id,
      users[0].id,
      [contact.id],
      users[0].id
    );
  });

  afterEach(async () => {
    await mocks.clearUserNotifications();
  });

  afterAll(async () => {
    await knex.destroy();
  });

  it("users should receive a notification when a recipient completes the petition", async () => {
    await userNotificationsListener(
      {
        id: 1,
        created_at: new Date(),
        type: "PETITION_COMPLETED",
        petition_id: petition.id,
        data: {
          petition_access_id: access.id,
        },
      },
      ctx
    );

    const notifications = await knex<PetitionUserNotification>(
      "petition_user_notification"
    )
      .where({ petition_id: petition.id })
      .select(
        "is_read",
        "processed_at",
        "data",
        "petition_id",
        "type",
        "user_id"
      );

    expect(notifications).toEqual(
      users.map((user) => ({
        is_read: false,
        processed_at: null,
        petition_id: petition.id,
        type: "PETITION_COMPLETED",
        user_id: user.id,
        data: {
          petition_access_id: access.id,
        },
      }))
    );
  });

  it("users should receive a notification when a recipient comments a field", async () => {
    const [comment] = await mocks.createRandomCommentsFromAccess(
      access.id,
      field.id,
      petition.id
    );
    await userNotificationsListener(
      {
        id: 1,
        created_at: new Date(),
        type: "COMMENT_PUBLISHED",
        petition_id: petition.id,
        data: {
          petition_field_comment_id: comment.id,
          petition_field_id: field.id,
        },
      },
      ctx
    );

    const notifications = await knex<PetitionUserNotification>(
      "petition_user_notification"
    )
      .where({ petition_id: petition.id })
      .select(
        "is_read",
        "processed_at",
        "data",
        "petition_id",
        "type",
        "user_id"
      );

    expect(notifications).toEqual(
      users.map((user) => ({
        is_read: false,
        processed_at: null,
        petition_id: petition.id,
        type: "COMMENT_CREATED",
        user_id: user.id,
        data: {
          petition_field_id: field.id,
          petition_field_comment_id: comment.id,
        },
      }))
    );
  });

  it("users should receive a notification when another user comments a field", async () => {
    const [comment] = await mocks.createRandomCommentsFromUser(
      users[1].id,
      field.id,
      petition.id
    );
    await userNotificationsListener(
      {
        id: 1,
        created_at: new Date(),
        type: "COMMENT_PUBLISHED",
        petition_id: petition.id,
        data: {
          petition_field_comment_id: comment.id,
          petition_field_id: field.id,
        },
      },
      ctx
    );

    const notifications = await knex<PetitionUserNotification>(
      "petition_user_notification"
    )
      .where({ petition_id: petition.id })
      .select(
        "is_read",
        "processed_at",
        "data",
        "petition_id",
        "type",
        "user_id"
      );

    expect(notifications).toEqual([
      {
        is_read: false,
        processed_at: null,
        petition_id: petition.id,
        type: "COMMENT_CREATED",
        user_id: users[0].id,
        data: {
          petition_field_id: field.id,
          petition_field_comment_id: comment.id,
        },
      },
    ]);
  });

  it("users should receive a notification when a petition is shared to them", async () => {
    const [newUser] = await mocks.createRandomUsers(organization.id, 1);
    await userNotificationsListener(
      {
        id: 1,
        created_at: new Date(),
        type: "USER_PERMISSION_ADDED",
        petition_id: petition.id,
        data: {
          permission_type: "READ",
          permission_user_id: newUser.id,
          user_id: users[0].id,
        },
      },
      ctx
    );

    const notifications = await knex<PetitionUserNotification>(
      "petition_user_notification"
    )
      .where({ petition_id: petition.id })
      .select(
        "is_read",
        "processed_at",
        "data",
        "petition_id",
        "type",
        "user_id"
      );

    expect(notifications).toEqual([
      {
        is_read: false,
        processed_at: null,
        petition_id: petition.id,
        type: "PETITION_SHARED",
        user_id: newUser.id,
        data: {
          owner_id: users[0].id,
          permission_type: "READ",
          user_id: newUser.id,
        },
      },
    ]);
  });

  it("users should receive a notification when a petition is shared to a group they belong", async () => {
    const members = await mocks.createRandomUsers(organization.id, 2);
    const [userGroup] = await mocks.createUserGroups(1, organization.id);
    await mocks.insertUserGroupMembers(
      userGroup.id,
      members.map((m) => m.id)
    );

    await userNotificationsListener(
      {
        id: 1,
        created_at: new Date(),
        type: "GROUP_PERMISSION_ADDED",
        petition_id: petition.id,
        data: {
          permission_type: "WRITE",
          user_group_id: userGroup.id,
          user_id: users[0].id,
        },
      },
      ctx
    );

    const notifications = await knex<PetitionUserNotification>(
      "petition_user_notification"
    )
      .where({ petition_id: petition.id })
      .select(
        "is_read",
        "processed_at",
        "data",
        "petition_id",
        "type",
        "user_id"
      );

    expect(notifications).toEqual(
      members.map((member) => ({
        is_read: false,
        processed_at: null,
        petition_id: petition.id,
        type: "PETITION_SHARED",
        user_id: member.id,
        data: {
          owner_id: users[0].id,
          permission_type: "WRITE",
          user_group_id: userGroup.id,
        },
      }))
    );
  });

  it("users should receive a notification when a signature is completed", async () => {
    await userNotificationsListener(
      {
        id: 1,
        created_at: new Date(),
        type: "SIGNATURE_COMPLETED",
        petition_id: petition.id,
        data: {
          file_upload_id: 1,
          petition_signature_request_id: 1,
        },
      },
      ctx
    );

    const notifications = await knex<PetitionUserNotification>(
      "petition_user_notification"
    )
      .where({ petition_id: petition.id })
      .select(
        "is_read",
        "processed_at",
        "data",
        "petition_id",
        "type",
        "user_id"
      );

    expect(notifications).toEqual(
      users.map((user) => ({
        is_read: false,
        processed_at: null,
        petition_id: petition.id,
        type: "SIGNATURE_COMPLETED",
        user_id: user.id,
        data: {
          petition_signature_request_id: 1,
        },
      }))
    );
  });

  it("users should receive a notification when a signature is cancelled", async () => {
    await userNotificationsListener(
      {
        id: 1,
        created_at: new Date(),
        type: "SIGNATURE_CANCELLED",
        petition_id: petition.id,
        data: {
          petition_signature_request_id: 1,
          cancel_reason: "CANCELLED_BY_USER",
          cancel_data: {
            canceller_id: users[1].id,
            canceller_reason: "this is my reason",
          },
        },
      },
      ctx
    );

    const notifications = await knex<PetitionUserNotification>(
      "petition_user_notification"
    )
      .where({ petition_id: petition.id })
      .select(
        "is_read",
        "processed_at",
        "data",
        "petition_id",
        "type",
        "user_id"
      );

    expect(notifications).toEqual(
      users.map((user) => ({
        is_read: false,
        processed_at: null,
        petition_id: petition.id,
        type: "SIGNATURE_CANCELLED",
        user_id: user.id,
        data: {
          petition_signature_request_id: 1,
        },
      }))
    );
  });

  it("users should receive a notification when a petition email is bounced", async () => {
    const [emailLog] = await mocks.createRandomEmailLog();
    const [message] = await mocks.createRandomPetitionMessage(
      petition.id,
      access.id,
      users[0].id,
      () => ({ email_log_id: emailLog.id })
    );
    await userNotificationsListener(
      {
        id: 1,
        created_at: new Date(),
        type: "PETITION_MESSAGE_BOUNCED",
        data: {
          petition_message_id: message.id,
        },
      },
      ctx
    );

    const notifications = await knex<PetitionUserNotification>(
      "petition_user_notification"
    )
      .where({ petition_id: petition.id })
      .select(
        "is_read",
        "processed_at",
        "data",
        "petition_id",
        "type",
        "user_id"
      );

    expect(notifications).toEqual([
      {
        is_read: false,
        processed_at: null,
        petition_id: petition.id,
        type: "MESSAGE_EMAIL_BOUNCED",
        user_id: users[0].id,
        data: {
          petition_access_id: access.id,
        },
      },
    ]);
  });

  it("users should receive a notification either if they are subscribed or not", async () => {
    const [unsubscribedUser] = await mocks.createRandomUsers(
      organization.id,
      1
    );
    await mocks.sharePetitions(
      [petition.id],
      unsubscribedUser.id,
      "READ",
      () => ({ is_subscribed: false })
    );

    await userNotificationsListener(
      {
        id: 1,
        created_at: new Date(),
        type: "PETITION_COMPLETED",
        petition_id: petition.id,
        data: {
          petition_access_id: access.id,
        },
      },
      ctx
    );

    const notifications = await knex<PetitionUserNotification>(
      "petition_user_notification"
    )
      .where({ petition_id: petition.id })
      .select(
        "is_read",
        "processed_at",
        "data",
        "petition_id",
        "type",
        "user_id"
      );

    expect(notifications).toEqual(
      [...users, unsubscribedUser].map((user) => ({
        is_read: false,
        processed_at: null,
        petition_id: petition.id,
        type: "PETITION_COMPLETED",
        user_id: user.id,
        data: {
          petition_access_id: access.id,
        },
      }))
    );
  });
});
