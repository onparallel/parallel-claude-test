import { evaluateFieldVisibility } from "../fieldVisibility";

describe("fieldVisibility", () => {
  it("no conditions", () => {
    const fields = evaluateFieldVisibility([
      {
        id: 1,
        type: "TEXT",
        options: {},
        visibility: null,
        replies: [{ content: { value: "Yes" } }],
      },
      {
        id: 2,
        type: "TEXT",
        options: {},
        visibility: null,
        replies: [{ content: { value: "No" } }],
      },
    ]);

    expect(fields).toMatchObject([true, true]);
  });

  it("should be case-insensitive", () => {
    const fields = evaluateFieldVisibility([
      {
        id: 1,
        type: "TEXT",
        options: {},
        visibility: null,
        replies: [{ content: { value: "Jon Snow" } }],
      },
      {
        id: 2,
        type: "TEXT",
        options: {},
        visibility: {
          type: "SHOW",
          operator: "OR",
          conditions: [
            {
              fieldId: 1,
              modifier: "ANY",
              operator: "EQUAL",
              value: "JON SNOW",
            },
          ],
        },
        replies: [{ content: { value: "." } }],
      },
    ]);

    expect(fields).toMatchObject([true, true]);
  });

  describe("simple conditions", () => {
    it("ANY EQUAL", () => {
      const fields = evaluateFieldVisibility([
        {
          id: 1,
          type: "TEXT",
          options: {},
          visibility: null,
          replies: [{ content: { value: "Jon Snow" } }],
        },
        {
          id: 2,
          type: "TEXT",
          options: {},
          visibility: {
            type: "SHOW",
            operator: "OR",
            conditions: [
              {
                fieldId: 1,
                modifier: "ANY",
                operator: "EQUAL",
                value: "Jon Snow",
              },
            ],
          },
          replies: [{ content: { value: "." } }],
        },
      ]);

      expect(fields).toMatchObject([true, true]);
    });

    it("ANY CONTAIN", () => {
      const fields = evaluateFieldVisibility([
        {
          id: 1,
          type: "TEXT",
          options: {},
          visibility: null,
          replies: [
            { content: { value: "Jon Snow" } },
            { content: { value: "Daenerys Targaryen" } },
          ],
        },
        {
          id: 2,
          type: "TEXT",
          options: {},
          visibility: {
            type: "SHOW",
            operator: "OR",
            conditions: [
              {
                fieldId: 1,
                modifier: "ANY",
                operator: "CONTAIN",
                value: "Targaryen",
              },
            ],
          },
          replies: [{ content: { value: "." } }],
        },
      ]);

      expect(fields).toMatchObject([true, true]);
    });

    it("ALL END_WITH", () => {
      const fields = evaluateFieldVisibility([
        {
          id: 1,
          type: "TEXT",
          options: {},
          visibility: null,
          replies: [
            { content: { value: "Robb Stark" } },
            { content: { value: "Sansa Stark" } },
            { content: { value: "Ned Stark" } },
          ],
        },
        {
          id: 2,
          type: "TEXT",
          options: {},
          visibility: {
            type: "SHOW",
            operator: "OR",
            conditions: [
              {
                fieldId: 1,
                modifier: "ALL",
                operator: "END_WITH",
                value: "Stark",
              },
            ],
          },
          replies: [{ content: { value: "." } }],
        },
      ]);
      expect(fields).toMatchObject([true, true]);
    });

    it("NONE CONTAIN", () => {
      const fields = evaluateFieldVisibility([
        {
          id: 1,
          type: "TEXT",
          options: {},
          visibility: null,
          replies: [
            { content: { value: "Robert Baratheon, king of Westeros" } },
            { content: { value: "Daenerys Targaryen, Mother of Dragons" } },
          ],
        },
        {
          id: 2,
          type: "TEXT",
          options: {},
          visibility: {
            type: "SHOW",
            operator: "OR",
            conditions: [
              {
                fieldId: 1,
                modifier: "NONE",
                operator: "CONTAIN",
                value: "dragons",
              },
            ],
          },
          replies: [{ content: { value: "." } }],
        },
      ]);

      expect(fields).toMatchObject([true, false]);
    });

    it("NUMBER_OF_REPLIES", () => {
      const fields = evaluateFieldVisibility([
        {
          id: 1,
          type: "TEXT",
          options: {},
          visibility: null,
          replies: [
            { content: { value: "Robb" } },
            { content: { value: "Sansa" } },
            { content: { value: "Arya" } },
            { content: { value: "Bran" } },
            { content: { value: "Rickon" } },
          ],
        },
        {
          id: 2,
          type: "TEXT",
          options: {},
          visibility: {
            type: "SHOW",
            operator: "OR",
            conditions: [
              {
                fieldId: 1,
                modifier: "NUMBER_OF_REPLIES",
                operator: "LESS_THAN_OR_EQUAL",
                value: 3,
              },
            ],
          },
          replies: [{ content: { value: "." } }],
        },
      ]);

      expect(fields).toMatchObject([true, false]);
    });
  });

  describe("multiple conditions", () => {
    it("NONE CONTAIN AND NUMBER_OF_REPLIES", () => {
      const fields = evaluateFieldVisibility([
        {
          id: 1,
          type: "TEXT",
          options: {},
          visibility: null,
          replies: [{ content: { value: "Jon Snow" } }],
        },
        {
          id: 2,
          type: "TEXT",
          options: {},
          visibility: {
            type: "SHOW",
            operator: "AND",
            conditions: [
              {
                fieldId: 1,
                modifier: "NONE",
                operator: "CONTAIN",
                value: "King",
              },
              {
                fieldId: 1,
                modifier: "NUMBER_OF_REPLIES",
                operator: "EQUAL",
                value: 1,
              },
            ],
          },
          replies: [{ content: { value: "." } }],
        },
      ]);

      expect(fields).toMatchObject([true, true]);
    });

    it("ALL CONTAIN AND ANY START_WITH", () => {
      const fields = evaluateFieldVisibility([
        {
          id: 1,
          type: "TEXT",
          options: {},
          visibility: null,
          replies: [
            { content: { value: "King in the North" } },
            { content: { value: "Hand of the King" } },
            { content: { value: "Kingkiller" } },
            { content: { value: "The Madking" } },
          ],
        },
        {
          id: 2,
          type: "TEXT",
          options: {},
          visibility: {
            type: "SHOW",
            operator: "AND",
            conditions: [
              {
                fieldId: 1,
                modifier: "ALL",
                operator: "CONTAIN",
                value: "king",
              },
              {
                fieldId: 1,
                modifier: "ANY",
                operator: "END_WITH",
                value: "killer",
              },
            ],
          },
          replies: [{ content: { value: "." } }],
        },
      ]);

      expect(fields).toMatchObject([true, true]);
    });

    it("NUMBER_OF_REPLIES OR NONE END_WITH OR ANY START_WITH", () => {
      const fields = evaluateFieldVisibility([
        {
          id: 1,
          type: "TEXT",
          options: {},
          visibility: null,
          replies: [
            { content: { value: "Jon Snow" } },
            { content: { value: "Tyrion Lannister" } },
            { content: { value: "Jaime Lannister" } },
            { content: { value: "Aerys Targaryen" } },
          ],
        },
        {
          id: 2,
          type: "TEXT",
          options: {},
          visibility: null,
          replies: [
            { content: { value: "King in the North" } },
            { content: { value: "Hand of the King" } },
            { content: { value: "Kingkiller" } },
            { content: { value: "The Madking" } },
          ],
        },
        {
          id: 3,
          type: "TEXT",
          options: {},
          visibility: {
            type: "SHOW",
            operator: "OR",
            conditions: [
              {
                fieldId: 1,
                modifier: "NUMBER_OF_REPLIES",
                operator: "EQUAL",
                value: 1,
              },
              {
                fieldId: 2,
                modifier: "NONE",
                operator: "END_WITH",
                value: "killer",
              },
              {
                fieldId: 2,
                modifier: "ANY",
                operator: "START_WITH",
                value: "hand",
              },
            ],
          },
          replies: [{ content: { value: "." } }],
        },
      ]);

      expect(fields).toMatchObject([true, true, true]);
    });

    it("SHOW ONE TEXT AND HIDE OTHER WHEN CHECKBOX CONTAIN CHOICE 1", () => {
      const fields = evaluateFieldVisibility([
        {
          id: 1,
          type: "CHECKBOX",
          options: {
            values: ["Choice 1", "Choice 2", "Choice 3", "Choice 4"],
            limit: {
              type: "UNLIMITED",
              min: 1,
              max: 1,
            },
          },
          visibility: null,
          replies: [{ content: { value: ["Choice 1", "Choice 2"] } }],
        },
        {
          id: 2,
          type: "TEXT",
          options: {},
          visibility: {
            type: "SHOW",
            operator: "AND",
            conditions: [
              {
                fieldId: 1,
                modifier: "ANY",
                operator: "CONTAIN",
                value: "Choice 1",
              },
            ],
          },
          replies: [{ content: { value: "." } }],
        },
        {
          id: 3,
          type: "TEXT",
          options: {},
          visibility: {
            type: "HIDE",
            operator: "AND",
            conditions: [
              {
                fieldId: 1,
                modifier: "ANY",
                operator: "CONTAIN",
                value: "Choice 1",
              },
            ],
          },
          replies: [{ content: { value: "." } }],
        },
      ]);

      expect(fields).toMatchObject([true, true, false]);
    });

    it("SHOW ONE TEXT AND HIDE OTHER WHEN CHECKBOX NOT CONTAIN CHOICE 1", () => {
      const fields = evaluateFieldVisibility([
        {
          id: 1,
          type: "CHECKBOX",
          options: {
            values: ["Choice 1", "Choice 2", "Choice 3", "Choice 4"],
            limit: {
              type: "UNLIMITED",
              min: 1,
              max: 1,
            },
          },
          visibility: null,
          replies: [{ content: { value: ["Choice 1", "Choice 2"] } }],
        },
        {
          id: 2,
          type: "TEXT",
          options: {},
          visibility: {
            type: "SHOW",
            operator: "AND",
            conditions: [
              {
                fieldId: 1,
                modifier: "ANY",
                operator: "NOT_CONTAIN",
                value: "Choice 1",
              },
            ],
          },
          replies: [{ content: { value: "." } }],
        },
        {
          id: 3,
          type: "TEXT",
          options: {},
          visibility: {
            type: "HIDE",
            operator: "AND",
            conditions: [
              {
                fieldId: 1,
                modifier: "ANY",
                operator: "NOT_CONTAIN",
                value: "Choice 1",
              },
            ],
          },
          replies: [{ content: { value: "." } }],
        },
      ]);

      expect(fields).toMatchObject([true, false, true]);
    });

    it("SHOW WHEN NUMBER_OF_SUBREPLIES CHECKBOX", () => {
      const fields = evaluateFieldVisibility([
        {
          id: 1,
          type: "CHECKBOX",
          options: {
            values: ["Choice 1", "Choice 2", "Choice 3", "Choice 4"],
            limit: {
              type: "UNLIMITED",
              min: 1,
              max: 1,
            },
          },
          visibility: null,
          replies: [{ content: { value: ["Choice 1", "Choice 2"] } }],
        },
        {
          id: 2,
          type: "TEXT",
          options: {},
          visibility: {
            type: "SHOW",
            operator: "AND",
            conditions: [
              {
                fieldId: 1,
                modifier: "ANY",
                operator: "NUMBER_OF_SUBREPLIES",
                value: 2,
              },
            ],
          },
          replies: [{ content: { value: "." } }],
        },
        {
          id: 3,
          type: "TEXT",
          options: {},
          visibility: {
            type: "HIDE",
            operator: "AND",
            conditions: [
              {
                fieldId: 1,
                modifier: "ANY",
                operator: "NUMBER_OF_SUBREPLIES",
                value: 2,
              },
            ],
          },
          replies: [{ content: { value: "." } }],
        },
        {
          id: 4,
          type: "TEXT",
          options: {},
          visibility: {
            type: "SHOW",
            operator: "AND",
            conditions: [
              {
                fieldId: 1,
                modifier: "ANY",
                operator: "NUMBER_OF_SUBREPLIES",
                value: 5,
              },
            ],
          },
          replies: [{ content: { value: "." } }],
        },
      ]);

      expect(fields).toMatchObject([true, true, false, false]);
    });

    it("SHOW WHEN HAS REPLIES AND DOES NOT HAVE REPLIES CHECKBOX INCOMPLETED REPLY", () => {
      const fields = evaluateFieldVisibility([
        {
          id: 1,
          type: "CHECKBOX",
          options: {
            values: ["Choice 1", "Choice 2", "Choice 3", "Choice 4"],
            limit: {
              type: "EXACT",
              min: 1,
              max: 3,
            },
          },
          visibility: null,
          replies: [{ content: { value: ["Choice 1", "Choice 2"] } }],
        },
        {
          id: 2,
          type: "TEXT",
          options: {},
          visibility: {
            type: "SHOW",
            operator: "AND",
            conditions: [
              {
                fieldId: 1,
                modifier: "NUMBER_OF_REPLIES",
                operator: "GREATER_THAN",
                value: 0,
              },
            ],
          },
          replies: [{ content: { value: "." } }],
        },
        {
          id: 3,
          type: "TEXT",
          options: {},
          visibility: {
            type: "SHOW",
            operator: "AND",
            conditions: [
              {
                fieldId: 1,
                modifier: "NUMBER_OF_REPLIES",
                operator: "EQUAL",
                value: 0,
              },
            ],
          },
          replies: [{ content: { value: "." } }],
        },
      ]);

      expect(fields).toMatchObject([true, false, true]);
    });

    it("SHOW WHEN HAS REPLIES AND DOES NOT HAVE REPLIES CHECKBOX COMPLETED REPLY", () => {
      const fields = evaluateFieldVisibility([
        {
          id: 1,
          type: "CHECKBOX",
          options: {
            values: ["Choice 1", "Choice 2", "Choice 3", "Choice 4"],
            limit: {
              type: "EXACT",
              min: 1,
              max: 3,
            },
          },
          visibility: null,
          replies: [{ content: { value: ["Choice 1", "Choice 2", "Choice 3"] } }],
        },
        {
          id: 2,
          type: "TEXT",
          options: {},
          visibility: {
            type: "SHOW",
            operator: "AND",
            conditions: [
              {
                fieldId: 1,
                modifier: "NUMBER_OF_REPLIES",
                operator: "GREATER_THAN",
                value: 0,
              },
            ],
          },
          replies: [{ content: { value: "." } }],
        },
        {
          id: 3,
          type: "TEXT",
          options: {},
          visibility: {
            type: "SHOW",
            operator: "AND",
            conditions: [
              {
                fieldId: 1,
                modifier: "NUMBER_OF_REPLIES",
                operator: "EQUAL",
                value: 0,
              },
            ],
          },
          replies: [{ content: { value: "." } }],
        },
      ]);

      expect(fields).toMatchObject([true, true, false]);
    });

    it("SHOW WHEN HAS REPLIES AND DOES NOT HAVE REPLIES CHECKBOX INCOMPLETED REPLY RANGE", () => {
      const fields = evaluateFieldVisibility([
        {
          id: 1,
          type: "CHECKBOX",
          options: {
            values: ["Choice 1", "Choice 2", "Choice 3", "Choice 4"],
            limit: {
              type: "RANGE",
              min: 3,
              max: 4,
            },
          },
          visibility: null,
          replies: [{ content: { value: ["Choice 1", "Choice 2"] } }],
        },
        {
          id: 2,
          type: "TEXT",
          options: {},
          visibility: {
            type: "SHOW",
            operator: "AND",
            conditions: [
              {
                fieldId: 1,
                modifier: "NUMBER_OF_REPLIES",
                operator: "GREATER_THAN",
                value: 0,
              },
            ],
          },
          replies: [{ content: { value: "." } }],
        },
        {
          id: 3,
          type: "TEXT",
          options: {},
          visibility: {
            type: "SHOW",
            operator: "AND",
            conditions: [
              {
                fieldId: 1,
                modifier: "NUMBER_OF_REPLIES",
                operator: "EQUAL",
                value: 0,
              },
            ],
          },
          replies: [{ content: { value: "." } }],
        },
      ]);

      expect(fields).toMatchObject([true, false, true]);
    });

    it("SHOW WHEN HAS REPLIES AND DOES NOT HAVE REPLIES CHECKBOX COMPLETED REPLY RANGE", () => {
      const fields = evaluateFieldVisibility([
        {
          id: 1,
          type: "CHECKBOX",
          options: {
            values: ["Choice 1", "Choice 2", "Choice 3", "Choice 4"],
            limit: {
              type: "RANGE",
              min: 3,
              max: 4,
            },
          },
          visibility: null,
          replies: [{ content: { value: ["Choice 1", "Choice 2", "Choice 3"] } }],
        },
        {
          id: 2,
          type: "TEXT",
          options: {},
          visibility: {
            type: "SHOW",
            operator: "AND",
            conditions: [
              {
                fieldId: 1,
                modifier: "NUMBER_OF_REPLIES",
                operator: "GREATER_THAN",
                value: 0,
              },
            ],
          },
          replies: [{ content: { value: "." } }],
        },
        {
          id: 3,
          type: "TEXT",
          options: {},
          visibility: {
            type: "SHOW",
            operator: "AND",
            conditions: [
              {
                fieldId: 1,
                modifier: "NUMBER_OF_REPLIES",
                operator: "EQUAL",
                value: 0,
              },
            ],
          },
          replies: [{ content: { value: "." } }],
        },
      ]);

      expect(fields).toMatchObject([true, true, false]);
    });
  });
});
