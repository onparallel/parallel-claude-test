import DataLoader from "dataloader";
import { fromDataLoader, Loader } from "../fromDataLoader";

describe("fromDataLoader", () => {
  interface Data {
    id: number;
    name: string;
  }
  let load: Loader<number, Data>;
  let mock: jest.Mock<Promise<Data[]>, [readonly number[]]>;
  let cache: Record<number, Data>;

  beforeEach(() => {
    cache = {
      0: { id: 0, name: "Alice" },
      1: { id: 1, name: "Bob" },
      2: { id: 3, name: "Charlie" }
    };
    mock = jest.fn().mockImplementation(async (ids: readonly number[]) => {
      return ids.map(id => cache[id] ?? null);
    });
    load = fromDataLoader(new DataLoader(mock));
  });

  test("loads data", async () => {
    expect(await load(0)).toMatchObject({ name: "Alice" });
    expect(await load([1, 2])).toMatchObject([
      { name: "Bob" },
      { name: "Charlie" }
    ]);
    expect(await load([0, 3, 1])).toMatchObject([
      { name: "Alice" },
      null,
      { name: "Bob" }
    ]);
  });

  test("caches repeated calls", async () => {
    await load(0);
    await load(2);
    await load(1);
    await load(0);
    expect(mock).toHaveBeenCalledTimes(3);
    expect(mock).toHaveBeenNthCalledWith(1, [0]);
    expect(mock).toHaveBeenNthCalledWith(2, [2]);
    expect(mock).toHaveBeenNthCalledWith(3, [1]);
  });

  test("refreshes the caches with the refresh option", async () => {
    const result1 = await load(0);
    cache[0] = { id: 0, name: "Albert" };
    const result2 = await load(0);
    expect(result2).toMatchObject({ name: "Alice" });
    expect(mock).toHaveBeenCalledTimes(1);
    const result3 = await load(0, { refresh: true });
    expect(result3).toMatchObject({ name: "Albert" });
  });
});
