import { gql } from "graphql-request";
import { Knex } from "knex";
import { USER_COGNITO_ID } from "../../../test/mocks";
import { KNEX } from "../../db/knex";
import { PetitionUserNotification } from "../../db/notifications";
import { Mocks } from "../../db/repositories/__tests__/mocks";
import {
  Organization,
  Petition,
  PetitionAccess,
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

  let petitionAccess: PetitionAccess;

  let organization: Organization;

  let otherUserApiKey: string;

  beforeAll(async () => {
    testClient = await initServer();
    knex = testClient.container.get<Knex>(KNEX);
    mocks = new Mocks(knex);
    [organization] = await mocks.createRandomOrganizations(1);
    [sessionUser] = await mocks.createRandomUsers(organization.id, 1, () => ({
      cognito_id: USER_COGNITO_ID,
    }));

    [otherUser] = await mocks.createRandomUsers(organization.id, 1);

    ({ apiKey: otherUserApiKey } = await mocks.createUserAuthToken(
      "other-user-token",
      otherUser.id
    ));
  });

  afterAll(async () => {
    await testClient.stop();
  });

  beforeEach(async () => {
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
    const [contact] = await mocks.createRandomContacts(organization.id, 1);
    [petitionAccess] = await mocks.createPetitionAccess(
      petition.id,
      sessionUser.id,
      [contact.id],
      sessionUser.id
    );

    notifications = await knex("petition_user_notification")
      .insert([
        {
          created_at: "2021-06-10T10:00:00Z",
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
          created_at: "2021-06-10T09:00:00Z",
          type: "COMMENT_CREATED",
          user_id: otherUser.id,
          petition_id: petition.id,
          data: {
            petition_field_id: petitionField.id,
            petition_field_comment_id: petitionFieldComment.id,
          },
        },
        {
          created_at: "2021-01-10T10:00:00Z",
          type: "PETITION_COMPLETED",
          user_id: sessionUser.id,
          petition_id: petition.id,
          data: {
            petition_access_id: petitionAccess.id,
          },
        },
        {
          created_at: "2021-01-01T10:00:00Z",
          type: "SIGNATURE_COMPLETED",
          user_id: sessionUser.id,
          petition_id: petition.id,
          data: {
            petition_signature_request_id: 1,
          },
        },
        {
          created_at: "2019-06-10T09:00:00Z",
          type: "COMMENT_CREATED",
          user_id: sessionUser.id,
          petition_id: petition.id,
          data: {
            petition_field_id: petitionField.id,
            petition_field_comment_id: petitionFieldComment.id,
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
            notifications(limit: 100) {
              hasMore
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
    expect(data?.me).toEqual({
      notifications: {
        hasMore: false,
        items: [],
      },
      unreadNotificationIds: [],
    });
  });

  it("should query a paginated list of notifications", async () => {
    const { errors, data } = await testClient.query({
      query: gql`
        query {
          me {
            notifications(limit: 2) {
              hasMore
              items {
                id
                isRead
                petition {
                  id
                }
              }
            }
          }
        }
      `,
    });

    expect(errors).toBeUndefined();
    expect(data?.me).toEqual({
      notifications: {
        hasMore: true,
        items: [
          {
            id: toGlobalId("PetitionUserNotification", notifications[0].id),
            isRead: true,
            petition: { id: toGlobalId("Petition", petition.id) },
          },
          {
            id: toGlobalId("PetitionUserNotification", notifications[2].id),
            isRead: false,
            petition: { id: toGlobalId("Petition", petition.id) },
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
            notifications(limit: 10, filter: SHARED) {
              hasMore
              items {
                id
                ... on PetitionSharedUserNotification {
                  owner {
                    id
                  }
                  permissionType
                  sharedWith {
                    __typename
                    ... on User {
                      id
                    }
                    ... on UserGroup {
                      id
                    }
                  }
                }
              }
            }
          }
        }
      `,
    });
    expect(errors).toBeUndefined();
    expect(data?.me).toEqual({
      notifications: {
        hasMore: false,
        items: [
          {
            id: toGlobalId("PetitionUserNotification", notifications[0].id),
            owner: { id: toGlobalId("User", otherUser.id) },
            permissionType: "READ",
            sharedWith: {
              __typename: "User",
              id: toGlobalId("User", sessionUser.id),
            },
          },
        ],
      },
    });
  });

  it("should query a list of notifications created before given Date", async () => {
    const { errors, data } = await testClient.query({
      query: gql`
        query {
          me {
            notifications(limit: 10, before: "2021-01-10T10:00:00Z") {
              hasMore
              items {
                id
                ... on CommentCreatedUserNotification {
                  comment {
                    id
                  }
                  field {
                    id
                  }
                }
              }
            }
          }
        }
      `,
    });
    expect(errors).toBeUndefined();
    expect(data?.me).toEqual({
      notifications: {
        hasMore: false,
        items: [
          { id: toGlobalId("PetitionUserNotification", notifications[3].id) },
          {
            id: toGlobalId("PetitionUserNotification", notifications[4].id),
            comment: {
              id: toGlobalId("PetitionFieldComment", petitionFieldComment.id),
            },
            field: {
              id: toGlobalId("PetitionField", petitionField.id),
            },
          },
        ],
      },
    });
  });

  it("should return an empty list when passing a before date older than the oldest notification", async () => {
    const { errors, data } = await testClient.query({
      query: gql`
        query {
          me {
            notifications(limit: 10, before: "2000-01-11T10:00:00Z") {
              items {
                id
              }
            }
          }
        }
      `,
    });
    expect(errors).toBeUndefined();
    expect(data?.me).toEqual({
      notifications: { items: [] },
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
    expect(data?.me).toEqual({
      unreadNotificationIds: [
        toGlobalId("PetitionUserNotification", notifications[2].id),
        toGlobalId("PetitionUserNotification", notifications[3].id),
        toGlobalId("PetitionUserNotification", notifications[4].id),
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
    expect(data?.updatePetitionUserNotificationReadStatus).toEqual([
      { id: toGlobalId("PetitionUserNotification", notifications[2].id) },
      { id: toGlobalId("PetitionUserNotification", notifications[3].id) },
      { id: toGlobalId("PetitionUserNotification", notifications[4].id) },
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
            ... on PetitionCompletedUserNotification {
              access {
                id
              }
            }
          }
        }
      `,
      variables: {
        isRead: true,
        filter: "COMPLETED",
      },
    });
    expect(errors).toBeUndefined();
    expect(data?.updatePetitionUserNotificationReadStatus).toEqual([
      {
        id: toGlobalId("PetitionUserNotification", notifications[2].id),
        access: { id: toGlobalId("PetitionAccess", petitionAccess.id) },
      },
      { id: toGlobalId("PetitionUserNotification", notifications[3].id) },
    ]);
  });

  it("should mark as read the notifications of a list of petitions, except the comments", async () => {
    const { errors, data } = await testClient.mutate({
      mutation: gql`
        mutation ($isRead: Boolean!, $petitionIds: [GID!]) {
          updatePetitionUserNotificationReadStatus(
            isRead: $isRead
            petitionIds: $petitionIds
          ) {
            id
          }
        }
      `,
      variables: {
        isRead: true,
        petitionIds: [toGlobalId("Petition", petition.id)],
      },
    });
    expect(errors).toBeUndefined();
    expect(data?.updatePetitionUserNotificationReadStatus).toEqual([
      { id: toGlobalId("PetitionUserNotification", notifications[2].id) },
      { id: toGlobalId("PetitionUserNotification", notifications[3].id) },
    ]);
  });

  it("should mark as read the notifications of a list of comments", async () => {
    const { errors, data } = await testClient.mutate({
      mutation: gql`
        mutation ($isRead: Boolean!, $petitionFieldCommentIds: [GID!]) {
          updatePetitionUserNotificationReadStatus(
            isRead: $isRead
            petitionFieldCommentIds: $petitionFieldCommentIds
          ) {
            id
          }
        }
      `,
      variables: {
        isRead: true,
        petitionFieldCommentIds: [
          toGlobalId("PetitionFieldComment", petitionFieldComment.id),
        ],
      },
    });
    expect(errors).toBeUndefined();
    expect(data?.updatePetitionUserNotificationReadStatus).toEqual([
      { id: toGlobalId("PetitionUserNotification", notifications[4].id) },
    ]);
  });

  it("should mark a list of notifications as unread", async () => {
    const { errors, data } = await testClient.mutate({
      mutation: gql`
        mutation ($notificationIds: [GID!], $isRead: Boolean!) {
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
    expect(data?.updatePetitionUserNotificationReadStatus).toEqual([
      { id: toGlobalId("PetitionUserNotification", notifications[0].id) },
    ]);
  });

  it("should return only the updated notifications when marking read status", async () => {
    const { errors, data } = await testClient.mutate({
      mutation: gql`
        mutation ($notificationIds: [GID!], $isRead: Boolean!) {
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
    expect(data?.updatePetitionUserNotificationReadStatus).toEqual([
      { id: toGlobalId("PetitionUserNotification", notifications[2].id) },
    ]);
  });

  it("should send error if trying to update the read status of another user's notification", async () => {
    const { errors, data } = await testClient.mutate({
      mutation: gql`
        mutation ($notificationIds: [GID!], $isRead: Boolean!) {
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

  it("should send error if pasing neither petitionUserNotificationIds nor filter arguments", async () => {
    const { errors, data } = await testClient.mutate({
      mutation: gql`
        mutation ($isRead: Boolean!) {
          updatePetitionUserNotificationReadStatus(isRead: $isRead) {
            id
          }
        }
      `,
      variables: {
        isRead: true,
      },
    });

    expect(errors).toContainGraphQLError("ARG_VALIDATION_ERROR");
    expect(data).toBeNull();
  });

  it("should throw error if not passing any of the optional arguments", async () => {
    const { errors, data } = await testClient.mutate({
      mutation: gql`
        mutation ($isRead: Boolean!) {
          updatePetitionUserNotificationReadStatus(isRead: $isRead) {
            id
          }
        }
      `,
      variables: {
        isRead: true,
      },
    });

    expect(errors).toContainGraphQLError("ARG_VALIDATION_ERROR");
    expect(data).toBeNull();
  });

  it("should throw error if passing both petitionUserNotificationIds and filter", async () => {
    const { errors, data } = await testClient.mutate({
      mutation: gql`
        mutation (
          $isRead: Boolean!
          $filter: PetitionUserNotificationFilter
          $petitionUserNotificationIds: [GID!]
        ) {
          updatePetitionUserNotificationReadStatus(
            isRead: $isRead
            filter: $filter
            petitionUserNotificationIds: $petitionUserNotificationIds
          ) {
            id
          }
        }
      `,
      variables: {
        isRead: true,
        petitionUserNotificationIds: [
          toGlobalId("PetitionUserNotification", notifications[2].id),
          toGlobalId("PetitionUserNotification", notifications[3].id),
        ],
        filter: "COMMENTS",
      },
    });

    expect(errors).toContainGraphQLError("ARG_VALIDATION_ERROR");
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

  it("notifications should be deleted if user transfers the ownership of their petition and then deletes it", async () => {
    const { errors: transferErrors } = await testClient.mutate({
      mutation: gql`
        mutation ($petitionIds: [GID!]!, $userId: GID!) {
          transferPetitionOwnership(
            petitionIds: $petitionIds
            userId: $userId
          ) {
            id
          }
        }
      `,
      variables: {
        petitionIds: [toGlobalId("Petition", petition.id)],
        userId: toGlobalId("User", otherUser.id),
      },
    });
    expect(transferErrors).toBeUndefined();

    const { errors: deleteErrors } = await testClient.mutate({
      mutation: gql`
        mutation ($petitionIds: [GID!]!) {
          deletePetitions(ids: $petitionIds)
        }
      `,
      variables: {
        petitionIds: [toGlobalId("Petition", petition.id)],
      },
    });
    expect(deleteErrors).toBeUndefined();

    const { data, errors } = await testClient.query({
      query: gql`
        query {
          me {
            notifications(limit: 100) {
              items {
                id
              }
              hasMore
            }
          }
        }
      `,
    });

    expect(errors).toBeUndefined();
    expect(data?.me).toEqual({
      notifications: {
        items: [],
        hasMore: false,
      },
    });
  });

  it("notifications should be deleted if other user stops sharing the petition with me", async () => {
    const { errors: transferErrors } = await testClient.mutate({
      mutation: gql`
        mutation ($petitionIds: [GID!]!, $userId: GID!) {
          transferPetitionOwnership(
            petitionIds: $petitionIds
            userId: $userId
          ) {
            id
          }
        }
      `,
      variables: {
        petitionIds: [toGlobalId("Petition", petition.id)],
        userId: toGlobalId("User", otherUser.id),
      },
    });
    expect(transferErrors).toBeUndefined();

    const { errors: otherUserStopSharingError } = await testClient
      .withApiKey(otherUserApiKey)
      .mutate({
        mutation: gql`
          mutation ($petitionIds: [GID!]!, $userIds: [GID!]) {
            removePetitionPermission(
              petitionIds: $petitionIds
              userIds: $userIds
            ) {
              id
            }
          }
        `,
        variables: {
          petitionIds: [toGlobalId("Petition", petition.id)],
          userIds: [toGlobalId("User", sessionUser.id)],
        },
      });
    expect(otherUserStopSharingError).toBeUndefined();

    const { data, errors } = await testClient.query({
      query: gql`
        query {
          me {
            id
            notifications(limit: 100) {
              items {
                id
              }
              hasMore
            }
          }
        }
      `,
    });

    expect(errors).toBeUndefined();
    expect(data?.me).toEqual({
      id: toGlobalId("User", sessionUser.id),
      notifications: {
        items: [],
        hasMore: false,
      },
    });
  });

  it("notifications should be deleted if other user stops sharing the petition with a group i'm in", async () => {
    const [userGroup] = await mocks.createUserGroups(1, organization.id);
    await mocks.insertUserGroupMembers(userGroup.id, [sessionUser.id]);
    const [groupPetition] = await mocks.createRandomPetitions(
      organization.id,
      otherUser.id,
      1
    );
    await mocks.sharePetitionWithGroups(groupPetition.id, [userGroup.id]);
    await knex("petition_user_notification").insert({
      created_at: "2021-07-10T10:00:00Z",
      type: "PETITION_SHARED",
      user_id: sessionUser.id,
      is_read: true,
      petition_id: groupPetition.id,
      data: {
        owner_id: otherUser.id,
        permission_type: "READ",
        user_group_id: userGroup.id,
      },
    });

    // at this point, `groupPetition` is shared with a group which sessionUser is member.

    // next request is executed by `otherUser`
    const { errors: otherUserStopSharingError } = await testClient
      .withApiKey(otherUserApiKey)
      .mutate({
        mutation: gql`
          mutation ($petitionIds: [GID!]!, $userGroupIds: [GID!]) {
            removePetitionPermission(
              petitionIds: $petitionIds
              userGroupIds: $userGroupIds
            ) {
              id
            }
          }
        `,
        variables: {
          petitionIds: [toGlobalId("Petition", groupPetition.id)],
          userGroupIds: [toGlobalId("UserGroup", userGroup.id)],
        },
      });
    expect(otherUserStopSharingError).toBeUndefined();

    const { data, errors } = await testClient.query({
      query: gql`
        query {
          me {
            id
            notifications(limit: 100) {
              items {
                petition {
                  id
                }
                id
              }
              hasMore
            }
          }
        }
      `,
    });

    expect(errors).toBeUndefined();
    expect(data?.me).toEqual({
      id: toGlobalId("User", sessionUser.id),
      notifications: {
        // only notification that should be deleted is the "group shared" created in this case
        items: notifications
          .filter((n) => n.user_id === sessionUser.id)
          .map((n) => ({
            id: toGlobalId("PetitionUserNotification", n.id),
            petition: {
              id: toGlobalId("Petition", petition.id),
            },
          })),
        hasMore: false,
      },
    });
  });

  it("notifications should not be deleted if other user stops sharing with a group but user still has direct access", async () => {
    const [userGroup] = await mocks.createUserGroups(1, organization.id);
    await mocks.insertUserGroupMembers(userGroup.id, [sessionUser.id]);
    const [otherPetition] = await mocks.createRandomPetitions(
      organization.id,
      otherUser.id
    );

    await mocks.sharePetitionWithGroups(otherPetition.id, [userGroup.id]);
    await mocks.sharePetitions([otherPetition.id], sessionUser.id, "READ");

    const { errors: otherUserStopSharingError } = await testClient
      .withApiKey(otherUserApiKey)
      .mutate({
        mutation: gql`
          mutation ($petitionIds: [GID!]!, $userGroupIds: [GID!]) {
            removePetitionPermission(
              petitionIds: $petitionIds
              userGroupIds: $userGroupIds
            ) {
              id
            }
          }
        `,
        variables: {
          petitionIds: [toGlobalId("Petition", otherPetition.id)],
          userGroupIds: [toGlobalId("UserGroup", userGroup.id)],
        },
      });
    expect(otherUserStopSharingError).toBeUndefined();

    const { data, errors } = await testClient.query({
      query: gql`
        query {
          me {
            id
            notifications(limit: 100) {
              items {
                id
              }
              hasMore
            }
          }
        }
      `,
    });

    expect(errors).toBeUndefined();
    expect(data?.me).toEqual({
      id: toGlobalId("User", sessionUser.id),
      notifications: {
        items: notifications
          .filter((n) => n.user_id === sessionUser.id)
          .map((n) => ({
            id: toGlobalId("PetitionUserNotification", n.id),
          })),
        hasMore: false,
      },
    });
  });
});
