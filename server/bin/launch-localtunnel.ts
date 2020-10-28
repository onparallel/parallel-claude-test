import localtunnel from "localtunnel";
import { writeFileSync } from "fs";
import { resolve } from "path";

(async () => {
  const tunnel = await localtunnel({
    port: 4000,
    subdomain: "parallel-localtunnel-dev", // try to use this custom subdomain, so restarts of the tunnel may keep the connection alive with 3rd party APIs
  });
  console.log("Your tunnel URL is:", tunnel.url);
  writeFileSync(resolve(__dirname, "localtunnel-dev.url"), tunnel.url, "utf8");

  tunnel.on("close", () => {
    console.log("tunnel closed");
  });
})();
