import { Page } from "@playwright/test";
import { AppLayout } from "./AppLayout";

export class SettingsLayout extends AppLayout {
  constructor(page: Page) {
    super(page);
  }
}
