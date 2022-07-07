import { writeFileSync } from "fs";
import localtunnel from "localtunnel";
import { connect } from "ngrok";
import { resolve } from "path";

(async () => {
  let url = "";
  try {
    url = await withTimeout(
      localtunnel({
        port: 4000,
        subdomain: "parallel-localtunnel-dev", // try to use this custom subdomain, so restarts of the tunnel may keep the connection alive with 3rd party APIs
      }).then((t) => t.url),
      10000
    );
  } catch {
    console.log("localtunnel offline, trying with ngrok...");
    url = await connect({ proto: "http", addr: 4000 });
  }

  console.log("Your tunnel URL is:", url);
  writeFileSync(resolve(__dirname, "localtunnel-dev.url"), url, "utf8");
})();

async function withTimeout<T>(fn: Promise<T>, timeout: number) {
  return await Promise.race([new Promise<T>((_, rejected) => setTimeout(rejected, timeout)), fn]);
}
