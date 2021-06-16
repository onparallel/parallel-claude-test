import {
  addPetitionField,
  fillPetitionField,
  getFields,
} from "../helpers/compose";
import { createPetition } from "../helpers/createPetition";
import { createTestSession } from "../helpers/createTestSession";
import { login } from "../helpers/login";
import { skipOnboarding } from "../helpers/skipOnboarding";
import { user1 } from "../helpers/users";

createTestSession("petitions", (context) => {
  it("should create a petition", async () => {
    const { page } = context;
    await login(page, user1);
    await skipOnboarding(page);

    await createPetition(page);
    await skipOnboarding(page);

    expect(page.url()).toMatch(/\/compose$/);

    await addPetitionField(page, "SELECT");
    await addPetitionField(page, "TEXT");
    await addPetitionField(page, "FILE_UPLOAD");

    const fields = await getFields(page);

    await fillPetitionField(fields[0], {
      title: "Welcome",
      description: "Fill the following fields",
    });
    await fillPetitionField(fields[1], {
      title: "What's your name?",
      description: "Your real name, please",
    });
    await fillPetitionField(fields[2], {
      title: "Where are you from?",
      description: "Select a country from the following list",
      values: ["Spain", "France", "Germany"],
    });
    await fillPetitionField(fields[3], {
      title: "Explain a bit about yourself",
    });
    await fillPetitionField(fields[4], {
      title: "A photo of you",
      description: "Your face must be perfectly visible.",
    });
  });
});
