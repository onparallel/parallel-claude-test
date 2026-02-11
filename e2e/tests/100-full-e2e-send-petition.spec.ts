import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import { createDataTransfer } from "../helpers/createDataTransfer";
import { openEmail } from "../helpers/emails/openEmail";
import { waitForEmail } from "../helpers/emails/waitForEmail";
import { login } from "../helpers/login";
import { openTargetBlankLink } from "../helpers/openTargetBlankLink";
import { showCursor } from "../helpers/showCursor";
import { waitForRehydration } from "../helpers/waitForRehydration";
import { NewPetition } from "../pages/NewPetition";
import { PetitionCompose } from "../pages/PetitionCompose";
import { PetitionReview } from "../pages/PetitionReview";
import { RecipientView } from "../pages/RecipientView";

test.beforeEach(async ({ page }) => {
  await showCursor(page);
  await login(page, {
    email: process.env.USER1_EMAIL,
    password: process.env.USER1_PASSWORD,
  });
  await page.goto(`${process.env.BASE_URL}/app/petitions/new`);
  await waitForRehydration(page);
});

test.describe("Full e2e send petition", () => {
  test("should let you create a petition", async ({ page, browser, context }) => {
    await test.step("create petition", async () => {
      const newPetition = new NewPetition(page);
      await newPetition.openMyTemplates();
      await newPetition.createPetition(process.env.TEMPLATE1_ID);
      await page.waitForURL("**/app/petitions/*/preview*");
      await expect(page).toHaveTitle("Unnamed parallel - Input | Parallel");
    });

    const compose = new PetitionCompose(page);
    const name = await test.step("name petition", async () => {
      const input = compose.getPetitionNameInput();
      await expect(input).toBeFocused();
      const name = `full e2e test ${faker.random.alphaNumeric(16)}`;
      await input.fill(name);
      await input.blur();
      await expect(page).toHaveTitle(`${name} - Input | Parallel`);
      return name;
    });

    await test.step("go to compose", async () => {
      await compose.goToSection("COMPOSE");
      await expect(page).toHaveTitle(`${name} - Compose | Parallel`);
      await compose.dismissEditParallelDialog();
    });

    await test.step("fill first header field", async () => {
      await compose.fillFieldParams(0, {
        title: "Hello",
        description: "Please fill the following information",
      });
    });

    await test.step("add a SHORT_TEXT field", async () => {
      await compose.addField("SHORT_TEXT");
      await compose.fillFieldParams(1, {
        title: "Name",
        description: "Please enter your name",
      });
    });

    await test.step("add a TEXT field", async () => {
      await compose.addField("TEXT");
      await compose.fillFieldParams(2, {
        title: "Address",
        description: "Please enter your address",
      });
    });

    await test.step("add a SELECT field", async () => {
      await compose.addField("SELECT");
      await compose.fillFieldParams(3, {
        title: "Favorite fruit",
        description: "Please enter your favorite fruit",
        options: ["Apple", "Banana", "Orange", "Pineapple", "Chicken", "Grapes", "Watermelon"],
      });
    });

    await test.step("add a NUMBER field", async () => {
      await compose.addField("NUMBER");
      await compose.fillFieldParams(4, {
        title: "Favorite number",
        description: "Please enter your favorite number",
      });
    });

    await test.step("add a CHECKBOX field", async () => {
      await compose.addField("CHECKBOX");
      await compose.fillFieldParams(5, {
        title: "Consoles",
        description: "Select which consoles you own",
        options: ["Xbox Series X|S", "PlayStation 5", "Nintendo Switch"],
      });
    });

    await test.step("add a SHORT_TEXT field with format", async () => {
      await compose.addField("SHORT_TEXT");
      await compose.fillFieldParams(6, {
        title: "Email",
        description: "Enter your email",
      });
      await compose.openFieldSettings(6);
      await compose.selectShortTextFormat("EMAIL");
    });

    await test.step("add a FILE_UPLOAD field", async () => {
      await compose.addField("FILE_UPLOAD");
      await compose.fillFieldParams(7, {
        title: "Photo",
        description: "Upload your photo",
      });
    });

    const { address, subject } = await test.step("send petition", async () => {
      await compose.openSendPetitionDialog();
      const address = process.env.USER1_EMAIL.replace(
        /(\+.*)?@.*$/,
        `+${faker.random.alphaNumeric(16)}@gmail.com`,
      );
      const subject = `Hello dummy ${faker.random.alphaNumeric(16)}`;
      await compose.fillSendPetitionDialog({
        recipients: [
          [
            {
              email: address,
              firstName: faker.person.firstName(),
              lastName: faker.person.lastName(),
            },
          ],
        ],
        subject,
        body: "Hello, please complete the following information!",
      });
      await compose.submitSendPetitionDialog();
      return { address, subject };
    });

    const { page: page2, context: _ } = await test.step("open recipient view", async () => {
      const email = await waitForEmail(
        (e) => e.subject === subject && e.to?.some((c) => c.address === address) === true,
        {
          user: process.env.IMAP_USER,
          password: process.env.IMAP_PASSWORD,
        },
      );
      return await openEmail(await browser.newContext(), email, async ({ page, context }) => {
        return {
          page: await openTargetBlankLink(context, page.getByTestId("complete-information-button")),
          context,
        };
      });
    });

    await test.step("check forward security on new context", async () => {
      const context = await browser.newContext();
      const page = await context.newPage();
      await page.goto(page2.url());
      await waitForRehydration(page2);
      await expect(page).toHaveTitle("Parallel e2e");
      const recipientView = new RecipientView(page);
      await page.getByTestId("send-verification-code-button").click();
      const email = await waitForEmail(
        (e) =>
          /^\d{6} is your verification code on Parallel/.test(e.subject ?? "") &&
          e.to?.some((c) => c.address === address) === true,
        {
          user: process.env.IMAP_USER,
          password: process.env.IMAP_PASSWORD,
        },
      );
      const code = await openEmail(await browser.newContext(), email, async ({ page }) => {
        return (await page.getByTestId("verification-code").textContent())!;
      });
      await recipientView.enterPinCode(code);
      await page.getByTestId("pin-input-verify-button").click();
      await page.waitForURL((url) => url.pathname.endsWith("/1"));
      await expect(page).toHaveTitle(`${subject} | Parallel e2e`);
      await page.close();
    });

    await test.step("fill recipient view", async () => {
      await waitForRehydration(page2);
      const recipientView = new RecipientView(page2);
      await recipientView.completeHelpDialog();

      await recipientView.replyShortTextField(0, "Bugs Bunny");
      await recipientView.replyTextField(1, "Carrer Almogavers 165\n08018 Barcelona");
      await recipientView.replySelectField(2, "Pineapple");
      await recipientView.replyNumberField(3, 3.14);
      await recipientView.replyCheckboxField(4, ["Xbox Series X|S", "Nintendo Switch"]);
      await recipientView.replyShortTextField(5, "elonmusk@onparallel.com");
      await recipientView.replyFileUploadField(
        6,
        await createDataTransfer(page2, {
          filePath: "../fixtures/0001.jpeg",
          fileType: "image/jpeg",
          fileName: "0001.jpeg",
        }),
      );
      await expect(page2.getByTestId("recipient-view-progress")).toHaveText("Progress 7/7");
      await recipientView.finalize();
    });

    const page3 = await test.step("wait for completed parallel email", async () => {
      const email = await waitForEmail(
        (e) =>
          e.subject === `${name} completed!` &&
          e.to?.some((c) => c.address === process.env.USER1_EMAIL) === true,
        {
          user: process.env.IMAP_USER,
          password: process.env.IMAP_PASSWORD,
        },
      );
      return await openEmail(context, email, async ({ page }) => {
        return await openTargetBlankLink(context, page.getByTestId("access-information-button"));
      });
    });

    await test.step("check review page", async () => {
      const review = new PetitionReview(page3);
      await expect(review.getPetitionStatus()).toHaveText("Completed");
    });
  });
});
