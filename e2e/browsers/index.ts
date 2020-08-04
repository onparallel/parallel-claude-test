import { PageView } from "./PageView";
import { chromium, firefox, webkit } from "playwright";

export const browsers = Object.fromEntries(
  (process.env.PLAYWRIGHT_BROWSERS ?? "chrome,webkit,firefox")
    .split(",")
    .map((name) => {
      switch (name) {
        case "chrome":
          return ["Chrome", new PageView(chromium, ["--no-sandbox"])];
        case "firefox":
          return ["Firefox", new PageView(firefox)];
        case "webkit":
          return ["Webkit", new PageView(webkit)];
      }
    })
);
