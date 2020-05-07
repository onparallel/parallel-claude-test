import "reflect-metadata";
import fetch from "node-fetch";
import { loadEnv } from "./util/loadEnv";
loadEnv();

(global as any).fetch = fetch;
(global as any).navigator = () => null;
