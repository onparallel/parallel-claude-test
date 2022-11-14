import { sumBy } from "remeda";
import { chunkWhile } from "../arrays";

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
});
