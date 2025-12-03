import { inject, injectable } from "inversify";
import { PetitionRepository } from "../db/repositories/PetitionRepository";
import { EMAILS, IEmailsService } from "../services/EmailsService";
import { createCronWorker, CronWorker } from "./helpers/createCronWorker";

@injectable()
export class ScheduledTriggerCronWorker extends CronWorker<"scheduled-trigger"> {
  constructor(
    @inject(PetitionRepository) private petitions: PetitionRepository,
    @inject(EMAILS) private emails: IEmailsService,
  ) {
    super();
  }

  async handler() {
    const messages = await this.petitions.processScheduledMessages();
    await Promise.all([
      this.emails.sendPetitionMessageEmail(messages.map((m) => m.id)),
      this.petitions.createEvent(
        messages.map((message) => ({
          type: "MESSAGE_SENT",
          data: { petition_message_id: message.id },
          petition_id: message.petition_id,
        })),
      ),
    ]);
  }
}

createCronWorker("scheduled-trigger", ScheduledTriggerCronWorker);
