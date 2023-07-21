import { chunk, countBy, difference, findLast, isDefined, sortBy } from "remeda";
import { PetitionStatus } from "../../db/__types";
import {
  PetitionEvent,
  ReplyCreatedEvent,
  ReplyDeletedEvent,
  ReplyUpdatedEvent,
} from "../../db/events/PetitionEvent";
import { PetitionTimeStatistics, TaskOutput } from "../../db/repositories/TaskRepository";
import { average, median, quartiles } from "../../util/arrays";
import { toGlobalId } from "../../util/globalId";
import { Maybe } from "../../util/types";
import { TaskRunner } from "../helpers/TaskRunner";

export interface TemplateStatsReportInput {
  id: number;
  name: Maybe<string>;
  status: PetitionStatus;
  latest_signature_status: Maybe<string>;
  is_sent: boolean;
}

type TemplateStatsReportPetitionWithEvents = TemplateStatsReportInput & {
  events: PetitionEvent[];
};

export class TemplateStatsReportRunner extends TaskRunner<"TEMPLATE_STATS_REPORT"> {
  async run() {
    const { template_id: templateId, start_date: startDate, end_date: endDate } = this.task.input;

    const [user, hasAccess] = await Promise.all([
      this.ctx.readonlyUsers.loadUser(this.task.user_id!),
      this.ctx.readonlyPetitions.userHasAccessToPetitions(this.task.user_id!, [templateId]),
    ]);

    if (!hasAccess) {
      throw new Error(`User ${this.task.user_id} has no access to template ${templateId}`);
    }

    return await this.generateTemplateStatsReport(templateId, user!.org_id, startDate, endDate);
  }

  private async generateTemplateStatsReport(
    templateId: number,
    orgId: number,
    startDate?: Maybe<Date> | undefined,
    endDate?: Maybe<Date> | undefined,
  ): Promise<TaskOutput<"TEMPLATE_STATS_REPORT">> {
    const [template, orgPetitions] = await Promise.all([
      this.ctx.readonlyPetitions.loadPetition(templateId),
      this.ctx.readonlyPetitions.getPetitionsForTemplateStatsReport(
        templateId,
        orgId,
        startDate,
        endDate,
      ),
    ]);

    if (!template) {
      throw new Error(`Petition:${templateId} not found`);
    }

    const petitionEvents = (await this.ctx.readonlyPetitions.getPetitionEventsByType(
      orgPetitions.map((p) => p.id),
      [
        "ACCESS_ACTIVATED",
        "ACCESS_ACTIVATED_FROM_PUBLIC_PETITION_LINK",
        "ACCESS_OPENED",
        "PETITION_COMPLETED",
        "PETITION_CLOSED",
        "REPLY_CREATED",
        "REPLY_UPDATED",
        "REPLY_DELETED",
        "SIGNATURE_COMPLETED",
        "SIGNATURE_STARTED",
      ],
    )) as PetitionEvent[];

    const petitionsWithEvents = orgPetitions.map((p) => ({
      ...p,
      events: sortBy(
        petitionEvents.filter((e) => e.petition_id === p.id),
        [(e) => e.created_at, "asc"],
      ),
    }));

    const { status, times } = this.getPetitionsStatusAndTimes(petitionsWithEvents);

    const repliedUnsentPetition = petitionsWithEvents.find(({ is_sent: isSent, events }) => {
      return !isSent && isDefined(this.findFirstRecipientReplyEvent(events));
    });

    const hasSignature = isDefined(template.signature_config);
    const funnel = this.getPetitionsConversionFunnel(petitionsWithEvents, hasSignature);

    return {
      from_template_id: toGlobalId("Petition", template.id),
      has_replied_unsent: isDefined(repliedUnsentPetition),
      has_signature_config: hasSignature,
      status,
      times,
      conversion_funnel: {
        sent: funnel.sent.length,
        opened: funnel.opened.length,
        first_reply: funnel.first_reply.length,
        completed: funnel.completed.length,
        signed: funnel.signed.length,
        closed: funnel.closed.length,
      },
      time_statistics: this.getPetitionsTimeStatistics(funnel, hasSignature),
    };
  }

