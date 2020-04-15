import { createQueueWorker } from "./helpers/createQueueWorker";
import { buildEmail } from "../emails/buildEmail";
import PetitionCompleted from "../emails/components/PetitionCompleted";
import { toGlobalId } from "../util/globalId";

type SendoutWorkerPayload = { petition_sendout_id: number };

const worker = createQueueWorker(
  "completed-email",
  async ({ petition_sendout_id }: SendoutWorkerPayload, context) => {
    const sendout = await context.petitions.loadSendout(petition_sendout_id);
    if (!sendout) {
      throw new Error(`Sendout not found for id ${petition_sendout_id}`);
    }
    const [petition, sender, contact, fields] = await Promise.all([
      context.petitions.loadPetition(sendout.petition_id),
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
    const recipientNameOrEmail =
      (contact.first_name && contact.last_name
        ? `${contact.first_name} ${contact.last_name}`
        : contact.first_name!) || contact.email;
    const { html, text, subject } = await buildEmail(
      PetitionCompleted,
      {
        name: sender.first_name,
        petitionId: toGlobalId("Petition", sendout.petition_id),
        petitionName: petition!.name,
        recipientNameOrEmail,
        fields: fields.map((f) => ({ id: f.id, title: f.title })),
        assetsUrl: context.config.misc.assetsUrl,
        parallelUrl: context.config.misc.parallelUrl,
      },
      { locale: sendout.locale }
    );
    const from = context.config.misc.emailFrom;
    const email = await context.emails.createEmail({
      from: `Parallel <${from}>`,
      to: sender.email,
      subject: subject!,
      text,
      html,
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
