import { test, expect } from "@playwright/test";
import { Login } from "../pages/Login";

test("should login", async ({ page }) => {
  await page.goto(`${process.env.BASE_URL}/login`);
  const login = new Login(page);
  await expect(page).toHaveTitle("Login | Parallel");
  await login.fillLoginForm({
    email: process.env.USER1_EMAIL,
    password: process.env.USER1_PASSWORD,
  });
  await login.submitLoginForm();
  await page.waitForURL(/\/app/);
  await expect(page).toHaveTitle("Choose organization | Parallel");
});
