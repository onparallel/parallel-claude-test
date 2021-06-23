import { gql } from "graphql-request";
import { Knex } from "knex";
import { USER_COGNITO_ID } from "../../../test/mocks";
import { KNEX } from "../../db/knex";
import { PetitionUserNotification } from "../../db/notifications";
import { Mocks } from "../../db/repositories/__tests__/mocks";
import {
  Petition,
  PetitionField,
  PetitionFieldComment,
  User,
} from "../../db/__types";
import { toGlobalId } from "../../util/globalId";
import { initServer, TestClient } from "./server";

describe("GraphQL - PetitionUserNotifications", () => {
  let testClient: TestClient;
  let mocks: Mocks;
  let knex: Knex;

  let sessionUser: User;
  let petition: Petition;
  let petitionField: PetitionField;
  let petitionFieldComment: PetitionFieldComment;
  let otherUser: User;
  let notifications: PetitionUserNotification[];

  beforeAll(async () => {
    testClient = await initServer();
    knex = testClient.container.get<Knex>(KNEX);
    mocks = new Mocks(knex);

    const [organization] = await mocks.createRandomOrganizations(1);
    [sessionUser] = await mocks.createRandomUsers(organization.id, 1, () => ({
      cognito_id: USER_COGNITO_ID,
    }));

    [otherUser] = await mocks.createRandomUsers(organization.id, 1);

    [petition] = await mocks.createRandomPetitions(
      organization.id,
      sessionUser.id
    );
    [petitionField] = await mocks.createRandomPetitionFields(
      petition.id,
      1,
      () => ({ type: "TEXT" })
    );

    [petitionFieldComment] = await mocks.createRandomCommentsFromUser(
      sessionUser.id,
      petitionField.id,
      petition.id,
      1
    );
  });

  afterAll(async () => {
    await testClient.stop();
  });

  beforeEach(async () => {
    notifications = await knex("petition_user_notification")
      .insert([
        {
          type: "PETITION_SHARED",
          user_id: sessionUser.id,
          is_read: true,
          petition_id: petition.id,
          data: {
            owner_id: otherUser.id,
            permission_type: "READ",
            user_id: sessionUser.id,
          },
        },
        {
          type: "COMMENT_CREATED",
          user_id: otherUser.id,
          petition_id: petition.id,
          data: {
            petition_field_id: petitionField.id,
            petition_field_comment_id: petitionFieldComment.id,
          },
        },
        {
          type: "PETITION_COMPLETED",
          user_id: sessionUser.id,
          petition_id: petition.id,
          data: {
            petition_access_id: 1,
          },
        },
        {
          type: "SIGNATURE_COMPLETED",
          user_id: sessionUser.id,
          petition_id: petition.id,
          data: {
            petition_signature_request_id: 1,
          },
        },
      ])
      .returning("*");
  });

  afterEach(async () => {
    await mocks.clearUserNotifications();
  });

  it("should start with an empty array of notifications", async () => {
    await mocks.clearUserNotifications();
    const { errors, data } = await testClient.query({
      query: gql`
        query {
          me {
            notifications(limit: 100, offset: 0) {
              totalCount
              items {
                id
              }
            }
            unreadNotificationIds
          }
        }
      `,
    });

    expect(errors).toBeUndefined();
    expect(data.me).toEqual({
      notifications: { totalCount: 0, items: [] },
      unreadNotificationIds: [],
    });
  });

  it("should query a paginated list of notifications", async () => {
    const { errors, data } = await testClient.query({
      query: gql`
        query {
          me {
            notifications(limit: 2, offset: 1) {
              totalCount
              items {
                id
              }
            }
          }
        }
      `,
    });

    expect(errors).toBeUndefined();
    expect(data.me).toEqual({
      notifications: {
        totalCount: 3,
        items: [
          {
            id: toGlobalId("PetitionUserNotification", notifications[2].id),
          },
          {
            id: toGlobalId("PetitionUserNotification", notifications[3].id),
          },
        ],
      },
    });
  });

  it("should query a paginated list of only petition sharing notifications", async () => {
    const { errors, data } = await testClient.query({
      query: gql`
        query {
          me {
            notifications(limit: 10, offset: 0, filter: SHARED) {
              totalCount
              items {
                id
              }
            }
          }
        }
      `,
    });
    expect(errors).toBeUndefined();
    expect(data.me).toEqual({
      notifications: {
        totalCount: 1,
        items: [
          { id: toGlobalId("PetitionUserNotification", notifications[0].id) },
        ],
      },
    });
  });

  it("should get a list of unread notification ids", async () => {
    const { errors, data } = await testClient.query({
      query: gql`
        query {
          me {
            unreadNotificationIds
          }
        }
      `,
    });
    expect(errors).toBeUndefined();
    expect(data.me).toEqual({
      unreadNotificationIds: [
        toGlobalId("PetitionUserNotification", notifications[2].id),
        toGlobalId("PetitionUserNotification", notifications[3].id),
      ],
    });
  });

  it("should mark all notifications as read", async () => {
    const { errors, data } = await testClient.mutate({
      mutation: gql`
        mutation ($isRead: Boolean!, $filter: PetitionUserNotificationFilter) {
          updatePetitionUserNotificationReadStatus(
            isRead: $isRead
            filter: $filter
          ) {
            id
          }
        }
      `,
      variables: {
        isRead: true,
        filter: "ALL",
      },
    });
    expect(errors).toBeUndefined();
    expect(data.updatePetitionUserNotificationReadStatus).toEqual([
      { id: toGlobalId("PetitionUserNotification", notifications[2].id) },
      { id: toGlobalId("PetitionUserNotification", notifications[3].id) },
    ]);
  });

  it("should mark all COMPLETED notifications as read", async () => {
    const { errors, data } = await testClient.mutate({
      mutation: gql`
        mutation ($isRead: Boolean!, $filter: PetitionUserNotificationFilter) {
          updatePetitionUserNotificationReadStatus(
            isRead: $isRead
            filter: $filter
          ) {
            id
          }
        }
      `,
      variables: {
        isRead: true,
        filter: "COMPLETED",
      },
    });
    expect(errors).toBeUndefined();
    expect(data.updatePetitionUserNotificationReadStatus).toEqual([
      { id: toGlobalId("PetitionUserNotification", notifications[2].id) },
      { id: toGlobalId("PetitionUserNotification", notifications[3].id) },
    ]);
  });

  it("should mark a list of notifications as unread", async () => {
    const { errors, data } = await testClient.mutate({
      mutation: gql`
        mutation ($notificationIds: [GID!]!, $isRead: Boolean!) {
          updatePetitionUserNotificationReadStatus(
            petitionUserNotificationIds: $notificationIds
            isRead: $isRead
          ) {
            id
          }
        }
      `,
      variables: {
        notificationIds: [
          toGlobalId("PetitionUserNotification", notifications[0].id),
        ],
        isRead: false,
      },
    });

    expect(errors).toBeUndefined();
    expect(data.updatePetitionUserNotificationReadStatus).toEqual([
      { id: toGlobalId("PetitionUserNotification", notifications[0].id) },
    ]);
  });

  it("should return only the updated notifications when marking read status", async () => {
    const { errors, data } = await testClient.mutate({
      mutation: gql`
        mutation ($notificationIds: [GID!]!, $isRead: Boolean!) {
          updatePetitionUserNotificationReadStatus(
            petitionUserNotificationIds: $notificationIds
            isRead: $isRead
          ) {
            id
          }
        }
      `,
      variables: {
        notificationIds: [
          toGlobalId("PetitionUserNotification", notifications[0].id),
          toGlobalId("PetitionUserNotification", notifications[2].id),
        ],
        isRead: true,
      },
    });

    expect(errors).toBeUndefined();
    expect(data.updatePetitionUserNotificationReadStatus).toEqual([
      { id: toGlobalId("PetitionUserNotification", notifications[2].id) },
    ]);
  });

  it("should send error if trying to update the read status of another user's notification", async () => {
    const { errors, data } = await testClient.mutate({
      mutation: gql`
        mutation ($notificationIds: [GID!]!, $isRead: Boolean!) {
          updatePetitionUserNotificationReadStatus(
            petitionUserNotificationIds: $notificationIds
            isRead: $isRead
          ) {
            id
          }
        }
      `,
      variables: {
        notificationIds: [
          toGlobalId("PetitionUserNotification", notifications[1].id),
        ],
        isRead: true,
      },
    });

    expect(errors).toContainGraphQLError("FORBIDDEN");
    expect(data).toBeNull();
  });

  it("notification should be deleted if the user comments a field and then deletes the comment", async () => {
    const { errors } = await testClient.mutate({
      mutation: gql`
        mutation (
          $petitionFieldCommentId: GID!
          $petitionFieldId: GID!
          $petitionId: GID!
        ) {
          deletePetitionFieldComment(
            petitionFieldCommentId: $petitionFieldCommentId
            petitionFieldId: $petitionFieldId
            petitionId: $petitionId
          ) {
            id
          }
        }
      `,
      variables: {
        petitionId: toGlobalId("Petition", petition.id),
        petitionFieldId: toGlobalId("PetitionField", petitionField.id),
        petitionFieldCommentId: toGlobalId(
          "PetitionFieldComment",
          petitionFieldComment.id
        ),
      },
    });

    expect(errors).toBeUndefined();

    const otherUserNotifications = await knex<PetitionUserNotification>(
      "petition_user_notification"
    )
      .where("user_id", otherUser.id)
      .select("id");

    expect(otherUserNotifications).toEqual([]);
  });

  it("all petition notifications should be deleted if the petition is deleted", async () => {
    const { errors } = await testClient.mutate({
      mutation: gql`
        mutation ($petitionIds: [GID!]!) {
          deletePetitions(ids: $petitionIds)
        }
      `,
      variables: {
        petitionIds: [toGlobalId("Petition", petition.id)],
      },
    });
    expect(errors).toBeUndefined();

    const petitionNotifications = await knex<PetitionUserNotification>(
      "petition_user_notification"
    )
      .where("petition_id", petition.id)
      .select("id");

    expect(petitionNotifications).toEqual([]);
  });
});
