import { addDays, addHours, addMinutes } from "date-fns";
import { format, toDate, utcToZonedTime } from "date-fns-tz";
import { Knex } from "knex";
import { USER_COGNITO_ID } from "../../../test/mocks";
import { createTestContainer } from "../../../test/testContainer";
import { ApiContext } from "../../context";
import { KNEX } from "../../db/knex";
import { Mocks } from "../../db/repositories/__tests__/mocks";
import { Contact, Organization, Petition, User } from "../../db/__types";
import { deleteAllData } from "../../util/knexUtils";
import { presendPetition } from "./../../graphql/helpers/presendPetition";

describe("presendPetition", () => {
  let mocks: Mocks;
  let knex: Knex;
  let apiContext: ApiContext;

  let user: User;
  let organization: Organization;
  let petitions: Petition[];
  let contacts: Contact[];
  let contactIds: number[];

  beforeAll(async () => {
    const container = createTestContainer();
    knex = container.get<Knex>(KNEX);
    mocks = new Mocks(knex);
    apiContext = container.get<ApiContext>(ApiContext);

    await deleteAllData(knex);

    [organization] = await mocks.createRandomOrganizations(1, () => ({
      name: "Parallel",
      status: "DEV",
    }));

    [user] = await mocks.createRandomUsers(organization.id, 1, () => ({
      cognito_id: USER_COGNITO_ID,
      first_name: "Harvey",
      last_name: "Specter",
    }));

    contacts = await mocks.createRandomContacts(organization.id, 21);
    contactIds = contacts.map((c) => c.id);

    petitions = await mocks.createRandomPetitions(organization.id, user.id, 21);
  });

  afterAll(async () => {
    await knex.destroy();
  });

  beforeEach(async () => {
    // truncate tables to reuse petitions and avoid insert conflicts
    await knex.from("petition_message").delete();
    await knex.from("petition_access").delete();
  });

  it("creates accesses and messages for a simple petition send with a few contacts", async () => {
    const petition = petitions[0];
    const results = await presendPetition(
      [[petition, [contactIds[0], contactIds[1]]]],
      { body: [], subject: "test" },
      user,
      false,
      apiContext
    );

    expect(results).toHaveLength(1);
    const [{ error, result, messages, accesses }] = results;

    expect(error).toBeUndefined();
    expect(result).toEqual("SUCCESS");
    expect(messages).toHaveLength(2);
    expect(accesses).toHaveLength(2);
    expect(accesses).toMatchObject([
      {
        contact_id: contactIds[0],
        granter_id: user.id,
        next_reminder_at: null,
        petition_id: petition.id,
        reminders_active: false,
        reminders_config: null,
      },
      {
        contact_id: contactIds[1],
        granter_id: user.id,
        next_reminder_at: null,
        petition_id: petition.id,
        reminders_active: false,
        reminders_config: null,
      },
    ]);

    expect(messages).toMatchObject([
      {
        petition_access_id: accesses?.[0].id,
        scheduled_at: null,
        sender_id: user.id,
        status: "PROCESSING",
        petition_id: petition.id,
        email_subject: "test",
        email_body: "[]",
      },
      {
        petition_access_id: accesses?.[1].id,
        scheduled_at: null,
        sender_id: user.id,
        status: "PROCESSING",
        petition_id: petition.id,
        email_subject: "test",
        email_body: "[]",
      },
    ]);
  });

  it("schedule a simple petition send with configured reminders", async () => {
    const petition = petitions[0];
    const results = await presendPetition(
      [[petition, [contactIds[0]]]],
      {
        scheduledAt: new Date(2021, 8, 3), // 03/09/2021 (month starts at 0)
        remindersConfig: {
          offset: 2,
          time: "11:45",
          weekdaysOnly: false,
          timezone: "Europe/Madrid",
        },
        body: [],
        subject: "test",
      },
      user,
      true,
      apiContext
    );

    expect(results).toHaveLength(1);
    const [{ error, result, messages, accesses }] = results;

    expect(error).toBeUndefined();
    expect(result).toEqual("SUCCESS");
    expect(accesses).toHaveLength(1);
    expect(messages).toHaveLength(1);
    expect(accesses).toMatchObject([
      {
        petition_id: petition.id,
        contact_id: contactIds[0],
        next_reminder_at: toDate("2021-09-05T11:45:00", {
          timeZone: "Europe/Madrid",
        }),

        reminders_active: true,
        reminders_left: 10,
        reminders_config: {
          offset: 2,
          time: "11:45",
          weekdaysOnly: false,
          timezone: "Europe/Madrid",
        },
      },
    ]);

    expect(messages).toMatchObject([
      {
        petition_access_id: accesses?.[0].id,
        sender_id: user.id,
        status: "SCHEDULED",
        scheduled_at: new Date(2021, 8, 3),
      },
    ]);
  });

  it("considers deferred sends when setting next reminder date on massive sends with reminders enabled", async () => {
    const morePetitions = await mocks.createRandomPetitions(organization.id, user.id, 300);
    const now = new Date(2021, 10, 5);
    const results = await presendPetition(
      // massive send of 300 different petitions to 1 contact each
      morePetitions.map((petition) => [petition, [contactIds[0]]]),
      {
        body: [],
        subject: "test",
        remindersConfig: {
          offset: 1,
          time: "08:30",
          weekdaysOnly: false,
          timezone: "Europe/Madrid",
        },
        scheduledAt: null,
      },
      user,
      false,
      apiContext,
      now
    );

    expect(results).toHaveLength(morePetitions.length);
    expect(results.every((r) => r.error === undefined)).toEqual(true);
    expect(results.every((r) => r.result === "SUCCESS")).toEqual(true);
    expect(results.flatMap((r) => r.messages)).toHaveLength(morePetitions.length);
    expect(results.flatMap((r) => r.accesses)).toHaveLength(morePetitions.length);
    expect(results.flatMap((r) => r.messages)).toMatchObject(
      morePetitions.map((p, i) => ({
        petition_id: p.id,
        status: i < 20 ? "PROCESSING" : "SCHEDULED",
        scheduled_at: i < 20 ? null : addMinutes(now, 5 * Math.floor(i / 20)),
      }))
    );

    expect(results.flatMap((r) => r.accesses)).toMatchObject(
      morePetitions.map((p, index) => ({
        contact_id: contactIds[0],
        petition_id: p.id,
        reminders_active: true,
        next_reminder_at: toDate(
          `${format(
            addDays(
              now,
              // reminders offset + extra day if the message is scheduled to be sent 24 hours later
              1 + Math.floor(index / (24 * 60))
            ),
            "yyyy-MM-dd"
          )}T08:30:00`,
          {
            timeZone: "Europe/Madrid",
          }
        ),
      }))
    );
  });

  it("does not distribute send times for a single group with more than 20 contacts", async () => {
    const now = new Date(2021, 10, 6);
    const results = await presendPetition(
      // send of 1 petition to 21 contact
      [[petitions[0], contactIds]],
      { body: [], subject: "test" },
      user,
      false,
      apiContext,
      now
    );

    expect(results).toHaveLength(1);
    const [{ error, result, messages, accesses }] = results;

    expect(error).toBeUndefined();
    expect(result).toEqual("SUCCESS");
    expect(messages).toHaveLength(21);
    expect(accesses).toHaveLength(21);
    expect(messages).toMatchObject(
      contactIds.map(() => ({
        petition_id: petitions[0].id,
        scheduled_at: null,
        status: "PROCESSING",
      }))
    );
    expect(accesses).toMatchObject(
      contactIds.map((id) => ({
        contact_id: id,
        granter_id: user.id,
        next_reminder_at: null,
        reminders_active: false,
        status: "ACTIVE",
      }))
    );
  });

  it("uses scheduled time as base for distributing sends when scheduledAt arg is defined", async () => {
    const scheduledAt = new Date(2021, 11, 5);

    const results = await presendPetition(
      // massive send of 21 different petitions with 1 contact each
      petitions.map((petition, index) => [petition, [contactIds[index]]]),
      {
        body: [],
        subject: "test",
        scheduledAt,
      },
      user,
      false,
      apiContext
    );

    expect(results).toHaveLength(petitions.length);
    expect(results.every((r) => r.error === undefined)).toEqual(true);
    expect(results.every((r) => r.result === "SUCCESS")).toEqual(true);
    expect(results.flatMap((r) => r.messages)).toMatchObject([
      ...petitions.slice(0, 20).map((p) => ({
        petition_id: p.id,
        status: "SCHEDULED",
        scheduled_at: scheduledAt,
      })),
      // last message is scheduled to be sent 5 minutes later
      {
        petition_id: petitions[20].id,
        status: "SCHEDULED",
        scheduled_at: addMinutes(scheduledAt, 5),
      },
    ]);

    expect(results.flatMap((r) => r.accesses)).toMatchObject(
      petitions.map((p, index) => ({
        contact_id: contactIds[index],
        petition_id: p.id,
        reminders_active: false,
        next_reminder_at: null,
      }))
    );
  });

  it("distribute send times when doing a massive send of 20 or more petitions with any amount of contacts each", async () => {
    const now = new Date(2021, 10, 6);
    const results = await presendPetition(
      // massive send of 21 different petitions with 21 contacts each
      petitions.map((petition) => [petition, contactIds]),
      {
        body: [],
        subject: "test",
      },
      user,
      false,
      apiContext,
      now
    );

    expect(results).toHaveLength(petitions.length);
    expect(results.every((r) => r.error === undefined)).toEqual(true);
    expect(results.every((r) => r.result === "SUCCESS")).toEqual(true);
    expect(results.flatMap((r) => r.messages)).toHaveLength(petitions.length * contactIds.length);
    expect(results.flatMap((r) => r.accesses)).toHaveLength(petitions.length * contactIds.length);

    expect(results.map((r) => r.messages)).toMatchObject(
      petitions.map((p, i) =>
        contactIds.map(() => ({
          petition_id: p.id,
          status: i === 0 ? "PROCESSING" : "SCHEDULED",
          scheduled_at: i === 0 ? null : addMinutes(now, 5 * i),
        }))
      )
    );

    expect(results.map((r) => r.accesses)).toMatchObject(
      petitions.map((p) =>
        contactIds.map((contactId) => ({
          contact_id: contactId,
          petition_id: p.id,
          reminders_active: false,
          next_reminder_at: null,
        }))
      )
    );
  });
});
