import { browsers } from "../browsers";

Object.entries(browsers)
  .filter(([_, browser]) => !!browser)
  .forEach(([name, browser]) => {
    describe(`Petition Creation - ${name}`, () => {
      beforeAll(async (done) => {
        await browser.load();
        done();
      });

      afterAll(async (done) => {
        await browser.close();
        done();
      });

      it("should start on Home", async () => {
        expect(await browser.currentURL()).toBe("");
      });

      it("should redirect to login page", async () => {
        await browser.clickAndNavigate("#pw-public-login");
        expect(await browser.currentURL()).toBe("/login");
      });

      it("should complete login process", async () => {
        await browser.writeInput("#email", "santialbo@gmail.com");
        await browser.writeInput("#password", "1234567890");
        await browser.clickAndNavigate("#pw-login-submit");
        expect(await browser.currentURL()).toBe("/app/petitions");
      });

      it("should create a new Petition", async (done) => {
        await browser.onSelector(
          "#pw-onboarding-next",
          async () => await browser.clickUntilHidden("#pw-onboarding-next")
        );
        await browser.clickAndNavigate("#new-petition-button");
        await browser.clickAndNavigate("#empty-petition-card");
        expect(await browser.currentURL()).toMatch(
          /^\/app\/petitions\/[A-Za-z0-9]+\/compose$/
        );
        done();
      });
    });
  });
