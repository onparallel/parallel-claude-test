import { EntityDetailsResponse, EntitySearchResponse } from "../../services/BackgroundCheckService";
import {
  isNotifiableEntityDifference,
  isNotifiableSearchDifference,
  requiresRefresh,
} from "../helpers/monitoringUtils";

describe("monitoringUtils", () => {
  describe("isNotifiableEntityDifference", () => {
    let entity: EntityDetailsResponse;
    beforeAll(() => {
      entity = {
        id: "1",
        type: "Person",
        name: "Vladimir Putin",
        properties: {
          topics: ["pep"],
          alias: ["Vova", "Vlad"],
          birthPlace: ["Leningrad"],
          country: ["RU"],
          sanctions: [{ id: "sanction-1", type: "Sanction", properties: {} }],
        },
        createdAt: new Date(),
      };
    });

    test("with different type", () => {
      expect(
        isNotifiableEntityDifference(entity, {
          id: "1",
          type: "Company",
          name: "Vladimir Putin",
          properties: {
            topics: ["pep"],
            alias: ["Vova", "Vlad"],
            jurisdiction: ["RU"],
            sanctions: [{ id: "sanction-1", type: "Sanction", properties: {} }],
          },
          createdAt: new Date(),
        }),
      ).toBe(true);
    });

    test("with more topics", () => {
      expect(
        isNotifiableEntityDifference(entity, {
          id: "1",
          type: "Person",
          name: "Vladimir Putin",
          properties: {
            topics: ["pep", "crime"],
            alias: ["Vova", "Vlad"],
            birthPlace: ["Leningrad"],
            country: ["RU"],
            sanctions: [{ id: "sanction-1", type: "Sanction", properties: {} }],
          },
          createdAt: new Date(),
        }),
      ).toBe(true);
    });

    test("with less topics", () => {
      expect(
        isNotifiableEntityDifference(entity, {
          id: "1",
          type: "Person",
          name: "Vladimir Putin",
          properties: {
            topics: [],
            alias: ["Vova", "Vlad"],
            birthPlace: ["Leningrad"],
            country: ["RU"],
            sanctions: [{ id: "sanction-1", type: "Sanction", properties: {} }],
          },
          createdAt: new Date(),
        }),
      ).toBe(true);
    });

    test("with different topics", () => {
      expect(
        isNotifiableEntityDifference(entity, {
          id: "1",
          type: "Person",
          name: "Vladimir Putin",
          properties: {
            topics: ["gov"],
            alias: ["Vova", "Vlad"],
            birthPlace: ["Leningrad"],
            country: ["RU"],
            sanctions: [{ id: "sanction-1", type: "Sanction", properties: {} }],
          },
          createdAt: new Date(),
        }),
      ).toBe(true);
    });

    test("with more alias", () => {
      expect(
        isNotifiableEntityDifference(entity, {
          id: "1",
          type: "Person",
          name: "Vladimir Putin",
          properties: {
            topics: ["pep"],
            alias: ["Vova", "Vlad", "Pootie"],
            birthPlace: ["Leningrad"],
            country: ["RU"],
            sanctions: [{ id: "sanction-1", type: "Sanction", properties: {} }],
          },
          createdAt: new Date(),
        }),
      ).toBe(false);
    });

    test("with more properties", () => {
      expect(
        isNotifiableEntityDifference(entity, {
          id: "1",
          type: "Person",
          name: "Vladimir Putin",
          properties: {
            topics: ["pep"],
            alias: ["Vova", "Vlad"],
            birthPlace: ["Leningrad"],
            country: ["RU"],
            religion: ["Orthodox"],
            position: ["President"],
            sanctions: [{ id: "sanction-1", type: "Sanction", properties: {} }],
          },
          createdAt: new Date(),
        }),
      ).toBe(false);
    });

    test("same entity", () => {
      expect(
        isNotifiableEntityDifference(entity, {
          id: "1",
          type: "Person",
          name: "Vladimir Putin",
          properties: {
            topics: ["pep"],
            alias: ["Vova", "Vlad"],
            birthPlace: ["Leningrad"],
            country: ["RU"],
            sanctions: [{ id: "sanction-1", type: "Sanction", properties: {} }],
          },
          createdAt: new Date(),
        }),
      ).toBe(false);
    });

    test("with new sanctions", () => {
      expect(
        isNotifiableEntityDifference(entity, {
          id: "1",
          type: "Person",
          name: "Vladimir Putin",
          properties: {
            topics: ["pep"],
            alias: ["Vova", "Vlad"],
            birthPlace: ["Leningrad"],
            country: ["RU"],
            sanctions: [
              { id: "sanction-1", type: "Sanction", properties: {} },
              { id: "sanction-2", type: "Sanction", properties: {} },
            ],
          },
          createdAt: new Date(),
        }),
      ).toBe(true);
    });

    test("with less sanctions", () => {
      expect(
        isNotifiableEntityDifference(entity, {
          id: "1",
          type: "Person",
          name: "Vladimir Putin",
          properties: {
            topics: ["pep"],
            alias: ["Vova", "Vlad"],
            birthPlace: ["Leningrad"],
            country: ["RU"],
            sanctions: [],
          },
          createdAt: new Date(),
        }),
      ).toBe(true);
    });

    test("with different sanctions", () => {
      expect(
        isNotifiableEntityDifference(entity, {
          id: "1",
          type: "Person",
          name: "Vladimir Putin",
          properties: {
            topics: ["pep"],
            alias: ["Vova", "Vlad"],
            birthPlace: ["Leningrad"],
            country: ["RU"],
            sanctions: [{ id: "sanction-2", type: "Sanction", properties: {} }],
          },
          createdAt: new Date(),
        }),
      ).toBe(true);
    });
  });

  describe("isNotifiableSearchDifference", () => {
    let search: EntitySearchResponse;
    beforeAll(() => {
      search = {
        totalCount: 3,
        items: [
          {
            id: "1",
            type: "Person",
            name: "Vladimir Vladimirovich Putin",
            properties: { topics: ["pep", "san", "spy"] },
          },
          { id: "2", type: "Person", name: "Vladimir Pekhtin", properties: { topics: ["pep"] } },
          {
            id: "3",
            type: "Company",
            name: "Military Commissariat of Vladimir Region",
            properties: { topics: ["gov"] },
          },
        ],
        createdAt: new Date(),
      };
    });

    test("with less results", () => {
      expect(
        isNotifiableSearchDifference(search, {
          totalCount: 2,
          items: search.items.slice(0, 2),
          createdAt: new Date(),
        }),
      ).toBe(false);
    });

    test("with more results", () => {
      expect(
        isNotifiableSearchDifference(search, {
          totalCount: 4,
          items: search.items.concat({
            id: "4",
            type: "Person",
            name: "Vladimir Putin",
            properties: { topics: ["pep"] },
          }),
          createdAt: new Date(),
        }),
      ).toBe(true);
    });

    test("with different results", () => {
      expect(
        isNotifiableSearchDifference(search, {
          totalCount: 3,
          items: [
            {
              id: "1",
              type: "Person",
              name: "Vladimir Vladimirovich Putin",
              properties: { topics: ["pep", "san", "spy"] },
            },
            { id: "2", type: "Person", name: "Vladimir Pekhtin", properties: { topics: ["pep"] } },
            {
              id: "4",
              type: "Company",
              name: "Military Commissariat of Vladimir Region",
              properties: { topics: ["gov"] },
            },
          ],
          createdAt: new Date(),
        }),
      ).toBe(true);
    });

    test("with a single different result", () => {
      expect(
        isNotifiableSearchDifference(search, {
          totalCount: 1,
          items: [
            {
              id: "4",
              type: "Person",
              name: "Vladimir Vladimirovich Putin",
              properties: { topics: ["pep", "san", "spy"] },
            },
          ],
          createdAt: new Date(),
        }),
      ).toBe(true);
    });
  });

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
