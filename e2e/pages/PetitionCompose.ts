import { Page } from "@playwright/test";
import { PetitionLayout } from "../layouts/PetitionLayout";

export class PetitionCompose extends PetitionLayout {
  constructor(page: Page) {
    super(page);
  }
}
