import { readFileSync } from "fs";
import fetch from "node-fetch";
import { resolve } from "path";

export async function getBaseEventsUrl(defaultURL: string) {
  return process.env.NODE_ENV === "production" ? defaultURL : await tunnelUrl();
}

async function tunnelUrl() {
  try {
    const tunnelUrl = readFileSync(resolve("./bin/localtunnel-dev.url"), {
      encoding: "utf-8",
    });

    // ping the webhooks endpoint to make sure tunnel is active.
    const { status } = await fetch(tunnelUrl.concat("/api/webhooks/ping"), {
      timeout: 5000, //5 seconds
    });
    if (status !== 200) {
      throw new Error(
        `Tunnel at ${tunnelUrl} seems to be down with code ${status}. Run 'yarn localtunnel' on a separate terminal and try again.`
      );
    }
    return tunnelUrl;
  } catch (e) {
    if (e.code === "ENOENT") {
      throw new Error(
        `localtunnel-dev.url file not found at path ${e.path}. Run 'yarn localtunnel' on a separate terminal and try again.`
      );
    } else {
      throw e;
    }
  }
}
