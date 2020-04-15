import { createQueueWorker } from "./helpers/createQueueWorker";
import { buildEmail } from "../emails/buildEmail";
import NewPetition from "../emails/components/NewPetition";

type SendoutEmailWorkerPayload = { petition_sendout_id: number };

const worker = createQueueWorker(
  "sendout-email",
  async ({ petition_sendout_id }: SendoutEmailWorkerPayload, context) => {
    const sendout = await context.petitions.loadSendout(petition_sendout_id);
    if (!sendout) {
      throw new Error(`Sendout not found for id ${petition_sendout_id}`);
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
    if (!fields) {
      throw new Error(
        `Fields not found for petition_sendout.petition_id ${sendout.petition_id}`
      );
    }
    const senderName = sender.last_name
      ? `${sender.first_name} ${sender.last_name}`
      : sender.first_name!;
    const { html, text } = await buildEmail(
      NewPetition,
      {
        name: contact.first_name,
        senderName,
        senderEmail: sender.email,
        body: sendout.email_body ? JSON.parse(sendout.email_body) : [],
        fields: fields.map((f) => ({ id: f.id, title: f.title })),
        deadline: sendout.deadline,
        keycode: sendout.keycode,
        assetsUrl: context.config.misc.assetsUrl,
        parallelUrl: context.config.misc.parallelUrl,
      },
      { locale: sendout.locale }
    );
    const from = context.config.misc.emailFrom;
    const email = await context.emails.createEmail({
      from: `"${senderName.replace(/"/g, '"')}" <${from}>`,
      to: contact.email,
      subject: sendout.email_subject ?? "",
      text,
      html,
      track_opens: true,
      created_from: `PetitionSendout:${petition_sendout_id}`,
    });
    await context.petitions.updatePetitionSendout(
      petition_sendout_id,
      {
        status: "ACTIVE",
        email_log_id: email.id,
      },
      sender
    );
    await context.aws.enqueueEmail(email.id);
  }
);

worker.start();
