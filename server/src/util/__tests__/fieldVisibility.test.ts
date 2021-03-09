import { evaluateFieldVisibility } from "../fieldVisibility";

describe("fieldVisibility", () => {
  it("no conditions", () => {
    const fields = evaluateFieldVisibility([
      {
        id: 1,
        visibility: null,
        replies: [{ content: { text: "Yes" } }],
      },
      {
        id: 2,
        visibility: null,
        replies: [{ content: { text: "No" } }],
      },
    ]);

    expect(fields).toMatchObject([true, true]);
  });

  it("should be case-insensitive", () => {
    const fields = evaluateFieldVisibility([
      {
        id: 1,
        visibility: null,
        replies: [{ content: { text: "Jon Snow" } }],
      },
      {
        id: 2,
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
        replies: [{ content: { text: "." } }],
      },
    ]);

    expect(fields).toMatchObject([true, true]);
  });

  describe("simple conditions", () => {
    it("ANY EQUAL", () => {
      const fields = evaluateFieldVisibility([
        {
          id: 1,
          visibility: null,
          replies: [{ content: { text: "Jon Snow" } }],
        },
        {
          id: 2,
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
          replies: [{ content: { text: "." } }],
        },
      ]);

      expect(fields).toMatchObject([true, true]);
    });

    it("ANY CONTAIN", () => {
      const fields = evaluateFieldVisibility([
        {
          id: 1,
          visibility: null,
          replies: [
            { content: { text: "Jon Snow" } },
            { content: { text: "Daenerys Targaryen" } },
          ],
        },
        {
          id: 2,
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
          replies: [{ content: { text: "." } }],
        },
      ]);

      expect(fields).toMatchObject([true, true]);
    });

    it("ALL END_WITH", () => {
      const fields = evaluateFieldVisibility([
        {
          id: 1,
          visibility: null,
          replies: [
            { content: { text: "Robb Stark" } },
            { content: { text: "Sansa Stark" } },
            { content: { text: "Ned Stark" } },
          ],
        },
        {
          id: 2,
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
          replies: [{ content: { text: "." } }],
        },
      ]);
      expect(fields).toMatchObject([true, true]);
    });

    it("NONE CONTAIN", () => {
      const fields = evaluateFieldVisibility([
        {
          id: 1,
          visibility: null,
          replies: [
            { content: { text: "Robert Baratheon, king of Westeros" } },
            { content: { text: "Daenerys Targaryen, Mother of Dragons" } },
          ],
        },
        {
          id: 2,
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
          replies: [{ content: { text: "." } }],
        },
      ]);

      expect(fields).toMatchObject([true, false]);
    });

    it("NUMBER_OF_REPLIES", () => {
      const fields = evaluateFieldVisibility([
        {
          id: 1,
          visibility: null,
          replies: [
            { content: { text: "Robb" } },
            { content: { text: "Sansa" } },
            { content: { text: "Arya" } },
            { content: { text: "Bran" } },
            { content: { text: "Rickon" } },
          ],
        },
        {
          id: 2,
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
          replies: [{ content: { text: "." } }],
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
          visibility: null,
          replies: [{ content: { text: "Jon Snow" } }],
        },
        {
          id: 2,
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
          replies: [{ content: { text: "." } }],
        },
      ]);

      expect(fields).toMatchObject([true, true]);
    });

    it("ALL CONTAIN AND ANY START_WITH", () => {
      const fields = evaluateFieldVisibility([
        {
          id: 1,
          visibility: null,
          replies: [
            { content: { text: "King in the North" } },
            { content: { text: "Hand of the King" } },
            { content: { text: "Kingkiller" } },
            { content: { text: "The Madking" } },
          ],
        },
        {
          id: 2,
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
          replies: [{ content: { text: "." } }],
        },
      ]);

      expect(fields).toMatchObject([true, true]);
    });

    it("NUMBER_OF_REPLIES OR NONE END_WITH OR ANY START_WITH", () => {
      const fields = evaluateFieldVisibility([
        {
          id: 1,
          visibility: null,
          replies: [
            { content: { text: "Jon Snow" } },
            { content: { text: "Tyrion Lannister" } },
            { content: { text: "Jaime Lannister" } },
            { content: { text: "Aerys Targaryen" } },
          ],
        },
        {
          id: 2,
          visibility: null,
          replies: [
            { content: { text: "King in the North" } },
            { content: { text: "Hand of the King" } },
            { content: { text: "Kingkiller" } },
            { content: { text: "The Madking" } },
          ],
        },
        {
          id: 3,
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
          replies: [{ content: { text: "." } }],
        },
      ]);

      expect(fields).toMatchObject([true, true, true]);
    });
  });
});
