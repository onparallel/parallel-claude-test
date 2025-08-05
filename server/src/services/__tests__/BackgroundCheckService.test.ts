import { Container } from "inversify";
import { createTestContainer } from "../../../test/testContainer";
import {
  BACKGROUND_CHECK_SERVICE,
  BackgroundCheckContent,
  IBackgroundCheckService,
} from "../BackgroundCheckService";

describe("BackgroundCheckService", () => {
  let container: Container;
  let backgroundCheck: IBackgroundCheckService;

  beforeAll(async () => {
    container = await createTestContainer();

    backgroundCheck = container.get<IBackgroundCheckService>(BACKGROUND_CHECK_SERVICE);
  });

  describe("mapBackgroundCheckSearch", () => {
    it("maps content from database, adding false positives to every search item", () => {
      expect(
        backgroundCheck.mapBackgroundCheckSearch({
          query: {
            name: "Person",
            type: "PERSON",
            birthCountry: null,
            country: null,
            date: null,
          },
          search: {
            createdAt: new Date(),
            totalCount: 1,
            items: [
              { id: "1", name: "Person 1", type: "Person", properties: {}, score: 1 },
              { id: "2", name: "Person 2", type: "Person", properties: {}, score: 0.8 },
              { id: "3", name: "Person 3", type: "Person", properties: {}, score: 0.6 },
              { id: "4", name: "Person 4", type: "Person", properties: {}, score: 0.4 },
              { id: "5", name: "Person 5", type: "Person", properties: {}, score: 0.2 },
            ],
          },
          entity: null,
          falsePositives: [
            { id: "1", addedAt: new Date(), addedByUserId: 1 },
            { id: "3", addedAt: new Date(), addedByUserId: 1 },
          ],
        }),
      ).toEqual({
        createdAt: expect.any(Date),
        totalCount: 1,
        items: [
          {
            id: "1",
            name: "Person 1",
            type: "Person",
            properties: {},
            score: 1,
            isFalsePositive: true,
            isMatch: false,
          },
          {
            id: "2",
            name: "Person 2",
            type: "Person",
            properties: {},
            score: 0.8,
            isFalsePositive: false,
            isMatch: false,
          },
          {
            id: "3",
            name: "Person 3",
            type: "Person",
            properties: {},
            score: 0.6,
            isFalsePositive: true,
            isMatch: false,
          },
          {
            id: "4",
            name: "Person 4",
            type: "Person",
            properties: {},
            score: 0.4,
            isFalsePositive: false,
            isMatch: false,
          },
          {
            id: "5",
            name: "Person 5",
            type: "Person",
            properties: {},
            score: 0.2,
            isFalsePositive: false,
            isMatch: false,
          },
        ],
      });
    });
  });

  describe("extractRelevantDifferences", () => {
    let content: BackgroundCheckContent;

    beforeAll(() => {
      content = {
        query: {
          name: "Vladimir Putin",
          type: "PERSON",
          birthCountry: null,
          country: null,
          date: null,
        },
        entity: {
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
        },
        search: {
          createdAt: new Date(),
          totalCount: 5,
          items: [
            {
              id: "1",
              type: "Person",
              name: "Person 1",
              properties: { topics: ["pep"], gender: ["male"] },
              score: 1,
            },
            {
              id: "2",
              type: "Person",
              name: "Person 2",
              properties: { topics: ["pep"], gender: ["male"] },
              score: 0.8,
            },
            {
              id: "3",
              type: "Company",
              name: "Company 3",
              properties: { topics: ["pep"], jurisdiction: ["us"] },
              score: 0.6,
            },
            {
              id: "4",
              type: "Person",
              name: "Person 4",
              properties: { topics: ["pep"], gender: ["male"] },
              score: 0.4,
            },
            {
              id: "5",
              type: "Company",
              name: "Company 5",
              properties: { topics: ["pep"], jurisdiction: ["us"] },
              score: 0.2,
            },
          ],
        },
      };
    });

    it("with different entity type", () => {
      expect(() =>
        backgroundCheck.extractRelevantDifferences(content, {
          query: content.query,
          search: content.search,
          entity: {
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
          },
        }),
      ).toThrow("Assertion Error: Entities must have the same type");
    });

    it("with more topics", () => {
      expect(
        backgroundCheck.extractRelevantDifferences(content, {
          query: content.query,
          search: content.search,
          entity: {
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
          },
        }),
      ).toEqual({
        entity: {
          properties: {
            topics: {
              added: ["crime"],
              removed: [],
            },
          },
        },
        search: null,
      });
    });

    it("with less topics", () => {
      expect(
        backgroundCheck.extractRelevantDifferences(content, {
          query: content.query,
          search: content.search,
          entity: {
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
          },
        }),
      ).toEqual({
        entity: {
          properties: {
            topics: {
              added: [],
              removed: ["pep"],
            },
          },
        },
        search: null,
      });
    });

    it("with different topics", () => {
      expect(
        backgroundCheck.extractRelevantDifferences(content, {
          query: content.query,
          search: content.search,
          entity: {
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
          },
        }),
      ).toEqual({
        entity: {
          properties: {
            topics: {
              added: ["gov"],
              removed: ["pep"],
            },
          },
        },
        search: null,
      });
    });

    it("with more alias", () => {
      expect(
        backgroundCheck.extractRelevantDifferences(content, {
          query: content.query,
          search: content.search,
          entity: {
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
          },
        }),
      ).toEqual({ entity: null, search: null });
    });

    it("with more properties", () => {
      expect(
        backgroundCheck.extractRelevantDifferences(content, {
          query: content.query,
          search: content.search,
          entity: {
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
          },
        }),
      ).toEqual({
        entity: null,
        search: null,
      });
    });

    it("same entity", () => {
      expect(
        backgroundCheck.extractRelevantDifferences(content, {
          query: content.query,
          search: content.search,
          entity: {
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
          },
        }),
      ).toEqual({ entity: null, search: null });
    });

    it("with null entity", () => {
      expect(
        backgroundCheck.extractRelevantDifferences(content, {
          query: content.query,
          search: content.search,
          entity: null,
        }),
      ).toEqual({ entity: null, search: null });
    });

    it("with new sanctions", () => {
      expect(
        backgroundCheck.extractRelevantDifferences(content, {
          query: content.query,
          search: content.search,
          entity: {
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
          },
        }),
      ).toEqual({
        entity: {
          properties: {
            sanctions: {
              added: [{ id: "sanction-2", type: "Sanction", properties: {} }],
              removed: [],
            },
          },
        },
        search: null,
      });
    });

    it("with less sanctions", () => {
      expect(
        backgroundCheck.extractRelevantDifferences(content, {
          query: content.query,
          search: content.search,
          entity: {
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
          },
        }),
      ).toEqual({
        entity: {
          properties: {
            sanctions: {
              added: [],
              removed: [{ id: "sanction-1", type: "Sanction", properties: {} }],
            },
          },
        },
        search: null,
      });
    });

    it("with different sanctions", () => {
      expect(
        backgroundCheck.extractRelevantDifferences(content, {
          query: content.query,
          search: content.search,
          entity: {
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
          },
        }),
      ).toEqual({
        entity: {
          properties: {
            sanctions: {
              added: [{ id: "sanction-2", type: "Sanction", properties: {} }],
              removed: [{ id: "sanction-1", type: "Sanction", properties: {} }],
            },
          },
        },
        search: null,
      });
    });

    it("with more items", () => {
      expect(
        backgroundCheck.extractRelevantDifferences(content, {
          query: content.query,
          entity: content.entity,
          search: {
            createdAt: new Date(),
            totalCount: 7,
            items: [
              {
                id: "1",
                type: "Person",
                name: "Person 1",
                properties: { topics: ["pep"], gender: ["male"] },
                score: 1,
              },
              {
                id: "2",
                type: "Person",
                name: "Person 2",
                properties: { topics: ["pep"], gender: ["male"] },
                score: 0.8,
              },
              {
                id: "3",
                type: "Company",
                name: "Company 3",
                properties: { topics: ["pep"], jurisdiction: ["us"] },
                score: 0.6,
              },
              {
                id: "4",
                type: "Person",
                name: "Person 4",
                properties: { topics: ["pep"], gender: ["male"] },
                score: 0.4,
              },
              {
                id: "5",
                type: "Company",
                name: "Company 5",
                properties: { topics: ["pep"], jurisdiction: ["us"] },
                score: 0.2,
              },
              {
                id: "6",
                type: "Person",
                name: "Person 6",
                properties: { topics: ["pep"], gender: ["male"] },
                score: 0.2,
              },
              {
                id: "7",
                type: "Company",
                name: "Company 7",
                properties: { topics: ["pep"], jurisdiction: ["us"] },
                score: 0.2,
              },
            ],
          },
        }),
      ).toEqual({
        entity: null,
        search: {
          items: {
            added: [
              {
                id: "6",
                type: "Person",
                name: "Person 6",
                properties: { topics: ["pep"], gender: ["male"] },
                score: 0.2,
              },
              {
                id: "7",
                type: "Company",
                name: "Company 7",
                properties: { topics: ["pep"], jurisdiction: ["us"] },
                score: 0.2,
              },
            ],
            removed: [],
          },
        },
      });
    });

    it("with less items", () => {
      expect(
        backgroundCheck.extractRelevantDifferences(content, {
          query: content.query,
          entity: content.entity,
          search: {
            createdAt: new Date(),
            totalCount: 2,
            items: [
              {
                id: "1",
                type: "Person",
                name: "Person 1",
                properties: { topics: ["pep"], gender: ["male"] },
                score: 1,
              },
              {
                id: "2",
                type: "Person",
                name: "Person 2",
                properties: { topics: ["pep"], gender: ["male"] },
                score: 0.8,
              },
            ],
          },
        }),
      ).toEqual({
        entity: null,
        search: {
          items: {
            added: [],
            removed: [
              {
                id: "3",
                type: "Company",
                name: "Company 3",
                properties: { topics: ["pep"], jurisdiction: ["us"] },
                score: 0.6,
              },
              {
                id: "4",
                type: "Person",
                name: "Person 4",
                properties: { topics: ["pep"], gender: ["male"] },
                score: 0.4,
              },
              {
                id: "5",
                type: "Company",
                name: "Company 5",
                properties: { topics: ["pep"], jurisdiction: ["us"] },
                score: 0.2,
              },
            ],
          },
        },
      });
    });

    it("with different items", () => {
      expect(
        backgroundCheck.extractRelevantDifferences(content, {
          query: content.query,
          entity: content.entity,
          search: {
            createdAt: new Date(),
            totalCount: 5,
            items: [
              {
                id: "1",
                type: "Person",
                name: "Person 1",
                properties: { topics: ["pep"], gender: ["male"] },
                score: 1,
              },
              {
                id: "4",
                type: "Person",
                name: "Person 4",
                properties: { topics: ["pep"], gender: ["male"] },
                score: 0.4,
              },
              {
                id: "5",
                type: "Company",
                name: "Company 5",
                properties: { topics: ["pep"], jurisdiction: ["us"] },
                score: 0.2,
              },
              {
                id: "6",
                type: "Person",
                name: "Person 6",
                properties: { topics: ["pep"], gender: ["male"] },
                score: 0.2,
              },
              {
                id: "7",
                type: "Company",
                name: "Company 7",
                properties: { topics: ["pep"], jurisdiction: ["us"] },
                score: 0.2,
              },
            ],
          },
        }),
      ).toEqual({
        entity: null,
        search: {
          items: {
            added: [
              {
                id: "6",
                type: "Person",
                name: "Person 6",
                properties: { topics: ["pep"], gender: ["male"] },
                score: 0.2,
              },
              {
                id: "7",
                type: "Company",
                name: "Company 7",
                properties: { topics: ["pep"], jurisdiction: ["us"] },
                score: 0.2,
              },
            ],
            removed: [
              {
                id: "2",
                type: "Person",
                name: "Person 2",
                properties: { topics: ["pep"], gender: ["male"] },
                score: 0.8,
              },
              {
                id: "3",
                type: "Company",
                name: "Company 3",
                properties: { topics: ["pep"], jurisdiction: ["us"] },
                score: 0.6,
              },
            ],
          },
        },
      });
    });

    it("with same items but different properties", () => {
      expect(
        backgroundCheck.extractRelevantDifferences(content, {
          query: content.query,
          entity: content.entity,
          search: {
            createdAt: new Date(),
            totalCount: 5,
            items: [
              {
                id: "1",
                type: "Person",
                name: "Person XXX",
                properties: { topics: ["pep"], gender: ["female"] },
                score: 1,
              },
              {
                id: "2",
                type: "Person",
                name: "Person 2",
                properties: { topics: [], gender: ["male"] },
                score: 0.8,
              },
              {
                id: "3",
                type: "Company",
                name: "Company 3",
                properties: { topics: ["pep", "gov"], jurisdiction: ["us"] },
                score: 0.6,
              },
              {
                id: "4",
                type: "Person",
                name: "Person 4",
                properties: { topics: ["pep"], gender: ["male"] },
                score: 0.4,
              },
              {
                id: "5",
                type: "Company",
                name: "Company XXX",
                properties: { topics: ["pep"] },
                score: 0.2,
              },
            ],
          },
        }),
      ).toEqual({
        entity: null,
        search: null,
      });
    });
  });

  describe("mergeReviewReasons", () => {
    it("with no differences", () => {
      expect(backgroundCheck.mergeReviewReasons([])).toEqual({ entity: null, search: null });
    });

    it("with incremental entity differences", () => {
      expect(
        backgroundCheck.mergeReviewReasons([
          {
            differences: {
              entity: { properties: { topics: { added: ["gov"], removed: [] } } },
              search: null,
            },
          },
          {
            differences: {
              entity: {
                properties: {
                  topics: { added: ["pep"], removed: [] },
                  sanctions: {
                    added: [{ id: "sanction-1", type: "Sanction", properties: {} }],
                    removed: [],
                  },
                },
              },
              search: null,
            },
          },
          {
            differences: {
              entity: { properties: { topics: { added: ["wanted"], removed: [] } } },
              search: null,
            },
          },
        ]),
      ).toEqual({
        entity: {
          properties: {
            topics: {
              added: ["gov", "pep", "wanted"],
              removed: [],
            },
            sanctions: {
              added: [{ id: "sanction-1", type: "Sanction", properties: {} }],
              removed: [],
            },
          },
        },
        search: null,
      });
    });

    it("with decremental entity differences", () => {
      expect(
        backgroundCheck.mergeReviewReasons([
          {
            differences: {
              entity: { properties: { topics: { added: ["gov"], removed: [] } } },
              search: null,
            },
          },
          {
            differences: {
              entity: { properties: { topics: { added: ["pep"], removed: [] } } },
              search: null,
            },
          },
          {
            differences: {
              entity: { properties: { topics: { added: [], removed: ["gov"] } } },
              search: null,
            },
          },
          {
            differences: {
              entity: {
                properties: {
                  sanctions: {
                    added: [],
                    removed: [{ id: "sanction-1", type: "Sanction", properties: {} }],
                  },
                },
              },
              search: null,
            },
          },
        ]),
      ).toEqual({
        entity: {
          properties: {
            topics: {
              added: ["pep"],
              removed: [],
            },
            sanctions: {
              added: [],
              removed: [{ id: "sanction-1", type: "Sanction", properties: {} }],
            },
          },
        },
        search: null,
      });
    });

    it("where entity differences go back to the initial state", () => {
      expect(
        backgroundCheck.mergeReviewReasons([
          {
            differences: {
              entity: { properties: { topics: { added: ["gov", "pep"], removed: [] } } },
              search: null,
            },
          },
          {
            differences: {
              entity: {
                properties: {
                  topics: { added: ["sanctioned"], removed: ["gov"] },
                  sanctions: {
                    added: [{ id: "sanction-1", type: "Sanction", properties: {} }],
                    removed: [],
                  },
                },
              },
              search: null,
            },
          },
          {
            differences: {
              entity: {
                properties: {
                  topics: { added: [], removed: ["sanctioned"] },
                  sanctions: {
                    added: [],
                    removed: [{ id: "sanction-1", type: "Sanction", properties: {} }],
                  },
                },
              },
              search: null,
            },
          },
          {
            differences: {
              entity: {
                properties: {
                  topics: { added: [], removed: ["pep"] },
                },
              },
              search: null,
            },
          },
        ]),
      ).toEqual({ entity: null, search: null });
    });

    it("with new search results", () => {
      expect(
        backgroundCheck.mergeReviewReasons([
          {
            differences: {
              entity: null,
              search: {
                items: {
                  added: [{ id: "1", type: "Person", name: "Bart", properties: {} }],
                  removed: [],
                },
              },
            },
          },
          {
            differences: {
              entity: null,
              search: {
                items: {
                  added: [{ id: "2", type: "Person", name: "Lisa", properties: {} }],
                  removed: [],
                },
              },
            },
          },
          {
            differences: {
              entity: null,
              search: {
                items: {
                  added: [{ id: "3", type: "Person", name: "Maggie", properties: {} }],
                  removed: [],
                },
              },
            },
          },
        ]),
      ).toEqual({
        entity: null,
        search: {
          items: {
            added: [
              { id: "1", type: "Person", name: "Bart", properties: {} },
              { id: "2", type: "Person", name: "Lisa", properties: {} },
              { id: "3", type: "Person", name: "Maggie", properties: {} },
            ],
            removed: [],
          },
        },
      });
    });

    it("where search differences go back to the initial state", () => {
      expect(
        backgroundCheck.mergeReviewReasons([
          {
            differences: {
              entity: null,
              search: {
                items: {
                  added: [{ id: "1", type: "Person", name: "Bart", properties: {} }],
                  removed: [{ id: "3", type: "Person", name: "Maggie", properties: {} }],
                },
              },
            },
          },
          {
            differences: {
              entity: null,
              search: {
                items: {
                  added: [{ id: "3", type: "Person", name: "Maggie", properties: {} }],
                  removed: [{ id: "1", type: "Person", name: "Bart", properties: {} }],
                },
              },
            },
          },
        ]),
      ).toEqual({
        entity: null,
        search: null,
      });
    });
  });
});
