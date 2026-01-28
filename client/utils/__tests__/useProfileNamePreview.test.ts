import type {
  useProfileNamePreview_PetitionFieldReplyFragment,
  useProfileNamePreview_PetitionFragment,
  useProfileNamePreview_ProfileTypeFragment,
} from "@parallel/graphql/__types";
import { renderHook } from "@testing-library/react";
import type { FieldLogicResult } from "../fieldLogic/types";
import type { UpdateProfileOnClose } from "../fieldOptions";
import { useProfileNamePreview } from "../useProfileNamePreview";

describe("useProfileNamePreview", () => {
  const createMockProfileType = (
    overrides?: Partial<useProfileNamePreview_ProfileTypeFragment>,
  ): useProfileNamePreview_ProfileTypeFragment => ({
    id: "profileTypeId1",
    profileNamePattern: "",
    fields: [],
    ...overrides,
  });

  const createMockPetition = (
    overrides?: Partial<useProfileNamePreview_PetitionFragment>,
  ): useProfileNamePreview_PetitionFragment => ({
    id: "petitionId1",
    closedAt: null,
    fields: [],
    ...overrides,
  });

  const createMockReply = (
    overrides?: Partial<useProfileNamePreview_PetitionFieldReplyFragment>,
  ): useProfileNamePreview_PetitionFieldReplyFragment => ({
    id: "replyId1",
    content: {},
    children: [],
    ...overrides,
  });

  const createMockFieldLogic = (overrides?: Partial<FieldLogicResult>): FieldLogicResult => ({
    isVisible: true,
    previousVariables: {},
    currentVariables: {},
    finalVariables: {},
    changes: [],
    ...overrides,
  });

  it("should return null when profileType is null", () => {
    const { result } = renderHook(() =>
      useProfileNamePreview({
        profileType: null,
        petition: createMockPetition(),
        replies: [],
        fieldLogic: [],
      }),
    );

    expect(result.current).toBeNull();
  });

  it("should return null when profileNamePattern is missing", () => {
    const profileType = createMockProfileType({
      profileNamePattern: "",
    });

    const { result } = renderHook(() =>
      useProfileNamePreview({
        profileType,
        petition: createMockPetition(),
        replies: [],
        fieldLogic: [],
      }),
    );

    expect(result.current).toBeNull();
  });

  it("should return null when no fields are used in profile name", () => {
    const profileTypeFieldId1 = "profileTypeFieldId1";
    const profileTypeFieldId2 = "profileTypeFieldId2";
    const profileType = createMockProfileType({
      profileNamePattern: `{{ ${profileTypeFieldId1} }} {{ ${profileTypeFieldId2} }}`,
      fields: [
        {
          id: profileTypeFieldId1,
          isUsedInProfileName: true,
          type: "SHORT_TEXT",
          options: {},
        },
        {
          id: profileTypeFieldId2,
          isUsedInProfileName: false,
          type: "SHORT_TEXT",
          options: {},
        },
      ],
    });

    const petitionFieldGroupId1 = "petitionFieldGroupId1";
    const petitionFieldId1 = "petitionFieldId1";
    const petition = createMockPetition({
      fields: [
        {
          id: petitionFieldGroupId1,
          type: "FIELD_GROUP",
          options: {},
          parent: null,
          replies: [],
          profileTypeField: null,
          children: [
            {
              id: petitionFieldId1,
              type: "SHORT_TEXT",
              options: {},
              parent: {
                id: petitionFieldGroupId1,
              },
              replies: [],
              profileTypeField: {
                id: profileTypeFieldId2,
              },
            },
          ],
        },
      ],
    });

    const reply = createMockReply({
      id: "replyId1",
      content: {},
      children: [
        {
          field: {
            id: petitionFieldId1,
          },
          replies: [
            {
              id: "childReplyId1",
              content: {
                value: "Some Value",
              },
            },
          ],
        },
      ],
    });

    const { result } = renderHook(() =>
      useProfileNamePreview({
        profileType,
        petition,
        replies: [reply],
        fieldLogic: [],
      }),
    );

    expect(result.current).toBeNull();
  });

  it("should build profile name from reply children", () => {
    const profileTypeFieldId1 = "field1";
    const profileTypeFieldId2 = "field2";

    const profileType = createMockProfileType({
      profileNamePattern: `{{ ${profileTypeFieldId1} }} {{ ${profileTypeFieldId2} }} {{ ${profileTypeFieldId1} }}`,
      fields: [
        {
          id: profileTypeFieldId1,
          isUsedInProfileName: true,
          type: "SHORT_TEXT",
          options: {},
        },
        {
          id: profileTypeFieldId2,
          isUsedInProfileName: true,
          type: "SHORT_TEXT",
          options: {},
        },
        {
          id: "field3",
          isUsedInProfileName: false,
          type: "SHORT_TEXT",
          options: {},
        },
      ],
    });

    const petitionFieldId1 = "petitionField1";
    const petitionFieldId2 = "petitionField2";
    const petition = createMockPetition({
      fields: [
        {
          id: "petitionFieldGroup1",
          type: "FIELD_GROUP",
          options: {},
          parent: null,
          replies: [],
          profileTypeField: null,
          children: [
            {
              id: petitionFieldId1,
              type: "SHORT_TEXT",
              options: {},
              parent: {
                id: "petitionFieldGroup1",
              },
              replies: [],
              profileTypeField: {
                id: profileTypeFieldId1,
              },
            },
            {
              id: petitionFieldId2,
              type: "SHORT_TEXT",
              options: {},
              parent: {
                id: "petitionFieldGroup1",
              },
              replies: [],
              profileTypeField: {
                id: profileTypeFieldId2,
              },
            },
          ],
        },
      ],
    });

    const reply = createMockReply({
      id: "replyId1",
      content: {},
      children: [
        {
          field: {
            id: petitionFieldId1,
          },
          replies: [
            {
              id: "childReply1",
              content: {
                value: "R1",
              },
            },
          ],
        },
        {
          field: {
            id: petitionFieldId2,
          },
          replies: [
            {
              id: "childReply2",
              content: {
                value: "R2",
              },
            },
          ],
        },
      ],
    });

    const { result } = renderHook(() =>
      useProfileNamePreview({
        profileType,
        petition,
        replies: [reply],
        fieldLogic: [],
      }),
    );

    expect(result.current).toBe("R1 R2 R1");
  });

  it("should build profile name from updateProfileOnClose with FIELD source", () => {
    const profileTypeFieldId = "profileTypeFieldId1";
    const petitionFieldId = "petitionFieldId1";
    const profileType = createMockProfileType({
      profileNamePattern: `{{ ${profileTypeFieldId} }}`,
      fields: [
        {
          id: profileTypeFieldId,
          isUsedInProfileName: true,
          type: "SHORT_TEXT",
          options: {},
        },
      ],
    });

    const petition = createMockPetition({
      fields: [
        {
          id: petitionFieldId,
          type: "SHORT_TEXT",
          options: {},
          parent: null,
          replies: [
            {
              id: "replyId1",
              content: {
                value: "Jane Doe",
              },
              children: [],
            },
          ],
          profileTypeField: null,
        },
      ],
    });

    const updateProfileOnClose: UpdateProfileOnClose[] = [
      {
        profileTypeFieldId,
        source: {
          type: "FIELD",
          fieldId: petitionFieldId,
        },
      },
    ];

    const reply = createMockReply({
      id: "fieldGroupReplyId1",
      content: {},
      children: [],
    });

    const { result } = renderHook(() =>
      useProfileNamePreview({
        profileType,
        petition,
        replies: [reply],
        fieldLogic: [],
        updateProfileOnClose,
      }),
    );

    expect(result.current).toBe("Jane Doe");
  });

  it("should build profile name from updateProfileOnClose with VARIABLE source", () => {
    const profileTypeFieldId = "profileTypeFieldId1";
    const profileType = createMockProfileType({
      profileNamePattern: `{{ ${profileTypeFieldId} }}`,
      fields: [
        {
          id: profileTypeFieldId,
          isUsedInProfileName: true,
          type: "SHORT_TEXT",
          options: {},
        },
      ],
    });

    const updateProfileOnClose: UpdateProfileOnClose[] = [
      {
        profileTypeFieldId,
        source: {
          type: "VARIABLE",
          name: "name",
        },
      },
    ];

    const fieldLogic = [
      createMockFieldLogic({
        finalVariables: {
          name: "Variable Name Value",
        },
      }),
    ];

    const reply = createMockReply({
      id: "fieldGroupReplyId1",
      content: {},
      children: [],
    });

    const { result } = renderHook(() =>
      useProfileNamePreview({
        profileType,
        petition: createMockPetition(),
        replies: [reply],
        fieldLogic,
        updateProfileOnClose,
      }),
    );

    expect(result.current).toBe("Variable Name Value");
  });

  it("should build profile name from updateProfileOnClose with PETITION_METADATA source", () => {
    const profileTypeFieldId = "profileTypeFieldId1";
    const profileType = createMockProfileType({
      profileNamePattern: `{{ ${profileTypeFieldId} }}`,
      fields: [
        {
          id: profileTypeFieldId,
          isUsedInProfileName: true,
          type: "DATE",
          options: {},
        },
      ],
    });

    const closedAt = "2024-01-15T10:00:00Z";
    const petition = createMockPetition({
      closedAt,
    });

    const updateProfileOnClose: UpdateProfileOnClose[] = [
      {
        profileTypeFieldId,
        source: {
          type: "PETITION_METADATA",
          name: "CLOSED_AT",
        },
      },
    ];

    const reply = createMockReply({
      id: "fieldGroupReplyId1",
      content: {},
      children: [],
    });

    const { result } = renderHook(() =>
      useProfileNamePreview({
        profileType,
        petition,
        replies: [reply],
        fieldLogic: [],
        updateProfileOnClose,
      }),
    );

    expect(result.current).toBe(closedAt);
  });

  it("should build profile name from reply children with combined FIELD_GROUP with multiple children", () => {
    const profileTypeFieldId1 = "profileTypeFieldId1";
    const profileTypeFieldId2 = "profileTypeFieldId2";

    const profileType = createMockProfileType({
      profileNamePattern: `{{ ${profileTypeFieldId1} }} {{ ${profileTypeFieldId2} }} {{ ${profileTypeFieldId1} }}`,
      fields: [
        {
          id: profileTypeFieldId1,
          isUsedInProfileName: true,
          type: "SHORT_TEXT",
          options: {},
        },
        {
          id: profileTypeFieldId2,
          isUsedInProfileName: true,
          type: "SHORT_TEXT",
          options: {},
        },
        {
          id: "field3",
          isUsedInProfileName: false,
          type: "SHORT_TEXT",
          options: {},
        },
      ],
    });

    const petitionFieldId1 = "petitionField1";
    const petitionFieldId2 = "petitionField2";
    const petitionFieldId3 = "petitionField3";
    const petition = createMockPetition({
      fields: [
        {
          id: "petitionFieldGroup1",
          type: "FIELD_GROUP",
          options: {
            groupName: "Client",
          },
          parent: null,
          replies: [],
          profileTypeField: null,
          children: [
            {
              id: petitionFieldId1,
              type: "SHORT_TEXT",
              options: {},
              parent: {
                id: "petitionFieldGroup1",
              },
              replies: [],
              profileTypeField: {
                id: profileTypeFieldId1,
              },
            },
          ],
        },
        {
          id: "petitionFieldGroup2",
          type: "FIELD_GROUP",
          options: {
            groupName: "Client",
          },
          parent: null,
          replies: [],
          profileTypeField: null,
          children: [
            {
              id: petitionFieldId2,
              type: "SHORT_TEXT",
              options: {},
              parent: {
                id: "petitionFieldGroup2",
              },
              replies: [],
              profileTypeField: {
                id: profileTypeFieldId1,
              },
            },
            {
              id: petitionFieldId3,
              type: "SHORT_TEXT",
              options: {},
              parent: {
                id: "petitionFieldGroup2",
              },
              replies: [],
              profileTypeField: {
                id: profileTypeFieldId2,
              },
            },
          ],
        },
      ],
    });

    const reply1 = createMockReply({
      id: "reply1",
      content: {},
      children: [
        {
          field: {
            id: petitionFieldId1,
          },
          replies: [
            {
              id: "childReply1",
              content: {
                value: "G1_R1",
              },
            },
          ],
        },
      ],
    });

    const reply2 = createMockReply({
      id: "reply2",
      content: {},
      children: [
        {
          field: {
            id: petitionFieldId2,
          },
          replies: [
            {
              id: "childReply1",
              content: {
                value: "G2_R1",
              },
            },
          ],
        },
        {
          field: {
            id: petitionFieldId3,
          },
          replies: [
            {
              id: "childReply2",
              content: {
                value: "G2_R2",
              },
            },
          ],
        },
      ],
    });

    const { result } = renderHook(() =>
      useProfileNamePreview({
        profileType,
        petition,
        replies: [reply1, reply2],
        fieldLogic: [],
      }),
    );

    expect(result.current).toBe("G1_R1 G2_R2 G1_R1");
  });
});
