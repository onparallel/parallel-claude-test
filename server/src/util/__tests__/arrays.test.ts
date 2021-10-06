import { chunkWhile, partition, sumBy } from "../arrays";

describe("Array Helper Functions", () => {
  it("chunkWhile 1", () => {
    const result = chunkWhile([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], (chunk) => chunk.length < 5);
    expect(result).toEqual([
      [1, 2, 3, 4, 5],
      [6, 7, 8, 9, 10],
    ]);
  });

  it("chunkWhile 2", () => {
    const result = chunkWhile([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], (_, value) => value < 5);
    expect(result).toEqual([[1, 2, 3, 4], [5], [6], [7], [8], [9], [10]]);
  });

  it("chunkWhile 3", () => {
    const result = chunkWhile(
      [
        [{ id: 1 }, [1, 2, 3]],
        [{ id: 2 }, [4, 5]],
        [{ id: 3 }, [6]],
        [{ id: 4 }, [7, 8, 9, 10]],
        [{ id: 5 }, [11, 12, 13]],
        [{ id: 6 }, [14]],
        [{ id: 7 }, [15, 16, 17, 18, 19, 20]],
        [{ id: 8 }, [21, 22]],
      ] as [any, number[]][],
      (chunk, [_, current]) =>
        chunk.length === 0 || sumBy(chunk, ([_, curr]) => curr.length) + current.length <= 5
    );

    expect(result).toEqual([
      [
        [{ id: 1 }, [1, 2, 3]],
        [{ id: 2 }, [4, 5]],
      ],
      [
        [{ id: 3 }, [6]],
        [{ id: 4 }, [7, 8, 9, 10]],
      ],
      [
        [{ id: 5 }, [11, 12, 13]],
        [{ id: 6 }, [14]],
      ],
      [[{ id: 7 }, [15, 16, 17, 18, 19, 20]]],
      [[{ id: 8 }, [21, 22]]],
    ]);
  });

  it("partition 1", () => {
    const result = partition([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], (v) => v > 5);
    expect(result).toEqual([
      [6, 7, 8, 9, 10],
      [1, 2, 3, 4, 5],
    ]);
  });

  it("partition 2", () => {
    const result = partition(
      [
        { id: 1, type: "WRITE" },
        { id: 2, type: "READ" },
        { id: 3, type: "READ" },
        { id: 4, type: "WRITE" },
        { id: 5, type: "READ" },
        { id: 6, type: "WRITE" },
        { id: 7, type: "WRITE" },
        { id: 8, type: "READ" },
      ],
      (p) => p.type === "READ"
    );

    expect(result).toEqual([
      [
        { id: 2, type: "READ" },
        { id: 3, type: "READ" },
        { id: 5, type: "READ" },
        { id: 8, type: "READ" },
      ],
      [
        { id: 1, type: "WRITE" },
        { id: 4, type: "WRITE" },
        { id: 6, type: "WRITE" },
        { id: 7, type: "WRITE" },
      ],
    ]);
  });
});
