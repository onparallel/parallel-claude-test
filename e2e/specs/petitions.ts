import { JSDOM } from "jsdom";
import { addPetitionField, fillPetitionField, getFields } from "../helpers/compose";
import { createRandomContact } from "../helpers/contacts";
import { createContact } from "../helpers/contactSelect";
import { createPetition } from "../helpers/createPetition";
import { createTestSession } from "../helpers/createTestSession";
import { waitForInbox } from "../helpers/emails";
import { goTo } from "../helpers/goTo";
import { waitForGraphQL } from "../helpers/graphql";
import { login } from "../helpers/login";
import { skipOnboarding } from "../helpers/skipOnboarding";
import { user1 } from "../helpers/users";

createTestSession("petitions", (context) => {
  it("should create and send a petition with fields", async () => {
    const { page, browserContext } = context;
    await login(page, user1);
    expect(page.url()).toMatch(/\/app\/petitions$/);
    await skipOnboarding(page);

    // Create a petition with 5 fields
    await createPetition(page);
    await skipOnboarding(page);
    expect(page.url()).toMatch(/\/compose$/);

    await addPetitionField(page, "SELECT");
    await addPetitionField(page, "TEXT");
    await addPetitionField(page, "FILE_UPLOAD");
    const fields = await getFields(page);
    // by default the petition is created with 2 fields
    expect(fields.length).toBe(5);

    await fillPetitionField(page, fields[0], {
      title: "Welcome",
      description: "Fill the following fields",
    });
    await fillPetitionField(page, fields[1], {
      title: "What's your name?",
      description: "Your real name, please",
    });
    await fillPetitionField(page, fields[2], {
      title: "Where are you from?",
      description: "Select a country from the following list",
      values: ["Spain", "France", "Germany"],
    });
    await fillPetitionField(page, fields[3], {
      title: "Explain a bit about yourself",
    });
    await fillPetitionField(page, fields[4], {
      title: "A photo of you",
      description: "Your face must be perfectly visible.",
    });

    // Fill email details
    const recipient = createRandomContact();
    await page.click("#petition-next");
    await page.waitForSelector("#chakra-modal-send-petition-dialog");

    await createContact(page, "#petition-recipients-0", recipient);

    await page.fill(
      "#input-message-email-editor-subject",
      `KYC - ${recipient.firstName} ${recipient.lastName}`
    );
    await page.type(
      "#petition-message-body",
      "Please, fill this information about yourself.\nKind Regards."
    );

    await waitForGraphQL(page, (o) => o.operationName === "PetitionCompose_updatePetition");
    await page.click("#send-button");
    await page.waitForNavigation();
    expect(page.url()).toMatch(/\/app\/petitions$/);

    // Wait for the email
    const inbox = await waitForInbox(recipient.email);
    expect(inbox.result).toBe("success");
    const dom = new JSDOM(inbox.emails[0].html);
    const button = [...dom.window.document.querySelectorAll("a")].find(
      (button) => button.textContent === "Complete the information here"
    );
    const petitionUrl = button.getAttribute("href");

    const page2 = await browserContext.newPage();
    await goTo(page2, petitionUrl);
    expect(await page2.title()).toBe("Welcome | Parallel");
  });
});
