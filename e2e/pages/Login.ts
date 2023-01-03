import { Page } from "@playwright/test";
import { PublicLayout } from "../layouts/PublicLayout";

export class Login extends PublicLayout {
  constructor(page: Page) {
    super(page);
  }

  async fillLoginForm({ email, password }: { email: string; password: string }) {
    await this.page.getByTestId("email-input").fill(email);
    await this.page.getByTestId("password-input").fill(password);
  }

  async submitLoginForm() {
    await this.page.getByTestId("login-submit").click();
  }
}
