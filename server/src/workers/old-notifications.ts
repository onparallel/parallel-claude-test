import { inject, injectable } from "inversify";
import { PetitionRepository } from "../db/repositories/PetitionRepository";
import { createCronWorker, CronWorker } from "./helpers/createCronWorker";

@injectable()
export class OldNotificationsCronWorker extends CronWorker<"old-notifications"> {
  constructor(@inject(PetitionRepository) private petitions: PetitionRepository) {
    super();
  }

  async handler() {
    // mark as read every unread user notifications that was created more than 1 months ago
    await this.petitions.markOldPetitionUserNotificationsAsRead(1);

    // delete notifications that were created more than 6 months ago
    await this.petitions.deleteOldPetitionUserNotifications(6);
  }
}

createCronWorker("old-notifications", OldNotificationsCronWorker);
