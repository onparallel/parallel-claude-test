import { toDate } from "date-fns-tz";
import { calculateNextReminder } from "../reminderUtils";

describe("reminderUtils", () => {
  it("calculateNextReminder with round date", () => {
    const fromDate = toDate(`2021-11-15T00:00:00`, { timeZone: "Europe/Madrid" });
    expect(fromDate.toISOString()).toEqual("2021-11-14T23:00:00.000Z");
    const nextReminder = calculateNextReminder(fromDate, {
      offset: 2,
      time: "10:45",
      timezone: "Europe/Madrid",
      weekdaysOnly: false,
    });

    expect(nextReminder).toEqual(toDate(`2021-11-17T10:45:00`, { timeZone: "Europe/Madrid" }));
    expect(nextReminder.toISOString()).toEqual("2021-11-17T09:45:00.000Z");
  });

  it("calculateNextReminder with date and time", () => {
    const fromDate = toDate("2021-10-15T23:50:00", { timeZone: "America/Argentina/Buenos_Aires" });
    expect(fromDate.toISOString()).toEqual("2021-10-16T02:50:00.000Z");
    const nextReminder = calculateNextReminder(fromDate, {
      offset: 1,
      time: "12:00",
      timezone: "America/Argentina/Buenos_Aires",
      weekdaysOnly: false,
    });

    expect(nextReminder).toEqual(
      toDate(`2021-10-16T12:00:00`, { timeZone: "America/Argentina/Buenos_Aires" }),
    );
    expect(nextReminder.toISOString()).toEqual("2021-10-16T15:00:00.000Z");
  });

  it("calculateNextReminder with long offset", () => {
    const fromDate = toDate("2021-04-01T00:00:00", { timeZone: "Europe/Madrid" });
    expect(fromDate.toISOString()).toEqual("2021-03-31T22:00:00.000Z");
    const nextReminder = calculateNextReminder(fromDate, {
      offset: 6,
      time: "00:00",
      timezone: "Europe/Madrid",
      weekdaysOnly: false,
    });

    expect(nextReminder).toEqual(toDate(`2021-04-07T00:00:00`, { timeZone: "Europe/Madrid" }));
    expect(nextReminder.toISOString()).toEqual("2021-04-06T22:00:00.000Z");
  });

  it("calculateNextReminder first minute of the day", () => {
    const fromDate = toDate("2021-10-15T00:01:00", { timeZone: "Singapore" });
    expect(fromDate.toISOString()).toEqual("2021-10-14T16:01:00.000Z");

    const nextReminder = calculateNextReminder(fromDate, {
      offset: 1,
      time: "00:00",
      timezone: "Singapore",
      weekdaysOnly: false,
    });

    expect(nextReminder).toEqual(toDate("2021-10-16T00:00:00", { timeZone: "Singapore" }));
    expect(nextReminder.toISOString()).toEqual("2021-10-15T16:00:00.000Z");
  });

  it("calculateNextReminder last minute of the day", () => {
    const fromDate = toDate(`2019-12-31T23:59:00`, { timeZone: "Europe/Lisbon" });
    expect(fromDate.toISOString()).toEqual("2019-12-31T23:59:00.000Z");

    const nextReminder = calculateNextReminder(fromDate, {
      offset: 1,
      time: "00:00",
      timezone: "Europe/Lisbon",
      weekdaysOnly: false,
    });
    expect(nextReminder).toEqual(toDate(`2020-01-01T00:00:00`, { timeZone: "Europe/Lisbon" }));
    expect(nextReminder.toISOString()).toEqual("2020-01-01T00:00:00.000Z");
  });

  it("calculateNextReminder weekDaysOnly", () => {
    const fromDate = new Date("2021-10-15");
    expect(fromDate.toISOString()).toEqual("2021-10-15T00:00:00.000Z");

    const nextReminder = calculateNextReminder(fromDate, {
      offset: 2,
      time: "23:50",
      timezone: "Europe/Berlin",
      weekdaysOnly: true,
    });

    expect(nextReminder).toEqual(toDate(`2021-10-18T23:50:00`, { timeZone: "Europe/Berlin" }));
    expect(nextReminder.toISOString()).toEqual("2021-10-18T21:50:00.000Z");
  });

  it("calculateNextReminder different timezone same day", () => {
    const fromDate = toDate(`2021-10-15T07:00:00`, { timeZone: "Europe/Madrid" });
    expect(fromDate.toISOString()).toEqual("2021-10-15T05:00:00.000Z");

    const nextReminder = calculateNextReminder(fromDate, {
      offset: 1,
      time: "09:00",
      timezone: "America/Argentina/Buenos_Aires",
      weekdaysOnly: false,
    });

    expect(nextReminder).toEqual(
      toDate(`2021-10-16T09:00:00`, { timeZone: "America/Argentina/Buenos_Aires" }),
    );
    expect(nextReminder.toISOString()).toEqual("2021-10-16T12:00:00.000Z");
  });

  it("calculateNextReminder different timezone day change", () => {
    const fromDate = toDate(`2021-10-15T00:00:00`, { timeZone: "Europe/Madrid" });
    expect(fromDate.toISOString()).toEqual("2021-10-14T22:00:00.000Z");

    const nextReminder = calculateNextReminder(fromDate, {
      offset: 1,
      time: "07:30",
      timezone: "America/Argentina/Buenos_Aires",
      weekdaysOnly: false,
    });

    expect(nextReminder).toEqual(
      toDate(`2021-10-15T07:30:00`, { timeZone: "America/Argentina/Buenos_Aires" }),
    );
    expect(nextReminder.toISOString()).toEqual("2021-10-15T10:30:00.000Z");
  });
});
