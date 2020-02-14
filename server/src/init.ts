import "reflect-metadata";
import fetch from "node-fetch";
require("dotenv").config();

(<any>global).fetch = fetch;
(<any>global).navigator = () => null;
