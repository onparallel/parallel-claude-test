import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import { openEmail } from "../helpers/emails/openEmail";
import { waitForEmail } from "../helpers/emails/waitForEmail";
import { login } from "../helpers/login";
import { openTargetBlankLink } from "../helpers/openTargetBlankLink";
import { selectInSimpleSelect } from "../helpers/react-select/selectInSimpleSelect";
import { showCursor } from "../helpers/showCursor";
import { waitForGraphQL } from "../helpers/waitForGraphQL";
import { waitForRehydration } from "../helpers/waitForRehydration";
import { AppLayout } from "../layouts/AppLayout";
import { Login } from "../pages/Login";
import { NewPetition } from "../pages/NewPetition";
import { PetitionCompose } from "../pages/PetitionCompose";

test.beforeEach(async ({ page }) => {
  await showCursor(page);
  await login(page, {
    email: process.env.USER1_EMAIL,
    password: process.env.USER1_PASSWORD,
  });
  await page.goto(`${process.env.BASE_URL}/app/petitions/new`);
  await waitForRehydration(page);
});

test.describe("Full e2e share template", () => {
  test("should let you share a template", async ({ page, browser, context }) => {
    const newPetition = new NewPetition(page);

    const templateId = await test.step("Duplicate empty template", async () => {
      await newPetition.openMyTemplates();
      await newPetition.openTemplateModal(process.env.TEMPLATE1_ID);
      await newPetition.duplicateTemplate(process.env.TEMPLATE1_ID);
      await page.waitForURL("**/app/petitions/*/compose");
      await expect(page).toHaveTitle("Empty template (copy) - Template | Parallel");
      const currentUrl = page.url();
      const pathname = new URL(currentUrl).pathname.split("/");
      return pathname[pathname.length - 2];
    });

    const templateName = await test.step("Rename new template", async () => {
      const compose = new PetitionCompose(page);
      await page.locator('[data-testid="petition-name-preview"]').click();
      const input = compose.getPetitionNameInput();
      await input.click();
      await expect(input).toBeFocused();
      const templateName = `Template ${faker.random.alphaNumeric(16)}`;
      await input.fill(templateName);
      await input.blur();
      await expect(page).toHaveTitle(`${templateName} - Template | Parallel`);
      return templateName;
    });

    const shareTemplateMessage =
      await test.step("Share new template with user 2 - Write", async () => {
        await newPetition.goToNewPetition();
        await newPetition.openTemplateModal(templateId);
        const message = `I'm sharing this template ${faker.random.alphaNumeric(16)}`;
        await newPetition.shareTemplate(templateId, [process.env.USER2_EMAIL], message);
        await page.getByTestId("close-template-modal-button").click();
        return message;
      });

    const { page: user2Page } = await test.step("Open shared template email", async () => {
      const email = await waitForEmail(
        (e) =>
          e.subject === `User 1 has shared ${templateName} with you` &&
          e.to.some((c) => c.address === process.env.USER2_EMAIL),
        {
          user: process.env.IMAP_USER,
          password: process.env.IMAP_PASSWORD,
        }
      );
      return await openEmail(await browser.newContext(), email, async ({ page, context }) => {
        const text = page.getByTestId("shared-message");
        await expect(text).toContainText(shareTemplateMessage);
        return {
          page: await openTargetBlankLink(context, page.getByTestId("go-to-parallel-button")),
          context,
        };
      });
    });

    await test.step("Login as user2", async () => {
      await showCursor(user2Page);
      const login = new Login(user2Page);
      await login.fillLoginForm({
        email: process.env.USER2_EMAIL,
        password: process.env.USER2_PASSWORD,
      });
      await login.submitLoginForm();
      await waitForRehydration(user2Page);
      await user2Page.waitForURL("**/app/petitions/*/compose");
      await expect(user2Page).toHaveTitle(`${templateName} - Template | Parallel`);
    });

    await test.step("Check notifications of shared template", async () => {
      const layout = new AppLayout(user2Page);
      const drawer = await layout.openNotificationsDrawer();
      await expect(drawer).toHaveCount(1);
      const select = drawer.getByTestId("notifications-filter-select");
      await Promise.all([
        waitForGraphQL(user2Page, (o) => o.operationName === "NotificationsDrawer_notifications"),
        selectInSimpleSelect(user2Page, select, "SHARED"),
      ]);
      const notification = drawer
        .locator(`[data-notification-type="PetitionSharedUserNotification"]`)
        .filter({
          has: user2Page.getByTestId("notification-title").filter({ hasText: templateName }),
        });
      await expect(notification).toHaveCount(1);
      await layout.closeNotificationsDrawer();
    });

    await test.step("Delete current shared template", async () => {
      await newPetition.openTemplateModal(templateId);
      await newPetition.editTemplate(templateId);
      await page.waitForURL("**/app/petitions/*/compose");
      const compose2 = new PetitionCompose(page);
      await compose2.deletePetition();
    });
  });
});
