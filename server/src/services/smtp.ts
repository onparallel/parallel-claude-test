import { inject, injectable } from "inversify";
import { Config, CONFIG } from "../config";
import { createTransport } from "nodemailer";

type Mail = ReturnType<typeof createTransport>;
type MailOptions = Pick<
  Parameters<Mail["sendMail"]>[0],
  | "from"
  | "to"
  | "subject"
  | "html"
  | "text"
  | "headers"
  | "attachments"
  | "replyTo"
>;

@injectable()
export class Smtp {
  private readonly transport: Mail;

  constructor(@inject(CONFIG) config: Config) {
    const { host, port, user, password } = config.smtp;
    this.transport = createTransport({
      host,
      port,
      secure: true,
      auth: { user, pass: password },
    });
  }

  async sendEmail(mailOptions: MailOptions) {
    return await this.transport.sendMail(mailOptions);
  }
}
