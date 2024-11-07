import { petitionIsCompleted } from "../petitionIsCompleted";

describe("petitionIsCompleted", () => {
  it("field group with optional incomplete fields", () => {
    expect(
      petitionIsCompleted({
        fields: [
          {
            id: 3280,
            is_internal: false,
            type: "HEADING",
            options: {},
            visibility: null,
            math: null,
            optional: false,
            replies: [],
            children: null,
          },
          {
            id: 3425,
            is_internal: false,
            type: "FIELD_GROUP",
            options: {},
            visibility: null,
            math: null,
            optional: true,
            children: [
              {
                id: 3438,
                is_internal: false,
                type: "SHORT_TEXT",
                options: {},
                optional: false,
                replies: [
                  {
                    content: { value: "AA" },
                    anonymized_at: null,
                  },
                ],
                visibility: null,
                math: null,
              },
              {
                id: 3440,
                is_internal: false,
                type: "SHORT_TEXT",
                optional: true,
                options: {},
                replies: [],
                visibility: null,
                math: null,
              },
            ],
            replies: [
              {
                content: {},
                anonymized_at: null,
                children: [
                  {
                    field: {
                      id: 3438,
                      is_internal: false,
                      type: "SHORT_TEXT",
                      options: {},
                      optional: false,
                    },
                    replies: [
                      {
                        content: { value: "AA" },
                        anonymized_at: null,
                      },
                    ],
                  },
                  {
                    field: {
                      id: 3440,
                      is_internal: false,
                      type: "SHORT_TEXT",
                      options: {},
                      optional: true,
                    },
                    replies: [],
                  },
                ],
              },
            ],
          },
        ],
        variables: [],
        customLists: [],
        automaticNumberingConfig: null,
        standardListDefinitions: [],
      }),
    ).toBeTrue();
  });

  it("field group with not visible required fields", () => {
    expect(
      petitionIsCompleted({
        fields: [
          {
            id: 3280,
            is_internal: false,
            type: "HEADING",
            options: {
              hasPageBreak: false,
            },
            visibility: null,
            math: null,
            optional: false,
            replies: [],
            children: null,
          },
          {
            id: 3425,
            is_internal: false,
            type: "FIELD_GROUP",
            options: {
              groupName: null,
            },
            visibility: null,
            math: null,
            optional: true,
            replies: [
              {
                content: {},
                anonymized_at: null,
                children: [
                  {
                    field: {
                      id: 3438,
                      is_internal: false,
                      type: "SHORT_TEXT",
                      options: {
                        format: null,
                        maxLength: null,
                        placeholder: null,
                      },
                      optional: false,
                    },
                    replies: [
                      {
                        content: {
                          value: "A",
                        },
                        anonymized_at: null,
                      },
                    ],
                  },
                  {
                    field: {
                      id: 3440,
                      is_internal: false,
                      type: "SHORT_TEXT",
                      options: {
                        format: null,
                        maxLength: null,
                        placeholder: null,
                      },
                      optional: false,
                    },
                    replies: [],
                  },
                ],
              },
            ],
            children: [
              {
                id: 3438,
                is_internal: false,
                type: "SHORT_TEXT",
                options: {
                  format: null,
                  maxLength: null,
                  placeholder: null,
                },
                visibility: null,
                math: null,
                optional: false,
                replies: [
                  {
                    content: {
                      value: "A",
                    },
                    anonymized_at: null,
                  },
                ],
              },
              {
                id: 3440,
                is_internal: false,
                type: "SHORT_TEXT",
                options: {
                  format: null,
                  maxLength: null,
                  placeholder: null,
                },
                visibility: {
                  type: "SHOW",
                  operator: "AND",
                  conditions: [
                    {
                      value: "$$$",
                      fieldId: 3438,
                      modifier: "ANY",
                      operator: "EQUAL",
                    },
                  ],
                },
                math: null,
                optional: false,
                replies: [],
              },
            ],
          },
        ],
        variables: [],
        customLists: [],
        automaticNumberingConfig: null,
        standardListDefinitions: [],
      }),
    ).toBeTrue();
  });

  it("visibility conditions referencing a field group child", () => {
    expect(
      petitionIsCompleted({
        fields: [
          {
            id: 3280,
            is_internal: false,
            type: "HEADING",
            options: {
              hasPageBreak: false,
            },
            visibility: null,
            math: null,
            optional: false,
            replies: [],
            children: null,
          },
          {
            id: 3425,
            is_internal: false,
            type: "FIELD_GROUP",
            options: {
              groupName: null,
            },
            visibility: null,
            math: null,
            optional: true,
            replies: [
              {
                content: {},
                anonymized_at: null,
                children: [
                  {
                    field: {
                      id: 3438,
                      is_internal: false,
                      type: "SHORT_TEXT",
                      options: {
                        format: null,
                        maxLength: null,
                        placeholder: null,
                      },
                      optional: false,
                    },
                    replies: [
                      {
                        content: {
                          value: "A",
                        },
                        anonymized_at: null,
                      },
                    ],
                  },
                  {
                    field: {
                      id: 3440,
                      is_internal: false,
                      type: "SHORT_TEXT",
                      options: {
                        format: null,
                        maxLength: null,
                        placeholder: null,
                      },
                      optional: false,
                    },
                    replies: [],
                  },
                ],
              },
              {
                content: {},
                anonymized_at: null,
                children: [
                  {
                    field: {
                      id: 3438,
                      is_internal: false,
                      type: "SHORT_TEXT",
                      options: {
                        format: null,
                        maxLength: null,
                        placeholder: null,
                      },
                      optional: false,
                    },
                    replies: [
                      {
                        content: {
                          value: "$$$",
                        },
                        anonymized_at: null,
                      },
                    ],
                  },
                  {
                    field: {
                      id: 3440,
                      is_internal: false,
                      type: "SHORT_TEXT",
                      options: {
                        format: null,
                        maxLength: null,
                        placeholder: null,
                      },
                      optional: false,
                    },
                    replies: [
                      {
                        content: {
                          value: "B!",
                        },
                        anonymized_at: null,
                      },
                    ],
                  },
                ],
              },
            ],
            children: [
              {
                id: 3438,
                is_internal: false,
                type: "SHORT_TEXT",
                options: {
                  format: null,
                  maxLength: null,
                  placeholder: null,
                },
                visibility: null,
                math: null,
                optional: false,
                replies: [
                  {
                    content: {
                      value: "A",
                    },
                    anonymized_at: null,
                  },
                  {
                    content: {
                      value: "$$$",
                    },
                    anonymized_at: null,
                  },
                ],
              },
              {
                id: 3440,
                is_internal: false,
                type: "SHORT_TEXT",
                options: {
                  format: null,
                  maxLength: null,
                  placeholder: null,
                },
                visibility: {
                  type: "SHOW",
                  operator: "AND",
                  conditions: [
                    {
                      value: "$$$",
                      fieldId: 3438,
                      modifier: "ANY",
                      operator: "EQUAL",
                    },
                  ],
                },
                math: null,
                optional: false,
                replies: [
                  {
                    content: {
                      value: "B!",
                    },
                    anonymized_at: null,
                  },
                ],
              },
            ],
          },
          {
            id: 3445,
            is_internal: false,
            type: "NUMBER",
            options: {
              range: {
                min: 0,
              },
              prefix: null,
              suffix: null,
              decimals: 2,
              placeholder: null,
            },
            visibility: {
              type: "SHOW",
              operator: "AND",
              conditions: [
                {
                  value: 2,
                  fieldId: 3425,
                  modifier: "NUMBER_OF_REPLIES",
                  operator: "GREATER_THAN",
                },
              ],
            },
            math: null,
            optional: false,
            replies: [],
            children: null,
          },
        ],
        variables: [],
        customLists: [],
        automaticNumberingConfig: null,
        standardListDefinitions: [],
      }),
    ).toBeTrue();
  });

  it("incomplete required internal field on public context", () => {
    expect(
      petitionIsCompleted(
        {
          fields: [
            {
              id: 3280,
              is_internal: false,
              type: "HEADING",
              options: {
                hasPageBreak: false,
              },
              visibility: null,
              math: null,
              optional: false,
              replies: [],
              children: null,
            },
            {
              id: 3425,
              is_internal: false,
              type: "FIELD_GROUP",
              options: {
                groupName: null,
              },
              visibility: null,
              math: null,
              optional: true,
              replies: [
                {
                  content: {},
                  anonymized_at: null,
                  children: [
                    {
                      field: {
                        id: 3438,
                        is_internal: false,
                        type: "SHORT_TEXT",
                        options: {
                          format: null,
                          maxLength: null,
                          placeholder: null,
                        },
                        optional: false,
                      },
                      replies: [
                        {
                          content: {
                            value: "A",
                          },
                          anonymized_at: null,
                        },
                      ],
                    },
                    {
                      field: {
                        id: 3440,
                        is_internal: false,
                        type: "SHORT_TEXT",
                        options: {
                          format: null,
                          maxLength: null,
                          placeholder: null,
                        },
                        optional: false,
                      },
                      replies: [],
                    },
                  ],
                },
                {
                  content: {},
                  anonymized_at: null,
                  children: [
                    {
                      field: {
                        id: 3438,
                        is_internal: false,
                        type: "SHORT_TEXT",
                        options: {
                          format: null,
                          maxLength: null,
                          placeholder: null,
                        },
                        optional: false,
                      },
                      replies: [
                        {
                          content: {
                            value: "$$$",
                          },
                          anonymized_at: null,
                        },
                      ],
                    },
                    {
                      field: {
                        id: 3440,
                        is_internal: false,
                        type: "SHORT_TEXT",
                        options: {
                          format: null,
                          maxLength: null,
                          placeholder: null,
                        },
                        optional: false,
                      },
                      replies: [
                        {
                          content: {
                            value: "B!",
                          },
                          anonymized_at: null,
                        },
                      ],
                    },
                  ],
                },
                {
                  content: {},
                  anonymized_at: null,
                  children: [
                    {
                      field: {
                        id: 3438,
                        is_internal: false,
                        type: "SHORT_TEXT",
                        options: {
                          format: null,
                          maxLength: null,
                          placeholder: null,
                        },
                        optional: false,
                      },
                      replies: [
                        {
                          content: {
                            value: "A",
                          },
                          anonymized_at: null,
                        },
                      ],
                    },
                    {
                      field: {
                        id: 3440,
                        is_internal: false,
                        type: "SHORT_TEXT",
                        options: {
                          format: null,
                          maxLength: null,
                          placeholder: null,
                        },
                        optional: false,
                      },
                      replies: [],
                    },
                  ],
                },
              ],
              children: [
                {
                  id: 3438,
                  is_internal: false,
                  type: "SHORT_TEXT",
                  options: {
                    format: null,
                    maxLength: null,
                    placeholder: null,
                  },
                  visibility: null,
                  math: null,
                  optional: false,
                  replies: [
                    {
                      content: {
                        value: "A",
                      },
                      anonymized_at: null,
                    },
                    {
                      content: {
                        value: "$$$",
                      },
                      anonymized_at: null,
                    },
                    {
                      content: {
                        value: "A",
                      },
                      anonymized_at: null,
                    },
                  ],
                },
                {
                  id: 3440,
                  is_internal: false,
                  type: "SHORT_TEXT",
                  options: {
                    format: null,
                    maxLength: null,
                    placeholder: null,
                  },
                  visibility: {
                    type: "SHOW",
                    operator: "AND",
                    conditions: [
                      {
                        value: "$$$",
                        fieldId: 3438,
                        modifier: "ANY",
                        operator: "EQUAL",
                      },
                    ],
                  },
                  math: null,
                  optional: false,
                  replies: [
                    {
                      content: {
                        value: "B!",
                      },
                      anonymized_at: null,
                    },
                  ],
                },
              ],
            },
            {
              id: 3445,
              is_internal: true,
              type: "NUMBER",
              options: {
                range: {
                  min: 0,
                },
                prefix: null,
                suffix: null,
                decimals: 2,
                placeholder: null,
              },
              visibility: null,
              math: null,
              optional: false,
              replies: [],
              children: null,
            },
          ],
          variables: [],
          customLists: [],
          automaticNumberingConfig: null,
          standardListDefinitions: [],
        },
        true,
      ),
    ).toBeTrue();
  });

  it("incomplete required internal field on not public context", () => {
    expect(
      petitionIsCompleted(
        {
          fields: [
            {
              id: 3280,
              is_internal: false,
              type: "HEADING",
              options: {
                hasPageBreak: false,
              },
              visibility: null,
              math: null,
              optional: false,
              replies: [],
              children: null,
            },
            {
              id: 3425,
              is_internal: false,
              type: "FIELD_GROUP",
              options: {
                groupName: null,
              },
              visibility: null,
              math: null,
              optional: true,
              replies: [
                {
                  content: {},
                  anonymized_at: null,
                  children: [
                    {
                      field: {
                        id: 3438,
                        is_internal: false,
                        type: "SHORT_TEXT",
                        options: {
                          format: null,
                          maxLength: null,
                          placeholder: null,
                        },
                        optional: false,
                      },
                      replies: [
                        {
                          content: {
                            value: "A",
                          },
                          anonymized_at: null,
                        },
                      ],
                    },
                    {
                      field: {
                        id: 3440,
                        is_internal: false,
                        type: "SHORT_TEXT",
                        options: {
                          format: null,
                          maxLength: null,
                          placeholder: null,
                        },
                        optional: false,
                      },
                      replies: [],
                    },
                  ],
                },
                {
                  content: {},
                  anonymized_at: null,
                  children: [
                    {
                      field: {
                        id: 3438,
                        is_internal: false,
                        type: "SHORT_TEXT",
                        options: {
                          format: null,
                          maxLength: null,
                          placeholder: null,
                        },
                        optional: false,
                      },
                      replies: [
                        {
                          content: {
                            value: "$$$",
                          },
                          anonymized_at: null,
                        },
                      ],
                    },
                    {
                      field: {
                        id: 3440,
                        is_internal: false,
                        type: "SHORT_TEXT",
                        options: {
                          format: null,
                          maxLength: null,
                          placeholder: null,
                        },
                        optional: false,
                      },
                      replies: [
                        {
                          content: {
                            value: "B!",
                          },
                          anonymized_at: null,
                        },
                      ],
                    },
                  ],
                },
                {
                  content: {},
                  anonymized_at: null,
                  children: [
                    {
                      field: {
                        id: 3438,
                        is_internal: false,
                        type: "SHORT_TEXT",
                        options: {
                          format: null,
                          maxLength: null,
                          placeholder: null,
                        },
                        optional: false,
                      },
                      replies: [
                        {
                          content: {
                            value: "A",
                          },
                          anonymized_at: null,
                        },
                      ],
                    },
                    {
                      field: {
                        id: 3440,
                        is_internal: false,
                        type: "SHORT_TEXT",
                        options: {
                          format: null,
                          maxLength: null,
                          placeholder: null,
                        },
                        optional: false,
                      },
                      replies: [],
                    },
                  ],
                },
              ],
              children: [
                {
                  id: 3438,
                  is_internal: false,
                  type: "SHORT_TEXT",
                  options: {
                    format: null,
                    maxLength: null,
                    placeholder: null,
                  },
                  visibility: null,
                  math: null,
                  optional: false,
                  replies: [
                    {
                      content: {
                        value: "A",
                      },
                      anonymized_at: null,
                    },
                    {
                      content: {
                        value: "$$$",
                      },
                      anonymized_at: null,
                    },
                    {
                      content: {
                        value: "A",
                      },
                      anonymized_at: null,
                    },
                  ],
                },
                {
                  id: 3440,
                  is_internal: false,
                  type: "SHORT_TEXT",
                  options: {
                    format: null,
                    maxLength: null,
                    placeholder: null,
                  },
                  visibility: {
                    type: "SHOW",
                    operator: "AND",
                    conditions: [
                      {
                        value: "$$$",
                        fieldId: 3438,
                        modifier: "ANY",
                        operator: "EQUAL",
                      },
                    ],
                  },
                  math: null,
                  optional: false,
                  replies: [
                    {
                      content: {
                        value: "B!",
                      },
                      anonymized_at: null,
                    },
                  ],
                },
              ],
            },
            {
              id: 3445,
              is_internal: true,
              type: "NUMBER",
              options: {
                range: {
                  min: 0,
                },
                prefix: null,
                suffix: null,
                decimals: 2,
                placeholder: null,
              },
              visibility: null,
              math: null,
              optional: false,
              replies: [],
              children: null,
            },
          ],
          variables: [],
          customLists: [],
          automaticNumberingConfig: null,
          standardListDefinitions: [],
        },
        false,
      ),
    ).toBeFalse();
  });

  it("incomplete internal field group on public context", () => {
    expect(
      petitionIsCompleted(
        {
          fields: [
            {
              id: 3280,
              is_internal: false,
              type: "HEADING",
              options: {
                hasPageBreak: false,
              },
              visibility: null,
              math: null,
              optional: false,
              replies: [],
              children: null,
            },
            {
              id: 3425,
              is_internal: true,
              type: "FIELD_GROUP",
              options: {
                groupName: null,
              },
              visibility: null,
              math: null,
              optional: false,
              replies: [],
              children: [
                {
                  id: 3438,
                  is_internal: true,
                  type: "SHORT_TEXT",
                  options: {
                    format: null,
                    maxLength: null,
                    placeholder: null,
                  },
                  visibility: null,
                  math: null,
                  optional: false,
                  replies: [],
                },
                {
                  id: 3440,
                  is_internal: true,
                  type: "SHORT_TEXT",
                  options: {
                    format: null,
                    maxLength: null,
                    placeholder: null,
                  },
                  visibility: null,
                  math: null,
                  optional: false,
                  replies: [],
                },
              ],
            },
            {
              id: 3446,
              is_internal: false,
              type: "NUMBER",
              options: {
                range: {
                  min: 0,
                },
                prefix: null,
                suffix: null,
                decimals: 2,
                placeholder: null,
              },
              visibility: null,
              math: null,
              optional: false,
              replies: [
                {
                  content: {
                    value: 123,
                  },
                  anonymized_at: null,
                  children: null,
                },
              ],
              children: null,
            },
          ],
          variables: [],
          customLists: [],
          automaticNumberingConfig: null,
          standardListDefinitions: [],
        },
        true,
      ),
    ).toBeTrue();
  });

  it("field group with incomplete internal child on public context", () => {
    expect(
      petitionIsCompleted(
        {
          fields: [
            {
              id: 3280,
              is_internal: false,
              type: "HEADING",
              options: {
                hasPageBreak: false,
              },
              visibility: null,
              math: null,
              optional: false,
              replies: [],
              children: null,
            },
            {
              id: 3425,
              is_internal: false,
              type: "FIELD_GROUP",
              options: {
                groupName: null,
              },
              visibility: null,
              math: null,
              optional: false,
              replies: [
                {
                  content: {},
                  anonymized_at: null,
                  children: [
                    {
                      field: {
                        id: 3438,
                        is_internal: false,
                        type: "SHORT_TEXT",
                        options: {
                          format: null,
                          maxLength: null,
                          placeholder: null,
                        },
                        optional: false,
                      },
                      replies: [
                        {
                          content: {
                            value: "A",
                          },
                          anonymized_at: null,
                        },
                      ],
                    },
                    {
                      field: {
                        id: 3440,
                        is_internal: true,
                        type: "SHORT_TEXT",
                        options: {
                          format: null,
                          maxLength: null,
                          placeholder: null,
                        },
                        optional: false,
                      },
                      replies: [],
                    },
                  ],
                },
              ],
              children: [
                {
                  id: 3438,
                  is_internal: false,
                  type: "SHORT_TEXT",
                  options: {
                    format: null,
                    maxLength: null,
                    placeholder: null,
                  },
                  visibility: null,
                  math: null,
                  optional: false,
                  replies: [
                    {
                      content: {
                        value: "A",
                      },
                      anonymized_at: null,
                    },
                  ],
                },
                {
                  id: 3440,
                  is_internal: true,
                  type: "SHORT_TEXT",
                  options: {
                    format: null,
                    maxLength: null,
                    placeholder: null,
                  },
                  visibility: null,
                  math: null,
                  optional: false,
                  replies: [],
                },
              ],
            },
          ],
          variables: [],
          customLists: [],
          automaticNumberingConfig: null,
          standardListDefinitions: [],
        },
        true,
      ),
    ).toBeTrue();
  });

  it('checkbox with "exact" option', () => {
    expect(
      petitionIsCompleted({
        fields: [
          {
            id: 3280,
            is_internal: false,
            type: "HEADING",
            options: {
              hasPageBreak: false,
            },
            visibility: null,
            math: null,
            optional: false,
            replies: [],
            children: null,
          },
          {
            id: 3447,
            is_internal: false,
            type: "CHECKBOX",
            options: {
              limit: {
                max: 2,
                min: 1,
                type: "EXACT",
              },
              values: ["A", "B", "C"],
            },
            visibility: null,
            math: null,
            optional: false,
            replies: [
              {
                content: {
                  value: ["A"],
                },
                anonymized_at: null,
                children: null,
              },
            ],
            children: null,
          },
        ],
        variables: [],
        customLists: [],
        automaticNumberingConfig: null,
        standardListDefinitions: [],
      }),
    ).toBeFalse();
  });

  it("field group with incomplete 'exact' checkbox field", () => {
    expect(
      petitionIsCompleted({
        fields: [
          {
            id: 3280,
            is_internal: false,
            type: "HEADING",
            options: {
              hasPageBreak: false,
            },
            visibility: null,
            math: null,
            optional: false,
            replies: [],
            children: null,
          },
          {
            id: 3448,
            is_internal: false,
            type: "FIELD_GROUP",
            options: {
              groupName: null,
            },
            visibility: null,
            math: null,
            optional: false,
            replies: [
              {
                content: {},
                anonymized_at: null,
                children: [
                  {
                    field: {
                      id: 3447,
                      is_internal: false,
                      type: "CHECKBOX",
                      options: {
                        limit: {
                          max: 2,
                          min: 1,
                          type: "EXACT",
                        },
                        values: ["A", "B", "C"],
                      },
                      optional: false,
                    },
                    replies: [
                      {
                        content: {
                          value: ["A"],
                        },
                        anonymized_at: null,
                      },
                    ],
                  },
                  {
                    field: {
                      id: 3449,
                      is_internal: false,
                      type: "SHORT_TEXT",
                      options: {
                        format: null,
                        maxLength: null,
                        placeholder: null,
                      },
                      optional: false,
                    },
                    replies: [
                      {
                        content: {
                          value: "AAA",
                        },
                        anonymized_at: null,
                      },
                    ],
                  },
                ],
              },
            ],
            children: [
              {
                id: 3447,
                is_internal: false,
                type: "CHECKBOX",
                options: {
                  limit: {
                    max: 2,
                    min: 1,
                    type: "EXACT",
                  },
                  values: ["A", "B", "C"],
                },
                visibility: null,
                math: null,
                optional: false,
                replies: [
                  {
                    content: {
                      value: ["A"],
                    },
                    anonymized_at: null,
                  },
                ],
              },
              {
                id: 3449,
                is_internal: false,
                type: "SHORT_TEXT",
                options: {
                  format: null,
                  maxLength: null,
                  placeholder: null,
                },
                visibility: null,
                math: null,
                optional: false,
                replies: [
                  {
                    content: {
                      value: "AAA",
                    },
                    anonymized_at: null,
                  },
                ],
              },
            ],
          },
        ],
        variables: [],
        customLists: [],
        automaticNumberingConfig: null,
        standardListDefinitions: [],
      }),
    ).toBeFalse();
  });

  it("should be completed if IS_IN_LIST condition hides an incomplete field", () => {
    expect(
      petitionIsCompleted({
        fields: [
          {
            id: 3280,
            is_internal: false,
            type: "HEADING",
            options: {
              hasPageBreak: false,
            },
            visibility: null,
            math: null,
            optional: false,
            replies: [],
            children: null,
          },
          {
            id: 3425,
            is_internal: false,
            type: "SELECT",
            options: {
              standardList: "COUNTRIES",
              values: [],
            },
            visibility: null,
            math: null,
            optional: false,
            replies: [
              {
                content: { value: "AR" },
                anonymized_at: null,
              },
            ],
          },
          {
            id: 3445,
            is_internal: false,
            type: "SHORT_TEXT",
            options: {},
            visibility: {
              type: "HIDE",
              operator: "AND",
              conditions: [
                {
                  value: "GAFI_BLACKLIST",
                  fieldId: 3425,
                  modifier: "ANY",
                  operator: "IS_IN_LIST",
                },
              ],
            },
            math: null,
            optional: false,
            replies: [],
          },
        ],
        variables: [],
        customLists: [],
        automaticNumberingConfig: null,
        standardListDefinitions: [
          {
            listName: "GAFI_BLACKLIST",
            values: [{ key: "AR" }, { key: "BR" }, { key: "UY" }],
          },
        ],
      }),
    ).toBeTrue();
  });
});
