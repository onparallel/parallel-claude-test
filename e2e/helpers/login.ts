import { Page } from "@playwright/test";
import { Login } from "../pages/Login";
import { waitForRehydration } from "./waitForRehydration";

export async function login(page: Page, { email, password }: { email: string; password: string }) {
  await page.goto(`${process.env.BASE_URL}/login`);
  await waitForRehydration(page);
  const login = new Login(page);
  await login.fillLoginForm({ email, password });
  await Promise.all([page.waitForURL(/\/app\/petitions/), login.submitLoginForm()]);
}
