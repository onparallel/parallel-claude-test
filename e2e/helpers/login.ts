import { Page } from "@playwright/test";
import { Login } from "../pages/Login";

export async function login(page: Page, { email, password }: { email: string; password: string }) {
  await page.goto(`${process.env.BASE_URL}/login`);
  const login = new Login(page);
  await login.fillLoginForm({ email, password });
  await login.submitLoginForm();
  await page.waitForURL(/\/app/);
}
