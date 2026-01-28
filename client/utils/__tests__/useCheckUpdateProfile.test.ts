import type {
  useCheckUpdateProfile_PetitionFieldReplyFragment,
  useCheckUpdateProfile_PetitionFragment,
  useCheckUpdateProfile_ProfileFragment,
} from "@parallel/graphql/__types";
import { renderHook } from "@testing-library/react";
import { useCheckUpdateProfile } from "../useCheckUpdateProfile";

describe("useCheckUpdateProfile", () => {
  const createMockProfile = (
    overrides?: Partial<useCheckUpdateProfile_ProfileFragment>,
  ): useCheckUpdateProfile_ProfileFragment => ({
    id: "profileId1",
    properties: [],
    profileType: {
      id: "profileTypeId1",
      fields: [],
    },
    ...overrides,
  });

  const createMockPetition = (
    overrides?: Partial<useCheckUpdateProfile_PetitionFragment>,
  ): useCheckUpdateProfile_PetitionFragment => ({
    id: "petitionId1",
    closedAt: null,
    fields: [],
    ...overrides,
  });

  const createMockReply = (
    overrides?: Partial<useCheckUpdateProfile_PetitionFieldReplyFragment>,
  ): useCheckUpdateProfile_PetitionFieldReplyFragment => ({
    id: "replyId1",
    content: {},
    updatedAt: new Date().toISOString(),
    parent: null,
    children: [],
    associatedAt: null,
    ...overrides,
  });

  it("should return no conflicts and no update needed when profile is null", () => {
    const reply = createMockReply();

    const { result } = renderHook(() =>
      useCheckUpdateProfile({
        parentReplyId: reply.id,
        profile: null,
        replies: [reply],
        petition: createMockPetition(),
        fieldLogic: [],
      }),
    );

    expect(result.current).toEqual({
      hasConflicts: false,
      needUpdate: false,
    });
  });

  it("should return no conflicts and no update needed when profile has no properties", () => {
    const profile = createMockProfile({
      properties: [],
    });

    const reply = createMockReply();

    const { result } = renderHook(() =>
      useCheckUpdateProfile({
        parentReplyId: reply.id,
        profile,
        replies: [reply],
        petition: createMockPetition(),
        fieldLogic: [],
      }),
    );

    expect(result.current).toEqual({
      hasConflicts: false,
      needUpdate: false,
    });
  });

  it("should return no conflicts when values match", () => {
    const profileTypeFieldId = "profileTypeFieldId1";
    const profile = createMockProfile({
      profileType: {
        id: "profileTypeId1",
        fields: [
          {
            id: profileTypeFieldId,
            type: "TEXT",
          },
        ],
      },
      properties: [
        {
          field: {
            id: profileTypeFieldId,
            myPermission: "WRITE",
            type: "TEXT",
          },
          value: {
            content: {
              value: "Test Value",
            },
          },
          files: [],
        },
      ],
    });

    const petition = createMockPetition({
      fields: [
        {
          id: "petitionFieldId1",
          type: "TEXT",
          replies: [
            {
              id: "replyId1",
              content: {
                value: "Test Value",
              },
              updatedAt: new Date().toISOString(),
              parent: null,
              children: [],
              associatedAt: null,
            },
          ],
          profileTypeField: {
            id: profileTypeFieldId,
          },
        },
      ],
    });

    const reply = createMockReply({
      id: "replyId1",
      children: [
        {
          field: {
            id: "petitionFieldId1",
          },
          replies: [
            {
              id: "childReplyId1",
              content: {
                value: "Test Value",
              },
              updatedAt: new Date().toISOString(),
              parent: {
                id: "replyId1",
              },
            },
          ],
        },
      ],
    });

    const { result } = renderHook(() =>
      useCheckUpdateProfile({
        parentReplyId: reply.id,
        profile,
        replies: [reply],
        petition,
        fieldLogic: [],
        parentAssociatedAt: new Date().toISOString(),
      }),
    );

    expect(result.current.hasConflicts).toBe(false);
  });

  it("should detect conflicts when values do not match", () => {
    const profileTypeFieldId1 = "profileTypeFieldId1";
    const profile = createMockProfile({
      profileType: {
        id: "profileTypeId1",
        fields: [
          {
            id: profileTypeFieldId1,
            type: "TEXT",
          },
        ],
      },
      properties: [
        {
          field: {
            id: profileTypeFieldId1,
            myPermission: "WRITE",
            type: "TEXT",
          },
          value: {
            content: {
              value: "Old Value",
            },
          },
          files: [],
        },
      ],
    });

    const fieldGroupReplyId1 = "fieldGroupReplyId1";
    const childReplyId1 = "childReplyId1";

    const childReply = createMockReply({
      id: childReplyId1,
      content: {
        value: "New Value",
      },
      updatedAt: new Date().toISOString(),
      parent: {
        id: fieldGroupReplyId1,
      },
    });

    const reply = createMockReply({
      id: fieldGroupReplyId1,
      children: [
        {
          field: {
            id: "petitionFieldId1",
          },
          replies: [childReply],
        },
      ],
    });

    const petitionFieldId1 = "petitionFieldId1";
    const petition = createMockPetition({
      fields: [
        {
          id: "petitionFieldGroup1",
          type: "FIELD_GROUP",
          replies: [reply],
          profileTypeField: null,
          children: [
            {
              id: petitionFieldId1,
              type: "SHORT_TEXT",
              replies: [childReply],
              profileTypeField: {
                id: profileTypeFieldId1,
              },
            },
          ],
        },
      ],
    });

    const { result } = renderHook(() =>
      useCheckUpdateProfile({
        parentReplyId: reply.id,
        profile,
        replies: [reply],
        petition,
        fieldLogic: [],
        parentAssociatedAt: new Date().toISOString(),
      }),
    );

    expect(result.current.hasConflicts).toBe(true);
  });

  it("should detect conflicts when values do not match in merged FIELD_GROUP", () => {
    const profileTypeFieldId1 = "profileTypeFieldId1";
    const profileTypeFieldId2 = "profileTypeFieldId2";
    const profile = createMockProfile({
      profileType: {
        id: "profileTypeId1",
        fields: [
          {
            id: profileTypeFieldId1,
            type: "TEXT",
          },
        ],
      },
      properties: [
        {
          field: {
            id: profileTypeFieldId1,
            myPermission: "WRITE",
            type: "TEXT",
          },
          value: {
            content: {
              value: "Old name",
            },
          },
          files: [],
        },
        {
          field: {
            id: profileTypeFieldId2,
            myPermission: "WRITE",
            type: "TEXT",
          },
          value: {
            content: {
              value: "Old last name",
            },
          },
          files: [],
        },
      ],
    });

    const fieldGroupReplyId1 = "fieldGroupReplyId1";
    const fieldGroupReplyId2 = "fieldGroupReplyId2";
    const childReplyId1 = "childReplyId1";
    const childReplyId2 = "childReplyId2";

    const childReply = createMockReply({
      id: childReplyId1,
      content: {
        value: "Old name",
      },
      updatedAt: new Date().toISOString(),
      parent: {
        id: fieldGroupReplyId1,
      },
    });

    const childReply2 = createMockReply({
      id: childReplyId2,
      content: {
        value: "New last name",
      },
      updatedAt: new Date().toISOString(),
      parent: {
        id: fieldGroupReplyId2,
      },
    });

    const petitionFieldId1 = "petitionFieldId1";
    const petitionFieldId2 = "petitionFieldId2";

    const fieldGroupReply1 = createMockReply({
      id: fieldGroupReplyId1,
      children: [
        {
          field: {
            id: petitionFieldId1,
          },
          replies: [childReply],
        },
      ],
    });

    const fieldGroupReply2 = createMockReply({
      id: fieldGroupReplyId2,
      children: [
        {
          field: {
            id: petitionFieldId2,
          },
          replies: [childReply],
        },
      ],
    });

    const petition = createMockPetition({
      fields: [
        {
          id: "petitionFieldGroup1",
          type: "FIELD_GROUP",
          replies: [fieldGroupReply1],
          profileTypeField: null,
          children: [
            {
              id: petitionFieldId1,
              type: "SHORT_TEXT",
              replies: [childReply],
              profileTypeField: {
                id: profileTypeFieldId1,
              },
            },
          ],
        },
        {
          id: "petitionFieldGroup2",
          type: "FIELD_GROUP",
          replies: [fieldGroupReply2],
          profileTypeField: null,
          children: [
            {
              id: petitionFieldId2,
              type: "SHORT_TEXT",
              replies: [childReply2],
              profileTypeField: {
                id: profileTypeFieldId2,
              },
            },
          ],
        },
      ],
    });

    const { result } = renderHook(() =>
      useCheckUpdateProfile({
        parentReplyId: fieldGroupReply1.id,
        profile,
        replies: [fieldGroupReply1, fieldGroupReply2],
        petition,
        fieldLogic: [],
        parentAssociatedAt: new Date().toISOString(),
      }),
    );

    expect(result.current.hasConflicts).toBe(true);
  });

  it("should detect conflicts from the correct reply when values do not match in FIELD_GROUP with multiple replies (multiple=true)", () => {
    const profileTypeFieldId1 = "profileTypeFieldId1";
    const profileTypeFieldId2 = "profileTypeFieldId2";
    const profile = createMockProfile({
      profileType: {
        id: "profileTypeId1",
        fields: [
          {
            id: profileTypeFieldId1,
            type: "SHORT_TEXT",
          },
          {
            id: profileTypeFieldId2,
            type: "SHORT_TEXT",
          },
        ],
      },
      properties: [
        {
          field: {
            id: profileTypeFieldId1,
            myPermission: "WRITE",
            type: "SHORT_TEXT",
          },
          value: {
            content: {
              value: "Old name",
            },
          },
          files: [],
        },
        {
          field: {
            id: profileTypeFieldId2,
            myPermission: "WRITE",
            type: "SHORT_TEXT",
          },
          value: {
            content: {
              value: "Old last name",
            },
          },
          files: [],
        },
      ],
    });

    const fieldGroupReplyId1 = "fieldGroupReplyId1";
    const fieldGroupReplyId2 = "fieldGroupReplyId2";
    const childReplyId1 = "childReplyId1";
    const childReplyId2 = "childReplyId2";
    const childReplyId3 = "childReplyId3";
    const childReplyId4 = "childReplyId4";

    // Child replies for fieldGroupReply1
    const childReply1Field1 = createMockReply({
      id: childReplyId1,
      content: {
        value: "Old name",
      },
      updatedAt: new Date().toISOString(),
      parent: {
        id: fieldGroupReplyId1,
      },
    });

    const childReply1Field2 = createMockReply({
      id: childReplyId2,
      content: {
        value: "Old last name",
      },
      updatedAt: new Date().toISOString(),
      parent: {
        id: fieldGroupReplyId1,
      },
    });

    // Child replies for fieldGroupReply2
    const childReply2Field1 = createMockReply({
      id: childReplyId3,
      content: {
        value: "Old name",
      },
      updatedAt: new Date().toISOString(),
      parent: {
        id: fieldGroupReplyId2,
      },
    });

    const childReply2Field2 = createMockReply({
      id: childReplyId4,
      content: {
        value: "New last name",
      },
      updatedAt: new Date().toISOString(),
      parent: {
        id: fieldGroupReplyId2,
      },
    });

    const petitionFieldId1 = "petitionFieldId1";
    const petitionFieldId2 = "petitionFieldId2";

    const fieldGroupReply1 = createMockReply({
      id: fieldGroupReplyId1,
      children: [
        {
          field: {
            id: petitionFieldId1,
          },
          replies: [childReply1Field1],
        },
        {
          field: {
            id: petitionFieldId2,
          },
          replies: [childReply1Field2],
        },
      ],
    });

    const fieldGroupReply2 = createMockReply({
      id: fieldGroupReplyId2,
      children: [
        {
          field: {
            id: petitionFieldId1,
          },
          replies: [childReply2Field1],
        },
        {
          field: {
            id: petitionFieldId2,
          },
          replies: [childReply2Field2],
        },
      ],
    });

    const petition = createMockPetition({
      fields: [
        {
          id: "petitionFieldGroup1",
          type: "FIELD_GROUP",
          replies: [fieldGroupReply1, fieldGroupReply2],
          profileTypeField: null,
          children: [
            {
              id: petitionFieldId1,
              type: "SHORT_TEXT",
              replies: [childReply1Field1, childReply2Field1],
              profileTypeField: {
                id: profileTypeFieldId1,
              },
            },
            {
              id: petitionFieldId2,
              type: "SHORT_TEXT",
              replies: [childReply1Field2, childReply2Field2],
              profileTypeField: {
                id: profileTypeFieldId2,
              },
            },
          ],
        },
      ],
    });

    const { result: resultGroup1 } = renderHook(() =>
      useCheckUpdateProfile({
        parentReplyId: fieldGroupReply1.id,
        profile,
        replies: [fieldGroupReply1],
        petition,
        fieldLogic: [],
        parentAssociatedAt: new Date().toISOString(),
      }),
    );

    expect(resultGroup1.current.hasConflicts).toBe(false);

    const { result: resultGroup2 } = renderHook(() =>
      useCheckUpdateProfile({
        parentReplyId: fieldGroupReply2.id,
        profile,
        replies: [fieldGroupReply2],
        petition,
        fieldLogic: [],
        parentAssociatedAt: new Date().toISOString(),
      }),
    );

    expect(resultGroup2.current.hasConflicts).toBe(true);
  });
});
