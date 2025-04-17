import { existsSync, statSync } from "fs";
import { tmpdir } from "os";
import { withTempDir } from "../withTempDir";

describe("withTempDir", () => {
  it("deletes temporary directory when util is disposed", async () => {
    let path: string;
    {
      await using dir = await withTempDir();
      expect(dir.path).toBeDefined();
      expect(dir.path).toStartWith(tmpdir());
      expect(existsSync(dir.path)).toBe(true);
      expect(statSync(dir.path).isDirectory()).toBe(true);
      path = dir.path;
    }
    expect(existsSync(path)).toBe(false);
  });
});
