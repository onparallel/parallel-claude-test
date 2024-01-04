import { evaluateFieldLogic } from "../fieldLogic";

describe("evaluateFieldLogic", () => {
  describe("field visibility", () => {
    it("no conditions", () => {
      const fields = evaluateFieldLogic({
        fields: [
          {
            id: 1,
            type: "TEXT",
            options: {},
            visibility: null,
            math: null,
            replies: [{ content: { value: "Yes" }, anonymized_at: null }],
          },
          {
            id: 2,
            type: "TEXT",
            options: {},
            visibility: null,
            math: null,
            replies: [{ content: { value: "No" }, anonymized_at: null }],
          },
        ],
        variables: [],
        custom_lists: [],
      });

      expect(fields).toMatchObject([true, true].map((isVisible) => ({ isVisible })));
    });

    it("should be case-insensitive", () => {
      const fields = evaluateFieldLogic({
        fields: [
          {
            id: 1,
            type: "TEXT",
            options: {},
            visibility: null,
            math: null,
            replies: [{ content: { value: "Jon Snow" }, anonymized_at: null }],
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
            math: null,
            replies: [{ content: { value: "." }, anonymized_at: null }],
          },
        ],
        variables: [],
        custom_lists: [],
      });

      expect(fields).toMatchObject([true, true].map((isVisible) => ({ isVisible })));
    });

    it("ANY EQUAL", () => {
      const fields = evaluateFieldLogic({
        fields: [
          {
            id: 1,
            type: "TEXT",
            options: {},
            visibility: null,
            math: null,
            replies: [{ content: { value: "Jon Snow" }, anonymized_at: null }],
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
            math: null,
            replies: [{ content: { value: "." }, anonymized_at: null }],
          },
        ],
        variables: [],
        custom_lists: [],
      });

      expect(fields).toMatchObject([true, true].map((isVisible) => ({ isVisible })));
    });

    it("ANY CONTAIN", () => {
      const fields = evaluateFieldLogic({
        fields: [
          {
            id: 1,
            type: "TEXT",
            options: {},
            visibility: null,
            math: null,
            replies: [
              { content: { value: "Jon Snow" }, anonymized_at: null },
              { content: { value: "Daenerys Targaryen" }, anonymized_at: null },
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
            math: null,
            replies: [{ content: { value: "." }, anonymized_at: null }],
          },
        ],
        variables: [],
        custom_lists: [],
      });

      expect(fields).toMatchObject([true, true].map((isVisible) => ({ isVisible })));
    });

    it("ALL END_WITH", () => {
      const fields = evaluateFieldLogic({
        fields: [
          {
            id: 1,
            type: "TEXT",
            options: {},
            visibility: null,
            math: null,
            replies: [
              { content: { value: "Robb Stark" }, anonymized_at: null },
              { content: { value: "Sansa Stark" }, anonymized_at: null },
              { content: { value: "Ned Stark" }, anonymized_at: null },
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
            math: null,
            replies: [{ content: { value: "." }, anonymized_at: null }],
          },
        ],
        variables: [],
        custom_lists: [],
      });
      expect(fields).toMatchObject([true, true].map((isVisible) => ({ isVisible })));
    });

    it("NONE CONTAIN", () => {
      const fields = evaluateFieldLogic({
        fields: [
          {
            id: 1,
            type: "TEXT",
            options: {},
            visibility: null,
            math: null,
            replies: [
              { content: { value: "Robert Baratheon, king of Westeros" }, anonymized_at: null },
              {
                content: { value: "Daenerys Targaryen, Mother of Dragons" },
                anonymized_at: null,
              },
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
            math: null,
            replies: [{ content: { value: "." }, anonymized_at: null }],
          },
        ],
        variables: [],
        custom_lists: [],
      });

      expect(fields).toMatchObject([true, false].map((isVisible) => ({ isVisible })));
    });

    it("NUMBER_OF_REPLIES", () => {
      const fields = evaluateFieldLogic({
        fields: [
          {
            id: 1,
            type: "TEXT",
            options: {},
            visibility: null,
            math: null,
            replies: [
              { content: { value: "Robb" }, anonymized_at: null },
              { content: { value: "Sansa" }, anonymized_at: null },
              { content: { value: "Arya" }, anonymized_at: null },
              { content: { value: "Bran" }, anonymized_at: null },
              { content: { value: "Rickon" }, anonymized_at: null },
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
            math: null,
            replies: [{ content: { value: "." }, anonymized_at: null }],
          },
        ],
        variables: [],
        custom_lists: [],
      });

      expect(fields).toMatchObject([true, false].map((isVisible) => ({ isVisible })));
    });

    it("with dynamic select", () => {
      const fields = evaluateFieldLogic({
        fields: [
          {
            id: 1,
            type: "DYNAMIC_SELECT",
            options: {
              labels: ["Marca del vehículo", "Modelo del vehículo"],
              values: [
                ["Alfa Romeo", ["4C", "Giulia", "Giulietta", "MiTo", "Otro", "Stelvio"]],
                ["Aro", ["Otro"]],
                ["Asia Motors", ["Otro"]],
                [
                  "Aston Martin",
                  ["DB9", "Otro", "Rapide", "Vanquish", "Vantage V12", "Vantage V8"],
                ],
              ],
            },
            visibility: null,
            math: null,
            replies: [
              {
                content: {
                  value: [
                    ["Marca del vehículo", "Aston Martin"],
                    ["Modelo del vehículo", "Vanquish"],
                  ],
                },
                anonymized_at: null,
              },
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
                  modifier: "ANY",
                  fieldId: 1,
                  column: 1,
                  operator: "EQUAL",
                  value: "Vanquish",
                },
              ],
            },
            math: null,
            replies: [],
          },
        ],
        variables: [],
        custom_lists: [],
      });

      expect(fields).toEqual([
        {
          isVisible: true,
          previousVariables: {},
          currentVariables: {},
          finalVariables: {},
        },
        {
          isVisible: true,
          previousVariables: {},
          currentVariables: {},
          finalVariables: {},
        },
      ]);
    });

    it("NONE CONTAIN AND NUMBER_OF_REPLIES", () => {
      const fields = evaluateFieldLogic({
        fields: [
          {
            id: 1,
            type: "TEXT",
            options: {},
            visibility: null,
            math: null,
            replies: [{ content: { value: "Jon Snow" }, anonymized_at: null }],
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
            math: null,
            replies: [{ content: { value: "." }, anonymized_at: null }],
          },
        ],
        variables: [],
        custom_lists: [],
      });

      expect(fields).toMatchObject([true, true].map((isVisible) => ({ isVisible })));
    });

    it("ALL CONTAIN AND ANY START_WITH", () => {
      const fields = evaluateFieldLogic({
        fields: [
          {
            id: 1,
            type: "TEXT",
            options: {},
            visibility: null,
            math: null,
            replies: [
              { content: { value: "King in the North" }, anonymized_at: null },
              { content: { value: "Hand of the King" }, anonymized_at: null },
              { content: { value: "Kingkiller" }, anonymized_at: null },
              { content: { value: "The Madking" }, anonymized_at: null },
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
            math: null,
            replies: [{ content: { value: "." }, anonymized_at: null }],
          },
        ],
        variables: [],
        custom_lists: [],
      });

      expect(fields).toMatchObject([true, true].map((isVisible) => ({ isVisible })));
    });

    it("NUMBER_OF_REPLIES OR NONE END_WITH OR ANY START_WITH", () => {
      const fields = evaluateFieldLogic({
        fields: [
          {
            id: 1,
            type: "TEXT",
            options: {},
            visibility: null,
            math: null,
            replies: [
              { content: { value: "Jon Snow" }, anonymized_at: null },
              { content: { value: "Tyrion Lannister" }, anonymized_at: null },
              { content: { value: "Jaime Lannister" }, anonymized_at: null },
              { content: { value: "Aerys Targaryen" }, anonymized_at: null },
            ],
          },
          {
            id: 2,
            type: "TEXT",
            options: {},
            visibility: null,
            math: null,
            replies: [
              { content: { value: "King in the North" }, anonymized_at: null },
              { content: { value: "Hand of the King" }, anonymized_at: null },
              { content: { value: "Kingkiller" }, anonymized_at: null },
              { content: { value: "The Madking" }, anonymized_at: null },
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
            math: null,
            replies: [{ content: { value: "." }, anonymized_at: null }],
          },
        ],
        variables: [],
        custom_lists: [],
      });

      expect(fields).toMatchObject([true, true, true].map((isVisible) => ({ isVisible })));
    });

    it("SHOW ONE TEXT AND HIDE OTHER WHEN CHECKBOX CONTAIN CHOICE 1", () => {
      const fields = evaluateFieldLogic({
        fields: [
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
            math: null,
            replies: [{ content: { value: ["Choice 1", "Choice 2"] }, anonymized_at: null }],
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
            math: null,
            replies: [{ content: { value: "." }, anonymized_at: null }],
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
            math: null,
            replies: [{ content: { value: "." }, anonymized_at: null }],
          },
        ],
        variables: [],
        custom_lists: [],
      });

      expect(fields).toMatchObject([true, true, false].map((isVisible) => ({ isVisible })));
    });

    it("SHOW ONE TEXT AND HIDE OTHER WHEN CHECKBOX NOT CONTAIN CHOICE 1", () => {
      const fields = evaluateFieldLogic({
        fields: [
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
            math: null,
            replies: [{ content: { value: ["Choice 1", "Choice 2"] }, anonymized_at: null }],
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
            math: null,
            replies: [{ content: { value: "." }, anonymized_at: null }],
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
            math: null,
            replies: [{ content: { value: "." }, anonymized_at: null }],
          },
        ],
        variables: [],
        custom_lists: [],
      });

      expect(fields).toMatchObject([true, false, true].map((isVisible) => ({ isVisible })));
    });

    it("SHOW WHEN NUMBER_OF_SUBREPLIES CHECKBOX", () => {
      const fields = evaluateFieldLogic({
        fields: [
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
            math: null,
            replies: [{ content: { value: ["Choice 1", "Choice 2"] }, anonymized_at: null }],
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
            math: null,
            replies: [{ content: { value: "." }, anonymized_at: null }],
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
            math: null,
            replies: [{ content: { value: "." }, anonymized_at: null }],
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
            math: null,
            replies: [{ content: { value: "." }, anonymized_at: null }],
          },
        ],
        variables: [],
        custom_lists: [],
      });

      expect(fields).toMatchObject([true, true, false, false].map((isVisible) => ({ isVisible })));
    });

    it("SHOW WHEN HAS REPLIES AND DOES NOT HAVE REPLIES CHECKBOX INCOMPLETED REPLY", () => {
      const fields = evaluateFieldLogic({
        fields: [
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
            math: null,
            replies: [{ content: { value: ["Choice 1", "Choice 2"] }, anonymized_at: null }],
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
            math: null,
            replies: [{ content: { value: "." }, anonymized_at: null }],
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
            math: null,
            replies: [{ content: { value: "." }, anonymized_at: null }],
          },
        ],
        variables: [],
        custom_lists: [],
      });

      expect(fields).toMatchObject([true, false, true].map((isVisible) => ({ isVisible })));
    });

    it("SHOW WHEN HAS REPLIES AND DOES NOT HAVE REPLIES CHECKBOX COMPLETED REPLY", () => {
      const fields = evaluateFieldLogic({
        fields: [
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
            math: null,
            replies: [
              { content: { value: ["Choice 1", "Choice 2", "Choice 3"] }, anonymized_at: null },
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
                  modifier: "NUMBER_OF_REPLIES",
                  operator: "GREATER_THAN",
                  value: 0,
                },
              ],
            },
            math: null,
            replies: [{ content: { value: "." }, anonymized_at: null }],
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
            math: null,
            replies: [{ content: { value: "." }, anonymized_at: null }],
          },
        ],
        variables: [],
        custom_lists: [],
      });

      expect(fields).toMatchObject([true, true, false].map((isVisible) => ({ isVisible })));
    });

    it("SHOW WHEN HAS REPLIES AND DOES NOT HAVE REPLIES CHECKBOX INCOMPLETED REPLY RANGE", () => {
      const fields = evaluateFieldLogic({
        fields: [
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
            math: null,
            replies: [{ content: { value: ["Choice 1", "Choice 2"] }, anonymized_at: null }],
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
            math: null,
            replies: [{ content: { value: "." }, anonymized_at: null }],
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
            math: null,
            replies: [{ content: { value: "." }, anonymized_at: null }],
          },
        ],
        variables: [],
        custom_lists: [],
      });

      expect(fields).toMatchObject([true, false, true].map((isVisible) => ({ isVisible })));
    });

    it("SHOW WHEN HAS REPLIES AND DOES NOT HAVE REPLIES CHECKBOX COMPLETED REPLY RANGE", () => {
      const fields = evaluateFieldLogic({
        fields: [
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
            math: null,
            replies: [
              { content: { value: ["Choice 1", "Choice 2", "Choice 3"] }, anonymized_at: null },
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
                  modifier: "NUMBER_OF_REPLIES",
                  operator: "GREATER_THAN",
                  value: 0,
                },
              ],
            },
            math: null,
            replies: [{ content: { value: "." }, anonymized_at: null }],
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
            math: null,
            replies: [{ content: { value: "." }, anonymized_at: null }],
          },
        ],
        variables: [],
        custom_lists: [],
      });

      expect(fields).toMatchObject([true, true, false].map((isVisible) => ({ isVisible })));
    });

    it("show when variable equals value", () => {
      const fields = evaluateFieldLogic({
        fields: [
          {
            id: 1,
            type: "TEXT",
            options: {},
            visibility: {
              type: "SHOW",
              operator: "AND",
              conditions: [
                {
                  variableName: "score",
                  operator: "EQUAL",
                  value: 100,
                },
              ],
            },
            math: null,
            replies: [],
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
                  variableName: "price",
                  operator: "GREATER_THAN_OR_EQUAL",
                  value: 10,
                },
              ],
            },
            math: null,
            replies: [],
          },
        ],
        variables: [
          { name: "score", default_value: 0 },
          { name: "price", default_value: 50 },
        ],
        custom_lists: [],
      });

      expect(fields).toEqual([
        {
          isVisible: false,
          previousVariables: { score: 0, price: 50 },
          currentVariables: { score: 0, price: 50 },
          finalVariables: { score: 0, price: 50 },
        },
        {
          isVisible: true,
          previousVariables: { score: 0, price: 50 },
          currentVariables: { score: 0, price: 50 },
          finalVariables: { score: 0, price: 50 },
        },
      ]);
    });

    it("hide when variable equals value and field has no replies", () => {
      const fields = evaluateFieldLogic({
        fields: [
          {
            id: 1,
            type: "TEXT",
            options: {},
            visibility: null,
            math: null,
            replies: [],
          },
          {
            id: 2,
            type: "TEXT",
            options: {},
            visibility: {
              type: "HIDE",
              operator: "AND",
              conditions: [
                {
                  variableName: "score",
                  operator: "EQUAL",
                  value: 100,
                },
                {
                  modifier: "NUMBER_OF_REPLIES",
                  fieldId: 1,
                  operator: "EQUAL",
                  value: 0,
                },
              ],
            },
            math: null,
            replies: [],
          },
        ],
        variables: [{ name: "score", default_value: 100 }],
        custom_lists: [],
      });

      expect(fields).toEqual([
        {
          isVisible: true,
          previousVariables: { score: 100 },
          currentVariables: { score: 100 },
          finalVariables: { score: 100 },
        },
        {
          isVisible: false,
          previousVariables: { score: 100 },
          currentVariables: { score: 100 },
          finalVariables: { score: 100 },
        },
      ]);
    });

    it("variables with field_group children", () => {
      const fields = evaluateFieldLogic({
        fields: [
          {
            id: 1,
            type: "FIELD_GROUP",
            math: null,
            visibility: null,
            options: {
              groupName: "Group 1",
            },
            replies: [
              {
                content: {},
                anonymized_at: null,
                children: [
                  {
                    field: { id: 2 },
                    replies: [{ content: { value: "aaaa" }, anonymized_at: null }],
                  },
                  {
                    field: { id: 3 },
                    replies: [],
                  },
                ],
              },
              {
                content: {},
                anonymized_at: null,
                children: [
                  {
                    field: { id: 2 },
                    replies: [],
                  },
                  {
                    field: { id: 3 },
                    replies: [],
                  },
                ],
              },
            ],
            children: [
              {
                id: 2,
                type: "TEXT",
                options: {},
                visibility: null,
                math: null,
                parent: {
                  id: 1,
                },
                replies: [{ content: { value: "aaaa" }, anonymized_at: null }],
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
                      variableName: "score",
                      operator: "LESS_THAN",
                      value: 101,
                    },
                    {
                      modifier: "NUMBER_OF_REPLIES",
                      fieldId: 2,
                      operator: "GREATER_THAN",
                      value: 0,
                    },
                  ],
                },
                math: null,
                parent: {
                  id: 1,
                },
                replies: [],
              },
            ],
          },
        ],
        variables: [{ name: "score", default_value: 100 }],
        custom_lists: [],
      });

      expect(fields).toEqual([
        {
          isVisible: true,
          previousVariables: { score: 100 },
          currentVariables: { score: 100 },
          finalVariables: { score: 100 },
          groupChildrenLogic: [
            [
              {
                isVisible: true,
                previousVariables: { score: 100 },
                currentVariables: { score: 100 },
                finalVariables: { score: 100 },
              },
              {
                isVisible: true,
                previousVariables: { score: 100 },
                currentVariables: { score: 100 },
                finalVariables: { score: 100 },
              },
            ],
            [
              {
                isVisible: true,
                previousVariables: { score: 100 },
                currentVariables: { score: 100 },
                finalVariables: { score: 100 },
              },
              {
                isVisible: false,
                previousVariables: { score: 100 },
                currentVariables: { score: 100 },
                finalVariables: { score: 100 },
              },
            ],
          ],
        },
      ]);
    });
  });

  describe("field math", () => {
    it("simple math with NUMBER operand", async () => {
      const fields = evaluateFieldLogic({
        fields: [
          {
            id: 1,
            type: "TEXT",
            options: {},
            visibility: null,
            math: null,
            replies: [],
          },
          {
            id: 2,
            type: "DATE",
            options: {},
            visibility: null,
            math: [
              {
                operator: "AND",
                conditions: [
                  {
                    modifier: "NUMBER_OF_REPLIES",
                    fieldId: 1,
                    operator: "NOT_EQUAL",
                    value: 1,
                  },
                ],
                operations: [
                  {
                    operator: "ADDITION",
                    operand: {
                      type: "NUMBER",
                      value: 50,
                    },
                    variable: "total",
                  },
                ],
              },
            ],
            replies: [],
          },
        ],
        variables: [{ name: "total", default_value: 0 }],
        custom_lists: [],
      });

      expect(fields).toEqual([
        {
          isVisible: true,
          previousVariables: { total: 0 },
          currentVariables: { total: 0 },
          finalVariables: { total: 50 },
        },
        {
          isVisible: true,
          previousVariables: { total: 0 },
          currentVariables: { total: 50 },
          finalVariables: { total: 50 },
        },
      ]);
    });

    it("simple math with FIELD operand", () => {
      const fields = evaluateFieldLogic({
        fields: [
          {
            id: 1,
            type: "NUMBER",
            options: {},
            visibility: null,
            math: null,
            replies: [{ content: { value: 123 }, anonymized_at: null }],
          },
          {
            id: 2,
            type: "DATE",
            options: {},
            visibility: null,
            math: [
              {
                operator: "AND",
                conditions: [
                  {
                    modifier: "NUMBER_OF_REPLIES",
                    fieldId: 1,
                    operator: "GREATER_THAN",
                    value: 0,
                  },
                ],
                operations: [
                  {
                    operator: "ASSIGNATION",
                    operand: {
                      type: "FIELD",
                      fieldId: 1,
                    },
                    variable: "total",
                  },
                ],
              },
            ],
            replies: [],
          },
        ],
        variables: [{ name: "total", default_value: 0 }],
        custom_lists: [],
      });

      expect(fields).toEqual([
        {
          isVisible: true,
          previousVariables: { total: 0 },
          currentVariables: { total: 0 },
          finalVariables: { total: 123 },
        },
        {
          isVisible: true,
          previousVariables: { total: 0 },
          currentVariables: { total: 123 },
          finalVariables: { total: 123 },
        },
      ]);
    });

    it("simple math with VARIABLE operand", () => {
      const fields = evaluateFieldLogic({
        fields: [
          {
            id: 1,
            type: "DATE",
            options: {},
            visibility: null,
            math: [
              {
                operator: "AND",
                conditions: [
                  {
                    modifier: "NUMBER_OF_REPLIES",
                    fieldId: 1,
                    operator: "EQUAL",
                    value: 0,
                  },
                ],
                operations: [
                  {
                    operator: "DIVISION",
                    operand: {
                      type: "VARIABLE",
                      name: "score",
                    },
                    variable: "total",
                  },
                ],
              },
            ],
            replies: [],
          },
        ],
        variables: [
          { name: "total", default_value: 10 },
          { name: "score", default_value: 100 },
        ],
        custom_lists: [],
      });

      expect(fields).toEqual([
        {
          isVisible: true,
          previousVariables: { total: 10, score: 100 },
          currentVariables: { total: 0.1, score: 100 },
          finalVariables: { total: 0.1, score: 100 },
        },
      ]);
    });

    it("math with variable on condition", () => {
      const fields = evaluateFieldLogic({
        fields: [
          {
            id: 1,
            type: "NUMBER",
            options: {},
            replies: [],
            visibility: null,
            math: [
              {
                operator: "OR",
                conditions: [
                  {
                    variableName: "price",
                    operator: "GREATER_THAN",
                    value: 20,
                  },
                  {
                    variableName: "price",
                    operator: "LESS_THAN",
                    value: 10,
                  },
                ],
                operations: [
                  {
                    operator: "ASSIGNATION",
                    operand: {
                      type: "NUMBER",
                      value: 15,
                    },
                    variable: "price",
                  },
                ],
              },
            ],
          },
          {
            id: 2,
            type: "NUMBER",
            options: {},
            replies: [],
            visibility: null,
            math: [
              {
                operator: "OR",
                conditions: [
                  {
                    variableName: "price",
                    operator: "GREATER_THAN",
                    value: 20,
                  },
                  {
                    variableName: "price",
                    operator: "LESS_THAN",
                    value: 10,
                  },
                ],
                operations: [
                  {
                    operator: "SUBSTRACTION",
                    operand: {
                      type: "NUMBER",
                      value: 99999,
                    },
                    variable: "price",
                  },
                ],
              },
            ],
          },
        ],
        variables: [{ name: "price", default_value: 0 }],
        custom_lists: [],
      });

      expect(fields).toEqual([
        {
          isVisible: true,
          previousVariables: { price: 0 },
          currentVariables: { price: 15 },
          finalVariables: { price: 15 },
        },
        {
          isVisible: true,
          previousVariables: { price: 15 },
          currentVariables: { price: 15 },
          finalVariables: { price: 15 },
        },
      ]);
    });

    it("math with not visible field on condition", () => {
      const fields = evaluateFieldLogic({
        fields: [
          {
            id: 1,
            type: "TEXT",
            options: {},
            math: null,
            visibility: {
              operator: "AND",
              type: "SHOW",
              conditions: [{ variableName: "score", operator: "EQUAL", value: 10 }],
            },
            replies: [
              { content: { value: "1st reply" }, anonymized_at: null },
              { content: { value: "2nd reply" }, anonymized_at: null },
              { content: { value: "3rd reply" }, anonymized_at: null },
            ],
          },
          {
            id: 2,
            type: "TEXT",
            options: {},
            math: [
              {
                operator: "AND",
                conditions: [
                  {
                    fieldId: 1,
                    modifier: "NUMBER_OF_REPLIES",
                    operator: "GREATER_THAN",
                    value: 0,
                  },
                ],
                operations: [
                  {
                    operator: "MULTIPLICATION",
                    operand: { type: "NUMBER", value: 200 },
                    variable: "price",
                  },
                ],
              },
            ],
            visibility: null,
            replies: [],
          },
        ],
        variables: [
          { name: "score", default_value: 0 },
          { name: "price", default_value: 1.5 },
        ],
        custom_lists: [],
      });

      expect(fields).toEqual([
        {
          isVisible: false,
          previousVariables: { score: 0, price: 1.5 },
          currentVariables: { score: 0, price: 1.5 },
          finalVariables: { score: 0, price: 1.5 },
        },
        {
          isVisible: true,
          previousVariables: { score: 0, price: 1.5 },
          currentVariables: { score: 0, price: 1.5 },
          finalVariables: { score: 0, price: 1.5 },
        },
      ]);
    });

    it("divide by zero", () => {
      const fields = evaluateFieldLogic({
        fields: [
          {
            id: 1,
            type: "NUMBER",
            options: {},
            math: [
              {
                operator: "AND",
                conditions: [
                  {
                    fieldId: 1,
                    modifier: "NUMBER_OF_REPLIES",
                    operator: "GREATER_THAN",
                    value: 0,
                  },
                ],
                operations: [
                  {
                    operator: "DIVISION",
                    operand: { type: "FIELD", fieldId: 1 },
                    variable: "score",
                  },
                ],
              },
            ],
            visibility: null,
            replies: [{ content: { value: 0 }, anonymized_at: null }],
          },
        ],
        variables: [{ name: "score", default_value: 0 }],
        custom_lists: [],
      });

      expect(fields).toEqual([
        {
          isVisible: true,
          previousVariables: { score: 0 },
          currentVariables: { score: NaN },
          finalVariables: { score: NaN },
        },
      ]);
    });

    it("operation over a not visible field", () => {
      const fields = evaluateFieldLogic({
        fields: [
          {
            id: 1,
            type: "TEXT",
            options: {},
            math: null,
            visibility: null,
            replies: [],
          },
          {
            id: 2,
            type: "NUMBER",
            options: {},
            math: null,
            visibility: {
              operator: "OR",
              type: "HIDE",
              conditions: [
                { fieldId: 1, modifier: "NUMBER_OF_REPLIES", operator: "EQUAL", value: 0 },
              ],
            },
            replies: [{ content: { value: 100 }, anonymized_at: null }],
          },
          {
            id: 3,
            type: "TEXT",
            options: {},
            visibility: null,
            math: [
              {
                operator: "AND",
                conditions: [
                  { fieldId: 1, modifier: "NUMBER_OF_REPLIES", operator: "EQUAL", value: 0 },
                ],
                operations: [
                  {
                    operand: { type: "FIELD", fieldId: 2 },
                    operator: "SUBSTRACTION",
                    variable: "score",
                  },
                ],
              },
            ],
            replies: [],
          },
        ],
        variables: [{ name: "score", default_value: 0 }],
        custom_lists: [],
      });

      expect(fields).toEqual([
        {
          isVisible: true,
          previousVariables: { score: 0 },
          currentVariables: { score: 0 },
          finalVariables: { score: NaN },
        },
        {
          isVisible: false,
          previousVariables: { score: 0 },
          currentVariables: { score: 0 },
          finalVariables: { score: NaN },
        },
        {
          isVisible: true,
          previousVariables: { score: 0 },
          currentVariables: { score: NaN },
          finalVariables: { score: NaN },
        },
      ]);
    });

    it("multiple fields with complex math", () => {
      const fields = evaluateFieldLogic({
        fields: [
          {
            id: 1,
            type: "TEXT",
            options: {},
            math: [
              {
                operator: "OR",
                conditions: [
                  {
                    operator: "IS_ONE_OF",
                    fieldId: 1,
                    value: ["a", "b", "c", "d"],
                    modifier: "ANY",
                  },
                  { operator: "EQUAL", fieldId: 1, value: "ABCD", modifier: "ANY" },
                ],
                operations: [
                  {
                    operator: "ASSIGNATION",
                    operand: { type: "NUMBER", value: 100 },
                    variable: "score",
                  },
                  {
                    operator: "SUBSTRACTION",
                    operand: { type: "VARIABLE", name: "score" },
                    variable: "total",
                  },
                ],
              },
            ],
            visibility: null,
            replies: [
              { content: { value: "h" }, anonymized_at: null },
              { content: { value: "ABCD" }, anonymized_at: null },
              { content: { value: "g" }, anonymized_at: null },
            ],
          },
          {
            id: 2,
            type: "FIELD_GROUP",
            options: {},
            visibility: {
              operator: "AND",
              type: "SHOW",
              conditions: [
                { fieldId: 1, modifier: "NUMBER_OF_REPLIES", operator: "EQUAL", value: 10 },
              ],
            },
            math: [],
            replies: [
              {
                content: {},
                anonymized_at: null,
                children: [
                  { field: { id: 3 }, replies: [{ content: { value: 300 }, anonymized_at: null }] },
                ],
              },
            ],
            children: [
              {
                id: 3,
                type: "NUMBER",
                visibility: null,
                math: null,
                options: {},
                replies: [{ content: { value: 300 }, anonymized_at: null }],
                parent: {
                  id: 2,
                },
              },
            ],
          },
          {
            id: 4,
            type: "PHONE",
            options: {},
            math: [
              {
                operator: "OR",
                conditions: [{ fieldId: 1, modifier: "ANY", operator: "EQUAL", value: "g" }],
                operations: [
                  {
                    operator: "DIVISION",
                    operand: { type: "NUMBER", value: 400 },
                    variable: "score",
                  },
                ],
              },
            ],
            visibility: null,
            replies: [],
          },
          {
            id: 5,
            type: "DATE",
            options: {},
            math: [
              {
                operator: "OR",
                conditions: [
                  { fieldId: 3, modifier: "NUMBER_OF_REPLIES", operator: "GREATER_THAN", value: 0 },
                ],
                operations: [
                  {
                    // this should be ignored because field 3 is not visible
                    operand: { type: "FIELD", fieldId: 3 },
                    operator: "MULTIPLICATION",
                    variable: "total",
                  },
                ],
              },
            ],
            visibility: null,
            replies: [],
          },
        ],
        variables: [
          { name: "total", default_value: 0 },
          { name: "score", default_value: 1 },
        ],
        custom_lists: [],
      });

      expect(fields).toEqual([
        {
          isVisible: true,
          previousVariables: { total: 0, score: 1 },
          currentVariables: { total: -100, score: 100 },
          finalVariables: { total: -100, score: 0.25 },
        },
        {
          isVisible: false,
          previousVariables: { total: -100, score: 100 },
          currentVariables: { total: -100, score: 100 },
          finalVariables: { total: -100, score: 0.25 },
          groupChildrenLogic: [
            [
              {
                isVisible: false,
                previousVariables: { total: -100, score: 100 },
                currentVariables: { total: -100, score: 100 },
                finalVariables: { total: -100, score: 0.25 },
              },
            ],
          ],
        },
        {
          isVisible: true,
          previousVariables: { total: -100, score: 100 },
          currentVariables: { total: -100, score: 0.25 },
          finalVariables: { total: -100, score: 0.25 },
        },
        {
          isVisible: true,
          previousVariables: { total: -100, score: 0.25 },
          currentVariables: { total: -100, score: 0.25 },
          finalVariables: { total: -100, score: 0.25 },
        },
      ]);
    });

    it("field group with variables and math", () => {
      const fields = evaluateFieldLogic({
        fields: [
          {
            id: 1,
            type: "FIELD_GROUP",
            options: {},
            visibility: null,
            math: null,
            replies: [
              {
                content: {},
                anonymized_at: null,
                children: [
                  {
                    field: { id: 2 },
                    replies: [{ content: { value: 2 }, anonymized_at: null }],
                  },
                  {
                    field: { id: 3 },
                    replies: [{ content: { value: "Si" }, anonymized_at: null }],
                  },
                  {
                    field: { id: 4 },
                    replies: [{ content: { value: 4 }, anonymized_at: null }],
                  },
                  {
                    field: { id: 5 },
                    replies: [{ content: { value: "No" }, anonymized_at: null }],
                  },
                  {
                    field: { id: 6 },
                    replies: [{ content: { value: 6 }, anonymized_at: null }],
                  },
                ],
              },
              {
                content: {},
                anonymized_at: null,
                children: [
                  {
                    field: { id: 2 },
                    replies: [{ content: { value: 20 }, anonymized_at: null }],
                  },
                  {
                    field: { id: 3 },
                    replies: [{ content: { value: "No" }, anonymized_at: null }],
                  },
                  {
                    field: { id: 4 },
                    replies: [],
                  },
                  {
                    field: { id: 5 },
                    replies: [{ content: { value: "Si" }, anonymized_at: null }],
                  },
                  {
                    field: { id: 6 },
                    replies: [{ content: { value: 60 }, anonymized_at: null }],
                  },
                ],
              },
              {
                content: {},
                anonymized_at: null,
                children: [
                  {
                    field: { id: 2 },
                    replies: [{ content: { value: 200 }, anonymized_at: null }],
                  },
                  {
                    field: { id: 3 },
                    replies: [{ content: { value: "Si" }, anonymized_at: null }],
                  },
                  {
                    field: { id: 4 },
                    replies: [{ content: { value: 400 }, anonymized_at: null }],
                  },
                  {
                    field: { id: 5 },
                    replies: [{ content: { value: "Si" }, anonymized_at: null }],
                  },
                  {
                    field: { id: 6 },
                    replies: [],
                  },
                ],
              },
            ],
            children: [
              {
                id: 2,
                type: "NUMBER",
                options: {},
                visibility: null,
                math: [
                  {
                    operator: "AND",
                    conditions: [
                      { fieldId: 2, modifier: "ANY", operator: "GREATER_THAN", value: 0 },
                    ],
                    operations: [
                      {
                        operator: "ADDITION",
                        operand: { type: "FIELD", fieldId: 2 },
                        variable: "edad",
                      },
                    ],
                  },
                ],
                replies: [
                  { content: { value: 2 }, anonymized_at: null },
                  { content: { value: 20 }, anonymized_at: null },
                  { content: { value: 200 }, anonymized_at: null },
                ],
                parent: {
                  id: 1,
                },
              },
              {
                id: 3,
                type: "SELECT",
                options: {
                  values: ["Si", "No"],
                },
                math: null,
                visibility: null,
                replies: [
                  { content: { value: "Si" }, anonymized_at: null },
                  { content: { value: "No" }, anonymized_at: null },
                  { content: { value: "Si" }, anonymized_at: null },
                ],
                parent: {
                  id: 1,
                },
              },
              {
                id: 4,
                type: "NUMBER",
                options: {},
                visibility: {
                  operator: "AND",
                  type: "SHOW",
                  conditions: [
                    {
                      fieldId: 3,
                      modifier: "ANY",
                      operator: "EQUAL",
                      value: "Si",
                    },
                  ],
                },
                math: [
                  {
                    operator: "AND",
                    conditions: [
                      { fieldId: 4, modifier: "ANY", operator: "GREATER_THAN", value: 0 },
                    ],
                    operations: [
                      {
                        operator: "ADDITION",
                        operand: { type: "FIELD", fieldId: 4 },
                        variable: "edad",
                      },
                    ],
                  },
                ],
                replies: [
                  { content: { value: 4 }, anonymized_at: null },
                  { content: { value: 400 }, anonymized_at: null },
                ],
                parent: {
                  id: 1,
                },
              },
              {
                id: 5,
                type: "SELECT",
                options: {
                  values: ["Si", "No"],
                },
                math: null,
                visibility: null,
                replies: [
                  { content: { value: "No" }, anonymized_at: null },
                  { content: { value: "Si" }, anonymized_at: null },
                  { content: { value: "Si" }, anonymized_at: null },
                ],
                parent: {
                  id: 1,
                },
              },
              {
                id: 6,
                type: "NUMBER",
                options: {},
                visibility: {
                  operator: "AND",
                  type: "SHOW",
                  conditions: [
                    {
                      fieldId: 5,
                      modifier: "ANY",
                      operator: "EQUAL",
                      value: "Si",
                    },
                  ],
                },
                math: [
                  {
                    operator: "AND",
                    conditions: [
                      { fieldId: 6, modifier: "ANY", operator: "GREATER_THAN", value: 0 },
                    ],
                    operations: [
                      {
                        operator: "ADDITION",
                        operand: { type: "FIELD", fieldId: 6 },
                        variable: "edad",
                      },
                    ],
                  },
                ],
                replies: [
                  { content: { value: 6 }, anonymized_at: null },
                  { content: { value: 60 }, anonymized_at: null },
                ],
                parent: {
                  id: 1,
                },
              },
            ],
          },
        ],
        variables: [{ name: "edad", default_value: 0 }],
        custom_lists: [],
      });

      expect(fields).toEqual([
        {
          isVisible: true,
          previousVariables: { edad: 0 },
          currentVariables: { edad: 686 },
          finalVariables: { edad: 686 },
          groupChildrenLogic: [
            [
              {
                isVisible: true,
                previousVariables: { edad: 0 },
                currentVariables: { edad: 2 },
                finalVariables: { edad: 686 },
              },
              {
                isVisible: true,
                previousVariables: { edad: 2 },
                currentVariables: { edad: 2 },
                finalVariables: { edad: 686 },
              },
              {
                isVisible: true,
                previousVariables: { edad: 2 },
                currentVariables: { edad: 6 },
                finalVariables: { edad: 686 },
              },
              {
                isVisible: true,
                previousVariables: { edad: 6 },
                currentVariables: { edad: 6 },
                finalVariables: { edad: 686 },
              },
              {
                isVisible: false,
                previousVariables: { edad: 6 },
                currentVariables: { edad: 6 },
                finalVariables: { edad: 686 },
              },
            ],
            [
              {
                isVisible: true,
                previousVariables: { edad: 6 },
                currentVariables: { edad: 26 },
                finalVariables: { edad: 686 },
              },
              {
                isVisible: true,
                previousVariables: { edad: 26 },
                currentVariables: { edad: 26 },
                finalVariables: { edad: 686 },
              },
              {
                isVisible: false,
                previousVariables: { edad: 26 },
                currentVariables: { edad: 26 },
                finalVariables: { edad: 686 },
              },
              {
                isVisible: true,
                previousVariables: { edad: 26 },
                currentVariables: { edad: 26 },
                finalVariables: { edad: 686 },
              },
              {
                isVisible: true,
                previousVariables: { edad: 26 },
                currentVariables: { edad: 86 },
                finalVariables: { edad: 686 },
              },
            ],
            [
              {
                isVisible: true,
                previousVariables: { edad: 86 },
                currentVariables: { edad: 286 },
                finalVariables: { edad: 686 },
              },
              {
                isVisible: true,
                previousVariables: { edad: 286 },
                currentVariables: { edad: 286 },
                finalVariables: { edad: 686 },
              },
              {
                isVisible: true,
                previousVariables: { edad: 286 },
                currentVariables: { edad: 686 },
                finalVariables: { edad: 686 },
              },
              {
                isVisible: true,
                previousVariables: { edad: 686 },
                currentVariables: { edad: 686 },
                finalVariables: { edad: 686 },
              },
              {
                isVisible: true,
                previousVariables: { edad: 686 },
                currentVariables: { edad: 686 },
                finalVariables: { edad: 686 },
              },
            ],
          ],
        },
      ]);
    });

    it("math with conditions on child fields of different group", () => {
      const fields = evaluateFieldLogic({
        fields: [
          {
            id: 1,
            type: "FIELD_GROUP",
            options: {},
            visibility: null,
            math: null,
            replies: [
              {
                content: {},
                anonymized_at: null,
                children: [
                  {
                    field: { id: 2 },
                    replies: [{ content: { value: "hello" }, anonymized_at: null }],
                  },
                ],
              },
              {
                content: {},
                anonymized_at: null,
                children: [
                  {
                    field: { id: 2 },
                    replies: [{ content: { value: "goodbye" }, anonymized_at: null }],
                  },
                ],
              },
            ],
            children: [
              {
                id: 2,
                type: "TEXT",
                options: {},
                math: null,
                visibility: null,
                parent: {
                  id: 1,
                },
                replies: [
                  { content: { value: "hello" }, anonymized_at: null },
                  { content: { value: "goodbye" }, anonymized_at: null },
                ],
              },
            ],
          },
          {
            id: 3,
            type: "FIELD_GROUP",
            options: {},
            visibility: null,
            math: null,
            replies: [
              { content: {}, anonymized_at: null, children: [{ field: { id: 4 }, replies: [] }] },
            ],
            children: [
              {
                id: 4,
                type: "TEXT",
                options: {},
                math: [
                  {
                    operator: "AND",
                    conditions: [
                      { fieldId: 2, modifier: "ANY", operator: "NOT_CONTAIN", value: "1234" },
                    ],
                    operations: [
                      {
                        operator: "MULTIPLICATION",
                        operand: { type: "NUMBER", value: 50 },
                        variable: "score",
                      },
                    ],
                  },
                  {
                    operator: "AND",
                    conditions: [
                      { fieldId: 2, modifier: "ALL", operator: "NOT_EQUAL", value: "xxx" },
                    ],
                    operations: [
                      {
                        operator: "MULTIPLICATION",
                        operand: { type: "VARIABLE", name: "price" },
                        variable: "score",
                      },
                    ],
                  },
                ],
                visibility: null,
                parent: {
                  id: 3,
                },
                replies: [],
              },
            ],
          },
        ],
        variables: [
          { name: "score", default_value: 1 },
          { name: "price", default_value: 2 },
        ],
        custom_lists: [],
      });

      expect(fields).toEqual([
        {
          isVisible: true,
          previousVariables: { score: 1, price: 2 },
          currentVariables: { score: 1, price: 2 },
          finalVariables: { score: 100, price: 2 },
          groupChildrenLogic: [
            [
              {
                isVisible: true,
                previousVariables: { score: 1, price: 2 },
                currentVariables: { score: 1, price: 2 },
                finalVariables: { score: 100, price: 2 },
              },
            ],
            [
              {
                isVisible: true,
                previousVariables: { score: 1, price: 2 },
                currentVariables: { score: 1, price: 2 },
                finalVariables: { score: 100, price: 2 },
              },
            ],
          ],
        },
        {
          isVisible: true,
          previousVariables: { score: 1, price: 2 },
          currentVariables: { score: 100, price: 2 },
          finalVariables: { score: 100, price: 2 },
          groupChildrenLogic: [
            [
              {
                isVisible: true,
                previousVariables: { score: 1, price: 2 },
                currentVariables: { score: 100, price: 2 },
                finalVariables: { score: 100, price: 2 },
              },
            ],
          ],
        },
      ]);
    });

    it("math conditions on a group child outside a group", () => {
      const fields = evaluateFieldLogic({
        fields: [
          {
            id: 1,
            type: "FIELD_GROUP",
            options: {},
            math: null,
            visibility: null,
            children: [
              {
                id: 2,
                type: "SELECT",
                math: null,
                visibility: null,
                options: { values: ["A", "B", "C"] },
                parent: {
                  id: 1,
                },
                replies: [
                  { content: { value: "B" }, anonymized_at: null },
                  { content: { value: "C" }, anonymized_at: null },
                ],
              },
            ],
            replies: [
              {
                content: {},
                anonymized_at: null,
                children: [
                  { field: { id: 2 }, replies: [{ content: { value: "B" }, anonymized_at: null }] },
                ],
              },
              {
                content: {},
                anonymized_at: null,
                children: [
                  { field: { id: 2 }, replies: [{ content: { value: "C" }, anonymized_at: null }] },
                ],
              },
            ],
          },
          {
            id: 3,
            type: "SHORT_TEXT",
            options: {},
            visibility: null,
            math: [
              {
                operator: "OR",
                conditions: [
                  {
                    value: ["A", "B"],
                    fieldId: 2,
                    modifier: "ALL",
                    operator: "NOT_IS_ONE_OF",
                  },
                  {
                    value: 3,
                    fieldId: 1,
                    modifier: "NUMBER_OF_REPLIES",
                    operator: "GREATER_THAN_OR_EQUAL",
                  },
                ],
                operations: [
                  {
                    operand: {
                      type: "NUMBER",
                      value: 1000,
                    },
                    operator: "ADDITION",
                    variable: "score",
                  },
                ],
              },
              {
                operator: "AND",
                conditions: [
                  {
                    value: ["C"],
                    fieldId: 2,
                    modifier: "ANY",
                    operator: "IS_ONE_OF",
                  },
                ],
                operations: [
                  {
                    operand: {
                      type: "NUMBER",
                      value: 5000,
                    },
                    operator: "ADDITION",
                    variable: "score",
                  },
                ],
              },
            ],
            replies: [],
          },
        ],
        variables: [{ name: "score", default_value: 0 }],
        custom_lists: [],
      });

      expect(fields).toEqual([
        {
          isVisible: true,
          previousVariables: { score: 0 },
          currentVariables: { score: 0 },
          finalVariables: { score: 5000 },
          groupChildrenLogic: [
            [
              {
                isVisible: true,
                previousVariables: { score: 0 },
                currentVariables: { score: 0 },
                finalVariables: { score: 5000 },
              },
            ],
            [
              {
                isVisible: true,
                previousVariables: { score: 0 },
                currentVariables: { score: 0 },
                finalVariables: { score: 5000 },
              },
            ],
          ],
        },
        {
          isVisible: true,
          previousVariables: { score: 0 },
          currentVariables: { score: 5000 },
          finalVariables: { score: 5000 },
        },
      ]);
    });
  });
});
