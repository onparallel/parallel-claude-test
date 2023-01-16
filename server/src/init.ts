import "reflect-metadata";
// keep this space to prevent import sorting, removing init from top
import fetch from "node-fetch";
import { loadEnv } from "./util/loadEnv";
loadEnv();

(global as any).fetch = fetch;
(global as any).navigator = () => null;
