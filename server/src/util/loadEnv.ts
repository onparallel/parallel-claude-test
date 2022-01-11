import path from "path";
import { config } from "dotenv";

export function loadEnv(overrides?: string) {
  if (overrides) {
    config({ path: path.resolve(process.cwd(), overrides) });
  }
  config();
}
