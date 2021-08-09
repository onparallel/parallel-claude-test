import { Browser, BrowserContext, Page } from "playwright";
import { getBrowser } from "./getBrowser";
import { startContext } from "./startContext";

export interface TestSessionContext {
  browser: Browser;
  browserContext: BrowserContext;
  page: Page;
}

function buildCreateTestSession(func: jest.Describe) {
  return function (name: string, fn: (context: TestSessionContext) => void) {
    func.each((process.env.BROWSER ?? "chrome").split(","))(`${name} - %s`, (browserName) => {
      const context = {} as Partial<TestSessionContext>;
      beforeAll(async () => {
        context.browser = await getBrowser(browserName, process.env.HEADLESS_BROWSER === "true");
        context.browserContext = await startContext(context.browser!);
        context.page = await context.browserContext!.newPage();
      });

      afterAll(async () => {
        await context.browser!.close();
      });

      fn(context as TestSessionContext);
    });
  };
}

export const createTestSession = Object.assign(buildCreateTestSession(describe), {
  only: buildCreateTestSession(describe.only),
  skip: buildCreateTestSession(describe.skip),
});