  private getPetitionsStatusAndTimes(
    petitions: TemplateStatsReportPetitionWithEvents[],
  ): Pick<TaskOutput<"TEMPLATE_STATS_REPORT">, "status" | "times"> {
    const times = chunk(petitions, 200).flatMap((chunk) => this.getPetitionTimes(chunk));

    return {
      status: {
        all: petitions.length,
        pending: countBy(petitions, (p) => p.status === "PENDING"),
        completed: countBy(petitions, (p) => p.status === "COMPLETED"),
        closed: countBy(petitions, (p) => p.status === "CLOSED"),
        signed: countBy(petitions, (p) => p.latest_signature_status === "COMPLETED"),
      },
      times: {
        pending_to_complete: average(times.map((p) => p.pending_to_complete).filter(isDefined)),
        complete_to_close: average(times.map((p) => p.complete_to_close).filter(isDefined)),
        signature_completed: average(times.map((p) => p.signature_completed).filter(isDefined)),
      },
    };
  }

  private getPetitionTimes(petitions: TemplateStatsReportPetitionWithEvents[]) {
    return petitions.map((petition) => {
      const events = petition.events;
      // first ACCESS_ACTIVATED or REPLY_CREATED event marks the first time the petition moved to PENDING status
      const pendingAt = events
        .find(
          (e) =>
            e.type === "ACCESS_ACTIVATED" ||
            e.type === "ACCESS_ACTIVATED_FROM_PUBLIC_PETITION_LINK" ||
            e.type === "REPLY_CREATED",
        )
        ?.created_at.getTime();

      const completedAt = findLast(
        events,
        (e) => e.type === "PETITION_COMPLETED",
      )?.created_at.getTime();

      const closedAt = findLast(events, (e) => e.type === "PETITION_CLOSED")?.created_at.getTime();

      const signatureStartedAt = findLast(
        events,
        (e) => e.type === "SIGNATURE_STARTED",
      )?.created_at.getTime();

      const signatureCompletedAt = findLast(
        events,
        (e) => e.type === "SIGNATURE_COMPLETED",
      )?.created_at.getTime();

      return {
        pending_to_complete: this.getTimeInterval(completedAt, pendingAt),
        complete_to_close: this.getTimeInterval(closedAt, completedAt),
        signature_completed: this.getTimeInterval(signatureCompletedAt, signatureStartedAt),
      };
    });
  }

  /**
   * CONVERSION FUNNEL ON A TEMPLATE'S PETITIONS.
   *
   *  Each step uses the subset of petitions from a previous step, to ensure the "funnel" shape.
   *
   *  - STEP 1: Sent Petitions. Nº of petitions that have been sent to at least one recipient.
   *
   *  - STEP 2: Opened Petitions. Nº of petitions with at least 1 ACCESS_OPENED event.
   *            Every petition with an ACCESS_OPENED must have been sent previously, funnel is ensured.
   *
   *  - STEP 3: First Reply. Nº of petitions with at least:
   *              - 1 REPLY_CREATED or REPLY_UPDATED event (made by a recipient); or
   *              - 1 PETITION_COMPLETED (made by a recipient) and petition status is COMPLETED or CLOSED
   *            Here we check that the reply is not currently deleted.
   *            For REPLY_UPDATED, the reply could be first created by an User, but then updated by the recipient and we consider that as a recipient reply.
   *            If there are no REPLY events made by a recipient, check the PETITION_COMPLETED, as the petition can have all optional non replied fields.
   *            If the reply is created by a recipient, or petition is completed by a recipient, the petition must have an ACCESS_OPENED, so the funnel is ensured.
   *
   *  - STEP 4: Completed Petitions: Nº of petitions with a PETITION_COMPLETED event (made by a recipient)
   *            The petitions must have status COMPLETED or CLOSED, to ensure it is currently in that status.
   *            If the petition has every field optional, recipient could complete it without replying. So we use the subset from Step 2 instead of Step 3 to ensure funnel
   *
   *  - STEP 5: Signed Petitions: Nº of petitions with a SIGNATURE_COMPLETED event.
   *            The petitions must have its latest signature COMPLETED.
   *            Use subset from previous step (Completed Petitions) to ensure funnel.
   *
   *  - STEP 6: Closed Petitions: Nº of petitions with at least 1 PETITION_CLOSED event.
   *            The petitions must have status CLOSED.
   *            If the template has a signature configured, use subset from previous step.
   *            If the template does not have a signature, use subset from step 4.
   */
  private getPetitionsConversionFunnel(
    petitions: TemplateStatsReportPetitionWithEvents[],
    templateHasSignature: boolean,
  ) {
    // STEP 1
    const sent = petitions.filter((p) => p.is_sent);

    // STEP 2
    const opened = sent.filter(
      ({ events }) => countBy(events, (e) => e.type === "ACCESS_OPENED") > 0,
    );

    // STEP 3
    const firstReply = opened.filter(({ status, events }) => {
      const hasRecipientReply = isDefined(this.findFirstRecipientReplyEvent(events));
      if (hasRecipientReply) {
        return true;
      }

      // if the petition has no recipient replies, but its completed by a recipient, consider it "replied" (the petition may have all optional fields)
      const completedByRecipientEvent = events.find(
        (e) => e.type === "PETITION_COMPLETED" && isDefined(e.data.petition_access_id),
      );

      return isDefined(completedByRecipientEvent) && ["COMPLETED", "CLOSED"].includes(status);
    });

    // STEP 4. use subset "opened" instead of "firstReply"
    const completed = opened.filter(({ status, events }) => {
      const completedByRecipientEvent = events.find(
        (e) => e.type === "PETITION_COMPLETED" && isDefined(e.data.petition_access_id),
      );

      return isDefined(completedByRecipientEvent) && ["COMPLETED", "CLOSED"].includes(status);
    });

    // STEP 5
    const signed = completed.filter(({ latest_signature_status: signature, events }) => {
      const signatureCompletedEvent = events.find((e) => e.type === "SIGNATURE_COMPLETED");
      return signature === "COMPLETED" && isDefined(signatureCompletedEvent);
    });

    // STEP 6
    const closed = (templateHasSignature ? signed : completed).filter(({ status, events }) => {
      const petitionClosedEvent = events.find((e) => e.type === "PETITION_CLOSED");
      return status === "CLOSED" && isDefined(petitionClosedEvent);
    });

    return {
      sent,
      opened,
      first_reply: firstReply,
      completed,
      signed,
      closed,
    };
  }

