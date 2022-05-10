import { inject, injectable } from "inversify";
import { createTransport, SentMessageInfo, Transporter } from "nodemailer";
import { Config, CONFIG } from "../config";

type MailOptions = Pick<
  Parameters<Transporter<SentMessageInfo>["sendMail"]>[0],
  "from" | "to" | "subject" | "html" | "text" | "headers" | "attachments" | "replyTo"
>;

export interface ISmtp {
  sendEmail(mailOptions: MailOptions): Promise<any>;
}

export const SMTP = Symbol.for("SMTP");

@injectable()
export class Smtp implements ISmtp {
  private readonly transport: Transporter<SentMessageInfo>;

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
