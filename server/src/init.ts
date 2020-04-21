import "reflect-metadata";
import fetch from "node-fetch";
import { loadEnv } from "./util/loadEnv";
loadEnv();

(<any>global).fetch = fetch;
(<any>global).navigator = () => null;