  /**
   * TIME STATISTICS:
   *
   * - OPEN:        The time intervals between first time petition is sent and first time it is opened.
   *
   * - FIRST REPLY: Time intervals between access is opened and recipient submits first reply.
   *                If the recipient didn't submit any reply there will not be a time value on that petition.
   *
   * - COMPLETED:   Time intervals between the recipient submits the first reply and the petition is completed.
   *                If the recipient didn't submit any reply, use the first opened time.
   *                If the petition was not completed by a recipient, look for a "completed by user" time.
   *                If the petition is not COMPLETED or CLOSED, there will not be a time value.
   *
   * - SIGNED:      Time intervals between the petition is completed and signed.
   *                If the petition was not completed by a recipient, look for a "completed by user" time.
   *                If the petition is not COMPLETED or CLOSED, and its latest signature status is not COMPLETED, there will not be a time value.
   *
   * - CLOSED:      Time intervals between the petition is signed and closed.
   *                If the petition was not
   *                If the petition is not CLOSED, there will not be a time value.
   */
  private getPetitionsTimeStatistics(
    funnel: ReturnType<typeof this.getPetitionsConversionFunnel>,
    templateHasSignature: boolean,
  ): PetitionTimeStatistics {
    const openTimes = funnel.sent
      .map(({ events }) => {
        const firstActivatedAt = events
          .find(
            (e) =>
              e.type === "ACCESS_ACTIVATED" ||
              e.type === "ACCESS_ACTIVATED_FROM_PUBLIC_PETITION_LINK",
          )
          ?.created_at.getTime();

        const firstOpenedAt = events.find((e) => e.type === "ACCESS_OPENED")?.created_at.getTime();

        return this.getTimeInterval(firstOpenedAt, firstActivatedAt);
      })
      .filter(isDefined);

    const firstReplyTimes = funnel.opened
      .map(({ events }) => {
        const firstOpenedAt = events.find((e) => e.type === "ACCESS_OPENED")?.created_at.getTime();

        const firstRepliedByRecipientAt =
          this.findFirstRecipientReplyEvent(events)?.created_at.getTime();

        return this.getTimeInterval(firstRepliedByRecipientAt, firstOpenedAt);
      })
      .filter(isDefined);

    const completedTimes = funnel.opened
      .map(({ status, events }) => {
        if (!["COMPLETED", "CLOSED"].includes(status)) {
          return null;
        }
        const firstRepliedByRecipientAt =
          this.findFirstRecipientReplyEvent(events)?.created_at.getTime();

        const firstOpenedAt = events.find((e) => e.type === "ACCESS_OPENED")?.created_at.getTime();

        const lastCompletedByRecipientAt = findLast(
          events,
          (e) => e.type === "PETITION_COMPLETED" && isDefined(e.data.petition_access_id),
        )?.created_at.getTime();

        const lastCompletedByUserAt = findLast(
          events,
          (e) => e.type === "PETITION_COMPLETED" && isDefined(e.data.user_id),
        )?.created_at.getTime();

        return this.getTimeInterval(
          lastCompletedByRecipientAt ?? lastCompletedByUserAt,
          firstRepliedByRecipientAt ?? firstOpenedAt,
        );
      })
      .filter(isDefined);

    const signedTimes = funnel.completed
      .map(({ status, latest_signature_status: signature, events }) => {
        if (!["COMPLETED", "CLOSED"].includes(status) || signature !== "COMPLETED") {
          return null;
        }

        const lastCompletedByRecipientAt = findLast(
          events,
          (e) => e.type === "PETITION_COMPLETED" && isDefined(e.data.petition_access_id),
        )?.created_at.getTime();

        const lastCompletedByUserAt = findLast(
          events,
          (e) => e.type === "PETITION_COMPLETED" && isDefined(e.data.user_id),
        )?.created_at.getTime();

        const lastSignatureCompletedAt = findLast(
          events,
          (e) => e.type === "SIGNATURE_COMPLETED",
        )?.created_at.getTime();

        return this.getTimeInterval(
          lastSignatureCompletedAt,
          lastCompletedByRecipientAt ?? lastCompletedByUserAt,
        );
      })
      .filter(isDefined);

    const closedTimes = (templateHasSignature ? funnel.signed : funnel.completed)
      .map(({ status, events }) => {
        if (status !== "CLOSED") {
          return null;
        }

        const lastCompletedByRecipientAt = findLast(
          events,
          (e) => e.type === "PETITION_COMPLETED" && isDefined(e.data.petition_access_id),
        )?.created_at.getTime();

        const lastCompletedByUserAt = findLast(
          events,
          (e) => e.type === "PETITION_COMPLETED" && isDefined(e.data.user_id),
        )?.created_at.getTime();

        const lastClosedAt = findLast(
          events,
          (e) => e.type === "PETITION_CLOSED",
        )?.created_at.getTime();

        return this.getTimeInterval(
          lastClosedAt,
          lastCompletedByRecipientAt ?? lastCompletedByUserAt,
        );
      })
      .filter(isDefined);

    return {
      opened: this.getTimeStatisticsValues(openTimes),
      first_reply: this.getTimeStatisticsValues(firstReplyTimes),
      completed: this.getTimeStatisticsValues(completedTimes),
      signed: this.getTimeStatisticsValues(signedTimes),
      closed: this.getTimeStatisticsValues(closedTimes),
    };
  }

