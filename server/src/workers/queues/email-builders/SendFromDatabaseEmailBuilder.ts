import { inject, injectable } from "inversify";
import { isNonNullish } from "remeda";
import { EmailLogRepository } from "../../../db/repositories/EmailLogRepository";
import { EmailBuilder } from "../EmailSenderQueue";

interface SendFromDatabaseEmailPayload {
  email_log_id: number[];
}

@injectable()
export class SendFromDatabaseEmailBuilder implements EmailBuilder<SendFromDatabaseEmailPayload> {
  constructor(@inject(EmailLogRepository) private emailLogs: EmailLogRepository) {}

  async build(payload: SendFromDatabaseEmailPayload) {
    const emails = await this.emailLogs.loadEmailLog(payload.email_log_id);
    return emails.filter(isNonNullish);
  }
}
