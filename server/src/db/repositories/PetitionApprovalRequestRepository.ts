import { inject } from "inversify";
import { Knex } from "knex";
import { groupBy, sortBy } from "remeda";
import { PetitionFieldVisibility } from "../../util/fieldLogic";
import { MaybeArray, unMaybeArray } from "../../util/types";
import {
  CreatePetitionApprovalRequestStep,
  PetitionApprovalRequestStep,
  PetitionApprovalRequestStepApprovalType,
} from "../__types";
import { BaseRepository } from "../helpers/BaseRepository";
import { KNEX } from "../knex";

export interface ApprovalRequestStepConfig {
  name: string;
  type: PetitionApprovalRequestStepApprovalType;
  values: { id: number; type: "User" | "UserGroup" | "PetitionField" }[];
  visibility?: PetitionFieldVisibility | null;
  manual_start: boolean;
  allow_edit: boolean;
}

export class PetitionApprovalRequestRepository extends BaseRepository {
  constructor(@inject(KNEX) knex: Knex) {
    super(knex);
  }

  readonly loadPetitionApprovalRequestStep = this.buildLoadBy(
    "petition_approval_request_step",
    "id",
  );

  readonly loadPetitionApprovalRequestStepApproversByStepId = this.buildLoadMultipleBy(
    "petition_approval_request_step_approver",
    "petition_approval_request_step_id",
    (q) => q.orderBy("id", "asc"),
  );

  readonly loadCurrentPetitionApprovalRequestStepsByPetitionId = this.buildLoadMultipleBy(
    "petition_approval_request_step",
    "petition_id",
    (q) => q.whereNull("deprecated_at").orderBy("step_number", "asc"),
  );

  /*
   * When an approval process is deprecated, all of its steps get the same deprecated_at timestamp.
   * For each deprecated approval process on the petition, get the step that was updated last. This will contain the cause of the deprecation: cancel, reject, etc.
   */
  readonly loadDeprecatedPetitionApprovalRequestStepsByPetitionId = this.buildLoader<
    number,
    PetitionApprovalRequestStep[]
  >(async (ids, t) => {
    const steps = await this.raw<PetitionApprovalRequestStep>(
      /* sql */ `
        select * from (
          select distinct on (deprecated_at) *
          from petition_approval_request_step
          where petition_id in ?
          and deprecated_at is not null
          order by deprecated_at, updated_at desc
        ) sub
        order by id desc;
      `,
      [this.sqlIn(ids)],
      t,
    );

    const byPetitionId = groupBy(steps, (s) => s.petition_id);
    return ids.map((id) => byPetitionId[id] ?? []);
  });

  async createPetitionApprovalRequestSteps(
    data: CreatePetitionApprovalRequestStep[],
    createdBy: string,
  ) {
    if (data.length === 0) {
      return [];
    }
    return await this.from("petition_approval_request_step").insert(
      data.map((d) => ({
        ...d,
        created_at: this.now(),
        created_by: createdBy,
      })),
      "*",
    );
  }

  async updatePetitionApprovalRequestStep(
    id: number,
    data: Partial<PetitionApprovalRequestStep>,
    updatedBy: string,
    t?: Knex.Transaction,
  ): Promise<PetitionApprovalRequestStep | undefined> {
    const [row] = await this.from("petition_approval_request_step", t)
      .where("id", id)
      .whereNull("deprecated_at")
      .update(
        {
          ...data,
          updated_at: this.now(),
          updated_by: updatedBy,
        },
        "*",
      );

    return row;
  }

  async createPetitionApprovalRequestStepApprovers(
    petitionApprovalRequestStepId: number,
    users: { id: number; skipped?: boolean; canceled?: boolean; sent?: boolean }[],
    createdBy: string,
    t?: Knex.Transaction,
  ) {
    if (users.length === 0) {
      return;
    }

    await this.from("petition_approval_request_step_approver", t).insert(
      users.map((u) => ({
        petition_approval_request_step_id: petitionApprovalRequestStepId,
        user_id: u.id,
        ...(u.skipped ? { skipped_at: this.now() } : {}),
        ...(u.canceled ? { canceled_at: this.now() } : {}),
        ...(u.sent ? { sent_at: this.now() } : {}),
        created_at: this.now(),
        created_by: createdBy,
      })),
    );
  }

  async updatePetitionApprovalRequestStepApproverTimestamps(
    id: MaybeArray<number>,
    timestamps: {
      sent?: boolean;
      approved?: boolean;
      rejected?: boolean;
      canceled?: boolean;
      skipped?: boolean;
    },
    updatedBy: string,
    t?: Knex.Transaction,
  ) {
    const ids = unMaybeArray(id);
    if (ids.length === 0) {
      return;
    }

    await this.from("petition_approval_request_step_approver", t)
      .whereIn("id", ids)
      .update({
        ...(timestamps.sent ? { sent_at: this.now() } : {}),
        ...(timestamps.approved ? { approved_at: this.now() } : {}),
        ...(timestamps.rejected ? { rejected_at: this.now() } : {}),
        ...(timestamps.canceled ? { canceled_at: this.now() } : {}),
        ...(timestamps.skipped ? { skipped_at: this.now() } : {}),
        updated_at: this.now(),
        updated_by: updatedBy,
      });
  }

  async restartPetitionApprovalRequestStepApproversByStepId(id: number, updatedBy: string) {
    await this.from("petition_approval_request_step_approver")
      .where("petition_approval_request_step_id", id)
      .update({
        sent_at: null,
        approved_at: null,
        rejected_at: null,
        canceled_at: null,
        skipped_at: null,
        updated_at: this.now(),
        updated_by: updatedBy,
      });
  }

  async updatePetitionApprovalRequestStepsAsDeprecated(
    petitionId: MaybeArray<number>,
    t?: Knex.Transaction,
  ) {
    const petitionIds = unMaybeArray(petitionId);
    if (petitionIds.length === 0) {
      return [];
    }
    const data = await this.from("petition_approval_request_step", t)
      .whereIn("petition_id", petitionIds)
      .whereNull("deprecated_at")
      .update({ deprecated_at: this.now() })
      .returning("*");

    return petitionIds.map((id) =>
      sortBy(
        data.filter((d) => d.petition_id === id),
        [(d) => d.step_number, "asc"],
      ),
    );
  }

  async deleteNotStartedPetitionApprovalRequestStepsAndApproversByPetitionId(petitionId: number) {
    const currentSteps =
      await this.loadCurrentPetitionApprovalRequestStepsByPetitionId.raw(petitionId);

    if (currentSteps.length === 0) {
      return;
    }

    if (currentSteps.some((s) => !["NOT_STARTED", "NOT_APPLICABLE"].includes(s.status))) {
      throw new Error("Cannot delete steps that are not in NOT_STARTED or NOT_APPLICABLE status");
    }

    await this.from("petition_approval_request_step_approver")
      .whereIn(
        "petition_approval_request_step_id",
        currentSteps.map((s) => s.id),
      )
      .delete();

    await this.from("petition_approval_request_step")
      .whereIn(
        "id",
        currentSteps.map((s) => s.id),
      )
      .delete();
  }
}
