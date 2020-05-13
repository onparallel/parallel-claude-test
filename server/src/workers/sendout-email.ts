import { buildEmail } from "../emails/buildEmail";
import NewPetition from "../emails/components/NewPetition";
import { buildFrom } from "../emails/utils/buildFrom";
import { createQueueWorker } from "./helpers/createQueueWorker";

type SendoutEmailWorkerPayload = { petition_sendout_id: number };

createQueueWorker<SendoutEmailWorkerPayload>(
  "sendout-email",
  async (payload, context) => {
    const sendout = await context.petitions.loadSendout(
      payload.petition_sendout_id
    );
    if (!sendout) {
      throw new Error(
        `Sendout not found for id ${payload.petition_sendout_id}`
      );
    }
    const [sender, contact, fields] = await Promise.all([
      context.users.loadUser(sendout.sender_id),
      context.contacts.loadContact(sendout.contact_id),
      context.petitions.loadFieldsForPetition(sendout.petition_id),
    ]);
    if (!sender) {
      throw new Error(
        `User not found for petition_sendout.sender_id ${sendout.sender_id}`
      );
    }
    if (!contact) {
      throw new Error(
        `Contact not found for petition_sendout.contact_id ${sendout.contact_id}`
      );
    }
    const senderName = sender.last_name
      ? `${sender.first_name} ${sender.last_name}`
      : sender.first_name!;
    const { html, text, subject, from } = await buildEmail(
      NewPetition,
      {
        name: contact.first_name,
        senderName,
        senderEmail: sender.email,
        subject: sendout.email_subject,
        body: sendout.email_body ? JSON.parse(sendout.email_body) : [],
        fields: fields.map((f) => ({ id: f.id, title: f.title })),
        deadline: sendout.deadline,
        keycode: sendout.keycode,
        assetsUrl: context.config.misc.assetsUrl,
        parallelUrl: context.config.misc.parallelUrl,
      },
      { locale: sendout.locale }
    );
    const email = await context.emails.createEmail({
      from: buildFrom(from, context.config.misc.emailFrom),
      to: contact.email,
      subject,
      text,
      html,
      track_opens: true,
      created_from: `PetitionSendout:${payload.petition_sendout_id}`,
    });
    await context.petitions.updatePetitionSendout(
      payload.petition_sendout_id,
      {
        status: "ACTIVE",
        email_log_id: email.id,
      },
      sender
    );
    await context.aws.enqueueEmail(email.id);
  }
);
