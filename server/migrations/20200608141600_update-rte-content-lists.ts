import * as Knex from "knex";

type Maybe<T> = T | null;

interface Petition {
  id: number;
  org_id: number;
  owner_id: number;
  name: Maybe<string>;
  custom_ref: Maybe<string>;
  locale: string;
  is_template: boolean;
  status: Maybe<"DRAFT" | "PENDING" | "COMPLETED">;
  deadline: Maybe<Date>;
  email_subject: Maybe<string>;
  email_body: Maybe<string>;
  reminders_active: boolean;
  created_at: Date;
  created_by: Maybe<string>;
  updated_at: Date;
  updated_by: Maybe<string>;
  deleted_at: Maybe<Date>;
  deleted_by: Maybe<string>;
  reminders_config: Maybe<any>;
}

interface PetitionMessage {
  id: number;
  petition_id: number;
  petition_access_id: number;
  sender_id: number;
  email_subject: Maybe<string>;
  email_body: Maybe<string>;
  status: "SCHEDULED" | "CANCELLED" | "PROCESSING" | "PROCESSED";
  scheduled_at: Maybe<Date>;
  email_log_id: Maybe<number>;
  created_at: Date;
  created_by: Maybe<string>;
}

export async function up(knex: Knex): Promise<any> {
  const { rows: petitions }: { rows: Petition[] } = await knex.raw(
    /* sql */ `select * from petition where email_body like '%list-item%'`
  );
  for (const petition of petitions) {
    if (petition.email_body) {
      await knex<Petition>("petition")
        .where("id", petition.id)
        .update({
          email_body: updateContent(petition.email_body),
        });
    }
  }
  const { rows: messages }: { rows: PetitionMessage[] } = await knex.raw(
    /* sql */ `select * from petition_message where email_body like '%list-item%'`
  );
  for (const message of messages) {
    if (message.email_body) {
      await knex<PetitionMessage>("petition_message")
        .where("id", message.id)
        .update({
          email_body: updateContent(message.email_body),
        });
    }
  }
}

export async function down(knex: Knex): Promise<any> {}

function updateContent(value: string) {
  const content = JSON.parse(value);
  const updated = content.map((node: any) => {
    if (node.type === "bulleted-list" || node.type === "numbered-list") {
      return {
        ...node,
        children: node.children.map((child: any) => ({
          ...child,
          children: [{ type: "paragraph", children: child.children }],
        })),
      };
    } else {
      return node;
    }
  });
  return JSON.stringify(updated);
}
