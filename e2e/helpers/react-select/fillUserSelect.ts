import { Locator, Page } from "@playwright/test";
import { waitForSelectLoading } from "./waitForSelectLoading";

type UserOrGroup = string | { type: "User"; email: string } | { type: "UserGroup"; name: string };

export async function fillUserSelect(page: Page, select: Locator, usersOrGroups: UserOrGroup[]) {
  await select.click();
  const input = select.locator("input");
  const controls = await input.getAttribute("aria-controls");
  const menu = page.locator(`#${controls}`);
  for (const userOrGroup of usersOrGroups) {
    if (typeof userOrGroup === "string" || userOrGroup.type === "User") {
      const email = typeof userOrGroup === "string" ? userOrGroup : userOrGroup.email;
      await input.type(email);
      await waitForSelectLoading(page, select);
      const option = menu.locator(`[data-option-type="User"][data-email="${email}"]`);
      if ((await option.count()) === 1) {
        option.click();
      }
    } else {
      const name = userOrGroup.name;
      await input.type(name);
      await waitForSelectLoading(page, select);
      const option = menu.locator(`[data-option-type="UserGroup"][data-name="${name}"]`);
      if ((await option.count()) === 1) {
        option.click();
      }
    }
  }
}
