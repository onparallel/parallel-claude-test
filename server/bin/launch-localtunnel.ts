import { spawn } from "child_process";
import { writeFileSync } from "fs";
import fetch from "node-fetch";
import { resolve } from "path";
import { waitFor } from "../src/util/promises/waitFor";

interface Ngrok {
  tunnels: {
    public_url: string;
    proto: "http" | "https";
  }[];
}

(async () => {
  const child = spawn("ngrok", ["http", "4000"]);

  try {
    await waitFor(2000); // wait for the web UI to be up
    const response = await fetch("http://127.0.0.1:4040/api/tunnels");
    const data = (await response.json()) as Ngrok;

    const url = data.tunnels.find((t) => t.proto === "https")?.public_url;
    console.log("Your tunnel URL is:", url);
    console.log("Inspect webhook on: http://127.0.0.1:4040/");

    writeFileSync(resolve(__dirname, "localtunnel-dev.url"), url!, "utf8");
  } catch (error) {
    console.error(error);
    child.kill();
  }

  process.on("SIGINT", child.kill);
})();
