import { subMinutes } from "date-fns";
import { toDate } from "date-fns-tz";
import { calculateNextReminder } from "../reminderUtils";

describe("reminderUtils", () => {
  it("calculateNextReminder with round date", () => {
    const nextReminder = calculateNextReminder(new Date("2021-11-15"), {
      offset: 2,
      time: "10:45",
      timezone: "Europe/Madrid",
      weekdaysOnly: false,
    });

    expect(nextReminder).toEqual(toDate(`2021-11-17T10:45:00`, { timeZone: "Europe/Madrid" }));
  });

  it("calculateNextReminder with date and time", () => {
    const nextReminder = calculateNextReminder(new Date("2021-10-15T23:50"), {
      offset: 1,
      time: "12:00",
      timezone: "America/Argentina/Buenos_Aires",
      weekdaysOnly: false,
    });

    expect(nextReminder).toEqual(
      toDate(`2021-10-16T12:00:00`, { timeZone: "America/Argentina/Buenos_Aires" })
    );
  });

  it("calculateNextReminder with long offset", () => {
    const nextReminder = calculateNextReminder(new Date("2021-04-01"), {
      offset: 6,
      time: "00:00",
      timezone: "Europe/Madrid",
      weekdaysOnly: false,
    });

    expect(nextReminder).toEqual(toDate(`2021-04-07T00:00:00`, { timeZone: "Europe/Madrid" }));
  });

  it("calculateNextReminder first minute of the day", () => {
    const nextReminder = calculateNextReminder(new Date("2021-10-15T00:01"), {
      offset: 1,
      time: "00:00",
      timezone: "Singapore",
      weekdaysOnly: false,
    });

    expect(nextReminder).toEqual(toDate("2021-10-16T00:00:00", { timeZone: "Singapore" }));
  });

  it("calculateNextReminder last minute of the day", () => {
    const nextReminder = calculateNextReminder(new Date("2019-12-31T23:59"), {
      offset: 1,
      time: "00:00",
      timezone: "Europe/Madrid",
      weekdaysOnly: false,
    });
    expect(nextReminder).toEqual(toDate(`2020-01-01T00:00:00`, { timeZone: "Europe/Madrid" }));
  });

  it("calculateNextReminder weekDaysOnly", () => {
    const nextReminder = calculateNextReminder(new Date("2021-10-15"), {
      offset: 2,
      time: "23:50",
      timezone: "Portugal",
      weekdaysOnly: true,
    });

    expect(nextReminder).toEqual(toDate(`2021-10-18T23:50:00`, { timeZone: "Portugal" }));
  });
});
