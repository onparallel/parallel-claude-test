import { requiresRefresh } from "../helpers/monitoringUtils";

describe("monitoringUtils", () => {
  describe("requiresRefresh", () => {
    test("fixed frequency - expired", () => {
      expect(
        requiresRefresh(new Date("2024-02-01"))(
          { created_at: new Date("2024-01-01") },
          { searchFrequency: { type: "FIXED", frequency: "1_MONTHS" } },
          [],
        ),
      ).toEqual(true);
    });

    test("fixed frequency - not expired", () => {
      expect(
        requiresRefresh(new Date("2024-03-01"))(
          { created_at: new Date("2024-01-01") },
          { searchFrequency: { type: "FIXED", frequency: "6_MONTHS" } },
          [],
        ),
      ).toEqual(false);
    });

    test("fixed frequency - daily (refreshes)", () => {
      expect(
        requiresRefresh(new Date("2024-03-02"))(
          { created_at: new Date("2024-03-01") },
          { searchFrequency: { type: "FIXED", frequency: "1_DAYS" } },
          [],
        ),
      ).toEqual(true);
    });

    test("fixed frequency - daily (does not refresh)", () => {
      expect(
        requiresRefresh(new Date("2024-03-02"))(
          { created_at: new Date("2024-03-02") },
          { searchFrequency: { type: "FIXED", frequency: "1_DAYS" } },
          [],
        ),
      ).toEqual(false);
    });

    test("variable frequency - high", () => {
      expect(
        requiresRefresh(new Date("2024-03-01"))(
          { created_at: new Date("2024-01-01") },
          {
            searchFrequency: {
              type: "VARIABLE",
              profileTypeFieldId: 1,
              options: [
                { value: "high", frequency: "1_MONTHS" },
                { value: "medium", frequency: "6_MONTHS" },
                { value: "low", frequency: "1_YEARS" },
              ],
            },
          },
          [{ profile_type_field_id: 1, content: { value: "high" } }],
        ),
      ).toEqual(true);
    });

    test("variable frequency - medium", () => {
      expect(
        requiresRefresh(new Date("2024-03-01"))(
          { created_at: new Date("2024-01-01") },
          {
            searchFrequency: {
              type: "VARIABLE",
              profileTypeFieldId: 1,
              options: [
                { value: "high", frequency: "1_MONTHS" },
                { value: "medium", frequency: "6_MONTHS" },
                { value: "low", frequency: "1_YEARS" },
              ],
            },
          },
          [{ profile_type_field_id: 1, content: { value: "medium" } }],
        ),
      ).toEqual(false);
    });

    test("variable frequency - low", () => {
      expect(
        requiresRefresh(new Date("2024-03-01"))(
          { created_at: new Date("2024-01-01") },
          {
            searchFrequency: {
              type: "VARIABLE",
              profileTypeFieldId: 1,
              options: [
                { value: "high", frequency: "1_MONTHS" },
                { value: "medium", frequency: "6_MONTHS" },
                { value: "low", frequency: "1_YEARS" },
              ],
            },
          },
          [{ profile_type_field_id: 1, content: { value: "low" } }],
        ),
      ).toEqual(false);
    });

    test("variable frequency - no selectValues", () => {
      expect(
        requiresRefresh(new Date("2024-03-01"))(
          { created_at: new Date("2024-01-01") },
          {
            searchFrequency: {
              type: "VARIABLE",
              profileTypeFieldId: 1,
              options: [
                { value: "high", frequency: "1_MONTHS" },
                { value: "medium", frequency: "6_MONTHS" },
                { value: "low", frequency: "1_YEARS" },
              ],
            },
          },
          [],
        ),
      ).toEqual(false);
    });

    test("with passing activation condition and fixed frequency - expired", () => {
      expect(
        requiresRefresh(new Date("2024-02-01"))(
          { created_at: new Date("2024-01-01") },
          {
            searchFrequency: { type: "FIXED", frequency: "1_MONTHS" },
            activationCondition: { profileTypeFieldId: 1, values: ["high"] },
          },
          [{ profile_type_field_id: 1, content: { value: "high" } }],
        ),
      ).toEqual(true);
    });

    test("with passing activation condition and fixed frequency - not expired", () => {
      expect(
        requiresRefresh(new Date("2024-02-01"))(
          { created_at: new Date("2024-01-01") },
          {
            searchFrequency: { type: "FIXED", frequency: "6_MONTHS" },
            activationCondition: { profileTypeFieldId: 1, values: ["high"] },
          },
          [{ profile_type_field_id: 1, content: { value: "high" } }],
        ),
      ).toEqual(false);
    });

    test("with non passing activation condition", () => {
      expect(
        requiresRefresh(new Date("2024-03-01"))(
          { created_at: new Date("2024-01-01") },
          {
            searchFrequency: { type: "FIXED", frequency: "1_MONTHS" },
            activationCondition: { profileTypeFieldId: 1, values: ["high"] },
          },
          [{ profile_type_field_id: 1, content: { value: "low" } }],
        ),
      ).toEqual(false);
    });
  });
});
