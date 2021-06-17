import {
  addPetitionField,
  fillPetitionField,
  getFields,
} from "../helpers/compose";
import { createPetition } from "../helpers/createPetition";
import { createTestSession } from "../helpers/createTestSession";
import { Recipient, waitForEmailReceipt } from "../helpers/emails";
import { login } from "../helpers/login";
import { sendPetition } from "../helpers/sendPetition";
import { skipOnboarding } from "../helpers/skipOnboarding";
import { user1 } from "../helpers/users";

createTestSession("petitions", (context) => {
  describe("Sending a simple petition to a new recipient", () => {
    let recipient: Recipient;
    it("should login", async () => {
      await login(context.page, user1);
      expect(context.page.url()).toMatch(/\/app\/petitions$/);
    });

    it("should create a petition", async () => {
      await skipOnboarding(context.page);
      await createPetition(context.page);
      await skipOnboarding(context.page);
      expect(context.page.url()).toMatch(/\/compose$/);
    });

    it("should add fields to the petition", async () => {
      await addPetitionField(context.page, "SELECT");
      await addPetitionField(context.page, "TEXT");
      await addPetitionField(context.page, "FILE_UPLOAD");
      const fields = await getFields(context.page);
      // by default the petition is created with 2 fields
      expect(fields.length).toBe(5);
    });

    it("should fill the petition fields", async () => {
      const fields = await getFields(context.page);
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

    it("should send the petition", async () => {
      recipient = await sendPetition(context.page);
      expect(context.page.url()).toMatch(/\/app\/petitions$/);
    });

    it(
      "recipient should receive an email with an access to the petition",
      async () => {
        const email = await waitForEmailReceipt(recipient.emailTag);
        expect(email.result).toBe("success");
      },
      1000 * 60 // 1 min timeout
    );
  });
});
