import { browsers } from "../browsers";
import * as faker from "faker";

Object.entries(browsers)
  .filter(([_, browser]) => !!browser)
  .forEach(([name, browser]) => {
    describe(`Add Contact - ${name}`, () => {
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

      it("should redirect to contacts page", async () => {
        await browser.clickAndNavigate("#pw-section-contacts");
        await browser.onSelector(
          "#pw-onboarding-next",
          async () => await browser.clickUntilHidden("#pw-onboarding-next")
        );
        expect(await browser.currentURL()).toBe("/app/contacts");
      });

      it("should create a new Contact", async () => {
        await browser.click("#pw-new-contact");
        await browser.waitUntilVisible("#chakra-modal-pw-add-contact");
        await browser.writeInput("#contact-email", faker.internet.email());
        await browser.writeInput("#contact-first-name", faker.name.firstName());
        await browser.writeInput("#contact-last-name", faker.name.lastName());
        await browser.click("#create-contact-submit");

        // TODO check network response status
      });
    });
  });
