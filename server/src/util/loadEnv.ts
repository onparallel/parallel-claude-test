import { resolve } from "path";
import { config } from "dotenv";
import { existsSync } from "fs";

export function loadEnv(overrides?: string) {
  if (overrides) {
    const path = resolve(process.cwd(), overrides);
    if (existsSync(path)) {
      config({ path });
    }
  }
  config();
}
