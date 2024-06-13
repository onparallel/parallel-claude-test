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
import { deleteAllData } from "../../util/knexUtils";
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
    [petition] = await mocks.createRandomPetitions(organization.id, users[0].id, 1);

    [field] = await mocks.createRandomPetitionFields(petition.id, 1, () => ({
      type: "SHORT_TEXT",
    }));

    await mocks.sharePetitions([petition.id], users[1].id, "READ");

    const [contact] = await mocks.createRandomContacts(organization.id, 1);
    [access] = await mocks.createPetitionAccess(
      petition.id,
      users[0].id,
      [contact.id],
      users[0].id,
    );
  });

  afterEach(async () => {
    await mocks.clearUserNotifications();
    const extraUsers = await mocks.knex
      .from("user")
      .whereNotIn(
        "id",
        users.map((u) => u.id),
      )
      .select("*");

    if (extraUsers.length > 0) {
      await mocks.knex
        .from("petition_permission")
        .whereIn(
          "user_id",
          extraUsers.map((u) => u.id),
        )
        .delete();

      await mocks.knex
        .from("user_group_member")
        .whereIn(
          "user_id",
          extraUsers.map((u) => u.id),
        )
        .delete();

      await mocks.knex
        .from("user")
        .whereIn(
          "id",
          extraUsers.map((u) => u.id),
        )
        .delete();

      await mocks.knex
        .from("user_data")
        .whereIn(
          "id",
          extraUsers.map((u) => u.user_data_id),
        )
        .delete();
    }
  });

  afterAll(async () => {
    await deleteAllData(knex);
    await knex.destroy();
  });

  it("users should receive a notification when a recipient completes the petition", async () => {
    await userNotificationsListener.handle(
      {
        id: 1,
        created_at: new Date(),
        type: "PETITION_COMPLETED",
        petition_id: petition.id,
        data: {
          petition_access_id: access.id,
        },
        processed_at: null,
        processed_by: null,
      },
      ctx,
    );

    const notifications = await knex<PetitionUserNotification>("petition_user_notification")
      .where({ petition_id: petition.id })
      .select("read_at", "processed_at", "data", "petition_id", "type", "user_id");

    expect(notifications).toEqual(
      users.map((user) => ({
        read_at: null,
        processed_at: null,
        petition_id: petition.id,
        type: "PETITION_COMPLETED",
        user_id: user.id,
        data: {
          petition_access_id: access.id,
        },
      })),
    );
  });

  it("users should receive a notification when a recipient comments a field", async () => {
    const [comment] = await mocks.createRandomCommentsFromAccess(access.id, field.id, petition.id);
    await userNotificationsListener.handle(
      {
        id: 1,
        created_at: new Date(),
        type: "COMMENT_PUBLISHED",
        petition_id: petition.id,
        data: {
          petition_field_comment_id: comment.id,
          petition_field_id: field.id,
        },
        processed_at: null,
        processed_by: null,
      },
      ctx,
    );

    const notifications = await knex<PetitionUserNotification>("petition_user_notification")
      .where({ petition_id: petition.id })
      .select("read_at", "processed_at", "data", "petition_id", "type", "user_id");

    expect(notifications).toEqual(
      users.map((user) => ({
        read_at: null,
        processed_at: null,
        petition_id: petition.id,
        type: "COMMENT_CREATED",
        user_id: user.id,
        data: {
          petition_field_id: field.id,
          petition_field_comment_id: comment.id,
          is_mentioned: false,
        },
      })),
    );
  });

  it("users should receive a notification when another user comments a field", async () => {
    const [comment] = await mocks.createRandomCommentsFromUser(users[1].id, field.id, petition.id);
    await userNotificationsListener.handle(
      {
        id: 1,
        created_at: new Date(),
        type: "COMMENT_PUBLISHED",
        petition_id: petition.id,
        data: {
          petition_field_comment_id: comment.id,
          petition_field_id: field.id,
        },
        processed_at: null,
        processed_by: null,
      },
      ctx,
    );

    const notifications = await knex<PetitionUserNotification>("petition_user_notification")
      .where({ petition_id: petition.id })
      .select("read_at", "processed_at", "data", "petition_id", "type", "user_id");

    expect(notifications).toEqual([
      {
        read_at: null,
        processed_at: null,
        petition_id: petition.id,
        type: "COMMENT_CREATED",
        user_id: users[0].id,
        data: {
          petition_field_id: field.id,
          petition_field_comment_id: comment.id,
          is_mentioned: false,
        },
      },
    ]);
  });

  it("users should receive a notification when another user mentions them on a comment", async () => {
    const [comment] = await mocks.createRandomCommentsFromUser(users[1].id, field.id, petition.id);
    await mocks.mentionUserInComment(users[0].id, comment.id);
    await userNotificationsListener.handle(
      {
        id: 1,
        created_at: new Date(),
        type: "COMMENT_PUBLISHED",
        petition_id: petition.id,
        data: {
          petition_field_comment_id: comment.id,
          petition_field_id: field.id,
        },
        processed_at: null,
        processed_by: null,
      },
      ctx,
    );

    const notifications = await knex<PetitionUserNotification>("petition_user_notification")
      .where({ petition_id: petition.id })
      .select("read_at", "processed_at", "data", "petition_id", "type", "user_id");

    expect(notifications).toEqual([
      {
        read_at: null,
        processed_at: null,
        petition_id: petition.id,
        type: "COMMENT_CREATED",
        user_id: users[0].id,
        data: {
          petition_field_id: field.id,
          petition_field_comment_id: comment.id,
          is_mentioned: true,
        },
      },
    ]);
  });

  it("users should receive a notification when another user mentions them on a comment even if they are not subscribed", async () => {
    const [comment] = await mocks.createRandomCommentsFromUser(users[1].id, field.id, petition.id);
    const [newUser] = await mocks.createRandomUsers(organization.id, 1);
    await mocks.sharePetitions([petition.id], newUser.id, "READ", () => ({ is_subscribed: false }));
    await mocks.mentionUserInComment(newUser.id, comment.id);
    await userNotificationsListener.handle(
      {
        id: 1,
        created_at: new Date(),
        type: "COMMENT_PUBLISHED",
        petition_id: petition.id,
        data: {
          petition_field_comment_id: comment.id,
          petition_field_id: field.id,
        },
        processed_at: null,
        processed_by: null,
      },
      ctx,
    );

    const notifications = await knex<PetitionUserNotification>("petition_user_notification")
      .where({ petition_id: petition.id })
      .select("read_at", "processed_at", "data", "petition_id", "type", "user_id");

    expect(notifications).toIncludeSameMembers([
      {
        read_at: null,
        processed_at: null,
        petition_id: petition.id,
        type: "COMMENT_CREATED",
        user_id: newUser.id,
        data: {
          petition_field_id: field.id,
          petition_field_comment_id: comment.id,
          is_mentioned: true,
        },
      },
      {
        read_at: null,
        processed_at: null,
        petition_id: petition.id,
        type: "COMMENT_CREATED",
        user_id: users[0].id,
        data: {
          petition_field_id: field.id,
          petition_field_comment_id: comment.id,
          is_mentioned: false,
        },
      },
    ]);
  });

  it("users should receive a notification when another user mentions a group they belong to in a comment", async () => {
    const [comment] = await mocks.createRandomCommentsFromUser(users[1].id, field.id, petition.id);

    const [group] = await mocks.createUserGroups(1, users[0].org_id);
    await mocks.insertUserGroupMembers(group.id, [users[0].id]);
    await mocks.mentionUserGroupInComment(group.id, comment.id);

    await userNotificationsListener.handle(
      {
        id: 1,
        created_at: new Date(),
        type: "COMMENT_PUBLISHED",
        petition_id: petition.id,
        data: {
          petition_field_comment_id: comment.id,
          petition_field_id: field.id,
        },
        processed_at: null,
        processed_by: null,
      },
      ctx,
    );

    const notifications = await knex<PetitionUserNotification>("petition_user_notification")
      .where({ petition_id: petition.id })
      .select("read_at", "processed_at", "data", "petition_id", "type", "user_id");

    expect(notifications).toEqual([
      {
        read_at: null,
        processed_at: null,
        petition_id: petition.id,
        type: "COMMENT_CREATED",
        user_id: users[0].id,
        data: {
          petition_field_id: field.id,
          petition_field_comment_id: comment.id,
          is_mentioned: true,
        },
      },
    ]);
  });

  it("users should receive a notification when a petition is shared to them", async () => {
    const [newUser] = await mocks.createRandomUsers(organization.id, 1);
    await mocks.sharePetitions([petition.id], newUser.id, "READ", () => ({ is_subscribed: true }));
    await userNotificationsListener.handle(
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
        processed_at: null,
        processed_by: null,
      },
      ctx,
    );

    const notifications = await knex<PetitionUserNotification>("petition_user_notification")
      .where({ petition_id: petition.id })
      .select("read_at", "processed_at", "data", "petition_id", "type", "user_id");

    expect(notifications).toEqual([
      {
        read_at: null,
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

  it("users should not receive a notification when a petition is shared to them but they are not subscribed", async () => {
    const [newUser] = await mocks.createRandomUsers(organization.id, 1);
    await mocks.sharePetitions([petition.id], newUser.id, "READ", () => ({ is_subscribed: false }));
    await userNotificationsListener.handle(
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
        processed_at: null,
        processed_by: null,
      },
      ctx,
    );

    const notifications = await knex<PetitionUserNotification>("petition_user_notification")
      .where({ petition_id: petition.id })
      .select("read_at", "processed_at", "data", "petition_id", "type", "user_id");

    expect(notifications).toHaveLength(0);
  });

  it("users should receive a notification when a petition is shared to a group they belong", async () => {
    const members = await mocks.createRandomUsers(organization.id, 2);
    const [userGroup] = await mocks.createUserGroups(1, organization.id);
    await mocks.insertUserGroupMembers(
      userGroup.id,
      members.map((m) => m.id),
    );

    await mocks.knex.from("petition_permission").insert([
      {
        user_group_id: userGroup.id,
        petition_id: petition.id,
        type: "WRITE",
      },
      {
        user_id: members[0].id,
        from_user_group_id: userGroup.id,
        is_subscribed: true,
        petition_id: petition.id,
        type: "WRITE",
      },
      {
        user_id: members[1].id,
        from_user_group_id: userGroup.id,
        is_subscribed: false,
        petition_id: petition.id,
        type: "WRITE",
      },
    ]);

    await userNotificationsListener.handle(
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
        processed_at: null,
        processed_by: null,
      },
      ctx,
    );

    const notifications = await knex<PetitionUserNotification>("petition_user_notification")
      .where({ petition_id: petition.id })
      .select("read_at", "processed_at", "data", "petition_id", "type", "user_id");

    expect(notifications).toEqual([
      {
        read_at: null,
        processed_at: null,
        petition_id: petition.id,
        type: "PETITION_SHARED",
        user_id: members[0].id,
        data: {
          owner_id: users[0].id,
          permission_type: "WRITE",
          user_group_id: userGroup.id,
        },
      },
    ]);
  });

  it("users should receive a notification when a signature is completed", async () => {
    await userNotificationsListener.handle(
      {
        id: 1,
        created_at: new Date(),
        type: "SIGNATURE_COMPLETED",
        petition_id: petition.id,
        data: {
          file_upload_id: 1,
          petition_signature_request_id: 1,
        },
        processed_at: null,
        processed_by: null,
      },
      ctx,
    );

    const notifications = await knex<PetitionUserNotification>("petition_user_notification")
      .where({ petition_id: petition.id })
      .select("read_at", "processed_at", "data", "petition_id", "type", "user_id");

    expect(notifications).toEqual(
      users.map((user) => ({
        read_at: null,
        processed_at: null,
        petition_id: petition.id,
        type: "SIGNATURE_COMPLETED",
        user_id: user.id,
        data: {
          petition_signature_request_id: 1,
        },
      })),
    );
  });

  it("users should receive a notification when a signature is cancelled", async () => {
    await userNotificationsListener.handle(
      {
        id: 1,
        created_at: new Date(),
        type: "SIGNATURE_CANCELLED",
        petition_id: petition.id,
        data: {
          petition_signature_request_id: 1,
          cancel_reason: "CANCELLED_BY_USER",
          cancel_data: {
            user_id: users[1].id,
          },
        },
        processed_at: null,
        processed_by: null,
      },
      ctx,
    );

    const notifications = await knex<PetitionUserNotification>("petition_user_notification")
      .where({ petition_id: petition.id })
      .select("read_at", "processed_at", "data", "petition_id", "type", "user_id");

    expect(notifications).toEqual(
      users
        .filter((u) => u.id !== users[1].id)
        .map((user) => ({
          read_at: null,
          processed_at: null,
          petition_id: petition.id,
          type: "SIGNATURE_CANCELLED",
          user_id: user.id,
          data: {
            petition_signature_request_id: 1,
            cancel_reason: "CANCELLED_BY_USER",
            cancel_data: {
              user_id: users[1].id,
            },
          },
        })),
    );
  });

  it("users should receive a notification when a petition email is bounced", async () => {
    const [emailLog] = await mocks.createRandomEmailLog();
    const [message] = await mocks.createRandomPetitionMessage(
      petition.id,
      access.id,
      users[0].id,
      () => ({ email_log_id: emailLog.id }),
    );
    await userNotificationsListener.handle(
      {
        id: 1,
        created_at: new Date(),
        type: "PETITION_MESSAGE_BOUNCED",
        petition_id: message.petition_id,
        data: {
          petition_message_id: message.id,
        },
        processed_at: null,
        processed_by: null,
      },
      ctx,
    );

    const notifications = await knex<PetitionUserNotification>("petition_user_notification")
      .where({ petition_id: petition.id })
      .select("read_at", "processed_at", "data", "petition_id", "type", "user_id");

    expect(notifications).toEqual([
      {
        read_at: null,
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
});
