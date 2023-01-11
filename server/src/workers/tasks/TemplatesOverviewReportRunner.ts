import { countBy, groupBy, isDefined, partition } from "remeda";
import { average, findLast } from "../../util/arrays";
import { TaskRunner } from "../helpers/TaskRunner";

export class TemplatesOverviewReportRunner extends TaskRunner<"TEMPLATES_OVERVIEW_REPORT"> {
  async run() {
    if (!this.task.user_id) {
      throw new Error(`Task ${this.task.id} is missing user_id`);
    }

    const { start_date: startDate, end_date: endDate } = this.task.input;
    const userPetitions = await this.ctx.petitions.getUserPetitionsForOverviewReport(
      this.task.user_id,
      startDate,
      endDate
    );

    const [petitions, templates] = partition(userPetitions, (p) => !p.is_template);
    const petitionEvents = await this.ctx.petitions.getPetitionEventsByType(
      petitions.map((p) => p.id),
      [
        "ACCESS_ACTIVATED",
        "REPLY_CREATED",
        "PETITION_COMPLETED",
        "PETITION_CLOSED",
        "SIGNATURE_STARTED",
        "SIGNATURE_COMPLETED",
      ]
    );

    return {
      total: petitions.length,
      closed: countBy(petitions, (p) => p.status === "CLOSED"),
      completed: countBy(petitions, (p) => p.status === "COMPLETED"),
      signed: countBy(petitions, (p) => p.latest_signature_status === "COMPLETED"),
      template_status: templates.map((t) => {
        const templatePetitions = petitions.filter((p) => p.from_template_id === t.id);
        return {
          id: t.id,
          name: t.name,
          total: templatePetitions.length,
          closed: countBy(templatePetitions, (p) => p.status === "CLOSED"),
          completed: countBy(templatePetitions, (p) => p.status === "COMPLETED"),
          signed: countBy(templatePetitions, (p) => p.latest_signature_status === "COMPLETED"),
        };
      }),
      template_times: templates.map((t) => {
        const templatePetitions = petitions.filter((p) => p.from_template_id === t.id);
        const petitionIds = templatePetitions.map((p) => p.id);
        const eventsByPetitionId = groupBy(
          petitionEvents.filter((e) => petitionIds.includes(e.petition_id)),
          (e) => e.petition_id
        );

        const petitionTimes = Object.values(eventsByPetitionId)
          .map((events) => ({
            pendingAt: events
              .find((e) => e.type === "ACCESS_ACTIVATED" || e.type === "REPLY_CREATED") // first ACCESS_ACTIVATED or REPLY_CREATED event marks the first time the petition moved to PENDING status
              ?.created_at.getTime(),
            completedAt: findLast(
              events,
              (e) => e.type === "PETITION_COMPLETED"
            )?.created_at.getTime(),
            closedAt: findLast(events, (e) => e.type === "PETITION_CLOSED")?.created_at.getTime(),
          }))
          .map(({ pendingAt, completedAt, closedAt }) => ({
            pendingToComplete:
              isDefined(completedAt) && isDefined(pendingAt) && completedAt > pendingAt
                ? (completedAt - pendingAt) / 1000
                : null,
            completeToClose:
              isDefined(closedAt) && isDefined(completedAt) && closedAt > completedAt
                ? (closedAt - completedAt) / 1000
                : null,
          }));

        const pendingToCompletePetitionTimes = petitionTimes
          .filter((t) => isDefined(t.pendingToComplete))
          .map((t) => t.pendingToComplete!);

        const completeToClosePetitionTimes = petitionTimes
          .filter((t) => isDefined(t.completeToClose))
          .map((t) => t.completeToClose!);

        const timeToCompleteSignatureTimes = Object.values(eventsByPetitionId)
          .map((events) => ({
            startedAt: findLast(
              events,
              (e) => e.type === "SIGNATURE_STARTED"
            )?.created_at.getTime(),
            completedAt: findLast(
              events,
              (e) => e.type === "SIGNATURE_COMPLETED"
            )?.created_at.getTime(),
          }))
          .map(({ startedAt, completedAt }) =>
            isDefined(startedAt) && isDefined(completedAt) && completedAt > startedAt
              ? (completedAt - startedAt) / 1000
              : null
          )
          .filter(isDefined);

        return {
          id: t.id,
          name: t.name,
          total: templatePetitions.length,
          time_to_complete:
            pendingToCompletePetitionTimes.length > 0
              ? average(pendingToCompletePetitionTimes)
              : null,
          time_to_sign:
            timeToCompleteSignatureTimes.length > 0 ? average(timeToCompleteSignatureTimes) : null,
          time_to_close:
            completeToClosePetitionTimes.length > 0 ? average(completeToClosePetitionTimes) : null,
        };
      }),
    };
  }
}
