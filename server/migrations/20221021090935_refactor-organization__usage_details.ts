import { Duration } from "date-fns";
import { Knex } from "knex";
import { isDefined } from "remeda";

import { OrganizationUsageDetails } from "../src/db/repositories/OrganizationRepository";

function stringToISODuration(value: string) {
  const REGEXP = new RegExp(/(\d*) (years|year|months|month|days|day)/g);
  let i = 0;
  const duration: Duration = {};
  while (i < 10) {
    const match = REGEXP.exec(value);

    if (match === null) break;
    const key = (match[2].endsWith("s") ? match[2] : `${match[2]}s`) as keyof Duration;
    duration[key] = parseInt(match[1]);
    i++;
  }

  return (
    "P" +
    [
      duration.years ? `${duration.years}Y` : null,
      duration.months ? `${duration.months}M` : null,
      duration.days ? `${duration.days}D` : null,
    ]
      .filter(isDefined)
      .join("")
  );
}

function isoDurationToString(duration: string) {
  // only the part of year, month, day
  const REGEXP = new RegExp(
    /P(?:([\d]+\.?[\d]*|\.[\d]+)Y)?(?:([\d]+\.?[\d]*|\.[\d]+)M)?(?:([\d]+\.?[\d]*|\.[\d]+)D)?/g
  );

  const match = REGEXP.exec(duration);
  if (match === null) throw new Error("expected match: " + duration);
  const [, years, months, days] = match;

  return [
    years ? `${years} years` : null,
    months ? `${months} months` : null,
    days ? `${days} days` : null,
  ]
    .filter(isDefined)
    .join(" ");
}

export async function up(knex: Knex): Promise<void> {
  const data = await knex.raw<{ rows: { id: number; usage_details: OrganizationUsageDetails }[] }>(
    /* sql */ `select id, usage_details from "organization"`
  );

  if (data.rows.length > 0) {
    const newData = data.rows.map((d) => {
      const updated = {
        id: d.id,
        usage_details: {
          ...d.usage_details,
          PETITION_SEND: {
            ...d.usage_details.PETITION_SEND,
            duration: stringToISODuration((d.usage_details.PETITION_SEND as any).period),
          },
        },
      };
      if (d.usage_details.SIGNATURIT_SHARED_APIKEY) {
        updated.usage_details.SIGNATURIT_SHARED_APIKEY = {
          ...d.usage_details.SIGNATURIT_SHARED_APIKEY,
          duration: stringToISODuration((d.usage_details.SIGNATURIT_SHARED_APIKEY as any).period),
        };
      }

      return updated;
    });

    await knex.raw(
      /* sql */ `
    with rows_to_update(org_id, details) 
    as (values ${newData.map(() => "(?::int, ?::jsonb)").join(", ")})
    update "organization" o set usage_details = r.details
    from "rows_to_update" r where r.org_id = o.id;
  `,
      newData.flatMap((d) => [d.id, d.usage_details])
    );
  }
}

export async function down(knex: Knex): Promise<void> {
  const data = await knex.raw<{ rows: { id: number; usage_details: OrganizationUsageDetails }[] }>(
    /* sql */ `select id, usage_details from "organization"`
  );

  if (data.rows.length > 0) {
    const newData = data.rows.map((d) => {
      const updated = {
        id: d.id,
        usage_details: {
          ...d.usage_details,
          PETITION_SEND: {
            ...d.usage_details.PETITION_SEND,
            period: isoDurationToString(d.usage_details.PETITION_SEND.duration),
          },
        },
      };
      if (d.usage_details.SIGNATURIT_SHARED_APIKEY) {
        updated.usage_details.SIGNATURIT_SHARED_APIKEY = {
          ...d.usage_details.SIGNATURIT_SHARED_APIKEY,
          period: isoDurationToString(d.usage_details.SIGNATURIT_SHARED_APIKEY.duration),
        } as any;
      }

      return updated;
    });

    await knex.raw(
      /* sql */ `
    with rows_to_update(org_id, details) 
    as (values ${newData.map(() => "(?::int, ?::jsonb)").join(", ")})
    update "organization" o set usage_details = r.details
    from "rows_to_update" r where r.org_id = o.id;
  `,
      newData.flatMap((d) => [d.id, d.usage_details])
    );
  }
}