  private getTimeStatisticsValues(values: number[]) {
    const [q1, q3] = quartiles(values);
    return {
      min: Math.min(...values),
      max: Math.max(...values),
      q1,
      q3,
      median: median(values),
      mean: average(values),
    };
  }

  private findFirstRecipientReplyEvent(events: PetitionEvent[]) {
    const allReplyIds = events
      .filter(
        (e) =>
          (e.type === "REPLY_CREATED" || e.type === "REPLY_UPDATED") &&
          isDefined(e.data.petition_access_id),
      )
      .map((e) => (e as ReplyCreatedEvent | ReplyUpdatedEvent).data.petition_field_reply_id);

    const deletedReplyIds = events
      .filter((e) => e.type === "REPLY_DELETED")
      .map((e) => (e as ReplyDeletedEvent).data.petition_field_reply_id);

    const currentReplyIds = difference(allReplyIds, deletedReplyIds);

    return events.find(
      (e) =>
        (e.type === "REPLY_CREATED" || e.type === "REPLY_UPDATED") &&
        isDefined(e.data.petition_access_id) &&
        currentReplyIds.includes(e.data.petition_field_reply_id),
    );
  }

  private getTimeInterval(timeA?: number, timeB?: number) {
    return isDefined(timeA) && isDefined(timeB) && timeA > timeB ? (timeA - timeB) / 1000 : null;
  }
}
